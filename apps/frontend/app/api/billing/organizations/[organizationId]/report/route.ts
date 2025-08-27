import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { organizationId } = params;
    
    // Mock billing report data
    const mockReport = {
      organizationId,
      reportDate: new Date(),
      currentPeriod: {
        organizationId,
        periodStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0),
        billingPeriod: 'monthly',
        usageByType: {
          generation: {
            quantity: 150,
            unitPrice: 0.05,
            totalCost: 7.50,
          },
          publish: {
            quantity: 50,
            unitPrice: 0.10,
            totalCost: 5.00,
          },
          seat: {
            quantity: 3,
            unitPrice: 9.99,
            totalCost: 29.97,
          },
          storage: {
            quantity: 25,
            unitPrice: 0.15,
            totalCost: 3.75,
          },
          api_call: {
            quantity: 1000,
            unitPrice: 0.001,
            totalCost: 1.00,
          },
          webhook: {
            quantity: 500,
            unitPrice: 0.0005,
            totalCost: 0.25,
          },
        },
        totalCost: 47.47,
        planLimits: {
          maxSeats: 10,
          maxGenerationsPerMonth: 500,
          maxPublishesPerMonth: 200,
          maxStorageGB: 50,
        },
        currentUsage: {
          seats: 3,
          generations: 150,
          publishes: 50,
          storageGB: 25,
        },
        overages: {
          seats: 0,
          generations: 0,
          publishes: 0,
          storageGB: 0,
        },
      },
      previousPeriods: [
        {
          organizationId,
          periodStart: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1),
          periodEnd: new Date(new Date().getFullYear(), new Date().getMonth(), 0),
          billingPeriod: 'monthly',
          usageByType: {
            generation: { quantity: 120, unitPrice: 0.05, totalCost: 6.00 },
            publish: { quantity: 40, unitPrice: 0.10, totalCost: 4.00 },
            seat: { quantity: 3, unitPrice: 9.99, totalCost: 29.97 },
            storage: { quantity: 20, unitPrice: 0.15, totalCost: 3.00 },
            api_call: { quantity: 800, unitPrice: 0.001, totalCost: 0.80 },
            webhook: { quantity: 400, unitPrice: 0.0005, totalCost: 0.20 },
          },
          totalCost: 43.97,
          planLimits: {
            maxSeats: 10,
            maxGenerationsPerMonth: 500,
            maxPublishesPerMonth: 200,
            maxStorageGB: 50,
          },
          currentUsage: {
            seats: 3,
            generations: 120,
            publishes: 40,
            storageGB: 20,
          },
          overages: {
            seats: 0,
            generations: 0,
            publishes: 0,
            storageGB: 0,
          },
        },
        {
          organizationId,
          periodStart: new Date(new Date().getFullYear(), new Date().getMonth() - 2, 1),
          periodEnd: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 0),
          billingPeriod: 'monthly',
          usageByType: {
            generation: { quantity: 100, unitPrice: 0.05, totalCost: 5.00 },
            publish: { quantity: 30, unitPrice: 0.10, totalCost: 3.00 },
            seat: { quantity: 2, unitPrice: 9.99, totalCost: 19.98 },
            storage: { quantity: 15, unitPrice: 0.15, totalCost: 2.25 },
            api_call: { quantity: 600, unitPrice: 0.001, totalCost: 0.60 },
            webhook: { quantity: 300, unitPrice: 0.0005, totalCost: 0.15 },
          },
          totalCost: 30.98,
          planLimits: {
            maxSeats: 10,
            maxGenerationsPerMonth: 500,
            maxPublishesPerMonth: 200,
            maxStorageGB: 50,
          },
          currentUsage: {
            seats: 2,
            generations: 100,
            publishes: 30,
            storageGB: 15,
          },
          overages: {
            seats: 0,
            generations: 0,
            publishes: 0,
            storageGB: 0,
          },
        },
      ],
      invoices: [
        {
          id: 'inv-1',
          invoiceNumber: 'INV-12345678-202412-0001',
          status: 'paid',
          totalAmount: 47.47,
          issueDate: new Date('2024-12-01'),
          dueDate: new Date('2024-12-31'),
        },
        {
          id: 'inv-2',
          invoiceNumber: 'INV-12345678-202411-0001',
          status: 'paid',
          totalAmount: 43.97,
          issueDate: new Date('2024-11-01'),
          dueDate: new Date('2024-11-30'),
        },
        {
          id: 'inv-3',
          invoiceNumber: 'INV-12345678-202410-0001',
          status: 'paid',
          totalAmount: 30.98,
          issueDate: new Date('2024-10-01'),
          dueDate: new Date('2024-10-31'),
        },
      ],
      recommendations: [
        'Your usage has increased by 8% this month. Consider reviewing your usage patterns.',
        'You\'re using 30% of your generation limit. Consider exploring more content generation features.',
        'Your storage usage is at 50%. Consider cleaning up unused assets to optimize costs.',
        'You have 7 seats remaining. Consider inviting more team members to maximize your plan value.',
      ],
    };

    return NextResponse.json(mockReport);
  } catch (error) {
    console.error('Error fetching billing report:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing report' },
      { status: 500 }
    );
  }
}
