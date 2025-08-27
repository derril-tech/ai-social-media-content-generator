'use client';

import React, { useState, useEffect } from 'react';
import { 
  Modal, 
  Steps, 
  Button, 
  Form, 
  Input, 
  Select, 
  Switch, 
  Alert, 
  Spin, 
  Typography,
  Space,
  Divider,
  message
} from 'antd';
import { 
  CheckCircleOutlined, 
  ExclamationCircleOutlined,
  LinkOutlined,
  SecurityScanOutlined,
  SyncOutlined
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;
const { Option } = Select;

interface ConnectorSetupModalProps {
  visible: boolean;
  connector: any;
  onCancel: () => void;
  onComplete: () => void;
}

interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scopes: string[];
  authUrl: string;
}

const oauthConfigs: Record<string, OAuthConfig> = {
  twitter: {
    clientId: '',
    clientSecret: '',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/twitter/callback`,
    scopes: ['tweet.read', 'tweet.write', 'users.read', 'offline.access'],
    authUrl: 'https://twitter.com/i/oauth2/authorize'
  },
  linkedin: {
    clientId: '',
    clientSecret: '',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/linkedin/callback`,
    scopes: ['r_liteprofile', 'r_emailaddress', 'w_member_social'],
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization'
  },
  facebook: {
    clientId: '',
    clientSecret: '',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/facebook/callback`,
    scopes: ['pages_manage_posts', 'pages_read_engagement', 'pages_show_list'],
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth'
  },
  instagram: {
    clientId: '',
    clientSecret: '',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/instagram/callback`,
    scopes: ['instagram_basic', 'instagram_content_publish', 'pages_show_list'],
    authUrl: 'https://www.facebook.com/v18.0/dialog/oauth'
  },
  youtube: {
    clientId: '',
    clientSecret: '',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/youtube/callback`,
    scopes: ['https://www.googleapis.com/auth/youtube.upload', 'https://www.googleapis.com/auth/youtube.readonly'],
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth'
  },
  tiktok: {
    clientId: '',
    clientSecret: '',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/tiktok/callback`,
    scopes: ['user.info.basic', 'video.list', 'video.upload'],
    authUrl: 'https://www.tiktok.com/v2/auth/authorize'
  },
  pinterest: {
    clientId: '',
    clientSecret: '',
    redirectUri: `${process.env.NEXT_PUBLIC_APP_URL}/api/oauth/pinterest/callback`,
    scopes: ['boards:read', 'boards:write', 'pins:read', 'pins:write'],
    authUrl: 'https://www.pinterest.com/oauth'
  }
};

const steps = [
  {
    title: 'Configure',
    description: 'Set up API credentials'
  },
  {
    title: 'Authenticate',
    description: 'Connect your account'
  },
  {
    title: 'Test',
    description: 'Verify connection'
  }
];

export default function ConnectorSetupModal({ 
  visible, 
  connector, 
  onCancel, 
  onComplete 
}: ConnectorSetupModalProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [oauthUrl, setOauthUrl] = useState('');
  const [testResult, setTestResult] = useState<any>(null);
  const [form] = Form.useForm();

  const oauthConfig = oauthConfigs[connector?.platform] || {};

  useEffect(() => {
    if (visible) {
      setCurrentStep(0);
      setTestResult(null);
      form.resetFields();
    }
  }, [visible, connector, form]);

  const handleStepChange = (step: number) => {
    setCurrentStep(step);
  };

  const handleConfigure = async (values: any) => {
    setLoading(true);
    try {
      const response = await fetch('/api/connectors/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: connector.platform,
          ...values
        })
      });

      if (response.ok) {
        const data = await response.json();
        setOauthUrl(data.oauthUrl);
        setCurrentStep(1);
        message.success('Configuration saved successfully');
      } else {
        throw new Error('Failed to save configuration');
      }
    } catch (error) {
      message.error('Failed to save configuration');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleOAuthRedirect = () => {
    if (oauthUrl) {
      window.open(oauthUrl, '_blank', 'width=600,height=700');
    }
  };

  const handleOAuthCallback = async (code: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/oauth/callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          platform: connector.platform,
          code
        })
      });

      if (response.ok) {
        setCurrentStep(2);
        message.success('Authentication successful');
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      message.error('Authentication failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/connectors/${connector.platform}/test`, {
        method: 'POST'
      });

      if (response.ok) {
        const result = await response.json();
        setTestResult(result);
        if (result.success) {
          message.success('Connection test successful');
        } else {
          message.error('Connection test failed');
        }
      } else {
        throw new Error('Test failed');
      }
    } catch (error) {
      message.error('Connection test failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = () => {
    onComplete();
  };

  const renderConfigureStep = () => (
    <div>
      <Title level={4}>Configure {connector.name} API</Title>
      <Paragraph type="secondary" className="mb-6">
        You'll need to create an app in the {connector.name} developer portal and get your API credentials.
      </Paragraph>

      <Form
        form={form}
        layout="vertical"
        onFinish={handleConfigure}
        initialValues={{
          autoSync: true,
          syncInterval: 'hourly'
        }}
      >
        <Form.Item
          label="Client ID"
          name="clientId"
          rules={[{ required: true, message: 'Please enter your Client ID' }]}
        >
          <Input placeholder="Enter your Client ID" />
        </Form.Item>

        <Form.Item
          label="Client Secret"
          name="clientSecret"
          rules={[{ required: true, message: 'Please enter your Client Secret' }]}
        >
          <Input.Password placeholder="Enter your Client Secret" />
        </Form.Item>

        <Form.Item
          label="Redirect URI"
          name="redirectUri"
          initialValue={oauthConfig.redirectUri}
        >
          <Input disabled />
        </Form.Item>

        <Form.Item
          label="Required Scopes"
          name="scopes"
          initialValue={oauthConfig.scopes}
        >
          <Select mode="multiple" disabled>
            {oauthConfig.scopes?.map((scope: string) => (
              <Option key={scope} value={scope}>{scope}</Option>
            ))}
          </Select>
        </Form.Item>

        <Divider />

        <Form.Item
          label="Auto-sync"
          name="autoSync"
          valuePropName="checked"
        >
          <Switch />
        </Form.Item>

        <Form.Item
          label="Sync Interval"
          name="syncInterval"
        >
          <Select>
            <Option value="hourly">Hourly</Option>
            <Option value="daily">Daily</Option>
            <Option value="weekly">Weekly</Option>
          </Select>
        </Form.Item>

        <Alert
          message="Security Note"
          description="Your API credentials are encrypted and stored securely. We never store your access tokens in plain text."
          type="info"
          showIcon
          icon={<SecurityScanOutlined />}
          className="mb-4"
        />
      </Form>
    </div>
  );

  const renderAuthenticateStep = () => (
    <div>
      <Title level={4}>Connect Your {connector.name} Account</Title>
      <Paragraph type="secondary" className="mb-6">
        Click the button below to authorize our app to access your {connector.name} account.
      </Paragraph>

      <div className="text-center">
        <Button
          type="primary"
          size="large"
          icon={<LinkOutlined />}
          onClick={handleOAuthRedirect}
          loading={loading}
          className="mb-4"
        >
          Connect to {connector.name}
        </Button>

        <Alert
          message="Authorization Required"
          description={`You'll be redirected to ${connector.name} to grant permissions. After authorization, you'll be redirected back to complete the setup.`}
          type="info"
          showIcon
        />

        <div className="mt-4">
          <Text type="secondary">
            <strong>Required Permissions:</strong>
          </Text>
          <ul className="mt-2">
            {oauthConfig.scopes?.map((scope: string) => (
              <li key={scope} className="text-sm text-gray-600">
                {scope}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );

  const renderTestStep = () => (
    <div>
      <Title level={4}>Test Connection</Title>
      <Paragraph type="secondary" className="mb-6">
        Let's verify that your {connector.name} connection is working properly.
      </Paragraph>

      <div className="text-center">
        <Button
          type="primary"
          size="large"
          icon={<SyncOutlined />}
          onClick={handleTestConnection}
          loading={loading}
          className="mb-4"
        >
          Test Connection
        </Button>

        {testResult && (
          <div className="mt-4">
            {testResult.success ? (
              <Alert
                message="Connection Successful"
                description={testResult.message}
                type="success"
                showIcon
                icon={<CheckCircleOutlined />}
              />
            ) : (
              <Alert
                message="Connection Failed"
                description={testResult.message}
                type="error"
                showIcon
                icon={<ExclamationCircleOutlined />}
              />
            )}

            {testResult.details && (
              <div className="mt-4 text-left">
                <Text strong>Test Details:</Text>
                <pre className="mt-2 p-3 bg-gray-100 rounded text-sm overflow-auto">
                  {JSON.stringify(testResult.details, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return renderConfigureStep();
      case 1:
        return renderAuthenticateStep();
      case 2:
        return renderTestStep();
      default:
        return null;
    }
  };

  const canProceed = () => {
    if (currentStep === 0) {
      return form.getFieldsError().every(field => field.errors.length === 0);
    }
    if (currentStep === 1) {
      return oauthUrl;
    }
    if (currentStep === 2) {
      return testResult?.success;
    }
    return false;
  };

  const handleNext = () => {
    if (currentStep === 0) {
      form.submit();
    } else if (currentStep === 1) {
      setCurrentStep(2);
    } else if (currentStep === 2) {
      handleComplete();
    }
  };

  const handleBack = () => {
    setCurrentStep(currentStep - 1);
  };

  return (
    <Modal
      title={`Connect ${connector?.name}`}
      open={visible}
      onCancel={onCancel}
      width={600}
      footer={null}
      destroyOnClose
    >
      <Steps current={currentStep} items={steps} className="mb-6" />

      <div className="min-h-[400px]">
        {renderStepContent()}
      </div>

      <Divider />

      <div className="flex justify-between">
        <Button 
          onClick={currentStep === 0 ? onCancel : handleBack}
          disabled={loading}
        >
          {currentStep === 0 ? 'Cancel' : 'Back'}
        </Button>

        <Space>
          {currentStep < steps.length - 1 && (
            <Button
              type="primary"
              onClick={handleNext}
              loading={loading}
              disabled={!canProceed()}
            >
              Next
            </Button>
          )}

          {currentStep === steps.length - 1 && testResult?.success && (
            <Button
              type="primary"
              onClick={handleComplete}
              loading={loading}
            >
              Complete Setup
            </Button>
          )}
        </Space>
      </div>
    </Modal>
  );
}
