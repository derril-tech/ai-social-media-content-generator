'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Table, 
  Tag, 
  Button, 
  Space, 
  Typography, 
  Progress, 
  Tooltip, 
  Badge,
  Alert,
  Spin,
  Modal,
  Descriptions,
  Timeline
} from 'antd';
import { 
  CheckCircleOutlined, 
  ExclamationCircleOutlined, 
  SyncOutlined,
  ClockCircleOutlined,
  WarningOutlined,
  ReloadOutlined,
  EyeOutlined,
  SettingOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

interface ConnectorStatus {
  id: string;
  platform: string;
  name: string;
  status: 'connected' | 'disconnected' | 'error' | 'pending' | 'rate_limited';
  lastSync: string;
  nextSync: string;
  syncProgress: number;
  errorCount: number;
  successRate: number;
  accountName: string;
  rateLimitRemaining: number;
  rateLimitReset: string;
  lastError?: string;
  healthScore: number;
}

interface StatusCheckProps {
  className?: string;
}

export default function ConnectorStatusCheck({ className }: StatusCheckProps) {
  const [connectors, setConnectors] = useState<ConnectorStatus[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedConnector, setSelectedConnector] = useState<ConnectorStatus | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  useEffect(() => {
    fetchConnectorStatus();
    const interval = setInterval(fetchConnectorStatus, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchConnectorStatus = async () => {
    try {
      const response = await fetch('/api/connectors/status/detailed');
      if (response.ok) {
        const data = await response.json();
        setConnectors(data);
      }
    } catch (error) {
      console.error('Failed to fetch connector status:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchConnectorStatus();
    setRefreshing(false);
  };

  const handleViewDetails = (connector: ConnectorStatus) => {
    setSelectedConnector(connector);
    setDetailModalVisible(true);
  };

  const handleTestConnector = async (connectorId: string) => {
    try {
      const response = await fetch(`/api/connectors/${connectorId}/test`, {
        method: 'POST'
      });
      if (response.ok) {
        await fetchConnectorStatus();
      }
    } catch (error) {
      console.error('Failed to test connector:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'connected': return 'success';
      case 'disconnected': return 'default';
      case 'error': return 'error';
      case 'pending': return 'processing';
      case 'rate_limited': return 'warning';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'connected': return <CheckCircleOutlined />;
      case 'error': return <ExclamationCircleOutlined />;
      case 'pending': return <SyncOutlined spin />;
      case 'rate_limited': return <WarningOutlined />;
      default: return <ClockCircleOutlined />;
    }
  };

  const getHealthScoreColor = (score: number) => {
    if (score >= 90) return 'success';
    if (score >= 70) return 'warning';
    return 'error';
  };

  const columns = [
    {
      title: 'Platform',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: ConnectorStatus) => (
        <Space>
          <Badge 
            status={record.status === 'connected' ? 'success' : 'error'} 
            text={name}
          />
          {record.accountName && (
            <Text type="secondary" className="text-xs">
              @{record.accountName}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag 
          color={getStatusColor(status)} 
          icon={getStatusIcon(status)}
        >
          {status.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Health Score',
      dataIndex: 'healthScore',
      key: 'healthScore',
      render: (score: number) => (
        <div className="flex items-center gap-2">
          <Progress 
            type="circle" 
            size={32} 
            percent={score} 
            strokeColor={getHealthScoreColor(score)}
            format={(percent) => `${percent}%`}
          />
        </div>
      ),
    },
    {
      title: 'Success Rate',
      dataIndex: 'successRate',
      key: 'successRate',
      render: (rate: number) => (
        <Text type={rate >= 95 ? 'success' : rate >= 80 ? 'warning' : 'danger'}>
          {rate}%
        </Text>
      ),
    },
    {
      title: 'Last Sync',
      dataIndex: 'lastSync',
      key: 'lastSync',
      render: (lastSync: string) => (
        <Tooltip title={new Date(lastSync).toLocaleString()}>
          <Text type="secondary">
            {new Date(lastSync).toRelativeTimeString?.() || 
             new Date(lastSync).toLocaleDateString()}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: 'Rate Limit',
      dataIndex: 'rateLimitRemaining',
      key: 'rateLimitRemaining',
      render: (remaining: number, record: ConnectorStatus) => (
        <div>
          <Text type={remaining < 10 ? 'danger' : remaining < 50 ? 'warning' : 'success'}>
            {remaining} remaining
          </Text>
          {record.rateLimitReset && (
            <div className="text-xs text-gray-500">
              Resets: {new Date(record.rateLimitReset).toLocaleTimeString()}
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record: ConnectorStatus) => (
        <Space>
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined />}
            onClick={() => handleViewDetails(record)}
          >
            Details
          </Button>
          <Button
            type="text"
            size="small"
            icon={<SyncOutlined />}
            onClick={() => handleTestConnector(record.id)}
            loading={refreshing}
          >
            Test
          </Button>
          <Button
            type="text"
            size="small"
            icon={<SettingOutlined />}
            href={`/connectors/${record.id}/settings`}
          >
            Settings
          </Button>
        </Space>
      ),
    },
  ];

  const connectedConnectors = connectors.filter(c => c.status === 'connected');
  const errorConnectors = connectors.filter(c => c.status === 'error');
  const rateLimitedConnectors = connectors.filter(c => c.status === 'rate_limited');

  const overallHealth = connectors.length > 0 
    ? Math.round(connectors.reduce((sum, c) => sum + c.healthScore, 0) / connectors.length)
    : 0;

  return (
    <div className={className}>
      <Card 
        title={
          <Space>
            <Title level={4} className="mb-0">Connector Status</Title>
            <Button
              type="text"
              icon={<ReloadOutlined spin={refreshing} />}
              onClick={handleRefresh}
              loading={refreshing}
            >
              Refresh
            </Button>
          </Space>
        }
        className="mt-6"
      >
        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{connectedConnectors.length}</div>
            <div className="text-sm text-green-700">Connected</div>
          </div>
          <div className="text-center p-4 bg-red-50 rounded-lg">
            <div className="text-2xl font-bold text-red-600">{errorConnectors.length}</div>
            <div className="text-sm text-red-700">Errors</div>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600">{rateLimitedConnectors.length}</div>
            <div className="text-sm text-yellow-700">Rate Limited</div>
          </div>
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{overallHealth}%</div>
            <div className="text-sm text-blue-700">Overall Health</div>
          </div>
        </div>

        {/* Alerts */}
        {errorConnectors.length > 0 && (
          <Alert
            message={`${errorConnectors.length} connector(s) have errors`}
            description={
              <div>
                {errorConnectors.map(connector => (
                  <div key={connector.id} className="flex justify-between items-center">
                    <span>{connector.name}</span>
                    <Button 
                      size="small" 
                      onClick={() => handleTestConnector(connector.id)}
                    >
                      Retry
                    </Button>
                  </div>
                ))}
              </div>
            }
            type="error"
            showIcon
            className="mb-4"
          />
        )}

        {rateLimitedConnectors.length > 0 && (
          <Alert
            message={`${rateLimitedConnectors.length} connector(s) are rate limited`}
            description="Some connectors have hit their API rate limits. They will resume automatically when limits reset."
            type="warning"
            showIcon
            className="mb-4"
          />
        )}

        {/* Status Table */}
        <Table
          columns={columns}
          dataSource={connectors}
          rowKey="id"
          pagination={false}
          loading={loading}
          size="small"
          className="mt-4"
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        title={`${selectedConnector?.name} - Connection Details`}
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={null}
        width={600}
      >
        {selectedConnector && (
          <div>
            <Descriptions column={1} bordered size="small" className="mb-6">
              <Descriptions.Item label="Platform">{selectedConnector.name}</Descriptions.Item>
              <Descriptions.Item label="Account">{selectedConnector.accountName}</Descriptions.Item>
              <Descriptions.Item label="Status">
                <Tag color={getStatusColor(selectedConnector.status)}>
                  {selectedConnector.status.toUpperCase()}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Health Score">
                <Progress 
                  percent={selectedConnector.healthScore} 
                  strokeColor={getHealthScoreColor(selectedConnector.healthScore)}
                />
              </Descriptions.Item>
              <Descriptions.Item label="Success Rate">{selectedConnector.successRate}%</Descriptions.Item>
              <Descriptions.Item label="Error Count">{selectedConnector.errorCount}</Descriptions.Item>
              <Descriptions.Item label="Last Sync">
                {new Date(selectedConnector.lastSync).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Next Sync">
                {new Date(selectedConnector.nextSync).toLocaleString()}
              </Descriptions.Item>
              <Descriptions.Item label="Rate Limit Remaining">
                {selectedConnector.rateLimitRemaining}
              </Descriptions.Item>
            </Descriptions>

            {selectedConnector.lastError && (
              <div className="mt-4">
                <Text strong>Last Error:</Text>
                <Alert
                  message={selectedConnector.lastError}
                  type="error"
                  showIcon
                  className="mt-2"
                />
              </div>
            )}

            <div className="mt-6">
              <Text strong>Recent Activity:</Text>
              <Timeline className="mt-2">
                <Timeline.Item color="green">
                  <Text>Last successful sync: {new Date(selectedConnector.lastSync).toLocaleString()}</Text>
                </Timeline.Item>
                {selectedConnector.errorCount > 0 && (
                  <Timeline.Item color="red">
                    <Text>{selectedConnector.errorCount} errors in the last 24 hours</Text>
                  </Timeline.Item>
                )}
                <Timeline.Item color="blue">
                  <Text>Connection established</Text>
                </Timeline.Item>
              </Timeline>
            </div>

            <div className="mt-6 flex gap-2">
              <Button 
                type="primary" 
                icon={<SyncOutlined />}
                onClick={() => handleTestConnector(selectedConnector.id)}
              >
                Test Connection
              </Button>
              <Button 
                icon={<SettingOutlined />}
                href={`/connectors/${selectedConnector.id}/settings`}
              >
                View Settings
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
