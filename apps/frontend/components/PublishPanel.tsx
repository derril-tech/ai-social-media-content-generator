'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Button, 
  Switch, 
  Form, 
  Select, 
  DatePicker, 
  TimePicker, 
  Space, 
  Typography, 
  Alert, 
  Modal,
  Tabs,
  Tag,
  Divider,
  List,
  Checkbox,
  Radio,
  Input,
  message,
  Spin,
  Progress
} from 'antd';
import { 
  SendOutlined, 
  EyeOutlined, 
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SettingOutlined,
  GlobalOutlined,
  CalendarOutlined,
  SafetyOutlined
} from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;
const { TabPane } = Tabs;

interface PublishPanelProps {
  variant: any;
  onPublish: (publishData: any) => void;
  onSchedule: (scheduleData: any) => void;
  onPreview: (previewData: any) => void;
}

interface PlatformPreview {
  platform: string;
  name: string;
  content: string;
  media?: string[];
  hashtags?: string[];
  mentions?: string[];
  links?: string[];
  disclosure?: string;
  characterCount: number;
  characterLimit: number;
  warnings: string[];
  errors: string[];
}

export default function PublishPanel({ 
  variant, 
  onPublish, 
  onSchedule, 
  onPreview 
}: PublishPanelProps) {
  const [form] = Form.useForm();
  const [publishMode, setPublishMode] = useState<'now' | 'schedule'>('now');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [disclosureEnabled, setDisclosureEnabled] = useState(true);
  const [disclosureType, setDisclosureType] = useState<'paid' | 'ad' | 'sponsored'>('paid');
  const [customDisclosure, setCustomDisclosure] = useState('');
  const [previewVisible, setPreviewVisible] = useState(false);
  const [platformPreviews, setPlatformPreviews] = useState<PlatformPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  const platforms = [
    { key: 'twitter', name: 'X (Twitter)', icon: '🐦' },
    { key: 'linkedin', name: 'LinkedIn', icon: '💼' },
    { key: 'facebook', name: 'Facebook', icon: '📘' },
    { key: 'instagram', name: 'Instagram', icon: '📷' },
    { key: 'youtube', name: 'YouTube', icon: '📺' },
    { key: 'tiktok', name: 'TikTok', icon: '🎵' },
    { key: 'pinterest', name: 'Pinterest', icon: '📌' }
  ];

  const disclosureOptions = [
    { value: 'paid', label: 'PAID', description: 'For paid partnerships' },
    { value: 'ad', label: 'AD', description: 'For advertisements' },
    { value: 'sponsored', label: 'SPONSORED', description: 'For sponsored content' },
    { value: 'custom', label: 'Custom', description: 'Custom disclosure text' }
  ];

  useEffect(() => {
    if (variant) {
      // Auto-select platforms based on variant
      const variantPlatforms = variant.platforms || [];
      setSelectedPlatforms(variantPlatforms);
      generatePreviews();
    }
  }, [variant]);

  const generatePreviews = async () => {
    if (!variant || selectedPlatforms.length === 0) return;

    setLoading(true);
    try {
      // In a real app, this would call the API to generate platform-specific previews
      const previews = selectedPlatforms.map(platform => {
        const platformData = platforms.find(p => p.key === platform);
        const baseContent = variant.content || '';
        const disclosure = getDisclosureText();
        
        let content = baseContent;
        if (disclosure && disclosureEnabled) {
          content += `\n\n${disclosure}`;
        }

        return {
          platform,
          name: platformData?.name || platform,
          content,
          media: variant.media || [],
          hashtags: variant.hashtags || [],
          mentions: variant.mentions || [],
          links: variant.links || [],
          disclosure: disclosure,
          characterCount: content.length,
          characterLimit: getCharacterLimit(platform),
          warnings: generateWarnings(platform, content),
          errors: generateErrors(platform, content)
        };
      });

      setPlatformPreviews(previews);
    } catch (error) {
      message.error('Failed to generate previews');
    } finally {
      setLoading(false);
    }
  };

  const getCharacterLimit = (platform: string): number => {
    const limits: Record<string, number> = {
      twitter: 280,
      linkedin: 3000,
      facebook: 63206,
      instagram: 2200,
      youtube: 5000,
      tiktok: 2200,
      pinterest: 500
    };
    return limits[platform] || 1000;
  };

  const generateWarnings = (platform: string, content: string): string[] => {
    const warnings: string[] = [];
    
    if (content.length > getCharacterLimit(platform) * 0.9) {
      warnings.push('Content is approaching character limit');
    }
    
    if (content.includes('http') && !content.includes('https')) {
      warnings.push('Consider using HTTPS links for better security');
    }
    
    if (content.toLowerCase().includes('buy now') || content.toLowerCase().includes('click here')) {
      warnings.push('Content may appear overly promotional');
    }

    return warnings;
  };

  const generateErrors = (platform: string, content: string): string[] => {
    const errors: string[] = [];
    
    if (content.length > getCharacterLimit(platform)) {
      errors.push(`Content exceeds ${getCharacterLimit(platform)} character limit`);
    }
    
    if (platform === 'twitter' && content.includes('@') && !content.includes(' ')) {
      errors.push('Twitter handles should be followed by a space');
    }

    return errors;
  };

  const getDisclosureText = (): string => {
    if (!disclosureEnabled) return '';
    
    if (disclosureType === 'custom') {
      return customDisclosure;
    }
    
    const disclosures: Record<string, string> = {
      paid: '#PAID',
      ad: '#AD',
      sponsored: '#SPONSORED'
    };
    
    return disclosures[disclosureType] || '';
  };

  const handlePlatformChange = (platforms: string[]) => {
    setSelectedPlatforms(platforms);
    generatePreviews();
  };

  const handleDisclosureChange = (enabled: boolean) => {
    setDisclosureEnabled(enabled);
    generatePreviews();
  };

  const handlePreview = () => {
    setPreviewVisible(true);
  };

  const handlePublish = async () => {
    if (selectedPlatforms.length === 0) {
      message.error('Please select at least one platform');
      return;
    }

    setPublishing(true);
    try {
      const publishData = {
        variantId: variant.id,
        platforms: selectedPlatforms,
        disclosure: getDisclosureText(),
        publishMode,
        scheduledTime: publishMode === 'schedule' ? form.getFieldValue('scheduledTime') : null,
        dryRun: false
      };

      await onPublish(publishData);
      message.success('Content published successfully!');
    } catch (error) {
      message.error('Failed to publish content');
    } finally {
      setPublishing(false);
    }
  };

  const handleSchedule = async () => {
    if (selectedPlatforms.length === 0) {
      message.error('Please select at least one platform');
      return;
    }

    const scheduledTime = form.getFieldValue('scheduledTime');
    if (!scheduledTime) {
      message.error('Please select a scheduled time');
      return;
    }

    setPublishing(true);
    try {
      const scheduleData = {
        variantId: variant.id,
        platforms: selectedPlatforms,
        disclosure: getDisclosureText(),
        scheduledTime: scheduledTime.toISOString(),
        dryRun: false
      };

      await onSchedule(scheduleData);
      message.success('Content scheduled successfully!');
    } catch (error) {
      message.error('Failed to schedule content');
    } finally {
      setPublishing(false);
    }
  };

  const renderPlatformPreview = (preview: PlatformPreview) => (
    <div key={preview.platform} className="mb-4 p-4 border rounded-lg">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-lg">{platforms.find(p => p.key === preview.platform)?.icon}</span>
          <Text strong>{preview.name}</Text>
        </div>
        <div className="flex items-center gap-2">
          <Text type={preview.characterCount > preview.characterLimit ? 'danger' : 'secondary'}>
            {preview.characterCount}/{preview.characterLimit}
          </Text>
          {preview.errors.length > 0 && (
            <Tag color="red" icon={<ExclamationCircleOutlined />}>
              {preview.errors.length} errors
            </Tag>
          )}
          {preview.warnings.length > 0 && (
            <Tag color="orange" icon={<ExclamationCircleOutlined />}>
              {preview.warnings.length} warnings
            </Tag>
          )}
        </div>
      </div>

      <div className="bg-gray-50 p-3 rounded mb-2">
        <Text>{preview.content}</Text>
      </div>

      {preview.hashtags.length > 0 && (
        <div className="mb-2">
          <Text type="secondary" className="text-sm">Hashtags: </Text>
          {preview.hashtags.map((tag, index) => (
            <Tag key={index} color="blue" size="small">#{tag}</Tag>
          ))}
        </div>
      )}

      {preview.mentions.length > 0 && (
        <div className="mb-2">
          <Text type="secondary" className="text-sm">Mentions: </Text>
          {preview.mentions.map((mention, index) => (
            <Tag key={index} color="green" size="small">@{mention}</Tag>
          ))}
        </div>
      )}

      {preview.errors.length > 0 && (
        <div className="mb-2">
          <Text type="danger" className="text-sm">Errors:</Text>
          <ul className="text-sm text-red-600 ml-4">
            {preview.errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {preview.warnings.length > 0 && (
        <div className="mb-2">
          <Text type="warning" className="text-sm">Warnings:</Text>
          <ul className="text-sm text-orange-600 ml-4">
            {preview.warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );

  return (
    <div>
      <Card title="Publish Content" className="mb-4">
        <Form form={form} layout="vertical">
          {/* Platform Selection */}
          <Form.Item label="Select Platforms" required>
            <Select
              mode="multiple"
              placeholder="Choose platforms to publish to"
              value={selectedPlatforms}
              onChange={handlePlatformChange}
              style={{ width: '100%' }}
            >
              {platforms.map(platform => (
                <Option key={platform.key} value={platform.key}>
                  <span className="mr-2">{platform.icon}</span>
                  {platform.name}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {/* Disclosure Settings */}
          <Form.Item label="Disclosure Settings">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <Text strong>Enable Disclosure</Text>
                  <div className="text-sm text-gray-500">
                    Required for paid partnerships and sponsored content
                  </div>
                </div>
                <Switch 
                  checked={disclosureEnabled} 
                  onChange={handleDisclosureChange}
                />
              </div>

              {disclosureEnabled && (
                <div className="ml-4">
                  <Radio.Group 
                    value={disclosureType} 
                    onChange={(e) => setDisclosureType(e.target.value)}
                  >
                    <Space direction="vertical">
                      {disclosureOptions.map(option => (
                        <Radio key={option.value} value={option.value}>
                          <div>
                            <Text strong>{option.label}</Text>
                            <div className="text-sm text-gray-500">
                              {option.description}
                            </div>
                          </div>
                        </Radio>
                      ))}
                    </Space>
                  </Radio.Group>

                  {disclosureType === 'custom' && (
                    <div className="mt-2">
                      <Input
                        placeholder="Enter custom disclosure text"
                        value={customDisclosure}
                        onChange={(e) => setCustomDisclosure(e.target.value)}
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
          </Form.Item>

          {/* Publish Mode */}
          <Form.Item label="Publish Mode">
            <Radio.Group value={publishMode} onChange={(e) => setPublishMode(e.target.value)}>
              <Space direction="vertical">
                <Radio value="now">
                  <div className="flex items-center gap-2">
                    <SendOutlined />
                    <div>
                      <Text strong>Publish Now</Text>
                      <div className="text-sm text-gray-500">Publish immediately to selected platforms</div>
                    </div>
                  </div>
                </Radio>
                <Radio value="schedule">
                  <div className="flex items-center gap-2">
                    <ClockCircleOutlined />
                    <div>
                      <Text strong>Schedule for Later</Text>
                      <div className="text-sm text-gray-500">Schedule publication for a specific time</div>
                    </div>
                  </div>
                </Radio>
              </Space>
            </Radio.Group>
          </Form.Item>

          {/* Schedule Settings */}
          {publishMode === 'schedule' && (
            <Form.Item label="Scheduled Time" required>
              <Space>
                <DatePicker 
                  placeholder="Select date"
                  disabledDate={(current) => current && current < dayjs().startOf('day')}
                />
                <TimePicker 
                  placeholder="Select time"
                  format="HH:mm"
                  minuteStep={15}
                />
              </Space>
            </Form.Item>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 mt-6">
            <Button
              type="default"
              icon={<EyeOutlined />}
              onClick={handlePreview}
              loading={loading}
            >
              Preview
            </Button>
            {publishMode === 'now' ? (
              <Button
                type="primary"
                icon={<SendOutlined />}
                onClick={handlePublish}
                loading={publishing}
                disabled={selectedPlatforms.length === 0}
              >
                Publish Now
              </Button>
            ) : (
              <Button
                type="primary"
                icon={<ClockCircleOutlined />}
                onClick={handleSchedule}
                loading={publishing}
                disabled={selectedPlatforms.length === 0}
              >
                Schedule
              </Button>
            )}
          </div>
        </Form>
      </Card>

      {/* Preview Modal */}
      <Modal
        title="Content Preview"
        open={previewVisible}
        onCancel={() => setPreviewVisible(false)}
        width={800}
        footer={null}
      >
        <div className="max-h-96 overflow-y-auto">
          {platformPreviews.map(renderPlatformPreview)}
        </div>
      </Modal>
    </div>
  );
}
