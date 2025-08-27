'use client';
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Space, Tag, Button, Tooltip, Modal, Form, Input, Select, DatePicker, Switch, InputNumber, message, Table, Badge, Statistic, Tabs, Divider, List, Avatar, Alert, Spin, Popconfirm, Drawer, Descriptions, Timeline } from 'antd';
import {
  ShareAltOutlined, LinkOutlined, EyeOutlined, DownloadOutlined, EditOutlined, DeleteOutlined, 
  LockOutlined, UnlockOutlined, CalendarOutlined, BarChartOutlined, CopyOutlined, QrcodeOutlined,
  SettingOutlined, InfoCircleOutlined, ExclamationCircleOutlined, CheckCircleOutlined
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TabPane } = Tabs;
const { Option } = Select;
const { TextArea } = Input;

interface ShareLink {
  id: string;
  token: string;
  title: string;
  description?: string;
  type: string;
  status: string;
  expiresAt?: Date;
  maxViews: number;
  currentViews: number;
  requirePassword: boolean;
  allowDownload: boolean;
  allowComments: boolean;
  createdAt: Date;
  lastAccessedAt?: Date;
  createdBy: string;
  shareUrl: string;
}

interface ShareLinkStats {
  totalViews: number;
  uniqueVisitors: number;
  downloads: number;
  comments: number;
  lastAccessed: Date | null;
  topReferrers: Array<{ referrer: string; count: number }>;
  accessByCountry: Array<{ country: string; count: number }>;
}

interface ShareLinkManagerProps {
  organizationId: string;
  className?: string;
}

export default function ShareLinkManager({ organizationId, className }: ShareLinkManagerProps) {
  const [loading, setLoading] = useState(false);
  const [shareLinks, setShareLinks] = useState<ShareLink[]>([]);
  const [selectedLink, setSelectedLink] = useState<ShareLink | null>(null);
  const [selectedStats, setSelectedStats] = useState<ShareLinkStats | null>(null);
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [statsDrawerVisible, setStatsDrawerVisible] = useState(false);
  const [createForm] = Form.useForm();
  const [editForm] = Form.useForm();

  useEffect(() => {
    fetchShareLinks();
  }, [organizationId]);

  const fetchShareLinks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/share-links/organizations/${organizationId}`);
      if (response.ok) {
        const data = await response.json();
        setShareLinks(data.shareLinks);
      }
    } catch (error) {
      console.error('Error fetching share links:', error);
      message.error('Failed to fetch share links');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateShareLink = async (values: any) => {
    try {
      const response = await fetch(`/api/share-links/organizations/${organizationId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          expiresAt: values.expiresAt?.toISOString(),
        }),
      });

      if (response.ok) {
        message.success('Share link created successfully');
        setCreateModalVisible(false);
        createForm.resetFields();
        fetchShareLinks();
      } else {
        message.error('Failed to create share link');
      }
    } catch (error) {
      console.error('Error creating share link:', error);
      message.error('Failed to create share link');
    }
  };

  const handleUpdateShareLink = async (values: any) => {
    if (!selectedLink) return;

    try {
      const response = await fetch(`/api/share-links/organizations/${organizationId}/${selectedLink.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...values,
          expiresAt: values.expiresAt?.toISOString(),
        }),
      });

      if (response.ok) {
        message.success('Share link updated successfully');
        setEditModalVisible(false);
        editForm.resetFields();
        fetchShareLinks();
      } else {
        message.error('Failed to update share link');
      }
    } catch (error) {
      console.error('Error updating share link:', error);
      message.error('Failed to update share link');
    }
  };

  const handleRevokeShareLink = async (shareLinkId: string) => {
    try {
      const response = await fetch(`/api/share-links/organizations/${organizationId}/${shareLinkId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        message.success('Share link revoked successfully');
        fetchShareLinks();
      } else {
        message.error('Failed to revoke share link');
      }
    } catch (error) {
      console.error('Error revoking share link:', error);
      message.error('Failed to revoke share link');
    }
  };

  const handleViewStats = async (shareLinkId: string) => {
    try {
      const response = await fetch(`/api/share-links/organizations/${organizationId}/${shareLinkId}/stats`);
      if (response.ok) {
        const stats = await response.json();
        setSelectedStats(stats);
        setStatsDrawerVisible(true);
      }
    } catch (error) {
      console.error('Error fetching share link stats:', error);
      message.error('Failed to fetch share link statistics');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    message.success('Copied to clipboard');
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'green';
      case 'expired': return 'red';
      case 'revoked': return 'orange';
      default: return 'default';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'content_preview': return 'blue';
      case 'campaign_preview': return 'purple';
      case 'analytics_report': return 'cyan';
      case 'billing_report': return 'gold';
      default: return 'default';
    }
  };

  const formatDate = (date: Date) => {
    return dayjs(date).format('MMM DD, YYYY HH:mm');
  };

  const columns = [
    {
      title: 'Title',
      dataIndex: 'title',
      key: 'title',
      render: (text: string, record: ShareLink) => (
        <div>
          <div className="font-medium">{text}</div>
          <div className="text-sm text-gray-500">{record.description}</div>
        </div>
      ),
    },
    {
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <Tag color={getTypeColor(type)}>
          {type.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Badge status={status === 'active' ? 'success' : status === 'expired' ? 'error' : 'warning'} text={status.toUpperCase()} />
      ),
    },
    {
      title: 'Views',
      key: 'views',
      render: (record: ShareLink) => (
        <div>
          <div>{record.currentViews}</div>
          {record.maxViews > 0 && (
            <div className="text-sm text-gray-500">/ {record.maxViews}</div>
          )}
        </div>
      ),
    },
    {
      title: 'Expires',
      dataIndex: 'expiresAt',
      key: 'expiresAt',
      render: (date: Date) => date ? formatDate(date) : 'Never',
    },
    {
      title: 'Created',
      dataIndex: 'createdAt',
      key: 'createdAt',
      render: (date: Date) => formatDate(date),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (record: ShareLink) => (
        <Space>
          <Button 
            size="small" 
            icon={<LinkOutlined />}
            onClick={() => copyToClipboard(record.shareUrl)}
          >
            Copy
          </Button>
          <Button 
            size="small" 
            icon={<BarChartOutlined />}
            onClick={() => handleViewStats(record.id)}
          >
            Stats
          </Button>
          <Button 
            size="small" 
            icon={<EditOutlined />}
            onClick={() => {
              setSelectedLink(record);
              editForm.setFieldsValue({
                ...record,
                expiresAt: record.expiresAt ? dayjs(record.expiresAt) : undefined,
              });
              setEditModalVisible(true);
            }}
          >
            Edit
          </Button>
          <Popconfirm
            title="Are you sure you want to revoke this share link?"
            onConfirm={() => handleRevokeShareLink(record.id)}
            okText="Yes"
            cancelText="No"
          >
            <Button 
              size="small" 
              danger 
              icon={<DeleteOutlined />}
            >
              Revoke
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

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
          <ShareAltOutlined className="mr-2" />
          Share Link Manager
        </Title>
        <Text type="secondary">
          Create and manage shareable links for content previews, campaigns, and reports
        </Text>
      </div>

      {/* Summary Stats */}
      <Row gutter={16} className="mb-6">
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Share Links"
              value={shareLinks.length}
              prefix={<LinkOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Active Links"
              value={shareLinks.filter(link => link.status === 'active').length}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Views"
              value={shareLinks.reduce((sum, link) => sum + link.currentViews, 0)}
              prefix={<EyeOutlined />}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Expired Links"
              value={shareLinks.filter(link => link.status === 'expired').length}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Actions */}
      <div className="mb-4 flex justify-between items-center">
        <div>
          <Title level={4}>Share Links</Title>
          <Text type="secondary">Manage your shareable links and track their performance</Text>
        </div>
        <Button 
          type="primary" 
          icon={<ShareAltOutlined />}
          onClick={() => setCreateModalVisible(true)}
        >
          Create Share Link
        </Button>
      </div>

      {/* Share Links Table */}
      <Card>
        <Table
          dataSource={shareLinks}
          columns={columns}
          rowKey="id"
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) => `${range[0]}-${range[1]} of ${total} items`,
          }}
        />
      </Card>

      {/* Create Share Link Modal */}
      <Modal
        title="Create Share Link"
        open={createModalVisible}
        onCancel={() => setCreateModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={createForm}
          layout="vertical"
          onFinish={handleCreateShareLink}
        >
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter a title' }]}
          >
            <Input placeholder="Enter share link title" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={3} placeholder="Enter description (optional)" />
          </Form.Item>

          <Form.Item
            name="type"
            label="Type"
            rules={[{ required: true, message: 'Please select a type' }]}
          >
            <Select placeholder="Select share link type">
              <Option value="content_preview">Content Preview</Option>
              <Option value="campaign_preview">Campaign Preview</Option>
              <Option value="analytics_report">Analytics Report</Option>
              <Option value="billing_report">Billing Report</Option>
            </Select>
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="expiresAt"
                label="Expires At"
              >
                <DatePicker 
                  showTime 
                  placeholder="Select expiration date"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="maxViews"
                label="Max Views"
              >
                <InputNumber 
                  min={0} 
                  placeholder="Unlimited"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="requirePassword"
                label="Require Password"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="allowDownload"
                label="Allow Download"
                valuePropName="checked"
                initialValue={true}
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="allowComments"
            label="Allow Comments"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item
            name="resourceData"
            label="Resource Data"
            rules={[{ required: true, message: 'Please enter resource data' }]}
          >
            <TextArea 
              rows={4} 
              placeholder="Enter JSON data for the shared resource"
            />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Create Share Link
              </Button>
              <Button onClick={() => setCreateModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Edit Share Link Modal */}
      <Modal
        title="Edit Share Link"
        open={editModalVisible}
        onCancel={() => setEditModalVisible(false)}
        footer={null}
        width={600}
      >
        <Form
          form={editForm}
          layout="vertical"
          onFinish={handleUpdateShareLink}
        >
          <Form.Item
            name="title"
            label="Title"
            rules={[{ required: true, message: 'Please enter a title' }]}
          >
            <Input placeholder="Enter share link title" />
          </Form.Item>

          <Form.Item
            name="description"
            label="Description"
          >
            <TextArea rows={3} placeholder="Enter description (optional)" />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="expiresAt"
                label="Expires At"
              >
                <DatePicker 
                  showTime 
                  placeholder="Select expiration date"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="maxViews"
                label="Max Views"
              >
                <InputNumber 
                  min={0} 
                  placeholder="Unlimited"
                  style={{ width: '100%' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="requirePassword"
                label="Require Password"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="allowDownload"
                label="Allow Download"
                valuePropName="checked"
              >
                <Switch />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="allowComments"
            label="Allow Comments"
            valuePropName="checked"
          >
            <Switch />
          </Form.Item>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                Update Share Link
              </Button>
              <Button onClick={() => setEditModalVisible(false)}>
                Cancel
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* Stats Drawer */}
      <Drawer
        title="Share Link Statistics"
        placement="right"
        width={600}
        open={statsDrawerVisible}
        onClose={() => setStatsDrawerVisible(false)}
      >
        {selectedStats && (
          <div>
            <Row gutter={16} className="mb-6">
              <Col span={12}>
                <Statistic title="Total Views" value={selectedStats.totalViews} />
              </Col>
              <Col span={12}>
                <Statistic title="Unique Visitors" value={selectedStats.uniqueVisitors} />
              </Col>
            </Row>

            <Row gutter={16} className="mb-6">
              <Col span={12}>
                <Statistic title="Downloads" value={selectedStats.downloads} />
              </Col>
              <Col span={12}>
                <Statistic title="Comments" value={selectedStats.comments} />
              </Col>
            </Row>

            <Divider />

            <Title level={5}>Access by Country</Title>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={selectedStats.accessByCountry}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="count"
                  label={({ country, count }) => `${country}: ${count}`}
                />
                <RechartsTooltip />
              </PieChart>
            </ResponsiveContainer>

            <Divider />

            <Title level={5}>Top Referrers</Title>
            <List
              size="small"
              dataSource={selectedStats.topReferrers}
              renderItem={(item) => (
                <List.Item>
                  <div className="flex justify-between w-full">
                    <Text>{item.referrer}</Text>
                    <Text strong>{item.count}</Text>
                  </div>
                </List.Item>
              )}
            />
          </div>
        )}
      </Drawer>
    </div>
  );
}
