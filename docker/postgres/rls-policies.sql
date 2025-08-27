-- Row Level Security (RLS) Policies for Multi-Tenant Isolation
-- This ensures users can only access data from their organizations

-- Enable RLS on all tenant-scoped tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_models ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE briefs ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE connectors ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Create a function to get current user's organization IDs
CREATE OR REPLACE FUNCTION current_user_orgs()
RETURNS UUID[] AS $$
BEGIN
    -- In a real application, this would get the current user from session/auth context
    -- For now, we'll return an empty array - this should be replaced with proper auth
    RETURN ARRAY[]::UUID[];
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Organizations RLS Policies
CREATE POLICY organizations_owner ON organizations
    FOR ALL USING (
        id IN (SELECT organization_id FROM memberships WHERE user_id = current_user_id())
    );

CREATE POLICY organizations_admin ON organizations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM memberships m
            WHERE m.organization_id = organizations.id
            AND m.user_id = current_user_id()
            AND m.role IN ('owner', 'admin')
        )
    );

-- Memberships RLS Policies
CREATE POLICY memberships_access ON memberships
    FOR ALL USING (
        organization_id IN (SELECT unnest(current_user_orgs()))
    );

-- Brands RLS Policies
CREATE POLICY brands_access ON brands
    FOR ALL USING (
        organization_id IN (SELECT unnest(current_user_orgs()))
    );

-- Voice Models RLS Policies
CREATE POLICY voice_models_access ON voice_models
    FOR ALL USING (
        brand_id IN (
            SELECT b.id FROM brands b
            WHERE b.organization_id IN (SELECT unnest(current_user_orgs()))
        )
    );

-- Campaigns RLS Policies
CREATE POLICY campaigns_access ON campaigns
    FOR ALL USING (
        organization_id IN (SELECT unnest(current_user_orgs()))
    );

-- Briefs RLS Policies
CREATE POLICY briefs_access ON briefs
    FOR ALL USING (
        campaign_id IN (
            SELECT c.id FROM campaigns c
            WHERE c.organization_id IN (SELECT unnest(current_user_orgs()))
        )
    );

-- Posts RLS Policies
CREATE POLICY posts_access ON posts
    FOR ALL USING (
        brief_id IN (
            SELECT b.id FROM briefs b
            JOIN campaigns c ON b.campaign_id = c.id
            WHERE c.organization_id IN (SELECT unnest(current_user_orgs()))
        )
    );

-- Variants RLS Policies
CREATE POLICY variants_access ON variants
    FOR ALL USING (
        post_id IN (
            SELECT p.id FROM posts p
            JOIN briefs b ON p.brief_id = b.id
            JOIN campaigns c ON b.campaign_id = c.id
            WHERE c.organization_id IN (SELECT unnest(current_user_orgs()))
        )
    );

-- Connectors RLS Policies
CREATE POLICY connectors_access ON connectors
    FOR ALL USING (
        brand_id IN (
            SELECT b.id FROM brands b
            WHERE b.organization_id IN (SELECT unnest(current_user_orgs()))
        )
    );

-- Assets RLS Policies
CREATE POLICY assets_access ON assets
    FOR ALL USING (
        organization_id IN (SELECT unnest(current_user_orgs()))
    );

-- Experiments RLS Policies
CREATE POLICY experiments_access ON experiments
    FOR ALL USING (
        organization_id IN (SELECT unnest(current_user_orgs()))
    );

-- Metrics RLS Policies
CREATE POLICY metrics_access ON metrics
    FOR ALL USING (
        post_id IN (
            SELECT p.id FROM posts p
            JOIN briefs b ON p.brief_id = b.id
            JOIN campaigns c ON b.campaign_id = c.id
            WHERE c.organization_id IN (SELECT unnest(current_user_orgs()))
        )
        OR
        experiment_id IN (
            SELECT e.id FROM experiments e
            WHERE e.organization_id IN (SELECT unnest(current_user_orgs()))
        )
    );

-- Audit Log RLS Policies
CREATE POLICY audit_log_access ON audit_log
    FOR ALL USING (
        organization_id IN (SELECT unnest(current_user_orgs()))
        OR user_id = current_user_id()
    );

-- Comments RLS Policies
CREATE POLICY comments_access ON comments
    FOR ALL USING (
        post_id IN (
            SELECT p.id FROM posts p
            JOIN briefs b ON p.brief_id = b.id
            JOIN campaigns c ON b.campaign_id = c.id
            WHERE c.organization_id IN (SELECT unnest(current_user_orgs()))
        )
    );

-- Users table - allow users to see their own data and users in their orgs
CREATE POLICY users_own_data ON users
    FOR ALL USING (id = current_user_id());

CREATE POLICY users_org_members ON users
    FOR SELECT USING (
        id IN (
            SELECT m.user_id FROM memberships m
            WHERE m.organization_id IN (SELECT unnest(current_user_orgs()))
        )
    );

-- Enable RLS on users table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Note: current_user_id() and current_user_orgs() functions need to be implemented
-- based on your authentication system (JWT, session, etc.)
-- This is a placeholder implementation for development

-- Create placeholder functions (to be replaced with real auth)
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
BEGIN
    -- Placeholder: in production, extract from JWT/session
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
