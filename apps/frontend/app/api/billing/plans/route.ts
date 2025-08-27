import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Mock billing plans data
    const mockPlans = [
      {
        id: 'plan-free',
        name: 'Free',
        planType: 'free',
        billingCycle: 'monthly',
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
        planType: 'starter',
        billingCycle: 'monthly',
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
        planType: 'professional',
        billingCycle: 'monthly',
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
        planType: 'enterprise',
        billingCycle: 'monthly',
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

    return NextResponse.json(mockPlans);
  } catch (error) {
    console.error('Error fetching billing plans:', error);
    return NextResponse.json(
      { error: 'Failed to fetch billing plans' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Mock response for creating a new plan
    const newPlan = {
      id: 'plan-custom-' + Date.now(),
      ...body,
      isActive: true,
      isCustom: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return NextResponse.json({
      message: 'Billing plan created successfully',
      plan: newPlan,
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating billing plan:', error);
    return NextResponse.json(
      { error: 'Failed to create billing plan' },
      { status: 500 }
    );
  }
}
