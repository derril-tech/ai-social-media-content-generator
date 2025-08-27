# Created automatically by Cursor AI (2024-12-19)

'use client';
import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Space, Tag, Button, Tooltip, Progress, Alert, Spin, List, Avatar, Badge, Select, Switch, Divider, Statistic } from 'antd';
import { 
  ClockCircleOutlined, TrophyOutlined, FireOutlined, TrendingUpOutlined, 
  GlobalOutlined, CalendarOutlined, BulbOutlined, CheckCircleOutlined,
  ExclamationCircleOutlined, InfoCircleOutlined, SettingOutlined
} from '@ant-design/icons';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface TimeSlot {
  hour: number;
  dayOfWeek: number;
  engagement: number;
  reach: number;
  ctr: number;
  frequency: number;
  timezone: string;
}

interface PlatformRecommendation {
  platform: string;
  bestTimes: TimeSlot[];
  worstTimes: TimeSlot[];
  timezone: string;
  confidence: number;
  lastUpdated: string;
}

interface RegionalData {
  region: string;
  timezone: string;
  bestTimes: TimeSlot[];
  audienceSize: number;
  engagementRate: number;
}

interface BestTimeRecommendationsProps {
  selectedPlatforms?: string[];
  selectedRegions?: string[];
  onTimeSelect?: (timeSlot: TimeSlot) => void;
  className?: string;
}

const TIMEZONES = [
  { value: 'America/New_York', label: 'Eastern Time (ET)' },
  { value: 'America/Chicago', label: 'Central Time (CT)' },
  { value: 'America/Denver', label: 'Mountain Time (MT)' },
  { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
  { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
  { value: 'Europe/Paris', label: 'Central European Time (CET)' },
  { value: 'Asia/Tokyo', label: 'Japan Standard Time (JST)' },
  { value: 'Australia/Sydney', label: 'Australian Eastern Time (AET)' }
];

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export default function BestTimeRecommendations({ 
  selectedPlatforms = ['all'], 
  selectedRegions = ['all'],
  onTimeSelect,
  className 
}: BestTimeRecommendationsProps) {
  const [recommendations, setRecommendations] = useState<PlatformRecommendation[]>([]);
  const [regionalData, setRegionalData] = useState<RegionalData[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTimezone, setSelectedTimezone] = useState('America/New_York');
  const [showHistoricalData, setShowHistoricalData] = useState(true);
  const [autoOptimize, setAutoOptimize] = useState(true);

  useEffect(() => {
    fetchRecommendations();
  }, [selectedPlatforms, selectedRegions, selectedTimezone]);

  const fetchRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/recommendations/best-times', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platforms: selectedPlatforms,
          regions: selectedRegions,
          timezone: selectedTimezone
        })
      });
      
      const data = await response.json();
      setRecommendations(data.recommendations);
      setRegionalData(data.regionalData);
    } catch (error) {
      console.error('Error fetching recommendations:', error);
      // Use mock data
      setRecommendations(generateMockRecommendations());
      setRegionalData(generateMockRegionalData());
    } finally {
      setLoading(false);
    }
  };

  const generateMockRecommendations = (): PlatformRecommendation[] => [
    {
      platform: 'Instagram',
      timezone: selectedTimezone,
      confidence: 85,
      lastUpdated: dayjs().subtract(2, 'hours').format(),
      bestTimes: [
        { hour: 9, dayOfWeek: 1, engagement: 850, reach: 12000, ctr: 4.2, frequency: 45, timezone: selectedTimezone },
        { hour: 12, dayOfWeek: 3, engagement: 920, reach: 13500, ctr: 4.8, frequency: 38, timezone: selectedTimezone },
        { hour: 18, dayOfWeek: 5, engagement: 780, reach: 11000, ctr: 3.9, frequency: 42, timezone: selectedTimezone },
        { hour: 20, dayOfWeek: 6, engagement: 950, reach: 14000, ctr: 5.1, frequency: 35, timezone: selectedTimezone }
      ],
      worstTimes: [
        { hour: 3, dayOfWeek: 0, engagement: 120, reach: 2000, ctr: 1.2, frequency: 8, timezone: selectedTimezone },
        { hour: 4, dayOfWeek: 1, engagement: 95, reach: 1500, ctr: 0.9, frequency: 5, timezone: selectedTimezone }
      ]
    },
    {
      platform: 'LinkedIn',
      timezone: selectedTimezone,
      confidence: 78,
      lastUpdated: dayjs().subtract(4, 'hours').format(),
      bestTimes: [
        { hour: 8, dayOfWeek: 2, engagement: 650, reach: 8500, ctr: 3.8, frequency: 32, timezone: selectedTimezone },
        { hour: 11, dayOfWeek: 3, engagement: 720, reach: 9200, ctr: 4.1, frequency: 28, timezone: selectedTimezone },
        { hour: 17, dayOfWeek: 4, engagement: 680, reach: 8800, ctr: 3.9, frequency: 25, timezone: selectedTimezone }
      ],
      worstTimes: [
        { hour: 22, dayOfWeek: 5, engagement: 180, reach: 2500, ctr: 1.8, frequency: 12, timezone: selectedTimezone },
        { hour: 23, dayOfWeek: 6, engagement: 150, reach: 2000, ctr: 1.5, frequency: 8, timezone: selectedTimezone }
      ]
    },
    {
      platform: 'Twitter',
      timezone: selectedTimezone,
      confidence: 82,
      lastUpdated: dayjs().subtract(1, 'hour').format(),
      bestTimes: [
        { hour: 10, dayOfWeek: 2, engagement: 580, reach: 7200, ctr: 3.5, frequency: 40, timezone: selectedTimezone },
        { hour: 14, dayOfWeek: 4, engagement: 620, reach: 7800, ctr: 3.8, frequency: 35, timezone: selectedTimezone },
        { hour: 19, dayOfWeek: 5, engagement: 590, reach: 7500, ctr: 3.6, frequency: 38, timezone: selectedTimezone }
      ],
      worstTimes: [
        { hour: 2, dayOfWeek: 1, engagement: 85, reach: 1200, ctr: 0.8, frequency: 6, timezone: selectedTimezone },
        { hour: 5, dayOfWeek: 2, engagement: 95, reach: 1400, ctr: 1.1, frequency: 7, timezone: selectedTimezone }
      ]
    }
  ];

  const generateMockRegionalData = (): RegionalData[] => [
    {
      region: 'North America',
      timezone: 'America/New_York',
      audienceSize: 45000,
      engagementRate: 4.2,
      bestTimes: [
        { hour: 9, dayOfWeek: 1, engagement: 850, reach: 12000, ctr: 4.2, frequency: 45, timezone: 'America/New_York' },
        { hour: 12, dayOfWeek: 3, engagement: 920, reach: 13500, ctr: 4.8, frequency: 38, timezone: 'America/New_York' }
      ]
    },
    {
      region: 'Europe',
      timezone: 'Europe/London',
      audienceSize: 28000,
      engagementRate: 3.8,
      bestTimes: [
        { hour: 10, dayOfWeek: 2, engagement: 720, reach: 9800, ctr: 3.9, frequency: 32, timezone: 'Europe/London' },
        { hour: 15, dayOfWeek: 4, engagement: 680, reach: 9200, ctr: 3.6, frequency: 28, timezone: 'Europe/London' }
      ]
    },
    {
      region: 'Asia Pacific',
      timezone: 'Asia/Tokyo',
      audienceSize: 32000,
      engagementRate: 4.5,
      bestTimes: [
        { hour: 8, dayOfWeek: 2, engagement: 890, reach: 12500, ctr: 4.6, frequency: 42, timezone: 'Asia/Tokyo' },
        { hour: 20, dayOfWeek: 5, engagement: 950, reach: 13500, ctr: 5.2, frequency: 38, timezone: 'Asia/Tokyo' }
      ]
    }
  ];

  const formatTime = (hour: number): string => {
    return dayjs().hour(hour).minute(0).format('h:mm A');
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 80) return 'green';
    if (confidence >= 60) return 'orange';
    return 'red';
  };

  const getEngagementColor = (engagement: number): string => {
    if (engagement >= 800) return 'green';
    if (engagement >= 500) return 'orange';
    return 'red';
  };

  const handleTimeSelect = (timeSlot: TimeSlot) => {
    if (onTimeSelect) {
      onTimeSelect(timeSlot);
    }
  };

  const generateHeatmapData = (platform: string) => {
    const data = [];
    for (let day = 0; day < 7; day++) {
      for (let hour = 0; hour < 24; hour++) {
        const timeSlot = recommendations
          .find(r => r.platform === platform)
          ?.bestTimes.find(t => t.dayOfWeek === day && t.hour === hour);
        
        data.push({
          day: DAYS_OF_WEEK[day],
          hour: hour,
          engagement: timeSlot?.engagement || Math.floor(Math.random() * 200) + 50,
          time: formatTime(hour)
        });
      }
    }
    return data;
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px' }}>
        <Spin size="large" />
        <Text style={{ marginTop: '16px', display: 'block' }}>Analyzing best posting times...</Text>
      </div>
    );
  }

  return (
    <div className={className}>
      {/* Header */}
      <Row justify="space-between" align="middle" style={{ marginBottom: '24px' }}>
        <Col>
          <Title level={3}>
            <ClockCircleOutlined style={{ marginRight: '8px' }} />
            Best Time Recommendations
          </Title>
          <Text type="secondary">AI-powered posting time optimization based on your audience behavior</Text>
        </Col>
        <Col>
          <Space>
            <Switch 
              checked={showHistoricalData} 
              onChange={setShowHistoricalData}
              checkedChildren="Historical Data"
              unCheckedChildren="Historical Data"
            />
            <Switch 
              checked={autoOptimize} 
              onChange={setAutoOptimize}
              checkedChildren="Auto Optimize"
              unCheckedChildren="Auto Optimize"
            />
            <Button icon={<SettingOutlined />} size="small">
              Settings
            </Button>
          </Space>
        </Col>
      </Row>

      {/* Filters */}
      <Card style={{ marginBottom: '24px' }}>
        <Row gutter={16} align="middle">
          <Col>
            <Text strong>Timezone:</Text>
          </Col>
          <Col>
            <Select
              value={selectedTimezone}
              onChange={setSelectedTimezone}
              style={{ minWidth: 200 }}
            >
              {TIMEZONES.map(tz => (
                <Option key={tz.value} value={tz.value}>{tz.label}</Option>
              ))}
            </Select>
          </Col>
          <Col>
            <Text type="secondary">
              Current time: {dayjs().tz(selectedTimezone).format('h:mm A, ddd MMM D')}
            </Text>
          </Col>
        </Row>
      </Card>

      {/* Platform Recommendations */}
      {recommendations.map((recommendation, index) => (
        <Card 
          key={recommendation.platform} 
          style={{ marginBottom: '16px' }}
          title={
            <Space>
              <Text strong>{recommendation.platform}</Text>
              <Badge 
                count={`${recommendation.confidence}%`} 
                style={{ backgroundColor: getConfidenceColor(recommendation.confidence) }}
              />
              <Text type="secondary">confidence</Text>
            </Space>
          }
          extra={
            <Space>
              <Text type="secondary">Updated {dayjs(recommendation.lastUpdated).fromNow()}</Text>
              <Button size="small" icon={<InfoCircleOutlined />}>
                Details
              </Button>
            </Space>
          }
        >
          <Row gutter={[16, 16]}>
            {/* Best Times */}
            <Col xs={24} lg={12}>
              <Card size="small" title="Best Times to Post" style={{ backgroundColor: '#f6ffed' }}>
                <List
                  dataSource={recommendation.bestTimes}
                  renderItem={(timeSlot) => (
                    <List.Item
                      actions={[
                        <Button 
                          size="small" 
                          type="primary"
                          onClick={() => handleTimeSelect(timeSlot)}
                        >
                          Select
                        </Button>
                      ]}
                    >
                      <List.Item.Meta
                        avatar={
                          <Avatar 
                            style={{ backgroundColor: getEngagementColor(timeSlot.engagement) }}
                            icon={<TrophyOutlined />}
                          />
                        }
                        title={
                          <Space>
                            <Text strong>{DAYS_OF_WEEK[timeSlot.dayOfWeek]} at {formatTime(timeSlot.hour)}</Text>
                            <Tag color="green">Best</Tag>
                          </Space>
                        }
                        description={
                          <Space direction="vertical" size="small">
                            <Text>Engagement: {timeSlot.engagement.toLocaleString()}</Text>
                            <Text>Reach: {timeSlot.reach.toLocaleString()}</Text>
                            <Text>CTR: {timeSlot.ctr}%</Text>
                            <Progress 
                              percent={Math.min((timeSlot.engagement / 1000) * 100, 100)} 
                              size="small" 
                              showInfo={false}
                            />
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>

            {/* Worst Times */}
            <Col xs={24} lg={12}>
              <Card size="small" title="Times to Avoid" style={{ backgroundColor: '#fff2f0' }}>
                <List
                  dataSource={recommendation.worstTimes}
                  renderItem={(timeSlot) => (
                    <List.Item>
                      <List.Item.Meta
                        avatar={
                          <Avatar 
                            style={{ backgroundColor: getEngagementColor(timeSlot.engagement) }}
                            icon={<ExclamationCircleOutlined />}
                          />
                        }
                        title={
                          <Space>
                            <Text strong>{DAYS_OF_WEEK[timeSlot.dayOfWeek]} at {formatTime(timeSlot.hour)}</Text>
                            <Tag color="red">Avoid</Tag>
                          </Space>
                        }
                        description={
                          <Space direction="vertical" size="small">
                            <Text>Engagement: {timeSlot.engagement.toLocaleString()}</Text>
                            <Text>Reach: {timeSlot.reach.toLocaleString()}</Text>
                            <Text>CTR: {timeSlot.ctr}%</Text>
                            <Progress 
                              percent={Math.min((timeSlot.engagement / 1000) * 100, 100)} 
                              size="small" 
                              showInfo={false}
                              strokeColor="#ff4d4f"
                            />
                          </Space>
                        }
                      />
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
          </Row>

          {/* Historical Performance Chart */}
          {showHistoricalData && (
            <div style={{ marginTop: '16px' }}>
              <Title level={5}>Historical Performance by Time</Title>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={generateHeatmapData(recommendation.platform)}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <RechartsTooltip />
                  <Bar dataKey="engagement" fill="#8884d8">
                    {generateHeatmapData(recommendation.platform).map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={getEngagementColor(entry.engagement) === 'green' ? '#52c41a' : 
                              getEngagementColor(entry.engagement) === 'orange' ? '#faad14' : '#ff4d4f'} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </Card>
      ))}

      {/* Regional Insights */}
      <Card title="Regional Performance Insights" style={{ marginTop: '24px' }}>
        <Row gutter={[16, 16]}>
          {regionalData.map((region) => (
            <Col xs={24} md={8} key={region.region}>
              <Card size="small">
                <Statistic
                  title={region.region}
                  value={region.audienceSize}
                  suffix="audience"
                  prefix={<GlobalOutlined />}
                />
                <Text type="secondary">Engagement Rate: {region.engagementRate}%</Text>
                <div style={{ marginTop: '8px' }}>
                  <Text strong>Best Times:</Text>
                  <List
                    size="small"
                    dataSource={region.bestTimes.slice(0, 2)}
                    renderItem={(timeSlot) => (
                      <List.Item>
                        <Text>
                          {DAYS_OF_WEEK[timeSlot.dayOfWeek]} at {formatTime(timeSlot.hour)}
                        </Text>
                      </List.Item>
                    )}
                  />
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      </Card>

      {/* Tips */}
      <Alert
        message="Pro Tips"
        description={
          <ul>
            <li>Post during peak engagement hours for maximum reach</li>
            <li>Consider your audience's timezone when scheduling</li>
            <li>Test different posting times to optimize for your specific audience</li>
            <li>Use auto-optimization to automatically adjust based on performance</li>
          </ul>
        }
        type="info"
        showIcon
        icon={<BulbOutlined />}
        style={{ marginTop: '24px' }}
      />
    </div>
  );
}
