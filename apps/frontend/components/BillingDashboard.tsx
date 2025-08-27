'use client';
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Space, Tag, Button, Tooltip, Progress, Alert, Spin, Table, Badge, Statistic, Tabs, Divider, List, Avatar, Modal, Form, InputNumber, Select, DatePicker, message, Descriptions, Timeline } from 'antd';
import {
  DollarOutlined, CreditCardOutlined, FileTextOutlined, BarChartOutlined,
  ReloadOutlined, SettingOutlined, DownloadOutlined, EyeOutlined,
  PlusOutlined, EditOutlined, DeleteOutlined, CheckCircleOutlined,
  ExclamationCircleOutlined, WarningOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie, AreaChart, Area } from 'recharts';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { RangePicker } = DatePicker;

interface UsageSummary {
  organizationId: string;
  periodStart: Date;
  periodEnd: Date;
  billingPeriod: string;
  usageByType: Record<string, {
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

interface BillingReport {
  organizationId: string;
  reportDate: Date;
  currentPeriod: UsageSummary;
  previousPeriods: UsageSummary[];
  invoices: Array<{
    id: string;
    invoiceNumber: string;
    status: string;
    totalAmount: number;
    issueDate: Date;
    dueDate: Date;
  }>;
  recommendations: string[];
}

interface BillingPlan {
  id: string;
  name: string;
  planType: string;
  billingCycle: string;
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
}

interface BillingDashboardProps {
  organizationId: string;
  className?: string;
}

export default function BillingDashboard({ organizationId, className }: BillingDashboardProps) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<BillingReport | null>(null);
  const [currentUsage, setCurrentUsage] = useState<any>(null);
  const [billingPlans, setBillingPlans] = useState<BillingPlan[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month')
  ]);
  const [invoiceModalVisible, setInvoiceModalVisible] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<any>(null);
  const [planModalVisible, setPlanModalVisible] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<BillingPlan | null>(null);

  useEffect(() => {
    fetchData();
  }, [organizationId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [reportRes, currentUsageRes, plansRes] = await Promise.all([
        fetch(`/api/billing/organizations/${organizationId}/report`),
        fetch(`/api/billing/organizations/${organizationId}/usage/current`),
        fetch('/api/billing/plans'),
      ]);

      if (reportRes.ok) {
        const reportData = await reportRes.json();
        setReport(reportData);
      }

      if (currentUsageRes.ok) {
        const currentUsageData = await currentUsageRes.json();
        setCurrentUsage(currentUsageData);
      }

      if (plansRes.ok) {
        const plansData = await plansRes.json();
        setBillingPlans(plansData);
      }
    } catch (error) {
      console.error('Error fetching billing data:', error);
      message.error('Failed to fetch billing data');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateInvoice = async () => {
    try {
      const response = await fetch(`/api/billing/organizations/${organizationId}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodStart: selectedPeriod[0].toISOString(),
          periodEnd: selectedPeriod[1].toISOString(),
        }),
      });

      if (response.ok) {
        message.success('Invoice generated successfully');
        fetchData();
      } else {
        message.error('Failed to generate invoice');
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      message.error('Failed to generate invoice');
    }
  };

  const handleViewInvoice = async (invoiceId: string) => {
    try {
      const response = await fetch(`/api/billing/organizations/${organizationId}/invoices/${invoiceId}`);
      if (response.ok) {
        const invoiceData = await response.json();
        setSelectedInvoice(invoiceData);
        setInvoiceModalVisible(true);
      }
    } catch (error) {
      console.error('Error fetching invoice:', error);
      message.error('Failed to fetch invoice details');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'green';
      case 'pending': return 'orange';
      case 'overdue': return 'red';
      case 'draft': return 'default';
      default: return 'default';
    }
  };

  const getUsagePercentage = (current: number, limit: number) => {
    if (limit === 0) return 0;
    return Math.min(100, (current / limit) * 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return '#ff4d4f';
    if (percentage >= 75) return '#faad14';
    return '#52c41a';
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return dayjs(date).format('MMM DD, YYYY');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="mb-6">
        <Title level={3}>
          <DollarOutlined className="mr-2" />
          Billing & Usage Dashboard
        </Title>
        <Text type="secondary">
          Monitor usage, manage billing, and view invoices for organization: {organizationId}
        </Text>
      </div>

      {/* Current Usage Overview */}
      {currentUsage && (
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Title level={4}>Current Usage (This Month)</Title>
            <Button 
              icon={<ReloadOutlined />} 
              onClick={fetchData}
              type="primary"
            >
              Refresh
            </Button>
          </div>
          
          <Row gutter={16}>
            <Col span={6}>
              <Statistic
                title="Seats Used"
                value={currentUsage.currentUsage.seats}
                suffix={`/ ${report?.currentPeriod.planLimits.maxSeats || '∞'}`}
                valueStyle={{ color: getUsageColor(getUsagePercentage(currentUsage.currentUsage.seats, report?.currentPeriod.planLimits.maxSeats || 0)) }}
              />
              <Progress 
                percent={getUsagePercentage(currentUsage.currentUsage.seats, report?.currentPeriod.planLimits.maxSeats || 0)} 
                strokeColor={getUsageColor(getUsagePercentage(currentUsage.currentUsage.seats, report?.currentPeriod.planLimits.maxSeats || 0))}
                size="small"
                showInfo={false}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Generations"
                value={currentUsage.currentUsage.generations}
                suffix={`/ ${report?.currentPeriod.planLimits.maxGenerationsPerMonth || '∞'}`}
                valueStyle={{ color: getUsageColor(getUsagePercentage(currentUsage.currentUsage.generations, report?.currentPeriod.planLimits.maxGenerationsPerMonth || 0)) }}
              />
              <Progress 
                percent={getUsagePercentage(currentUsage.currentUsage.generations, report?.currentPeriod.planLimits.maxGenerationsPerMonth || 0)} 
                strokeColor={getUsageColor(getUsagePercentage(currentUsage.currentUsage.generations, report?.currentPeriod.planLimits.maxGenerationsPerMonth || 0))}
                size="small"
                showInfo={false}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Publishes"
                value={currentUsage.currentUsage.publishes}
                suffix={`/ ${report?.currentPeriod.planLimits.maxPublishesPerMonth || '∞'}`}
                valueStyle={{ color: getUsageColor(getUsagePercentage(currentUsage.currentUsage.publishes, report?.currentPeriod.planLimits.maxPublishesPerMonth || 0)) }}
              />
              <Progress 
                percent={getUsagePercentage(currentUsage.currentUsage.publishes, report?.currentPeriod.planLimits.maxPublishesPerMonth || 0)} 
                strokeColor={getUsageColor(getUsagePercentage(currentUsage.currentUsage.publishes, report?.currentPeriod.planLimits.maxPublishesPerMonth || 0))}
                size="small"
                showInfo={false}
              />
            </Col>
            <Col span={6}>
              <Statistic
                title="Storage Used"
                value={currentUsage.currentUsage.storageGB}
                suffix={`GB / ${report?.currentPeriod.planLimits.maxStorageGB || '∞'} GB`}
                valueStyle={{ color: getUsageColor(getUsagePercentage(currentUsage.currentUsage.storageGB, report?.currentPeriod.planLimits.maxStorageGB || 0)) }}
              />
              <Progress 
                percent={getUsagePercentage(currentUsage.currentUsage.storageGB, report?.currentPeriod.planLimits.maxStorageGB || 0)} 
                strokeColor={getUsageColor(getUsagePercentage(currentUsage.currentUsage.storageGB, report?.currentPeriod.planLimits.maxStorageGB || 0))}
                size="small"
                showInfo={false}
              />
            </Col>
          </Row>
        </Card>
      )}

      {/* Recommendations */}
      {report?.recommendations && report.recommendations.length > 0 && (
        <Alert
          message="Billing Recommendations"
          description={
            <List
              size="small"
              dataSource={report.recommendations}
              renderItem={(item) => <List.Item>{item}</List.Item>}
            />
          }
          type="info"
          showIcon
          className="mb-6"
        />
      )}

      <Tabs defaultActiveKey="overview">
        <TabPane tab="Overview" key="overview">
          <Row gutter={16}>
            {/* Current Period Summary */}
            <Col span={12}>
              <Card title="Current Period Summary" className="h-full">
                {report?.currentPeriod && (
                  <div>
                    <Statistic
                      title="Total Cost"
                      value={report.currentPeriod.totalCost}
                      precision={2}
                      prefix="$"
                      valueStyle={{ color: '#1890ff', fontSize: '24px' }}
                    />
                    
                    <Divider />
                    
                    <div className="space-y-3">
                      {Object.entries(report.currentPeriod.usageByType).map(([type, usage]) => (
                        usage.quantity > 0 && (
                          <div key={type} className="flex justify-between items-center">
                            <Text>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                            <div className="text-right">
                              <div>{usage.quantity} units</div>
                              <div className="text-sm text-gray-500">
                                {formatCurrency(usage.totalCost)}
                              </div>
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  </div>
                )}
              </Card>
            </Col>

            {/* Cost Trends */}
            <Col span={12}>
              <Card title="Cost Trends (Last 6 Months)" className="h-full">
                {report?.previousPeriods && (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={report.previousPeriods.map((period, index) => ({
                      month: dayjs(period.periodStart).format('MMM'),
                      cost: period.totalCost,
                    }))}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <RechartsTooltip formatter={(value) => [formatCurrency(Number(value)), 'Cost']} />
                      <Area type="monotone" dataKey="cost" stroke="#1890ff" fill="#1890ff" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="Invoices" key="invoices">
          <Card>
            <div className="mb-4 flex justify-between items-center">
              <div>
                <Title level={4}>Invoices</Title>
                <Text type="secondary">Manage and view your billing invoices</Text>
              </div>
              <Space>
                <RangePicker
                  value={selectedPeriod}
                  onChange={(dates) => dates && setSelectedPeriod(dates)}
                />
                <Button 
                  icon={<PlusOutlined />}
                  onClick={handleGenerateInvoice}
                  type="primary"
                >
                  Generate Invoice
                </Button>
              </Space>
            </div>

            {report?.invoices && (
              <Table
                dataSource={report.invoices}
                columns={[
                  { title: 'Invoice #', dataIndex: 'invoiceNumber', key: 'invoiceNumber' },
                  { title: 'Issue Date', dataIndex: 'issueDate', key: 'issueDate', render: (date) => formatDate(date) },
                  { title: 'Due Date', dataIndex: 'dueDate', key: 'dueDate', render: (date) => formatDate(date) },
                  { 
                    title: 'Status', 
                    dataIndex: 'status', 
                    key: 'status',
                    render: (status) => (
                      <Tag color={getStatusColor(status)}>
                        {status.toUpperCase()}
                      </Tag>
                    )
                  },
                  { 
                    title: 'Amount', 
                    dataIndex: 'totalAmount', 
                    key: 'totalAmount',
                    render: (amount) => formatCurrency(amount)
                  },
                  {
                    title: 'Actions',
                    key: 'actions',
                    render: (_, record) => (
                      <Space>
                        <Button 
                          size="small" 
                          icon={<EyeOutlined />}
                          onClick={() => handleViewInvoice(record.id)}
                        >
                          View
                        </Button>
                        <Button 
                          size="small" 
                          icon={<DownloadOutlined />}
                        >
                          Download
                        </Button>
                      </Space>
                    )
                  },
                ]}
                pagination={false}
                size="small"
              />
            )}
          </Card>
        </TabPane>

        <TabPane tab="Usage Details" key="usage">
          <Card>
            <div className="mb-4">
              <Title level={4}>Usage Breakdown</Title>
              <Text type="secondary">Detailed breakdown of your usage by type</Text>
            </div>

            {report?.currentPeriod && (
              <Row gutter={16}>
                <Col span={12}>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={Object.entries(report.currentPeriod.usageByType)
                          .filter(([_, usage]) => usage.quantity > 0)
                          .map(([type, usage]) => ({
                            name: type.charAt(0).toUpperCase() + type.slice(1),
                            value: usage.totalCost,
                          }))}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, value }) => `${name}: ${formatCurrency(value)}`}
                      />
                      <RechartsTooltip formatter={(value) => [formatCurrency(Number(value)), 'Cost']} />
                    </PieChart>
                  </ResponsiveContainer>
                </Col>

                <Col span={12}>
                  <div className="space-y-4">
                    {Object.entries(report.currentPeriod.usageByType).map(([type, usage]) => (
                      <div key={type} className="border rounded p-3">
                        <div className="flex justify-between items-center mb-2">
                          <Text strong>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                          <Text>{usage.quantity} units</Text>
                        </div>
                        <div className="flex justify-between items-center">
                          <Text type="secondary">Unit Price: {formatCurrency(usage.unitPrice)}</Text>
                          <Text strong>{formatCurrency(usage.totalCost)}</Text>
                        </div>
                      </div>
                    ))}
                  </div>
                </Col>
              </Row>
            )}
          </Card>
        </TabPane>

        <TabPane tab="Plans" key="plans">
          <Card>
            <div className="mb-4 flex justify-between items-center">
              <div>
                <Title level={4}>Billing Plans</Title>
                <Text type="secondary">Available plans and pricing</Text>
              </div>
              <Button 
                icon={<PlusOutlined />}
                onClick={() => setPlanModalVisible(true)}
                type="primary"
              >
                Create Custom Plan
              </Button>
            </div>

            <Row gutter={16}>
              {billingPlans.map((plan) => (
                <Col span={6} key={plan.id}>
                  <Card 
                    title={plan.name}
                    extra={
                      <Tag color={plan.planType === 'enterprise' ? 'gold' : 'blue'}>
                        {plan.planType.toUpperCase()}
                      </Tag>
                    }
                    className="h-full"
                  >
                    <div className="text-center mb-4">
                      <Title level={2}>{formatCurrency(plan.basePrice)}</Title>
                      <Text type="secondary">per {plan.billingCycle}</Text>
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between">
                        <Text>Seats:</Text>
                        <Text>{plan.maxSeats}</Text>
                      </div>
                      <div className="flex justify-between">
                        <Text>Generations:</Text>
                        <Text>{plan.maxGenerationsPerMonth}/month</Text>
                      </div>
                      <div className="flex justify-between">
                        <Text>Publishes:</Text>
                        <Text>{plan.maxPublishesPerMonth}/month</Text>
                      </div>
                      <div className="flex justify-between">
                        <Text>Storage:</Text>
                        <Text>{plan.maxStorageGB}GB</Text>
                      </div>
                    </div>

                    <div className="space-y-1 mb-4">
                      {plan.features.slice(0, 3).map((feature, index) => (
                        <div key={index} className="flex items-center">
                          <CheckCircleOutlined className="text-green-500 mr-2" />
                          <Text className="text-sm">{feature}</Text>
                        </div>
                      ))}
                    </div>

                    <Button block type="primary">
                      Select Plan
                    </Button>
                  </Card>
                </Col>
              ))}
            </Row>
          </Card>
        </TabPane>
      </Tabs>

      {/* Invoice Detail Modal */}
      <Modal
        title="Invoice Details"
        open={invoiceModalVisible}
        onCancel={() => setInvoiceModalVisible(false)}
        footer={[
          <Button key="download" icon={<DownloadOutlined />}>
            Download PDF
          </Button>,
          <Button key="close" onClick={() => setInvoiceModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={800}
      >
        {selectedInvoice && (
          <div>
            <Descriptions bordered column={2}>
              <Descriptions.Item label="Invoice Number">{selectedInvoice.invoiceNumber}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(selectedInvoice.status)}>
                  {selectedInvoice.status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Issue Date">{formatDate(selectedInvoice.issueDate)}</Descriptions.Item>
              <Descriptions.Item label="Due Date">{formatDate(selectedInvoice.dueDate)}</Descriptions.Item>
              <Descriptions.Item label="Subtotal">{formatCurrency(selectedInvoice.subtotal)}</Descriptions.Item>
              <Descriptions.Item label="Tax">{formatCurrency(selectedInvoice.taxAmount)}</Descriptions.Item>
              <Descriptions.Item label="Total" span={2}>
                <Text strong style={{ fontSize: '18px' }}>
                  {formatCurrency(selectedInvoice.totalAmount)}
                </Text>
              </Descriptions.Item>
            </Descriptions>

            <Divider />

            <Title level={5}>Line Items</Title>
            <Table
              dataSource={selectedInvoice.lineItems}
              columns={[
                { title: 'Description', dataIndex: 'description', key: 'description' },
                { title: 'Quantity', dataIndex: 'quantity', key: 'quantity' },
                { title: 'Unit Price', dataIndex: 'unitPrice', key: 'unitPrice', render: (price) => formatCurrency(price) },
                { title: 'Total', dataIndex: 'total', key: 'total', render: (total) => formatCurrency(total) },
              ]}
              pagination={false}
              size="small"
            />
          </div>
        )}
      </Modal>

      {/* Plan Creation Modal */}
      <Modal
        title="Create Custom Plan"
        open={planModalVisible}
        onCancel={() => setPlanModalVisible(false)}
        footer={[
          <Button key="cancel" onClick={() => setPlanModalVisible(false)}>
            Cancel
          </Button>,
          <Button key="create" type="primary">
            Create Plan
          </Button>,
        ]}
      >
        <Form layout="vertical">
          <Form.Item label="Plan Name" required>
            <Input placeholder="Enter plan name" />
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="Base Price" required>
                <InputNumber
                  placeholder="0.00"
                  min={0}
                  step={0.01}
                  style={{ width: '100%' }}
                  prefix="$"
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="Billing Cycle" required>
                <Select placeholder="Select billing cycle">
                  <Select.Option value="monthly">Monthly</Select.Option>
                  <Select.Option value="yearly">Yearly</Select.Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={6}>
              <Form.Item label="Max Seats">
                <InputNumber min={1} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Max Generations">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Max Publishes">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item label="Max Storage (GB)">
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>
    </div>
  );
}
