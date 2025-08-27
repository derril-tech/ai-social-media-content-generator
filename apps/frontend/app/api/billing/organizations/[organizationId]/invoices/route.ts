import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { organizationId } = params;
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '10');
    const offset = parseInt(searchParams.get('offset') || '0');
    
    // Mock invoices data
    const mockInvoices = [
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
      {
        id: 'inv-4',
        invoiceNumber: 'INV-12345678-202409-0001',
        status: 'pending',
        totalAmount: 28.50,
        issueDate: new Date('2024-09-01'),
        dueDate: new Date('2024-09-30'),
      },
    ];

    // Filter by status if provided
    const filteredInvoices = status 
      ? mockInvoices.filter(invoice => invoice.status === status)
      : mockInvoices;

    // Apply pagination
    const paginatedInvoices = filteredInvoices.slice(offset, offset + limit);

    return NextResponse.json({
      invoices: paginatedInvoices,
      total: filteredInvoices.length,
    });
  } catch (error) {
    console.error('Error fetching invoices:', error);
    return NextResponse.json(
      { error: 'Failed to fetch invoices' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { organizationId: string } }
) {
  try {
    const { organizationId } = params;
    const body = await request.json();
    
    // Mock response for generating an invoice
    const newInvoice = {
      id: 'inv-' + Date.now(),
      invoiceNumber: `INV-${organizationId.slice(0, 8)}-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(Math.floor(Math.random() * 9999) + 1).padStart(4, '0')}`,
      status: 'draft',
      totalAmount: 47.47,
      issueDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    };

    return NextResponse.json({
      message: 'Invoice generated successfully',
      invoice: newInvoice,
    }, { status: 201 });
  } catch (error) {
    console.error('Error generating invoice:', error);
    return NextResponse.json(
      { error: 'Failed to generate invoice' },
      { status: 500 }
    );
  }
}
