import { test, expect } from '@playwright/test';

test.describe('Complete Workflow E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3000');
    
    // Login with test credentials
    await page.fill('[data-testid="email-input"]', 'admin@demo-agency.com');
    await page.fill('[data-testid="password-input"]', 'demo123');
    await page.click('[data-testid="login-button"]');
    
    // Wait for dashboard to load
    await page.waitForSelector('[data-testid="dashboard"]');
  });

  test('Complete workflow: campaign → brief wizard → multi-platform variants → calendar schedule → publish → analytics', async ({ page }) => {
    // Step 1: Create a new campaign
    await page.click('[data-testid="create-campaign-button"]');
    await page.fill('[data-testid="campaign-name"]', 'E2E Test Campaign');
    await page.fill('[data-testid="campaign-description"]', 'End-to-end test campaign for workflow validation');
    await page.selectOption('[data-testid="campaign-brand"]', 'TechFlow Solutions');
    await page.fill('[data-testid="campaign-budget"]', '10000');
    await page.selectOption('[data-testid="campaign-platforms"]', 'linkedin');
    await page.selectOption('[data-testid="campaign-platforms"]', 'twitter');
    await page.click('[data-testid="save-campaign"]');
    
    // Verify campaign was created
    await expect(page.locator('[data-testid="campaign-success-message"]')).toBeVisible();
    await expect(page.locator('text=E2E Test Campaign')).toBeVisible();

    // Step 2: Create a brief using the wizard
    await page.click('[data-testid="create-brief-button"]');
    await page.click('[data-testid="brief-wizard-start"]');
    
    // Brief wizard step 1: Basic info
    await page.fill('[data-testid="brief-title"]', 'AI Analytics Platform Launch');
    await page.fill('[data-testid="brief-description"]', 'Create engaging content to introduce our new AI-powered analytics platform');
    await page.selectOption('[data-testid="brief-campaign"]', 'E2E Test Campaign');
    await page.click('[data-testid="wizard-next"]');
    
    // Brief wizard step 2: Target audience
    await page.fill('[data-testid="target-role"]', 'Business Decision Makers');
    await page.fill('[data-testid="target-industry"]', 'Technology, Finance, Healthcare');
    await page.fill('[data-testid="pain-points"]', 'data complexity, manual reporting, lack of insights');
    await page.click('[data-testid="wizard-next"]');
    
    // Brief wizard step 3: Content requirements
    await page.selectOption('[data-testid="content-tone"]', 'Professional and innovative');
    await page.fill('[data-testid="key-messages"]', 'AI-powered insights in minutes, not hours');
    await page.fill('[data-testid="key-messages"]', 'No technical expertise required');
    await page.fill('[data-testid="key-messages"]', 'Real-time data visualization');
    await page.fill('[data-testid="call-to-action"]', 'Start your free trial');
    await page.fill('[data-testid="hashtags"]', '#AI, #Analytics, #BusinessIntelligence');
    await page.click('[data-testid="wizard-next"]');
    
    // Brief wizard step 4: Platforms and variants
    await page.check('[data-testid="platform-linkedin"]');
    await page.check('[data-testid="platform-twitter"]');
    await page.fill('[data-testid="variants-per-platform"]', '3');
    await page.click('[data-testid="wizard-next"]');
    
    // Brief wizard step 5: Review and create
    await page.click('[data-testid="create-brief"]');
    
    // Verify brief was created
    await expect(page.locator('[data-testid="brief-success-message"]')).toBeVisible();
    await expect(page.locator('text=AI Analytics Platform Launch')).toBeVisible();

    // Step 3: Generate multi-platform variants
    await page.click('[data-testid="generate-variants-button"]');
    await page.waitForSelector('[data-testid="generation-progress"]');
    await page.waitForSelector('[data-testid="generation-complete"]', { timeout: 60000 });
    
    // Verify variants were generated
    await expect(page.locator('[data-testid="variant-card"]')).toHaveCount(6); // 2 platforms × 3 variants
    await expect(page.locator('[data-testid="platform-linkedin"]')).toBeVisible();
    await expect(page.locator('[data-testid="platform-twitter"]')).toBeVisible();

    // Step 4: Review and edit variants
    // Select the first LinkedIn variant
    await page.click('[data-testid="variant-card"]:first-child');
    await page.click('[data-testid="edit-variant"]');
    
    // Edit the content
    await page.fill('[data-testid="variant-content"]', '🚀 Exciting news! We\'re launching our AI-powered analytics platform that transforms how businesses make data-driven decisions. Ready to unlock your data\'s potential? Start your free trial today! #AI #Analytics #BusinessIntelligence');
    await page.click('[data-testid="save-variant"]');
    
    // Verify edit was saved
    await expect(page.locator('[data-testid="edit-success-message"]')).toBeVisible();

    // Step 5: Schedule posts in calendar
    await page.click('[data-testid="calendar-tab"]');
    await page.waitForSelector('[data-testid="calendar-view"]');
    
    // Drag and drop variants to calendar slots
    const firstVariant = page.locator('[data-testid="variant-card"]:first-child');
    const calendarSlot = page.locator('[data-testid="calendar-slot"]:first-child');
    
    await firstVariant.dragTo(calendarSlot);
    await page.waitForSelector('[data-testid="schedule-dialog"]');
    
    // Set schedule time
    await page.fill('[data-testid="schedule-time"]', '10:00');
    await page.selectOption('[data-testid="schedule-date"]', '2024-12-20');
    await page.click('[data-testid="confirm-schedule"]');
    
    // Verify scheduling
    await expect(page.locator('[data-testid="schedule-success-message"]')).toBeVisible();

    // Step 6: Publish posts (sandbox mode)
    await page.click('[data-testid="publish-tab"]');
    await page.waitForSelector('[data-testid="publish-queue"]');
    
    // Select posts for publishing
    await page.check('[data-testid="select-post"]:first-child');
    await page.click('[data-testid="publish-selected"]');
    
    // Configure publish settings
    await page.check('[data-testid="sandbox-mode"]');
    await page.check('[data-testid="include-disclosure"]');
    await page.click('[data-testid="confirm-publish"]');
    
    // Wait for publishing to complete
    await page.waitForSelector('[data-testid="publish-progress"]');
    await page.waitForSelector('[data-testid="publish-complete"]', { timeout: 30000 });
    
    // Verify publishing
    await expect(page.locator('[data-testid="publish-success-message"]')).toBeVisible();

    // Step 7: View analytics
    await page.click('[data-testid="analytics-tab"]');
    await page.waitForSelector('[data-testid="analytics-dashboard"]');
    
    // Wait for metrics to load
    await page.waitForSelector('[data-testid="engagement-metrics"]');
    await page.waitForSelector('[data-testid="reach-metrics"]');
    await page.waitForSelector('[data-testid="click-metrics"]');
    
    // Verify analytics data
    await expect(page.locator('[data-testid="total-posts"]')).toContainText('6');
    await expect(page.locator('[data-testid="total-engagement"]')).toBeVisible();
    await expect(page.locator('[data-testid="engagement-rate"]')).toBeVisible();
    await expect(page.locator('[data-testid="click-through-rate"]')).toBeVisible();
    
    // Verify platform breakdown
    await expect(page.locator('[data-testid="platform-breakdown"]')).toBeVisible();
    await expect(page.locator('[data-testid="linkedin-stats"]')).toBeVisible();
    await expect(page.locator('[data-testid="twitter-stats"]')).toBeVisible();
  });

  test('Workflow with policy violations and review process', async ({ page }) => {
    // Create campaign
    await page.click('[data-testid="create-campaign-button"]');
    await page.fill('[data-testid="campaign-name"]', 'Policy Test Campaign');
    await page.fill('[data-testid="campaign-description"]', 'Campaign to test policy violation handling');
    await page.selectOption('[data-testid="campaign-brand"]', 'TechFlow Solutions');
    await page.click('[data-testid="save-campaign"]');

    // Create brief with potentially problematic content
    await page.click('[data-testid="create-brief-button"]');
    await page.click('[data-testid="brief-wizard-start"]');
    
    await page.fill('[data-testid="brief-title"]', 'Get Rich Quick Scheme');
    await page.fill('[data-testid="brief-description"]', 'Amazing opportunity to make money fast!');
    await page.selectOption('[data-testid="brief-campaign"]', 'Policy Test Campaign');
    await page.click('[data-testid="wizard-next"]');
    
    await page.fill('[data-testid="target-role"]', 'General Audience');
    await page.fill('[data-testid="target-industry"]', 'Various');
    await page.click('[data-testid="wizard-next"]');
    
    await page.selectOption('[data-testid="content-tone"]', 'Exciting and urgent');
    await page.fill('[data-testid="key-messages"]', 'Limited time offer!');
    await page.fill('[data-testid="key-messages"]', 'Get rich quick!');
    await page.fill('[data-testid="key-messages"]', 'Amazing opportunity!');
    await page.fill('[data-testid="call-to-action"]', 'Click now!');
    await page.click('[data-testid="wizard-next"]');
    
    await page.check('[data-testid="platform-linkedin"]');
    await page.fill('[data-testid="variants-per-platform"]', '1');
    await page.click('[data-testid="wizard-next"]');
    
    await page.click('[data-testid="create-brief"]');

    // Generate variants
    await page.click('[data-testid="generate-variants-button"]');
    await page.waitForSelector('[data-testid="generation-complete"]', { timeout: 60000 });

    // Check for policy violations
    await expect(page.locator('[data-testid="policy-violation-warning"]')).toBeVisible();
    await expect(page.locator('[data-testid="review-required-badge"]')).toBeVisible();

    // Review and approve with modifications
    await page.click('[data-testid="review-variant"]');
    await page.waitForSelector('[data-testid="review-dialog"]');
    
    // View policy violations
    await page.click('[data-testid="view-violations"]');
    await expect(page.locator('[data-testid="violation-list"]')).toBeVisible();
    await expect(page.locator('text=get rich quick')).toBeVisible();
    await expect(page.locator('text=amazing opportunity')).toBeVisible();

    // Edit to fix violations
    await page.click('[data-testid="edit-variant"]');
    await page.fill('[data-testid="variant-content"]', 'Transform your business with our innovative AI analytics platform. Start your free trial today! #AI #Analytics #BusinessIntelligence');
    await page.click('[data-testid="save-variant"]');

    // Re-check policy compliance
    await page.click('[data-testid="check-policy"]');
    await expect(page.locator('[data-testid="policy-compliant"]')).toBeVisible();
    await expect(page.locator('[data-testid="policy-violation-warning"]')).not.toBeVisible();

    // Approve for publishing
    await page.click('[data-testid="approve-variant"]');
    await expect(page.locator('[data-testid="approval-success"]')).toBeVisible();
  });

  test('Workflow with scheduling conflicts and resolution', async ({ page }) => {
    // Create campaign
    await page.click('[data-testid="create-campaign-button"]');
    await page.fill('[data-testid="campaign-name"]', 'Scheduling Test Campaign');
    await page.fill('[data-testid="campaign-description"]', 'Campaign to test scheduling conflict handling');
    await page.selectOption('[data-testid="campaign-brand"]', 'TechFlow Solutions');
    await page.click('[data-testid="save-campaign"]');

    // Create brief
    await page.click('[data-testid="create-brief-button"]');
    await page.click('[data-testid="brief-wizard-start"]');
    
    await page.fill('[data-testid="brief-title"]', 'Test Scheduling Conflict');
    await page.fill('[data-testid="brief-description"]', 'Testing scheduling conflict resolution');
    await page.selectOption('[data-testid="brief-campaign"]', 'Scheduling Test Campaign');
    await page.click('[data-testid="wizard-next"]');
    
    await page.fill('[data-testid="target-role"]', 'Test Audience');
    await page.fill('[data-testid="target-industry"]', 'Technology');
    await page.click('[data-testid="wizard-next"]');
    
    await page.selectOption('[data-testid="content-tone"]', 'Professional');
    await page.fill('[data-testid="key-messages"]', 'Test message');
    await page.fill('[data-testid="call-to-action"]', 'Test CTA');
    await page.click('[data-testid="wizard-next"]');
    
    await page.check('[data-testid="platform-linkedin"]');
    await page.fill('[data-testid="variants-per-platform"]', '2');
    await page.click('[data-testid="wizard-next"]');
    
    await page.click('[data-testid="create-brief"]');

    // Generate variants
    await page.click('[data-testid="generate-variants-button"]');
    await page.waitForSelector('[data-testid="generation-complete"]', { timeout: 60000 });

    // Schedule posts
    await page.click('[data-testid="calendar-tab"]');
    await page.waitForSelector('[data-testid="calendar-view"]');
    
    // Schedule first post
    const firstVariant = page.locator('[data-testid="variant-card"]:first-child');
    const firstSlot = page.locator('[data-testid="calendar-slot"]:first-child');
    await firstVariant.dragTo(firstSlot);
    await page.waitForSelector('[data-testid="schedule-dialog"]');
    await page.fill('[data-testid="schedule-time"]', '10:00');
    await page.selectOption('[data-testid="schedule-date"]', '2024-12-20');
    await page.click('[data-testid="confirm-schedule"]');
    
    // Try to schedule second post at same time (conflict)
    const secondVariant = page.locator('[data-testid="variant-card"]:nth-child(2)');
    const secondSlot = page.locator('[data-testid="calendar-slot"]:first-child');
    await secondVariant.dragTo(secondSlot);
    await page.waitForSelector('[data-testid="schedule-dialog"]');
    await page.fill('[data-testid="schedule-time"]', '10:00');
    await page.selectOption('[data-testid="schedule-date"]', '2024-12-20');
    await page.click('[data-testid="confirm-schedule"]');
    
    // Check for conflict warning
    await expect(page.locator('[data-testid="scheduling-conflict-warning"]')).toBeVisible();
    await expect(page.locator('[data-testid="conflict-details"]')).toBeVisible();
    
    // Resolve conflict by choosing different time
    await page.fill('[data-testid="schedule-time"]', '14:00');
    await page.click('[data-testid="confirm-schedule"]');
    
    // Verify both posts are scheduled
    await expect(page.locator('[data-testid="scheduled-post"]')).toHaveCount(2);
  });

  test('Workflow with brand compliance issues and suggestions', async ({ page }) => {
    // Create campaign
    await page.click('[data-testid="create-campaign-button"]');
    await page.fill('[data-testid="campaign-name"]', 'Brand Compliance Test');
    await page.fill('[data-testid="campaign-description"]', 'Campaign to test brand compliance handling');
    await page.selectOption('[data-testid="campaign-brand"]', 'TechFlow Solutions');
    await page.click('[data-testid="save-campaign"]');

    // Create brief with casual language
    await page.click('[data-testid="create-brief-button"]');
    await page.click('[data-testid="brief-wizard-start"]');
    
    await page.fill('[data-testid="brief-title"]', 'Casual AI Platform');
    await page.fill('[data-testid="brief-description"]', 'Our totally awesome AI thingy');
    await page.selectOption('[data-testid="brief-campaign"]', 'Brand Compliance Test');
    await page.click('[data-testid="wizard-next"]');
    
    await page.fill('[data-testid="target-role"]', 'General Users');
    await page.fill('[data-testid="target-industry"]', 'Technology');
    await page.click('[data-testid="wizard-next"]');
    
    await page.selectOption('[data-testid="content-tone"]', 'Casual and fun');
    await page.fill('[data-testid="key-messages"]', 'Our AI thingy is super cool');
    await page.fill('[data-testid="key-messages"]', 'You\'ll love it!');
    await page.fill('[data-testid="key-messages"]', 'It\'s totally amazing');
    await page.fill('[data-testid="call-to-action"]', 'Try it out!');
    await page.click('[data-testid="wizard-next"]');
    
    await page.check('[data-testid="platform-linkedin"]');
    await page.fill('[data-testid="variants-per-platform"]', '1');
    await page.click('[data-testid="wizard-next"]');
    
    await page.click('[data-testid="create-brief"]');

    // Generate variants
    await page.click('[data-testid="generate-variants-button"]');
    await page.waitForSelector('[data-testid="generation-complete"]', { timeout: 60000 });

    // Check brand compliance
    await page.click('[data-testid="check-brand-compliance"]');
    await page.waitForSelector('[data-testid="compliance-dialog"]');
    
    // View compliance issues
    await expect(page.locator('[data-testid="compliance-score"]')).toContainText(/[0-9]+/);
    await expect(page.locator('[data-testid="compliance-issues"]')).toBeVisible();
    await expect(page.locator('text=casual language')).toBeVisible();
    await expect(page.locator('text=unrealistic promises')).toBeVisible();

    // View suggestions
    await page.click('[data-testid="view-suggestions"]');
    await expect(page.locator('[data-testid="improvement-suggestions"]')).toBeVisible();
    await expect(page.locator('text=Consider using more professional language')).toBeVisible();
    await expect(page.locator('text=Focus on specific business benefits')).toBeVisible();

    // Apply suggestions
    await page.click('[data-testid="apply-suggestion"]:first-child');
    await page.waitForSelector('[data-testid="content-updated"]');
    
    // Re-check compliance
    await page.click('[data-testid="recheck-compliance"]');
    await expect(page.locator('[data-testid="compliance-score"]')).toContainText(/[7-9][0-9]/);
    await expect(page.locator('[data-testid="compliance-passed"]')).toBeVisible();
  });

  test('Workflow performance and responsiveness', async ({ page }) => {
    const startTime = Date.now();
    
    // Create campaign
    await page.click('[data-testid="create-campaign-button"]');
    await page.fill('[data-testid="campaign-name"]', 'Performance Test Campaign');
    await page.fill('[data-testid="campaign-description"]', 'Campaign to test workflow performance');
    await page.selectOption('[data-testid="campaign-brand"]', 'TechFlow Solutions');
    await page.click('[data-testid="save-campaign"]');

    // Create brief
    await page.click('[data-testid="create-brief-button"]');
    await page.click('[data-testid="brief-wizard-start"]');
    
    await page.fill('[data-testid="brief-title"]', 'Performance Test Brief');
    await page.fill('[data-testid="brief-description"]', 'Testing workflow performance');
    await page.selectOption('[data-testid="brief-campaign"]', 'Performance Test Campaign');
    await page.click('[data-testid="wizard-next"]');
    
    await page.fill('[data-testid="target-role"]', 'Test');
    await page.fill('[data-testid="target-industry"]', 'Test');
    await page.click('[data-testid="wizard-next"]');
    
    await page.selectOption('[data-testid="content-tone"]', 'Professional');
    await page.fill('[data-testid="key-messages"]', 'Test');
    await page.fill('[data-testid="call-to-action"]', 'Test');
    await page.click('[data-testid="wizard-next"]');
    
    await page.check('[data-testid="platform-linkedin"]');
    await page.fill('[data-testid="variants-per-platform"]', '1');
    await page.click('[data-testid="wizard-next"]');
    
    await page.click('[data-testid="create-brief"]');

    // Generate variants
    await page.click('[data-testid="generate-variants-button"]');
    await page.waitForSelector('[data-testid="generation-complete"]', { timeout: 60000 });

    // Schedule post
    await page.click('[data-testid="calendar-tab"]');
    await page.waitForSelector('[data-testid="calendar-view"]');
    
    const variant = page.locator('[data-testid="variant-card"]:first-child');
    const slot = page.locator('[data-testid="calendar-slot"]:first-child');
    await variant.dragTo(slot);
    await page.waitForSelector('[data-testid="schedule-dialog"]');
    await page.fill('[data-testid="schedule-time"]', '10:00');
    await page.selectOption('[data-testid="schedule-date"]', '2024-12-20');
    await page.click('[data-testid="confirm-schedule"]');

    // Publish post
    await page.click('[data-testid="publish-tab"]');
    await page.waitForSelector('[data-testid="publish-queue"]');
    await page.check('[data-testid="select-post"]:first-child');
    await page.click('[data-testid="publish-selected"]');
    await page.check('[data-testid="sandbox-mode"]');
    await page.click('[data-testid="confirm-publish"]');
    await page.waitForSelector('[data-testid="publish-complete"]', { timeout: 30000 });

    // View analytics
    await page.click('[data-testid="analytics-tab"]');
    await page.waitForSelector('[data-testid="analytics-dashboard"]');
    await page.waitForSelector('[data-testid="engagement-metrics"]');

    const endTime = Date.now();
    const duration = endTime - startTime;
    
    // Should complete within 2 minutes
    expect(duration).toBeLessThan(120000);
  });
});
