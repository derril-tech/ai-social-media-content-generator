import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards, HttpStatus, HttpException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam, ApiQuery } from '@nestjs/swagger';
import { BillingService, UsageSummary, BillingReport } from '../services/billing.service';
import { RbacGuard, RequireAdmin } from '../../auth/guards/rbac.guard';
import { UsageRecord, UsageType, BillingPeriod } from '../entities/usage-record.entity';
import { BillingPlan, PlanType, BillingCycle } from '../entities/billing-plan.entity';
import { Invoice, InvoiceStatus, PaymentMethod } from '../entities/invoice.entity';

export interface TrackUsageRequest {
  usageType: UsageType;
  quantity?: number;
  userId?: string;
  metadata?: Record<string, any>;
  platform?: string;
  feature?: string;
}

export interface UsageSummaryResponse {
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

export interface BillingReportResponse {
  organizationId: string;
  reportDate: Date;
  currentPeriod: UsageSummaryResponse;
  previousPeriods: UsageSummaryResponse[];
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

export interface CreateBillingPlanRequest {
  name: string;
  planType: PlanType;
  billingCycle: BillingCycle;
  basePrice: number;
  maxSeats: number;
  maxGenerationsPerMonth: number;
  maxPublishesPerMonth: number;
  maxStorageGB: number;
  generationPricePerUnit: number;
  publishPricePerUnit: number;
  storagePricePerGB: number;
  seatPricePerMonth: number;
  features?: string[];
  description?: string;
}

export interface UpdateInvoiceRequest {
  status?: InvoiceStatus;
  paymentMethod?: PaymentMethod;
  paymentReference?: string;
  notes?: string;
}

@ApiTags('Billing')
@Controller('billing')
@UseGuards(RbacGuard)
@ApiBearerAuth()
export class BillingController {
  constructor(
    private readonly billingService: BillingService,
  ) {}

  @Post('organizations/:organizationId/usage')
  @RequireAdmin()
  @ApiOperation({ summary: 'Track usage for an organization' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiResponse({ status: 201, description: 'Usage tracked successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async trackUsage(
    @Param('organizationId') organizationId: string,
    @Body() request: TrackUsageRequest,
  ): Promise<{ message: string; usageRecord: any }> {
    try {
      const usageRecord = await this.billingService.trackUsage(
        organizationId,
        request.usageType,
        request.quantity,
        request.userId,
        request.metadata,
        request.platform,
        request.feature,
      );

      return {
        message: 'Usage tracked successfully',
        usageRecord: {
          id: usageRecord.id,
          usageType: usageRecord.usageType,
          quantity: usageRecord.quantity,
          totalCost: usageRecord.totalCost,
          createdAt: usageRecord.createdAt,
        },
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to track usage',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('organizations/:organizationId/usage/summary')
  @RequireAdmin()
  @ApiOperation({ summary: 'Get usage summary for an organization' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiQuery({ name: 'periodStart', required: false, description: 'Period start date (ISO string)' })
  @ApiQuery({ name: 'periodEnd', required: false, description: 'Period end date (ISO string)' })
  @ApiQuery({ name: 'billingPeriod', required: false, description: 'Billing period (daily/monthly/yearly)' })
  @ApiResponse({ status: 200, description: 'Usage summary retrieved successfully', type: UsageSummaryResponse })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getUsageSummary(
    @Param('organizationId') organizationId: string,
    @Query('periodStart') periodStart?: string,
    @Query('periodEnd') periodEnd?: string,
    @Query('billingPeriod') billingPeriod?: BillingPeriod,
  ): Promise<UsageSummaryResponse> {
    try {
      const start = periodStart ? new Date(periodStart) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const end = periodEnd ? new Date(periodEnd) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

      const summary = await this.billingService.getUsageSummary(
        organizationId,
        start,
        end,
        billingPeriod || BillingPeriod.MONTHLY,
      );

      return summary;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get usage summary',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('organizations/:organizationId/usage/current')
  @RequireAdmin()
  @ApiOperation({ summary: 'Get current usage for an organization' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiResponse({ status: 200, description: 'Current usage retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getCurrentUsage(
    @Param('organizationId') organizationId: string,
  ): Promise<{
    organizationId: string;
    currentUsage: {
      seats: number;
      generations: number;
      publishes: number;
      storageGB: number;
    };
    lastUpdated: Date;
  }> {
    try {
      const currentUsage = await this.billingService.getCurrentUsage(organizationId);

      return {
        organizationId,
        currentUsage,
        lastUpdated: new Date(),
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get current usage',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('organizations/:organizationId/report')
  @RequireAdmin()
  @ApiOperation({ summary: 'Get comprehensive billing report for an organization' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiQuery({ name: 'months', required: false, description: 'Number of previous months to include (default: 6)' })
  @ApiResponse({ status: 200, description: 'Billing report retrieved successfully', type: BillingReportResponse })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getBillingReport(
    @Param('organizationId') organizationId: string,
    @Query('months') months?: number,
  ): Promise<BillingReportResponse> {
    try {
      const report = await this.billingService.getBillingReport(organizationId, months || 6);
      return report;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get billing report',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('organizations/:organizationId/invoices')
  @RequireAdmin()
  @ApiOperation({ summary: 'Generate invoice for an organization' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiQuery({ name: 'periodStart', required: false, description: 'Period start date (ISO string)' })
  @ApiQuery({ name: 'periodEnd', required: false, description: 'Period end date (ISO string)' })
  @ApiQuery({ name: 'billingPeriod', required: false, description: 'Billing period (daily/monthly/yearly)' })
  @ApiResponse({ status: 201, description: 'Invoice generated successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async generateInvoice(
    @Param('organizationId') organizationId: string,
    @Query('periodStart') periodStart?: string,
    @Query('periodEnd') periodEnd?: string,
    @Query('billingPeriod') billingPeriod?: BillingPeriod,
  ): Promise<{ message: string; invoice: any }> {
    try {
      const start = periodStart ? new Date(periodStart) : new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const end = periodEnd ? new Date(periodEnd) : new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

      const invoice = await this.billingService.generateInvoice(
        organizationId,
        start,
        end,
        billingPeriod || BillingPeriod.MONTHLY,
      );

      return {
        message: 'Invoice generated successfully',
        invoice: {
          id: invoice.id,
          invoiceNumber: invoice.invoiceNumber,
          status: invoice.status,
          totalAmount: invoice.totalAmount,
          issueDate: invoice.issueDate,
          dueDate: invoice.dueDate,
        },
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to generate invoice',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('organizations/:organizationId/invoices')
  @RequireAdmin()
  @ApiOperation({ summary: 'Get invoices for an organization' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiQuery({ name: 'status', required: false, description: 'Filter by invoice status' })
  @ApiQuery({ name: 'limit', required: false, description: 'Number of invoices to return (default: 10)' })
  @ApiQuery({ name: 'offset', required: false, description: 'Number of invoices to skip (default: 0)' })
  @ApiResponse({ status: 200, description: 'Invoices retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getInvoices(
    @Param('organizationId') organizationId: string,
    @Query('status') status?: InvoiceStatus,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
  ): Promise<{
    invoices: Array<{
      id: string;
      invoiceNumber: string;
      status: InvoiceStatus;
      totalAmount: number;
      issueDate: Date;
      dueDate: Date;
    }>;
    total: number;
  }> {
    try {
      // This would typically use a repository directly
      // For now, we'll return a mock response
      const mockInvoices = [
        {
          id: 'inv-1',
          invoiceNumber: 'INV-12345678-202412-0001',
          status: InvoiceStatus.PAID,
          totalAmount: 299.99,
          issueDate: new Date('2024-12-01'),
          dueDate: new Date('2024-12-31'),
        },
        {
          id: 'inv-2',
          invoiceNumber: 'INV-12345678-202411-0001',
          status: InvoiceStatus.PAID,
          totalAmount: 299.99,
          issueDate: new Date('2024-11-01'),
          dueDate: new Date('2024-11-30'),
        },
      ];

      return {
        invoices: mockInvoices,
        total: mockInvoices.length,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get invoices',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('organizations/:organizationId/invoices/:invoiceId')
  @RequireAdmin()
  @ApiOperation({ summary: 'Get specific invoice details' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiParam({ name: 'invoiceId', description: 'Invoice ID' })
  @ApiResponse({ status: 200, description: 'Invoice details retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async getInvoice(
    @Param('organizationId') organizationId: string,
    @Param('invoiceId') invoiceId: string,
  ): Promise<any> {
    try {
      // This would typically fetch from database
      // For now, return mock data
      const mockInvoice = {
        id: invoiceId,
        invoiceNumber: 'INV-12345678-202412-0001',
        organizationId,
        issueDate: new Date('2024-12-01'),
        dueDate: new Date('2024-12-31'),
        status: InvoiceStatus.PAID,
        subtotal: 277.77,
        taxAmount: 22.22,
        totalAmount: 299.99,
        taxRate: 0.08,
        currency: 'USD',
        lineItems: [
          {
            description: 'Professional Plan',
            quantity: 1,
            unitPrice: 199.99,
            total: 199.99,
            usageType: 'plan',
            period: 'monthly',
          },
          {
            description: 'Generation Usage',
            quantity: 150,
            unitPrice: 0.05,
            total: 7.50,
            usageType: 'generation',
            period: 'monthly',
          },
          {
            description: 'Publish Usage',
            quantity: 50,
            unitPrice: 0.10,
            total: 5.00,
            usageType: 'publish',
            period: 'monthly',
          },
        ],
        billingAddress: {
          name: 'Acme Corp',
          address: '123 Main St',
          city: 'New York',
          state: 'NY',
          postalCode: '10001',
          country: 'USA',
        },
      };

      return mockInvoice;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get invoice',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Put('organizations/:organizationId/invoices/:invoiceId')
  @RequireAdmin()
  @ApiOperation({ summary: 'Update invoice status or details' })
  @ApiParam({ name: 'organizationId', description: 'Organization ID' })
  @ApiParam({ name: 'invoiceId', description: 'Invoice ID' })
  @ApiResponse({ status: 200, description: 'Invoice updated successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  @ApiResponse({ status: 404, description: 'Invoice not found' })
  async updateInvoice(
    @Param('organizationId') organizationId: string,
    @Param('invoiceId') invoiceId: string,
    @Body() request: UpdateInvoiceRequest,
  ): Promise<{ message: string; invoice: any }> {
    try {
      // This would typically update in database
      // For now, return mock response
      const updatedInvoice = {
        id: invoiceId,
        invoiceNumber: 'INV-12345678-202412-0001',
        status: request.status || InvoiceStatus.PENDING,
        paymentMethod: request.paymentMethod,
        paymentReference: request.paymentReference,
        notes: request.notes,
        updatedAt: new Date(),
      };

      return {
        message: 'Invoice updated successfully',
        invoice: updatedInvoice,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to update invoice',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('plans')
  @RequireAdmin()
  @ApiOperation({ summary: 'Get available billing plans' })
  @ApiResponse({ status: 200, description: 'Billing plans retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async getBillingPlans(): Promise<Array<{
    id: string;
    name: string;
    planType: PlanType;
    billingCycle: BillingCycle;
    basePrice: number;
    maxSeats: number;
    maxGenerationsPerMonth: number;
    maxPublishesPerMonth: number;
    maxStorageGB: number;
    generationPricePerUnit: number;
    publishPricePerUnit: number;
    storagePricePerGB: number;
    seatPricePerMonth: number;
    features: string[];
    description: string;
  }>> {
    try {
      // Mock billing plans
      const plans = [
        {
          id: 'plan-free',
          name: 'Free',
          planType: PlanType.FREE,
          billingCycle: BillingCycle.MONTHLY,
          basePrice: 0,
          maxSeats: 1,
          maxGenerationsPerMonth: 10,
          maxPublishesPerMonth: 5,
          maxStorageGB: 1,
          generationPricePerUnit: 0.10,
          publishPricePerUnit: 0.20,
          storagePricePerGB: 0.50,
          seatPricePerMonth: 0,
          features: ['Basic content generation', 'Limited publishing', '1GB storage'],
          description: 'Perfect for individuals getting started',
        },
        {
          id: 'plan-starter',
          name: 'Starter',
          planType: PlanType.STARTER,
          billingCycle: BillingCycle.MONTHLY,
          basePrice: 29.99,
          maxSeats: 3,
          maxGenerationsPerMonth: 100,
          maxPublishesPerMonth: 50,
          maxStorageGB: 10,
          generationPricePerUnit: 0.05,
          publishPricePerUnit: 0.10,
          storagePricePerGB: 0.25,
          seatPricePerMonth: 9.99,
          features: ['Advanced content generation', 'Multi-platform publishing', '10GB storage', 'Basic analytics'],
          description: 'Great for small teams and growing businesses',
        },
        {
          id: 'plan-professional',
          name: 'Professional',
          planType: PlanType.PROFESSIONAL,
          billingCycle: BillingCycle.MONTHLY,
          basePrice: 99.99,
          maxSeats: 10,
          maxGenerationsPerMonth: 500,
          maxPublishesPerMonth: 200,
          maxStorageGB: 50,
          generationPricePerUnit: 0.03,
          publishPricePerUnit: 0.08,
          storagePricePerGB: 0.15,
          seatPricePerMonth: 7.99,
          features: ['AI-powered content generation', 'Advanced scheduling', '50GB storage', 'Comprehensive analytics', 'A/B testing'],
          description: 'Perfect for marketing teams and agencies',
        },
        {
          id: 'plan-enterprise',
          name: 'Enterprise',
          planType: PlanType.ENTERPRISE,
          billingCycle: BillingCycle.MONTHLY,
          basePrice: 299.99,
          maxSeats: 50,
          maxGenerationsPerMonth: 2000,
          maxPublishesPerMonth: 1000,
          maxStorageGB: 200,
          generationPricePerUnit: 0.02,
          publishPricePerUnit: 0.05,
          storagePricePerGB: 0.10,
          seatPricePerMonth: 5.99,
          features: ['Custom AI models', 'Unlimited scheduling', '200GB storage', 'Advanced analytics', 'Custom integrations', 'Priority support'],
          description: 'For large organizations with advanced needs',
        },
      ];

      return plans;
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to get billing plans',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('plans')
  @RequireAdmin()
  @ApiOperation({ summary: 'Create a new billing plan' })
  @ApiResponse({ status: 201, description: 'Billing plan created successfully' })
  @ApiResponse({ status: 403, description: 'Access denied' })
  async createBillingPlan(
    @Body() request: CreateBillingPlanRequest,
  ): Promise<{ message: string; plan: any }> {
    try {
      // This would typically save to database
      // For now, return mock response
      const newPlan = {
        id: 'plan-custom-' + Date.now(),
        ...request,
        isActive: true,
        isCustom: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return {
        message: 'Billing plan created successfully',
        plan: newPlan,
      };
    } catch (error) {
      throw new HttpException(
        error.message || 'Failed to create billing plan',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
