'use client';
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Space, Tag, Button, Tooltip, Progress, Alert, Spin, Table, Badge, Statistic, Tabs, Divider, List, Avatar, Modal, Form, InputNumber, Select, message } from 'antd';
import {
  ClockCircleOutlined, ExclamationCircleOutlined, CheckCircleOutlined,
  ReloadOutlined, SettingOutlined, BarChartOutlined, ThunderboltOutlined,
  WarningOutlined, InfoCircleOutlined, DeleteOutlined, PlayCircleOutlined
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TabPane } = Tabs;

interface RateLimitStatus {
  organizationId: string;
  path: string;
  method: string;
  current: number;
  limit: number;
  remaining: number;
  reset: number;
  burst?: {
    current: number;
    limit: number;
    remaining: number;
  };
}

interface RateLimitStats {
  organizationId: string;
  totalKeys: number;
  activeLimits: Array<{
    key: string;
    current: number;
    limit: number;
    remaining: number;
    reset: number;
  }>;
}

interface BurstControlStatus {
  operationType: string;
  organizationId: string;
  channelId?: string;
  config: {
    maxBurst: number;
    burstWindowMs: number;
    recoveryRate: number;
    bucketSize: number;
  };
  currentTokens: number;
  lastRefill: number;
  timeToNextToken: number;
}

interface RateLimitHealth {
  organizationId: string;
  status: 'healthy' | 'warning' | 'critical';
  activeLimits: number;
  nearLimit: number;
  atLimit: number;
  recommendations: string[];
}

interface RateLimitConfig {
  rules: Array<{
    path: string;
    method?: string;
    scope: string;
    config: {
      windowMs: number;
      maxRequests: number;
      burstLimit?: number;
      burstWindowMs?: number;
    };
  }>;
  burstConfigs: Array<{
    operationType: string;
    config: {
      maxBurst: number;
      burstWindowMs: number;
      recoveryRate: number;
      bucketSize: number;
    };
  }>;
}

interface RateLimitMonitorProps {
  organizationId: string;
  className?: string;
}

export default function RateLimitMonitor({ organizationId, className }: RateLimitMonitorProps) {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<RateLimitStats | null>(null);
  const [health, setHealth] = useState<RateLimitHealth | null>(null);
  const [config, setConfig] = useState<RateLimitConfig | null>(null);
  const [burstStatuses, setBurstStatuses] = useState<BurstControlStatus[]>([]);
  const [selectedPath, setSelectedPath] = useState<string>('/api/generate');
  const [pathStatus, setPathStatus] = useState<RateLimitStatus | null>(null);
  const [simulateModalVisible, setSimulateModalVisible] = useState(false);
  const [simulateForm] = Form.useForm();

  useEffect(() => {
    fetchData();
  }, [organizationId]);

  useEffect(() => {
    if (selectedPath) {
      fetchPathStatus();
    }
  }, [selectedPath, organizationId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [statsRes, healthRes, configRes] = await Promise.all([
        fetch(`/api/rate-limits/stats/${organizationId}`),
        fetch(`/api/rate-limits/health/${organizationId}`),
        fetch('/api/rate-limits/config'),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setHealth(healthData);
      }

      if (configRes.ok) {
        const configData = await configRes.json();
        setConfig(configData);
        
        // Fetch burst statuses for all operation types
        const burstPromises = configData.burstConfigs.map((burstConfig: any) =>
          fetch(`/api/rate-limits/burst/${organizationId}/${burstConfig.operationType}`)
            .then(res => res.ok ? res.json() : null)
            .catch(() => null)
        );
        
        const burstResults = await Promise.all(burstPromises);
        setBurstStatuses(burstResults.filter(Boolean));
      }
    } catch (error) {
      console.error('Error fetching rate limit data:', error);
      message.error('Failed to fetch rate limit data');
    } finally {
      setLoading(false);
    }
  };

  const fetchPathStatus = async () => {
    try {
      const response = await fetch(`/api/rate-limits/status/${organizationId}?path=${selectedPath}`);
      if (response.ok) {
        const data = await response.json();
        setPathStatus(data);
      }
    } catch (error) {
      console.error('Error fetching path status:', error);
    }
  };

  const handleResetRateLimits = async (path?: string) => {
    try {
      const url = path 
        ? `/api/rate-limits/reset/${organizationId}?path=${path}`
        : `/api/rate-limits/reset/${organizationId}`;
      
      const response = await fetch(url, { method: 'DELETE' });
      if (response.ok) {
        message.success('Rate limits reset successfully');
        fetchData();
        if (path) {
          fetchPathStatus();
        }
      } else {
        message.error('Failed to reset rate limits');
      }
    } catch (error) {
      console.error('Error resetting rate limits:', error);
      message.error('Failed to reset rate limits');
    }
  };

  const handleSimulate = async (values: any) => {
    try {
      const response = await fetch('/api/rate-limits/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });

      if (response.ok) {
        const result = await response.json();
        message.success(`Simulation completed: ${result.successful} successful, ${result.blocked} blocked`);
        setSimulateModalVisible(false);
        simulateForm.resetFields();
      } else {
        message.error('Failed to run simulation');
      }
    } catch (error) {
      console.error('Error running simulation:', error);
      message.error('Failed to run simulation');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'green';
      case 'warning': return 'orange';
      case 'critical': return 'red';
      default: return 'default';
    }
  };

  const getUsagePercentage = (current: number, limit: number) => {
    return Math.min(100, (current / limit) * 100);
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return '#ff4d4f';
    if (percentage >= 75) return '#faad14';
    return '#52c41a';
  };

  const formatTime = (timestamp: number) => {
    return dayjs(timestamp * 1000).format('HH:mm:ss');
  };

  const formatDuration = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${Math.round(ms / 1000)}s`;
    return `${Math.round(ms / 60000)}m`;
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
          <ClockCircleOutlined className="mr-2" />
          Rate Limit Monitor
        </Title>
        <Text type="secondary">
          Monitor and manage rate limits for organization: {organizationId}
        </Text>
      </div>

      {/* Health Status */}
      {health && (
        <Card className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <Title level={4}>Health Status</Title>
            <Badge 
              status={getStatusColor(health.status) as any} 
              text={health.status.toUpperCase()} 
            />
          </div>
          
          <Row gutter={16}>
            <Col span={6}>
              <Statistic title="Active Limits" value={health.activeLimits} />
            </Col>
            <Col span={6}>
              <Statistic 
                title="Near Limit" 
                value={health.nearLimit}
                valueStyle={{ color: health.nearLimit > 0 ? '#faad14' : undefined }}
              />
            </Col>
            <Col span={6}>
              <Statistic 
                title="At Limit" 
                value={health.atLimit}
                valueStyle={{ color: health.atLimit > 0 ? '#ff4d4f' : undefined }}
              />
            </Col>
            <Col span={6}>
              <Button 
                icon={<ReloadOutlined />} 
                onClick={fetchData}
                type="primary"
              >
                Refresh
              </Button>
            </Col>
          </Row>

          {health.recommendations.length > 0 && (
            <Alert
              message="Recommendations"
              description={
                <List
                  size="small"
                  dataSource={health.recommendations}
                  renderItem={(item) => <List.Item>{item}</List.Item>}
                />
              }
              type={health.status === 'critical' ? 'error' : 'warning'}
              showIcon
              className="mt-4"
            />
          )}
        </Card>
      )}

      <Tabs defaultActiveKey="overview">
        <TabPane tab="Overview" key="overview">
          <Row gutter={16}>
            {/* Active Limits */}
            <Col span={12}>
              <Card title="Active Rate Limits" className="h-full">
                {stats?.activeLimits && stats.activeLimits.length > 0 ? (
                  <List
                    dataSource={stats.activeLimits}
                    renderItem={(limit) => {
                      const percentage = getUsagePercentage(limit.current, limit.limit);
                      return (
                        <List.Item
                          actions={[
                            <Button 
                              size="small" 
                              danger 
                              icon={<DeleteOutlined />}
                              onClick={() => handleResetRateLimits(limit.key)}
                            >
                              Reset
                            </Button>
                          ]}
                        >
                          <List.Item.Meta
                            title={
                              <div className="flex items-center justify-between">
                                <Text code>{limit.key}</Text>
                                <Tag color={getUsageColor(percentage)}>
                                  {percentage.toFixed(1)}%
                                </Tag>
                              </div>
                            }
                            description={
                              <div>
                                <Progress 
                                  percent={percentage} 
                                  strokeColor={getUsageColor(percentage)}
                                  size="small"
                                  showInfo={false}
                                />
                                <Text type="secondary">
                                  {limit.current} / {limit.limit} requests
                                </Text>
                              </div>
                            }
                          />
                        </List.Item>
                      );
                    }}
                  />
                ) : (
                  <Empty description="No active rate limits" />
                )}
              </Card>
            </Col>

            {/* Burst Control Status */}
            <Col span={12}>
              <Card title="Burst Control Status" className="h-full">
                {burstStatuses.length > 0 ? (
                  <List
                    dataSource={burstStatuses}
                    renderItem={(burst) => {
                      const tokenPercentage = (burst.currentTokens / burst.config.bucketSize) * 100;
                      return (
                        <List.Item>
                          <List.Item.Meta
                            title={
                              <div className="flex items-center justify-between">
                                <Text strong>{burst.operationType}</Text>
                                <Tag color={tokenPercentage > 80 ? 'red' : 'green'}>
                                  {burst.currentTokens.toFixed(1)} tokens
                                </Tag>
                              </div>
                            }
                            description={
                              <div>
                                <Progress 
                                  percent={tokenPercentage} 
                                  strokeColor={getUsageColor(tokenPercentage)}
                                  size="small"
                                  showInfo={false}
                                />
                                <div className="text-xs text-gray-500 mt-1">
                                  <div>Bucket: {burst.config.bucketSize}</div>
                                  <div>Recovery: {burst.config.recoveryRate}/s</div>
                                  {burst.timeToNextToken > 0 && (
                                    <div>Next token in: {burst.timeToNextToken.toFixed(1)}s</div>
                                  )}
                                </div>
                              </div>
                            }
                          />
                        </List.Item>
                      );
                    }}
                  />
                ) : (
                  <Empty description="No burst control data" />
                )}
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="Path Monitoring" key="path">
          <Card>
            <div className="mb-4">
              <Select
                value={selectedPath}
                onChange={setSelectedPath}
                style={{ width: 300 }}
                placeholder="Select path to monitor"
              >
                <Select.Option value="/api/generate">Generate Content</Select.Option>
                <Select.Option value="/api/publish">Publish Content</Select.Option>
                <Select.Option value="/api/connectors">Connectors</Select.Option>
                <Select.Option value="/api/auth">Authentication</Select.Option>
              </Select>
            </div>

            {pathStatus && (
              <Row gutter={16}>
                <Col span={8}>
                  <Statistic
                    title="Current Usage"
                    value={pathStatus.current}
                    suffix={`/ ${pathStatus.limit}`}
                    valueStyle={{ color: getUsageColor(getUsagePercentage(pathStatus.current, pathStatus.limit)) }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Remaining"
                    value={pathStatus.remaining}
                    valueStyle={{ color: pathStatus.remaining > 0 ? '#52c41a' : '#ff4d4f' }}
                  />
                </Col>
                <Col span={8}>
                  <Statistic
                    title="Reset Time"
                    value={formatTime(pathStatus.reset)}
                    prefix={<ClockCircleOutlined />}
                  />
                </Col>
              </Row>

              {pathStatus.burst && (
                <div className="mt-4">
                  <Title level={5}>Burst Control</Title>
                  <Row gutter={16}>
                    <Col span={8}>
                      <Statistic
                        title="Burst Current"
                        value={pathStatus.burst.current}
                        suffix={`/ ${pathStatus.burst.limit}`}
                      />
                    </Col>
                    <Col span={8}>
                      <Statistic
                        title="Burst Remaining"
                        value={pathStatus.burst.remaining}
                      />
                    </Col>
                  </Row>
                </div>
              )}

              <div className="mt-4">
                <Button 
                  danger 
                  icon={<DeleteOutlined />}
                  onClick={() => handleResetRateLimits(selectedPath)}
                >
                  Reset This Path
                </Button>
              </div>
            )}
          </Card>
        </TabPane>

        <TabPane tab="Configuration" key="config">
          <Card>
            <div className="mb-4">
              <Button 
                icon={<PlayCircleOutlined />}
                onClick={() => setSimulateModalVisible(true)}
                type="primary"
              >
                Simulate Rate Limit
              </Button>
            </div>

            {config && (
              <Tabs defaultActiveKey="rules">
                <TabPane tab="Rate Limit Rules" key="rules">
                  <Table
                    dataSource={config.rules}
                    columns={[
                      { title: 'Path', dataIndex: 'path', key: 'path' },
                      { title: 'Method', dataIndex: 'method', key: 'method', render: (method) => method || 'ALL' },
                      { title: 'Scope', dataIndex: 'scope', key: 'scope' },
                      { 
                        title: 'Window', 
                        key: 'window',
                        render: (_, record) => formatDuration(record.config.windowMs)
                      },
                      { title: 'Max Requests', dataIndex: ['config', 'maxRequests'], key: 'maxRequests' },
                      { 
                        title: 'Burst Limit', 
                        key: 'burstLimit',
                        render: (_, record) => record.config.burstLimit || 'N/A'
                      },
                    ]}
                    pagination={false}
                    size="small"
                  />
                </TabPane>

                <TabPane tab="Burst Configurations" key="burst">
                  <Table
                    dataSource={config.burstConfigs}
                    columns={[
                      { title: 'Operation Type', dataIndex: 'operationType', key: 'operationType' },
                      { title: 'Max Burst', dataIndex: ['config', 'maxBurst'], key: 'maxBurst' },
                      { 
                        title: 'Burst Window', 
                        key: 'burstWindow',
                        render: (_, record) => formatDuration(record.config.burstWindowMs)
                      },
                      { title: 'Recovery Rate', dataIndex: ['config', 'recoveryRate'], key: 'recoveryRate', render: (rate) => `${rate}/s` },
                      { title: 'Bucket Size', dataIndex: ['config', 'bucketSize'], key: 'bucketSize' },
                    ]}
                    pagination={false}
                    size="small"
                  />
                </TabPane>
              </Tabs>
            )}
          </Card>
        </TabPane>
      </Tabs>

      {/* Simulation Modal */}
      <Modal
        title="Simulate Rate Limit"
        open={simulateModalVisible}
        onCancel={() => setSimulateModalVisible(false)}
        footer={null}
      >
        <Form
          form={simulateForm}
          onFinish={handleSimulate}
          layout="vertical"
        >
          <Form.Item
            name="key"
            label="Rate Limit Key"
            rules={[{ required: true, message: 'Please enter a rate limit key' }]}
          >
            <Select placeholder="Select rate limit key">
              <Select.Option value="test:org:123">test:org:123</Select.Option>
              <Select.Option value="generate:org:123">generate:org:123</Select.Option>
              <Select.Option value="publish:org:123">publish:org:123</Select.Option>
            </Select>
          </Form.Item>

          <Form.Item
            name="requests"
            label="Number of Requests"
            rules={[{ required: true, message: 'Please enter number of requests' }]}
          >
            <InputNumber min={1} max={1000} style={{ width: '100%' }} />
          </Form.Item>

          <Form.Item label="Configuration">
            <Row gutter={8}>
              <Col span={12}>
                <Form.Item name={['config', 'windowMs']} label="Window (ms)">
                  <InputNumber min={1000} defaultValue={60000} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name={['config', 'maxRequests']} label="Max Requests">
                  <InputNumber min={1} defaultValue={10} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
            <Row gutter={8}>
              <Col span={12}>
                <Form.Item name={['config', 'burstLimit']} label="Burst Limit">
                  <InputNumber min={1} defaultValue={20} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
              <Col span={12}>
                <Form.Item name={['config', 'burstWindowMs']} label="Burst Window (ms)">
                  <InputNumber min={1000} defaultValue={10000} style={{ width: '100%' }} />
                </Form.Item>
              </Col>
            </Row>
          </Form.Item>

          <Form.Item>
            <Button type="primary" htmlType="submit" block>
              Run Simulation
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
}

// Simple Empty component
const Empty = ({ description }: { description: string }) => (
  <div className="text-center py-8 text-gray-500">
    <InfoCircleOutlined className="text-2xl mb-2" />
    <div>{description}</div>
  </div>
);
