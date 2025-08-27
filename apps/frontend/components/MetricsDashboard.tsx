# Created automatically by Cursor AI (2024-12-19)

'use client';
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Select, DatePicker, Button, Table, Typography, Space, Tag, Progress, Tooltip, Badge, Alert, Spin, Tabs, Divider, List, Avatar } from 'antd';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, 
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, Radar, ComposedChart, Scatter, Legend 
} from 'recharts';
import { 
  TrendingUpOutlined, EyeOutlined, HeartOutlined, MessageOutlined, ShareAltOutlined, 
  UserAddOutlined, LinkOutlined, HashtagOutlined, FireOutlined, TrophyOutlined,
  CalendarOutlined, FilterOutlined, DownloadOutlined, ReloadOutlined, InfoCircleOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { TabPane } = Tabs;

interface MetricsData {
  overview: {
    totalEngagement: number;
    avgCTR: number;
    followerGrowth: number;
    totalReach: number;
    totalImpressions: number;
    totalClicks: number;
  };
  engagementTrend: Array<{
    date: string;
    engagement: number;
    reach: number;
    impressions: number;
  }>;
  platformPerformance: Array<{
    platform: string;
    engagement: number;
    ctr: number;
    reach: number;
    followers: number;
    growth: number;
  }>;
  hashtagPerformance: Array<{
    hashtag: string;
    usage: number;
    engagement: number;
    reach: number;
    trend: 'up' | 'down' | 'stable';
  }>;
  hookPerformance: Array<{
    hook: string;
    usage: number;
    engagement: number;
    ctr: number;
    effectiveness: number;
  }>;
  topPosts: Array<{
    id: string;
    content: string;
    platform: string;
    engagement: number;
    ctr: number;
    reach: number;
    date: string;
  }>;
  audienceInsights: {
    demographics: Array<{
      age: string;
      percentage: number;
    }>;
    locations: Array<{
      location: string;
      percentage: number;
    }>;
    interests: Array<{
      interest: string;
      percentage: number;
    }>;
  };
}

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1', '#d084d0'];

export default function MetricsDashboard() {
  const [metricsData, setMetricsData] = useState<MetricsData | null>(null);
  const [loading, setLoading] = useState(false);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().subtract(30, 'days'),
    dayjs()
  ]);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['all']);
  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>(['all']);

  useEffect(() => {
    fetchMetricsData();
  }, [dateRange, selectedPlatforms, selectedCampaigns]);

  const fetchMetricsData = async () => {
    setLoading(true);
    try {
      // Mock API call - replace with actual endpoint
      const response = await fetch('/api/metrics/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRange: {
            start: dateRange[0].format('YYYY-MM-DD'),
            end: dateRange[1].format('YYYY-MM-DD')
          },
          platforms: selectedPlatforms,
          campaigns: selectedCampaigns
        })
      });
      
      const data = await response.json();
      setMetricsData(data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
      // Use mock data for now
      setMetricsData(generateMockMetricsData());
    } finally {
      setLoading(false);
    }
  };

  const generateMockMetricsData = (): MetricsData => ({
    overview: {
      totalEngagement: 15420,
      avgCTR: 3.2,
      followerGrowth: 1250,
      totalReach: 125000,
      totalImpressions: 450000,
      totalClicks: 4000
    },
    engagementTrend: Array.from({ length: 30 }, (_, i) => ({
      date: dayjs().subtract(29 - i, 'days').format('YYYY-MM-DD'),
      engagement: Math.floor(Math.random() * 1000) + 200,
      reach: Math.floor(Math.random() * 5000) + 1000,
      impressions: Math.floor(Math.random() * 15000) + 5000
    })),
    platformPerformance: [
      { platform: 'Instagram', engagement: 5200, ctr: 4.1, reach: 45000, followers: 12500, growth: 450 },
      { platform: 'LinkedIn', engagement: 3800, ctr: 2.8, reach: 35000, followers: 8900, growth: 320 },
      { platform: 'Twitter', engagement: 2900, ctr: 3.5, reach: 25000, followers: 6700, growth: 280 },
      { platform: 'Facebook', engagement: 2100, ctr: 2.1, reach: 15000, followers: 4200, growth: 150 },
      { platform: 'TikTok', engagement: 1420, ctr: 5.2, reach: 5000, followers: 2100, growth: 50 }
    ],
    hashtagPerformance: [
      { hashtag: '#AI', usage: 45, engagement: 3200, reach: 28000, trend: 'up' },
      { hashtag: '#TechNews', usage: 32, engagement: 2100, reach: 18000, trend: 'up' },
      { hashtag: '#Innovation', usage: 28, engagement: 1800, reach: 15000, trend: 'stable' },
      { hashtag: '#Startup', usage: 25, engagement: 1600, reach: 12000, trend: 'down' },
      { hashtag: '#DigitalMarketing', usage: 22, engagement: 1400, reach: 10000, trend: 'up' }
    ],
    hookPerformance: [
      { hook: 'Question hooks', usage: 38, engagement: 2800, ctr: 4.2, effectiveness: 85 },
      { hook: 'Story hooks', usage: 32, engagement: 2400, ctr: 3.8, effectiveness: 78 },
      { hook: 'Statistic hooks', usage: 28, engagement: 2100, ctr: 3.5, effectiveness: 72 },
      { hook: 'Controversy hooks', usage: 25, engagement: 1800, ctr: 3.2, effectiveness: 68 },
      { hook: 'Curiosity hooks', usage: 22, engagement: 1600, ctr: 2.9, effectiveness: 65 }
    ],
    topPosts: [
      {
        id: '1',
        content: 'The future of AI in social media marketing is here! 🚀 What do you think about automated content generation?',
        platform: 'LinkedIn',
        engagement: 850,
        ctr: 5.2,
        reach: 12000,
        date: '2024-12-15'
      },
      {
        id: '2',
        content: 'Just discovered an amazing tool that increased our engagement by 300%! Want to know the secret? 👀',
        platform: 'Instagram',
        engagement: 720,
        ctr: 4.8,
        reach: 9800,
        date: '2024-12-14'
      },
      {
        id: '3',
        content: '5 proven strategies that will transform your social media presence. Number 3 will shock you!',
        platform: 'Twitter',
        engagement: 680,
        ctr: 4.1,
        reach: 8500,
        date: '2024-12-13'
      }
    ],
    audienceInsights: {
      demographics: [
        { age: '18-24', percentage: 25 },
        { age: '25-34', percentage: 35 },
        { age: '35-44', percentage: 22 },
        { age: '45-54', percentage: 12 },
        { age: '55+', percentage: 6 }
      ],
      locations: [
        { location: 'United States', percentage: 45 },
        { location: 'United Kingdom', percentage: 18 },
        { location: 'Canada', percentage: 12 },
        { location: 'Australia', percentage: 10 },
        { location: 'Germany', percentage: 8 },
        { location: 'Other', percentage: 7 }
      ],
      interests: [
        { interest: 'Technology', percentage: 40 },
        { interest: 'Marketing', percentage: 25 },
        { interest: 'Business', percentage: 20 },
        { interest: 'Design', percentage: 10 },
        { interest: 'Other', percentage: 5 }
      ]
    }
  });

  const handleExport = async (format: 'csv' | 'pdf' | 'json') => {
    try {
      const response = await fetch(`/api/metrics/export?format=${format}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dateRange: {
            start: dateRange[0].format('YYYY-MM-DD'),
            end: dateRange[1].format('YYYY-MM-DD')
          },
          platforms: selectedPlatforms,
          campaigns: selectedCampaigns
        })
      });
      
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `metrics-dashboard-${dayjs().format('YYYY-MM-DD')}.${format}`;
        a.click();
        window.URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Error exporting metrics:', error);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <Text style={{ marginTop: '16px', display: 'block' }}>Loading metrics dashboard...</Text>
      </div>
    );
  }

  if (!metricsData) {
    return <Alert message="No metrics data available" type="warning" />;
  }

  const topPostsColumns = [
    {
      title: 'Content',
      dataIndex: 'content',
      key: 'content',
      render: (text: string) => (
        <div style={{ maxWidth: 300 }}>
          <Text ellipsis={{ tooltip: text }}>{text}</Text>
        </div>
      )
    },
    {
      title: 'Platform',
      dataIndex: 'platform',
      key: 'platform',
      render: (platform: string) => <Tag color="blue">{platform}</Tag>
    },
    {
      title: 'Engagement',
      dataIndex: 'engagement',
      key: 'engagement',
      sorter: (a: any, b: any) => a.engagement - b.engagement,
      render: (value: number) => (
        <Space>
          <HeartOutlined style={{ color: '#ff4d4f' }} />
          {value.toLocaleString()}
        </Space>
      )
    },
    {
      title: 'CTR',
      dataIndex: 'ctr',
      key: 'ctr',
      render: (value: number) => `${value}%`
    },
    {
      title: 'Reach',
      dataIndex: 'reach',
      key: 'reach',
      render: (value: number) => value.toLocaleString()
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      render: (date: string) => dayjs(date).format('MMM DD')
    }
  ];

  const hashtagColumns = [
    {
      title: 'Hashtag',
      dataIndex: 'hashtag',
      key: 'hashtag',
      render: (hashtag: string) => (
        <Space>
          <HashtagOutlined />
          <Text strong>{hashtag}</Text>
        </Space>
      )
    },
    {
      title: 'Usage',
      dataIndex: 'usage',
      key: 'usage',
      sorter: (a: any, b: any) => a.usage - b.usage
    },
    {
      title: 'Engagement',
      dataIndex: 'engagement',
      key: 'engagement',
      render: (value: number) => value.toLocaleString()
    },
    {
      title: 'Reach',
      dataIndex: 'reach',
      key: 'reach',
      render: (value: number) => value.toLocaleString()
    },
    {
      title: 'Trend',
      dataIndex: 'trend',
      key: 'trend',
      render: (trend: string) => {
        const colors = { up: 'green', down: 'red', stable: 'orange' };
        const icons = { up: '↗', down: '↘', stable: '→' };
        return <Tag color={colors[trend as keyof typeof colors]}>{icons[trend as keyof typeof icons]} {trend}</Tag>;
      }
    }
  ];

  return (
    <div style={{ padding: '24px' }}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={2}>Metrics Dashboard</Title>
          <Text type="secondary">Track your social media performance and audience insights</Text>
        </Col>
        <Col>
          <Space>
            <Button icon={<ReloadOutlined />} onClick={fetchMetricsData}>
              Refresh
            </Button>
            <Button icon={<DownloadOutlined />} onClick={() => handleExport('csv')}>
              Export CSV
            </Button>
            <Button icon={<DownloadOutlined />} onClick={() => handleExport('pdf')}>
              Export PDF
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={16} align="middle">
          <Col>
            <Text strong>Date Range:</Text>
          </Col>
          <Col>
            <RangePicker
              value={dateRange}
              onChange={(dates) => dates && setDateRange(dates as [dayjs.Dayjs, dayjs.Dayjs])}
            />
          </Col>
          <Col>
            <Text strong>Platforms:</Text>
          </Col>
          <Col>
            <Select
              mode="multiple"
              style={{ minWidth: 200 }}
              value={selectedPlatforms}
              onChange={setSelectedPlatforms}
              placeholder="Select platforms"
            >
              <Option value="all">All Platforms</Option>
              <Option value="instagram">Instagram</Option>
              <Option value="linkedin">LinkedIn</Option>
              <Option value="twitter">Twitter</Option>
              <Option value="facebook">Facebook</Option>
              <Option value="tiktok">TikTok</Option>
            </Select>
          </Col>
          <Col>
            <Text strong>Campaigns:</Text>
          </Col>
          <Col>
            <Select
              mode="multiple"
              style={{ minWidth: 200 }}
              value={selectedCampaigns}
              onChange={setSelectedCampaigns}
              placeholder="Select campaigns"
            >
              <Option value="all">All Campaigns</Option>
              <Option value="q4-2024">Q4 2024 Campaign</Option>
              <Option value="holiday-special">Holiday Special</Option>
              <Option value="product-launch">Product Launch</Option>
            </Select>
          </Col>
        </Row>
      </Card>

      {/* Overview Stats */}
      <Row gutter={[16, 16]} style={{ marginBottom: '24px' }}>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Engagement"
              value={metricsData.overview.totalEngagement}
              prefix={<HeartOutlined style={{ color: '#ff4d4f' }} />}
              suffix="interactions"
            />
            <Progress percent={75} size="small" style={{ marginTop: '8px' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Avg. CTR"
              value={metricsData.overview.avgCTR}
              prefix={<LinkOutlined style={{ color: '#1890ff' }} />}
              suffix="%"
              precision={1}
            />
            <Progress percent={64} size="small" style={{ marginTop: '8px' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Follower Growth"
              value={metricsData.overview.followerGrowth}
              prefix={<UserAddOutlined style={{ color: '#52c41a' }} />}
              suffix="new followers"
            />
            <Progress percent={88} size="small" style={{ marginTop: '8px' }} />
          </Card>
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Card>
            <Statistic
              title="Total Reach"
              value={metricsData.overview.totalReach}
              prefix={<EyeOutlined style={{ color: '#722ed1' }} />}
              suffix="people"
            />
            <Progress percent={92} size="small" style={{ marginTop: '8px' }} />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      <Tabs defaultActiveKey="1" size="large">
        <TabPane tab="Engagement Trends" key="1">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={16}>
              <Card title="Engagement Over Time" extra={<InfoCircleOutlined />}>
                <ResponsiveContainer width="100%" height={300}>
                  <ComposedChart data={metricsData.engagementTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Area type="monotone" dataKey="impressions" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                    <Area type="monotone" dataKey="reach" stackId="1" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
                    <Line type="monotone" dataKey="engagement" stroke="#ff7300" strokeWidth={2} />
                  </ComposedChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="Platform Performance">
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={metricsData.platformPerformance}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="platform" />
                    <PolarRadiusAxis />
                    <Radar name="Engagement" dataKey="engagement" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                    <Radar name="CTR" dataKey="ctr" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.6} />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="Content Performance" key="2">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Top Performing Posts">
                <Table
                  dataSource={metricsData.topPosts}
                  columns={topPostsColumns}
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Hashtag Performance">
                <Table
                  dataSource={metricsData.hashtagPerformance}
                  columns={hashtagColumns}
                  pagination={false}
                  size="small"
                />
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="Hook Analysis" key="3">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <Card title="Hook Performance Comparison">
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={metricsData.hookPerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="hook" />
                    <YAxis />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="engagement" fill="#8884d8" />
                    <Bar dataKey="ctr" fill="#82ca9d" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Hook Effectiveness">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={metricsData.hookPerformance}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ hook, effectiveness }) => `${hook}: ${effectiveness}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="effectiveness"
                    >
                      {metricsData.hookPerformance.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </TabPane>

        <TabPane tab="Audience Insights" key="4">
          <Row gutter={[16, 16]}>
            <Col xs={24} lg={8}>
              <Card title="Age Demographics">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={metricsData.audienceInsights.demographics}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ age, percentage }) => `${age}: ${percentage}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="percentage"
                    >
                      {metricsData.audienceInsights.demographics.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="Geographic Distribution">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={metricsData.audienceInsights.locations}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ location, percentage }) => `${location}: ${percentage}%`}
                      outerRadius={80}
                      fill="#82ca9d"
                      dataKey="percentage"
                    >
                      {metricsData.audienceInsights.locations.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="Interest Categories">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={metricsData.audienceInsights.interests}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ interest, percentage }) => `${interest}: ${percentage}%`}
                      outerRadius={80}
                      fill="#ffc658"
                      dataKey="percentage"
                    >
                      {metricsData.audienceInsights.interests.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </Card>
            </Col>
          </Row>
        </TabPane>
      </Tabs>
    </div>
  );
}
