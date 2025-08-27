import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string; invoiceId: string } }
) {
  try {
    const { organizationId, invoiceId } = params;
    
    // Mock invoice details
    const mockInvoice = {
      id: invoiceId,
      invoiceNumber: 'INV-12345678-202412-0001',
      organizationId,
      issueDate: new Date('2024-12-01'),
      dueDate: new Date('2024-12-31'),
      status: 'paid',
      subtotal: 43.95,
      taxAmount: 3.52,
      totalAmount: 47.47,
      taxRate: 0.08,
      currency: 'USD',
      lineItems: [
        {
          description: 'Professional Plan',
          quantity: 1,
          unitPrice: 29.99,
          total: 29.99,
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
        {
          description: 'Storage Usage',
          quantity: 25,
          unitPrice: 0.15,
          total: 3.75,
          usageType: 'storage',
          period: 'monthly',
        },
        {
          description: 'API Calls',
          quantity: 1000,
          unitPrice: 0.001,
          total: 1.00,
          usageType: 'api_call',
          period: 'monthly',
        },
        {
          description: 'Webhooks',
          quantity: 500,
          unitPrice: 0.0005,
          total: 0.25,
          usageType: 'webhook',
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
      paymentMethod: 'credit_card',
      paymentReference: 'ch_1234567890',
      notes: 'Thank you for your business!',
    };

    return NextResponse.json(mockInvoice);
  } catch (error) {
    console.error('Error fetching invoice:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoice' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { organizationId: string; invoiceId: string } }
) {
  try {
    const { organizationId, invoiceId } = params;
    const body = await request.json();
    
    // Mock response for updating an invoice
    const updatedInvoice = {
      id: invoiceId,
      invoiceNumber: 'INV-12345678-202412-0001',
      status: body.status || 'pending',
      paymentMethod: body.paymentMethod,
      paymentReference: body.paymentReference,
      notes: body.notes,
      updatedAt: new Date(),
    };

    return NextResponse.json({
      message: 'Invoice updated successfully',
      invoice: updatedInvoice,
    });
  } catch (error) {
    console.error('Error updating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to update invoice' },
      { status: 500 }
    );
  }
}
