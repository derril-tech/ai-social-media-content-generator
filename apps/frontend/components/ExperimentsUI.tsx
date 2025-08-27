'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Table, 
  Select, 
  InputNumber, 
  Switch, 
  Typography, 
  Tag, 
  Space, 
  Modal,
  Form,
  Progress,
  Statistic,
  Row,
  Col,
  Alert,
  Spin,
  Tooltip,
  Badge,
  Divider,
  Timeline
} from 'antd';
import { 
  ExperimentOutlined, 
  PlayCircleOutlined, 
  PauseCircleOutlined, 
  StopOutlined,
  TrophyOutlined,
  BarChartOutlined,
  EyeOutlined,
  SettingOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface Experiment {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed' | 'stopped';
  variants: ExperimentVariant[];
  split: SplitConfig;
  startDate?: string;
  endDate?: string;
  duration: number; // in days
  sampleSize: number;
  confidenceLevel: number;
  metrics: ExperimentMetrics;
  createdAt: string;
  updatedAt: string;
}

interface ExperimentVariant {
  id: string;
  name: string;
  content: string;
  platform: string;
  trafficSplit: number; // percentage
  impressions: number;
  clicks: number;
  conversions: number;
  ctr: number;
  conversionRate: number;
  revenue: number;
  isControl: boolean;
  isWinner?: boolean;
  significance?: number;
}

interface SplitConfig {
  type: 'equal' | 'custom' | 'weighted';
  distribution: Record<string, number>;
  totalTraffic: number;
}

interface ExperimentMetrics {
  totalImpressions: number;
  totalClicks: number;
  totalConversions: number;
  overallCtr: number;
  overallConversionRate: number;
  totalRevenue: number;
  statisticalSignificance: number;
  confidenceInterval: number;
}

export default function ExperimentsUI() {
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [selectedExperiment, setSelectedExperiment] = useState<Experiment | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [detailsModalVisible, setDetailsModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchExperiments();
  }, []);

  const fetchExperiments = async () => {
    setLoading(true);
    try {
      // In a real app, this would call the API
      const mockExperiments: Experiment[] = [
        {
          id: 'exp-1',
          name: 'Headline A/B Test',
          description: 'Testing different headline variations for better CTR',
          status: 'running',
          variants: [
            {
              id: 'var-1',
              name: 'Control',
              content: 'Boost Your Productivity with Our New Tool',
              platform: 'linkedin',
              trafficSplit: 50,
              impressions: 1500,
              clicks: 180,
              conversions: 45,
              ctr: 12.0,
              conversionRate: 25.0,
              revenue: 2250,
              isControl: true
            },
            {
              id: 'var-2',
              name: 'Variant A',
              content: 'Transform Your Workflow: 10x Faster Results',
              platform: 'linkedin',
              trafficSplit: 50,
              impressions: 1480,
              clicks: 220,
              conversions: 58,
              ctr: 14.9,
              conversionRate: 26.4,
              revenue: 2900,
              isControl: false,
              isWinner: true,
              significance: 0.95
            }
          ],
          split: {
            type: 'equal',
            distribution: { 'var-1': 50, 'var-2': 50 },
            totalTraffic: 100
          },
          startDate: '2024-12-01T00:00:00Z',
          duration: 14,
          sampleSize: 2980,
          confidenceLevel: 95,
          metrics: {
            totalImpressions: 2980,
            totalClicks: 400,
            totalConversions: 103,
            overallCtr: 13.4,
            overallConversionRate: 25.8,
            totalRevenue: 5150,
            statisticalSignificance: 0.95,
            confidenceInterval: 2.1
          },
          createdAt: '2024-12-01T00:00:00Z',
          updatedAt: '2024-12-15T00:00:00Z'
        },
        {
          id: 'exp-2',
          name: 'CTA Button Test',
          description: 'Testing different call-to-action button texts',
          status: 'completed',
          variants: [
            {
              id: 'var-3',
              name: 'Control',
              content: 'Learn More',
              platform: 'facebook',
              trafficSplit: 33,
              impressions: 2000,
              clicks: 240,
              conversions: 60,
              ctr: 12.0,
              conversionRate: 25.0,
              revenue: 3000,
              isControl: true
            },
            {
              id: 'var-4',
              name: 'Variant A',
              content: 'Get Started',
              platform: 'facebook',
              trafficSplit: 33,
              impressions: 1950,
              clicks: 280,
              conversions: 70,
              ctr: 14.4,
              conversionRate: 25.0,
              revenue: 3500,
              isControl: false,
              isWinner: true,
              significance: 0.98
            },
            {
              id: 'var-5',
              name: 'Variant B',
              content: 'Try Now',
              platform: 'facebook',
              trafficSplit: 34,
              impressions: 2050,
              clicks: 200,
              conversions: 50,
              ctr: 9.8,
              conversionRate: 25.0,
              revenue: 2500,
              isControl: false,
              significance: 0.85
            }
          ],
          split: {
            type: 'equal',
            distribution: { 'var-3': 33, 'var-4': 33, 'var-5': 34 },
            totalTraffic: 100
          },
          startDate: '2024-11-15T00:00:00Z',
          endDate: '2024-11-29T00:00:00Z',
          duration: 14,
          sampleSize: 6000,
          confidenceLevel: 95,
          metrics: {
            totalImpressions: 6000,
            totalClicks: 720,
            totalConversions: 180,
            overallCtr: 12.0,
            overallConversionRate: 25.0,
            totalRevenue: 9000,
            statisticalSignificance: 0.98,
            confidenceInterval: 1.8
          },
          createdAt: '2024-11-15T00:00:00Z',
          updatedAt: '2024-11-29T00:00:00Z'
        }
      ];

      setExperiments(mockExperiments);
    } catch (error) {
      console.error('Failed to fetch experiments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateExperiment = async (values: any) => {
    try {
      // In a real app, this would call the API
      console.log('Creating experiment:', values);
      setCreateModalVisible(false);
      form.resetFields();
      await fetchExperiments();
    } catch (error) {
      console.error('Failed to create experiment:', error);
    }
  };

  const handleStartExperiment = async (experimentId: string) => {
    try {
      // In a real app, this would call the API
      console.log('Starting experiment:', experimentId);
      await fetchExperiments();
    } catch (error) {
      console.error('Failed to start experiment:', error);
    }
  };

  const handlePauseExperiment = async (experimentId: string) => {
    try {
      // In a real app, this would call the API
      console.log('Pausing experiment:', experimentId);
      await fetchExperiments();
    } catch (error) {
      console.error('Failed to pause experiment:', error);
    }
  };

  const handleStopExperiment = async (experimentId: string) => {
    try {
      // In a real app, this would call the API
      console.log('Stopping experiment:', experimentId);
      await fetchExperiments();
    } catch (error) {
      console.error('Failed to stop experiment:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running': return 'green';
      case 'paused': return 'orange';
      case 'completed': return 'blue';
      case 'stopped': return 'red';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running': return <PlayCircleOutlined />;
      case 'paused': return <PauseCircleOutlined />;
      case 'completed': return <CheckCircleOutlined />;
      case 'stopped': return <StopOutlined />;
      default: return <ClockCircleOutlined />;
    }
  };

  const columns = [
    {
      title: 'Experiment',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Experiment) => (
        <div>
          <div className="font-medium">{name}</div>
          <div className="text-sm text-gray-500">{record.description}</div>
        </div>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)} icon={getStatusIcon(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Variants',
      dataIndex: 'variants',
      key: 'variants',
      render: (variants: ExperimentVariant[]) => (
        <div className="flex gap-1">
          {variants.map(variant => (
            <Badge 
              key={variant.id} 
              count={variant.isWinner ? <TrophyOutlined style={{ color: '#f59e0b' }} /> : null}
              title={variant.isWinner ? 'Winner' : ''}
            >
              <Tag size="small" color={variant.isControl ? 'blue' : 'green'}>
                {variant.name}
              </Tag>
            </Badge>
          ))}
        </div>
      ),
    },
    {
      title: 'Traffic Split',
      dataIndex: 'split',
      key: 'split',
      render: (split: SplitConfig) => (
        <div className="flex gap-1">
          {Object.entries(split.distribution).map(([variantId, percentage]) => (
            <Tag key={variantId} size="small">
              {percentage}%
            </Tag>
          ))}
        </div>
      ),
    },
    {
      title: 'Sample Size',
      dataIndex: 'sampleSize',
      key: 'sampleSize',
      render: (sampleSize: number) => (
        <Text>{sampleSize.toLocaleString()}</Text>
      ),
    },
    {
      title: 'Significance',
      dataIndex: 'metrics',
      key: 'significance',
      render: (metrics: ExperimentMetrics) => (
        <div className="text-center">
          <div className="font-medium">{Math.round(metrics.statisticalSignificance * 100)}%</div>
          <div className="text-xs text-gray-500">±{metrics.confidenceInterval}%</div>
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: Experiment) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => {
              setSelectedExperiment(record);
              setDetailsModalVisible(true);
            }}
          >
            Details
          </Button>
          {record.status === 'draft' && (
            <Button
              type="primary"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleStartExperiment(record.id)}
            >
              Start
            </Button>
          )}
          {record.status === 'running' && (
            <>
              <Button
                type="default"
                size="small"
                icon={<PauseCircleOutlined />}
                onClick={() => handlePauseExperiment(record.id)}
              >
                Pause
              </Button>
              <Button
                type="default"
                size="small"
                icon={<StopOutlined />}
                onClick={() => handleStopExperiment(record.id)}
              >
                Stop
              </Button>
            </>
          )}
          {record.status === 'paused' && (
            <Button
              type="primary"
              size="small"
              icon={<PlayCircleOutlined />}
              onClick={() => handleStartExperiment(record.id)}
            >
              Resume
            </Button>
          )}
        </Space>
      ),
    },
  ];

  const renderExperimentDetails = () => {
    if (!selectedExperiment) return null;

    const { variants, metrics } = selectedExperiment;

    const chartData = variants.map(variant => ({
      name: variant.name,
      impressions: variant.impressions,
      clicks: variant.clicks,
      conversions: variant.conversions,
      ctr: variant.ctr,
      conversionRate: variant.conversionRate,
      revenue: variant.revenue
    }));

    const pieData = variants.map(variant => ({
      name: variant.name,
      value: variant.trafficSplit,
      color: variant.isControl ? '#1890ff' : variant.isWinner ? '#52c41a' : '#faad14'
    }));

    return (
      <div className="space-y-6">
        {/* Summary Stats */}
        <Row gutter={16}>
          <Col span={6}>
            <Statistic
              title="Total Impressions"
              value={metrics.totalImpressions}
              suffix=""
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Total Clicks"
              value={metrics.totalClicks}
              suffix=""
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Overall CTR"
              value={metrics.overallCtr}
              suffix="%"
              precision={1}
            />
          </Col>
          <Col span={6}>
            <Statistic
              title="Total Revenue"
              value={metrics.totalRevenue}
              prefix="$"
            />
          </Col>
        </Row>

        <Divider />

        {/* Charts */}
        <Row gutter={16}>
          <Col span={12}>
            <Card title="Performance Metrics" size="small">
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="ctr" fill="#1890ff" name="CTR (%)" />
                  <Bar dataKey="conversionRate" fill="#52c41a" name="Conv. Rate (%)" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </Col>
          <Col span={12}>
            <Card title="Traffic Distribution" size="small">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </Col>
        </Row>

        {/* Variants Table */}
        <Card title="Variant Performance" size="small">
          <Table
            dataSource={variants}
            columns={[
              {
                title: 'Variant',
                dataIndex: 'name',
                key: 'name',
                render: (name: string, record: ExperimentVariant) => (
                  <div className="flex items-center gap-2">
                    <Text strong>{name}</Text>
                    {record.isControl && <Tag color="blue">Control</Tag>}
                    {record.isWinner && <Tag color="gold" icon={<TrophyOutlined />}>Winner</Tag>}
                  </div>
                ),
              },
              {
                title: 'Content',
                dataIndex: 'content',
                key: 'content',
                render: (content: string) => (
                  <Text className="max-w-xs truncate">{content}</Text>
                ),
              },
              {
                title: 'Impressions',
                dataIndex: 'impressions',
                key: 'impressions',
                render: (impressions: number) => impressions.toLocaleString(),
              },
              {
                title: 'Clicks',
                dataIndex: 'clicks',
                key: 'clicks',
                render: (clicks: number) => clicks.toLocaleString(),
              },
              {
                title: 'CTR',
                dataIndex: 'ctr',
                key: 'ctr',
                render: (ctr: number) => `${ctr.toFixed(1)}%`,
              },
              {
                title: 'Conversions',
                dataIndex: 'conversions',
                key: 'conversions',
                render: (conversions: number) => conversions.toLocaleString(),
              },
              {
                title: 'Conv. Rate',
                dataIndex: 'conversionRate',
                key: 'conversionRate',
                render: (rate: number) => `${rate.toFixed(1)}%`,
              },
              {
                title: 'Revenue',
                dataIndex: 'revenue',
                key: 'revenue',
                render: (revenue: number) => `$${revenue.toLocaleString()}`,
              },
              {
                title: 'Significance',
                dataIndex: 'significance',
                key: 'significance',
                render: (significance?: number) => 
                  significance ? `${(significance * 100).toFixed(0)}%` : '-',
              },
            ]}
            pagination={false}
            size="small"
          />
        </Card>
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <Title level={2}>A/B Experiments</Title>
          <Text type="secondary">
            Create and manage A/B tests to optimize your content performance.
          </Text>
        </div>
        <Button
          type="primary"
          icon={<ExperimentOutlined />}
          onClick={() => setCreateModalVisible(true)}
        >
          Create Experiment
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          dataSource={experiments}
          rowKey="id"
          loading={loading}
          pagination={{ pageSize: 10 }}
        />
      </Card>

      {/* Create Experiment Modal */}
      <Modal
        title="Create A/B Experiment"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleCreateExperiment}
        >
          <Form.Item
            label="Experiment Name"
            name="name"
            rules={[{ required: true, message: 'Please enter experiment name' }]}
          >
            <Input placeholder="e.g., Headline A/B Test" />
          </Form.Item>

          <Form.Item
            label="Description"
            name="description"
            rules={[{ required: true, message: 'Please enter description' }]}
          >
            <Input.TextArea 
              placeholder="Describe what you're testing and why"
              rows={3}
            />
          </Form.Item>

          <Form.Item
            label="Platform"
            name="platform"
            rules={[{ required: true, message: 'Please select platform' }]}
          >
            <Select placeholder="Select platform">
              <Option value="twitter">X (Twitter)</Option>
              <Option value="linkedin">LinkedIn</Option>
              <Option value="facebook">Facebook</Option>
              <Option value="instagram">Instagram</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Traffic Split Type"
            name="splitType"
            rules={[{ required: true, message: 'Please select split type' }]}
          >
            <Select placeholder="Select split type">
              <Option value="equal">Equal (50/50)</Option>
              <Option value="custom">Custom Distribution</Option>
              <Option value="weighted">Weighted</Option>
            </Select>
          </Form.Item>

          <Form.Item
            label="Duration (days)"
            name="duration"
            rules={[{ required: true, message: 'Please enter duration' }]}
          >
            <InputNumber min={1} max={30} placeholder="14" />
          </Form.Item>

          <Form.Item
            label="Sample Size"
            name="sampleSize"
            rules={[{ required: true, message: 'Please enter sample size' }]}
          >
            <InputNumber min={100} placeholder="1000" />
          </Form.Item>

          <Form.Item
            label="Confidence Level"
            name="confidenceLevel"
            rules={[{ required: true, message: 'Please enter confidence level' }]}
          >
            <Select placeholder="Select confidence level">
              <Option value={90}>90%</Option>
              <Option value={95}>95%</Option>
              <Option value={99}>99%</Option>
            </Select>
          </Form.Item>

          <div className="flex justify-end gap-2">
            <Button onClick={() => setCreateModalVisible(false)}>
              Cancel
            </Button>
            <Button type="primary" htmlType="submit">
              Create Experiment
            </Button>
          </div>
        </Form>
      </Modal>

      {/* Experiment Details Modal */}
      <Modal
        title={`${selectedExperiment?.name} - Experiment Details`}
        open={detailsModalVisible}
        onCancel={() => setDetailsModalVisible(false)}
        width={1000}
        footer={null}
      >
        {renderExperimentDetails()}
      </Modal>
    </div>
  );
}
