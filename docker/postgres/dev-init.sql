-- Development database initialization
-- This script creates sample data for development

-- Insert sample organization
INSERT INTO organizations (id, name, slug) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'Demo Organization', 'demo-org')
ON CONFLICT (id) DO NOTHING;

-- Insert sample user
INSERT INTO users (id, email, password_hash, first_name, last_name, is_active, email_verified) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'demo@example.com', '$2b$10$dummy.hash.for.dev.purposes.only', 'Demo', 'User', true, true)
ON CONFLICT (id) DO NOTHING;

-- Insert membership
INSERT INTO memberships (organization_id, user_id, role) VALUES
('550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440001', 'owner')
ON CONFLICT (organization_id, user_id) DO NOTHING;

-- Insert sample brand
INSERT INTO brands (id, organization_id, name, colors, fonts, guidelines) VALUES
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440000', 'Demo Brand', ARRAY['#3B82F6', '#1E40AF', '#FFFFFF'], ARRAY['Inter', 'Arial'], 'Professional and modern tone for B2B SaaS')
ON CONFLICT (id) DO NOTHING;

-- Insert sample campaign
INSERT INTO campaigns (id, organization_id, brand_id, name, description) VALUES
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440002', 'Q1 Product Launch', 'Launch campaign for new AI features')
ON CONFLICT (id) DO NOTHING;

-- Insert sample brief
INSERT INTO briefs (id, campaign_id, topic, audience, tone, platforms, languages) VALUES
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440003', 'AI Content Generation', 'SaaS companies and marketers', 'professional', ARRAY['linkedin', 'twitter'], ARRAY['en'])
ON CONFLICT (id) DO NOTHING;

-- Insert sample post
INSERT INTO posts (id, brief_id, status) VALUES
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440004', 'draft')
ON CONFLICT (id) DO NOTHING;

-- Insert sample variants
INSERT INTO variants (id, post_id, platform, content, language, hashtags, score) VALUES
('550e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440005', 'linkedin', 'Excited to announce our new AI-powered content generation platform! 🚀 #AI #ContentMarketing #SaaS', 'en', ARRAY['AI', 'ContentMarketing', 'SaaS'], '{"brandFit": 0.9, "readability": 0.85, "policyRisk": 0.1, "overall": 0.85}'),
('550e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440005', 'twitter', 'Just launched: AI content generator for social media! Create platform-optimized posts in seconds ✨ #AI #SocialMedia #Tech', 'en', ARRAY['AI', 'SocialMedia', 'Tech'], '{"brandFit": 0.88, "readability": 0.9, "policyRisk": 0.05, "overall": 0.88}')
ON CONFLICT (id) DO NOTHING;

-- Insert sample connector
INSERT INTO connectors (id, brand_id, platform, config, enabled) VALUES
('550e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440002', 'twitter', '{"api_key": "demo_key", "api_secret": "demo_secret", "access_token": "demo_token", "access_token_secret": "demo_token_secret"}', true)
ON CONFLICT (id) DO NOTHING;

RAISE NOTICE 'Development data inserted successfully';
