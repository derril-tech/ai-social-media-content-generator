'use client';

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Button, Tag, Space, Typography, Alert, Spin } from 'antd';
import { 
  TwitterOutlined, 
  LinkedinOutlined, 
  FacebookOutlined, 
  InstagramOutlined,
  YoutubeOutlined,
  TikTokOutlined,
  PinterestOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SettingOutlined
} from '@ant-design/icons';
import ConnectorSetupModal from '../../components/ConnectorSetupModal';
import ConnectorStatusCheck from '../../components/ConnectorStatusCheck';

const { Title, Text } = Typography;

interface Connector {
  id: string;
  name: string;
  platform: string;
  status: 'connected' | 'disconnected' | 'error' | 'pending';
  lastSync?: string;
  accountName?: string;
  icon: React.ReactNode;
  description: string;
  features: string[];
}

const connectors: Connector[] = [
  {
    id: 'twitter',
    name: 'X (Twitter)',
    platform: 'twitter',
    status: 'disconnected',
    icon: <TwitterOutlined style={{ fontSize: '24px', color: '#1DA1F2' }} />,
    description: 'Post text, images, and videos to X (Twitter)',
    features: ['Text posts', 'Media uploads', 'Threads', 'Analytics']
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    platform: 'linkedin',
    status: 'disconnected',
    icon: <LinkedinOutlined style={{ fontSize: '24px', color: '#0077B5' }} />,
    description: 'Share professional content on LinkedIn',
    features: ['Company posts', 'Personal posts', 'Analytics', 'Scheduling']
  },
  {
    id: 'facebook',
    name: 'Facebook',
    platform: 'facebook',
    status: 'disconnected',
    icon: <FacebookOutlined style={{ fontSize: '24px', color: '#1877F2' }} />,
    description: 'Post to Facebook pages and groups',
    features: ['Page posts', 'Group posts', 'Stories', 'Analytics']
  },
  {
    id: 'instagram',
    name: 'Instagram',
    platform: 'instagram',
    status: 'disconnected',
    icon: <InstagramOutlined style={{ fontSize: '24px', color: '#E4405F' }} />,
    description: 'Share photos and stories on Instagram',
    features: ['Feed posts', 'Stories', 'Reels', 'Analytics']
  },
  {
    id: 'youtube',
    name: 'YouTube',
    platform: 'youtube',
    status: 'disconnected',
    icon: <YoutubeOutlined style={{ fontSize: '24px', color: '#FF0000' }} />,
    description: 'Manage YouTube Shorts titles and descriptions',
    features: ['Shorts titles', 'Descriptions', 'Thumbnails', 'Analytics']
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    platform: 'tiktok',
    status: 'disconnected',
    icon: <TikTokOutlined style={{ fontSize: '24px', color: '#000000' }} />,
    description: 'Create TikTok captions and scripts',
    features: ['Captions', 'Scripts', 'Trending hashtags', 'Analytics']
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    platform: 'pinterest',
    status: 'disconnected',
    icon: <PinterestOutlined style={{ fontSize: '24px', color: '#BD081C' }} />,
    description: 'Create and manage Pinterest pins',
    features: ['Pin creation', 'Board selection', 'Rich pins', 'Analytics']
  }
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'connected': return 'success';
    case 'disconnected': return 'default';
    case 'error': return 'error';
    case 'pending': return 'processing';
    default: return 'default';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'connected': return <CheckCircleOutlined />;
    case 'error': return <ExclamationCircleOutlined />;
    case 'pending': return <Spin size="small" />;
    default: return null;
  }
};

export default function ConnectorsPage() {
  const [connectorsData, setConnectorsData] = useState<Connector[]>(connectors);
  const [selectedConnector, setSelectedConnector] = useState<Connector | null>(null);
  const [setupModalVisible, setSetupModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchConnectorsStatus();
  }, []);

  const fetchConnectorsStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/connectors/status');
      if (response.ok) {
        const data = await response.json();
        setConnectorsData(prev => 
          prev.map(connector => ({
            ...connector,
            ...data[connector.id]
          }))
        );
      }
    } catch (error) {
      console.error('Failed to fetch connector status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSetupConnector = (connector: Connector) => {
    setSelectedConnector(connector);
    setSetupModalVisible(true);
  };

  const handleSetupComplete = async () => {
    setSetupModalVisible(false);
    setSelectedConnector(null);
    await fetchConnectorsStatus();
  };

  const handleDisconnect = async (connectorId: string) => {
    try {
      const response = await fetch(`/api/connectors/${connectorId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        await fetchConnectorsStatus();
      }
    } catch (error) {
      console.error('Failed to disconnect:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2}>Social Media Connectors</Title>
        <Text type="secondary">
          Connect your social media accounts to automatically publish content and track performance.
        </Text>
      </div>

      {loading && (
        <div className="text-center py-8">
          <Spin size="large" />
          <div className="mt-4">Loading connector status...</div>
        </div>
      )}

      <Row gutter={[16, 16]}>
        {connectorsData.map((connector) => (
          <Col xs={24} sm={12} lg={8} xl={6} key={connector.id}>
            <Card
              hoverable
              className="h-full"
              actions={[
                connector.status === 'connected' ? (
                  <Button 
                    key="manage" 
                    type="text" 
                    icon={<SettingOutlined />}
                    onClick={() => handleSetupConnector(connector)}
                  >
                    Manage
                  </Button>
                ) : (
                  <Button 
                    key="connect" 
                    type="primary"
                    onClick={() => handleSetupConnector(connector)}
                  >
                    Connect
                  </Button>
                )
              ]}
            >
              <div className="text-center">
                <div className="mb-3">
                  {connector.icon}
                </div>
                <Title level={4} className="mb-2">{connector.name}</Title>
                <Text type="secondary" className="block mb-3">
                  {connector.description}
                </Text>
                
                <Space direction="vertical" className="w-full">
                  <Tag 
                    color={getStatusColor(connector.status)}
                    icon={getStatusIcon(connector.status)}
                  >
                    {connector.status === 'connected' ? 'Connected' : 
                     connector.status === 'error' ? 'Error' :
                     connector.status === 'pending' ? 'Connecting...' : 'Not Connected'}
                  </Tag>
                  
                  {connector.accountName && (
                    <Text type="secondary" className="block">
                      {connector.accountName}
                    </Text>
                  )}
                  
                  {connector.lastSync && (
                    <Text type="secondary" className="block text-xs">
                      Last sync: {new Date(connector.lastSync).toLocaleDateString()}
                    </Text>
                  )}
                </Space>

                <div className="mt-4">
                  <Text strong className="block mb-2">Features:</Text>
                  <div className="flex flex-wrap gap-1 justify-center">
                    {connector.features.map((feature, index) => (
                      <Tag key={index} size="small" color="blue">
                        {feature}
                      </Tag>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </Col>
        ))}
      </Row>

      {selectedConnector && (
        <ConnectorSetupModal
          visible={setupModalVisible}
          connector={selectedConnector}
          onCancel={() => setSetupModalVisible(false)}
          onComplete={handleSetupComplete}
        />
      )}

      <ConnectorStatusCheck />
    </div>
  );
}
