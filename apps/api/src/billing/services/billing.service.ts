import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { UsageRecord, UsageType, BillingPeriod } from '../entities/usage-record.entity';
import { BillingPlan, PlanType, BillingCycle } from '../entities/billing-plan.entity';
import { Invoice, InvoiceStatus, PaymentMethod } from '../entities/invoice.entity';
import { Organization } from '../../organizations/entities/organization.entity';

export interface UsageSummary {
  organizationId: string;
  periodStart: Date;
  periodEnd: Date;
  billingPeriod: BillingPeriod;
  usageByType: Record<UsageType, {
    quantity: number;
    unitPrice: number;
    totalCost: number;
  }>;
  totalCost: number;
  planLimits: {
    maxSeats: number;
    maxGenerationsPerMonth: number;
    maxPublishesPerMonth: number;
    maxStorageGB: number;
  };
  currentUsage: {
    seats: number;
    generations: number;
    publishes: number;
    storageGB: number;
  };
  overages: {
    seats: number;
    generations: number;
    publishes: number;
    storageGB: number;
  };
}

export interface BillingReport {
  organizationId: string;
  reportDate: Date;
  currentPeriod: UsageSummary;
  previousPeriods: UsageSummary[];
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    status: InvoiceStatus;
    totalAmount: number;
    issueDate: Date;
    dueDate: Date;
  }>;
  recommendations: string[];
}

@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @InjectRepository(UsageRecord)
    private readonly usageRecordRepository: Repository<UsageRecord>,
    @InjectRepository(BillingPlan)
    private readonly billingPlanRepository: Repository<BillingPlan>,
    @InjectRepository(Invoice)
    private readonly invoiceRepository: Repository<Invoice>,
    @InjectRepository(Organization)
    private readonly organizationRepository: Repository<Organization>,
  ) {}

  async trackUsage(
    organizationId: string,
    usageType: UsageType,
    quantity: number = 1,
    userId?: string,
    metadata?: Record<string, any>,
    platform?: string,
    feature?: string,
  ): Promise<UsageRecord> {
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
      relations: ['billingPlan'],
    });

    if (!organization) {
      throw new Error(`Organization ${organizationId} not found`);
    }

    const billingPlan = organization.billingPlan;
    if (!billingPlan) {
      throw new Error(`No billing plan found for organization ${organizationId}`);
    }

    // Get current billing period
    const now = new Date();
    const { periodStart, periodEnd } = this.getBillingPeriod(now, billingPlan.billingCycle);

    // Get or create usage record for this period
    let usageRecord = await this.usageRecordRepository.findOne({
      where: {
        organizationId,
        usageType,
        billingPeriod: this.mapBillingCycleToPeriod(billingPlan.billingCycle),
        periodStart,
        periodEnd,
      },
    });

    if (!usageRecord) {
      usageRecord = this.usageRecordRepository.create({
        organizationId,
        userId,
        usageType,
        billingPeriod: this.mapBillingCycleToPeriod(billingPlan.billingCycle),
        periodStart,
        periodEnd,
        quantity: 0,
        unitPrice: this.getUnitPrice(usageType, billingPlan),
        totalCost: 0,
        metadata,
        platform,
        feature,
      });
    }

    // Update usage
    usageRecord.quantity += quantity;
    usageRecord.totalCost = usageRecord.quantity * usageRecord.unitPrice;
    usageRecord.metadata = { ...usageRecord.metadata, ...metadata };

    return await this.usageRecordRepository.save(usageRecord);
  }

  async getUsageSummary(
    organizationId: string,
    periodStart: Date,
    periodEnd: Date,
    billingPeriod: BillingPeriod = BillingPeriod.MONTHLY,
  ): Promise<UsageSummary> {
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
      relations: ['billingPlan'],
    });

    if (!organization?.billingPlan) {
      throw new Error(`No billing plan found for organization ${organizationId}`);
    }

    const billingPlan = organization.billingPlan;

    // Get all usage records for the period
    const usageRecords = await this.usageRecordRepository.find({
      where: {
        organizationId,
        billingPeriod,
        periodStart: Between(periodStart, periodEnd),
      },
    });

    // Group usage by type
    const usageByType: Record<UsageType, { quantity: number; unitPrice: number; totalCost: number }> = {
      [UsageType.GENERATION]: { quantity: 0, unitPrice: 0, totalCost: 0 },
      [UsageType.PUBLISH]: { quantity: 0, unitPrice: 0, totalCost: 0 },
      [UsageType.SEAT]: { quantity: 0, unitPrice: 0, totalCost: 0 },
      [UsageType.STORAGE]: { quantity: 0, unitPrice: 0, totalCost: 0 },
      [UsageType.API_CALL]: { quantity: 0, unitPrice: 0, totalCost: 0 },
      [UsageType.WEBHOOK]: { quantity: 0, unitPrice: 0, totalCost: 0 },
    };

    for (const record of usageRecords) {
      usageByType[record.usageType] = {
        quantity: record.quantity,
        unitPrice: record.unitPrice,
        totalCost: record.totalCost,
      };
    }

    const totalCost = Object.values(usageByType).reduce((sum, usage) => sum + usage.totalCost, 0);

    // Get current usage (latest records for each type)
    const currentUsage = await this.getCurrentUsage(organizationId);

    // Calculate overages
    const overages = {
      seats: Math.max(0, currentUsage.seats - billingPlan.maxSeats),
      generations: Math.max(0, currentUsage.generations - billingPlan.maxGenerationsPerMonth),
      publishes: Math.max(0, currentUsage.publishes - billingPlan.maxPublishesPerMonth),
      storageGB: Math.max(0, currentUsage.storageGB - billingPlan.maxStorageGB),
    };

    return {
      organizationId,
      periodStart,
      periodEnd,
      billingPeriod,
      usageByType,
      totalCost,
      planLimits: {
        maxSeats: billingPlan.maxSeats,
        maxGenerationsPerMonth: billingPlan.maxGenerationsPerMonth,
        maxPublishesPerMonth: billingPlan.maxPublishesPerMonth,
        maxStorageGB: billingPlan.maxStorageGB,
      },
      currentUsage,
      overages,
    };
  }

  async generateInvoice(
    organizationId: string,
    periodStart: Date,
    periodEnd: Date,
    billingPeriod: BillingPeriod = BillingPeriod.MONTHLY,
  ): Promise<Invoice> {
    const organization = await this.organizationRepository.findOne({
      where: { id: organizationId },
      relations: ['billingPlan'],
    });

    if (!organization?.billingPlan) {
      throw new Error(`No billing plan found for organization ${organizationId}`);
    }

    const billingPlan = organization.billingPlan;
    const usageSummary = await this.getUsageSummary(organizationId, periodStart, periodEnd, billingPeriod);

    // Generate invoice number
    const invoiceNumber = await this.generateInvoiceNumber(organizationId);

    // Calculate line items
    const lineItems = [];
    let subtotal = 0;

    // Base plan cost
    if (billingPlan.basePrice > 0) {
      lineItems.push({
        description: `${billingPlan.name} Plan`,
        quantity: 1,
        unitPrice: billingPlan.basePrice,
        total: billingPlan.basePrice,
        usageType: 'plan',
        period: billingPeriod,
      });
      subtotal += billingPlan.basePrice;
    }

    // Usage-based charges
    for (const [usageType, usage] of Object.entries(usageSummary.usageByType)) {
      if (usage.quantity > 0) {
        lineItems.push({
          description: `${usageType.charAt(0).toUpperCase() + usageType.slice(1)} Usage`,
          quantity: usage.quantity,
          unitPrice: usage.unitPrice,
          total: usage.totalCost,
          usageType,
          period: billingPeriod,
        });
        subtotal += usage.totalCost;
      }
    }

    // Calculate tax (simplified - in real app, this would be more complex)
    const taxRate = 0.08; // 8% tax rate
    const taxAmount = subtotal * taxRate;
    const totalAmount = subtotal + taxAmount;

    // Create invoice
    const invoice = this.invoiceRepository.create({
      invoiceNumber,
      organizationId,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: InvoiceStatus.DRAFT,
      subtotal,
      taxAmount,
      totalAmount,
      taxRate,
      currency: 'USD',
      lineItems,
      billingAddress: organization.billingAddress || {
        name: organization.name,
        address: '',
        city: '',
        state: '',
        postalCode: '',
        country: '',
      },
    });

    return await this.invoiceRepository.save(invoice);
  }

  async getBillingReport(
    organizationId: string,
    months: number = 6,
  ): Promise<BillingReport> {
    const now = new Date();
    const currentPeriod = await this.getUsageSummary(
      organizationId,
      new Date(now.getFullYear(), now.getMonth(), 1),
      new Date(now.getFullYear(), now.getMonth() + 1, 0),
    );

    // Get previous periods
    const previousPeriods: UsageSummary[] = [];
    for (let i = 1; i <= months; i++) {
      const periodStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const periodEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
      
      try {
        const summary = await this.getUsageSummary(organizationId, periodStart, periodEnd);
        previousPeriods.push(summary);
      } catch (error) {
        this.logger.warn(`Could not get usage summary for period ${periodStart} to ${periodEnd}: ${error.message}`);
      }
    }

    // Get recent invoices
    const invoices = await this.invoiceRepository.find({
      where: { organizationId },
      order: { issueDate: 'DESC' },
      take: 10,
    });

    // Generate recommendations
    const recommendations = this.generateRecommendations(currentPeriod, previousPeriods);

    return {
      organizationId,
      reportDate: now,
      currentPeriod,
      previousPeriods,
      invoices: invoices.map(invoice => ({
        id: invoice.id,
        invoiceNumber: invoice.invoiceNumber,
        status: invoice.status,
        totalAmount: invoice.totalAmount,
        issueDate: invoice.issueDate,
        dueDate: invoice.dueDate,
      })),
      recommendations,
    };
  }

  async getCurrentUsage(organizationId: string): Promise<{
    seats: number;
    generations: number;
    publishes: number;
    storageGB: number;
  }> {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const usageRecords = await this.usageRecordRepository.find({
      where: {
        organizationId,
        billingPeriod: BillingPeriod.MONTHLY,
        periodStart: Between(monthStart, monthEnd),
      },
    });

    const usage = {
      seats: 0,
      generations: 0,
      publishes: 0,
      storageGB: 0,
    };

    for (const record of usageRecords) {
      switch (record.usageType) {
        case UsageType.SEAT:
          usage.seats = record.quantity;
          break;
        case UsageType.GENERATION:
          usage.generations = record.quantity;
          break;
        case UsageType.PUBLISH:
          usage.publishes = record.quantity;
          break;
        case UsageType.STORAGE:
          usage.storageGB = record.quantity;
          break;
      }
    }

    return usage;
  }

  private getBillingPeriod(date: Date, billingCycle: BillingCycle): { periodStart: Date; periodEnd: Date } {
    const year = date.getFullYear();
    const month = date.getMonth();

    if (billingCycle === BillingCycle.MONTHLY) {
      return {
        periodStart: new Date(year, month, 1),
        periodEnd: new Date(year, month + 1, 0),
      };
    } else {
      // Yearly billing
      return {
        periodStart: new Date(year, 0, 1),
        periodEnd: new Date(year, 11, 31),
      };
    }
  }

  private mapBillingCycleToPeriod(billingCycle: BillingCycle): BillingPeriod {
    return billingCycle === BillingCycle.MONTHLY ? BillingPeriod.MONTHLY : BillingPeriod.YEARLY;
  }

  private getUnitPrice(usageType: UsageType, billingPlan: BillingPlan): number {
    switch (usageType) {
      case UsageType.GENERATION:
        return billingPlan.generationPricePerUnit;
      case UsageType.PUBLISH:
        return billingPlan.publishPricePerUnit;
      case UsageType.STORAGE:
        return billingPlan.storagePricePerGB;
      case UsageType.SEAT:
        return billingPlan.seatPricePerMonth;
      case UsageType.API_CALL:
        return 0.001; // $0.001 per API call
      case UsageType.WEBHOOK:
        return 0.0005; // $0.0005 per webhook
      default:
        return 0;
    }
  }

  private async generateInvoiceNumber(organizationId: string): Promise<string> {
    const count = await this.invoiceRepository.count({
      where: { organizationId },
    });
    
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const sequence = String(count + 1).padStart(4, '0');
    
    return `INV-${organizationId.slice(0, 8)}-${year}${month}-${sequence}`;
  }

  private generateRecommendations(
    currentPeriod: UsageSummary,
    previousPeriods: UsageSummary[],
  ): string[] {
    const recommendations: string[] = [];

    // Check for overages
    if (currentPeriod.overages.seats > 0) {
      recommendations.push(`Consider upgrading your plan to accommodate ${currentPeriod.overages.seats} additional seats`);
    }

    if (currentPeriod.overages.generations > 0) {
      recommendations.push(`You've exceeded your generation limit by ${currentPeriod.overages.generations}. Consider upgrading for more generations.`);
    }

    if (currentPeriod.overages.publishes > 0) {
      recommendations.push(`You've exceeded your publish limit by ${currentPeriod.overages.publishes}. Consider upgrading for more publishes.`);
    }

    if (currentPeriod.overages.storageGB > 0) {
      recommendations.push(`You've exceeded your storage limit by ${currentPeriod.overages.storageGB}GB. Consider upgrading for more storage.`);
    }

    // Check usage trends
    if (previousPeriods.length > 0) {
      const avgPreviousCost = previousPeriods.reduce((sum, period) => sum + period.totalCost, 0) / previousPeriods.length;
      
      if (currentPeriod.totalCost > avgPreviousCost * 1.2) {
        recommendations.push('Your usage has increased significantly this month. Consider reviewing your usage patterns.');
      }

      if (currentPeriod.totalCost < avgPreviousCost * 0.5) {
        recommendations.push('Your usage has decreased significantly. You might be able to downgrade your plan.');
      }
    }

    // Check for unused features
    if (currentPeriod.usageByType[UsageType.GENERATION].quantity === 0) {
      recommendations.push('You haven\'t used content generation this month. Consider exploring this feature.');
    }

    if (currentPeriod.usageByType[UsageType.PUBLISH].quantity === 0) {
      recommendations.push('You haven\'t published any content this month. Consider scheduling some posts.');
    }

    return recommendations;
  }
}
