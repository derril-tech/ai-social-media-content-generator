'use client';

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Typography, Alert, Spin, message } from 'antd';
import { SendOutlined, CheckCircleOutlined } from '@ant-design/icons';
import PublishPanel from '../../components/PublishPanel';

const { Title, Text } = Typography;

export default function PublishPage() {
  const [variant, setVariant] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In a real app, this would fetch the variant from the API
    // For now, use mock data
    const mockVariant = {
      id: 'variant-1',
      content: 'Check out our amazing new product! 🚀 It\'s designed to revolutionize your workflow and boost productivity. #Innovation #Productivity #Tech',
      platforms: ['twitter', 'linkedin', 'facebook'],
      hashtags: ['Innovation', 'Productivity', 'Tech'],
      mentions: ['company'],
      links: ['https://example.com/product'],
      media: ['https://example.com/image.jpg'],
      brandFit: 0.92,
      readability: 0.88,
      policyRisk: 0.05
    };

    setVariant(mockVariant);
    setLoading(false);
  }, []);

  const handlePublish = async (publishData: any) => {
    console.log('Publishing:', publishData);
    // In a real app, this would call the API to publish
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
    return Promise.resolve();
  };

  const handleSchedule = async (scheduleData: any) => {
    console.log('Scheduling:', scheduleData);
    // In a real app, this would call the API to schedule
    await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate API call
    return Promise.resolve();
  };

  const handlePreview = async (previewData: any) => {
    console.log('Preview:', previewData);
    // In a real app, this would call the API to generate previews
    return Promise.resolve();
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <Title level={2}>Publish Content</Title>
        <Text type="secondary">
          Review and publish your content to selected social media platforms.
        </Text>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={16}>
          <PublishPanel
            variant={variant}
            onPublish={handlePublish}
            onSchedule={handleSchedule}
            onPreview={handlePreview}
          />
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Content Summary" className="mb-4">
            <div className="space-y-4">
              <div>
                <Text strong>Content:</Text>
                <div className="mt-2 p-3 bg-gray-50 rounded">
                  <Text>{variant?.content}</Text>
                </div>
              </div>

              <div>
                <Text strong>Platforms:</Text>
                <div className="mt-2">
                  {variant?.platforms?.map((platform: string) => (
                    <span key={platform} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2 mb-2 text-sm">
                      {platform}
                    </span>
                  ))}
                </div>
              </div>

              {variant?.hashtags?.length > 0 && (
                <div>
                  <Text strong>Hashtags:</Text>
                  <div className="mt-2">
                    {variant.hashtags.map((tag: string) => (
                      <span key={tag} className="inline-block bg-green-100 text-green-800 px-2 py-1 rounded mr-2 mb-2 text-sm">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {variant?.mentions?.length > 0 && (
                <div>
                  <Text strong>Mentions:</Text>
                  <div className="mt-2">
                    {variant.mentions.map((mention: string) => (
                      <span key={mention} className="inline-block bg-purple-100 text-purple-800 px-2 py-1 rounded mr-2 mb-2 text-sm">
                        @{mention}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600">{Math.round((variant?.brandFit || 0) * 100)}%</div>
                  <div className="text-sm text-gray-600">Brand Fit</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-blue-600">{Math.round((variant?.readability || 0) * 100)}%</div>
                  <div className="text-sm text-gray-600">Readability</div>
                </div>
                <div className="text-center">
                  <div className="text-lg font-bold text-red-600">{Math.round((variant?.policyRisk || 0) * 100)}%</div>
                  <div className="text-sm text-gray-600">Policy Risk</div>
                </div>
              </div>
            </div>
          </Card>

          <Alert
            message="Publishing Guidelines"
            description="Make sure your content complies with platform policies and includes appropriate disclosures for sponsored content."
            type="info"
            showIcon
            icon={<CheckCircleOutlined />}
          />
        </Col>
      </Row>
    </div>
  );
}
