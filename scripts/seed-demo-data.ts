#!/usr/bin/env ts-node

import { NestFactory } from '@nestjs/core';
import { AppModule } from '../apps/api/src/app.module';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization } from '../apps/api/src/organizations/entities/organization.entity';
import { User } from '../apps/api/src/users/entities/user.entity';
import { Brand } from '../apps/api/src/brands/entities/brand.entity';
import { Campaign } from '../apps/api/src/campaigns/entities/campaign.entity';
import { Brief } from '../apps/api/src/briefs/entities/brief.entity';
import { Post } from '../apps/api/src/posts/entities/post.entity';
import { UserRole } from '../apps/api/src/users/entities/user.entity';
import { faker } from '@faker-js/faker';

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  console.log('🌱 Starting demo data seeding...');

  try {
    // Get repositories
    const organizationRepo = app.get<Repository<Organization>>(getRepositoryToken(Organization));
    const userRepo = app.get<Repository<User>>(getRepositoryToken(User));
    const brandRepo = app.get<Repository<Brand>>(getRepositoryToken(Brand));
    const campaignRepo = app.get<Repository<Campaign>>(getRepositoryToken(Campaign));
    const briefRepo = app.get<Repository<Brief>>(getRepositoryToken(Brief));
    const postRepo = app.get<Repository<Post>>(getRepositoryToken(Post));

    // Create demo organization
    console.log('📋 Creating demo organization...');
    const demoOrg = organizationRepo.create({
      name: 'Demo Marketing Agency',
      slug: 'demo-marketing-agency',
      description: 'A demo marketing agency showcasing AI-powered content generation',
      website: 'https://demo-marketing-agency.com',
      industry: 'Marketing & Advertising',
      size: '50-100',
      isActive: true,
      settings: {
        timezone: 'America/New_York',
        dateFormat: 'MM/DD/YYYY',
        currency: 'USD',
        language: 'en',
      },
    });
    await organizationRepo.save(demoOrg);

    // Create demo users
    console.log('👥 Creating demo users...');
    const users = [
      {
        email: 'admin@demo-agency.com',
        firstName: 'Sarah',
        lastName: 'Johnson',
        role: UserRole.ADMIN,
        isActive: true,
      },
      {
        email: 'manager@demo-agency.com',
        firstName: 'Michael',
        lastName: 'Chen',
        role: UserRole.MANAGER,
        isActive: true,
      },
      {
        email: 'editor@demo-agency.com',
        firstName: 'Emily',
        lastName: 'Davis',
        role: UserRole.EDITOR,
        isActive: true,
      },
      {
        email: 'reviewer@demo-agency.com',
        firstName: 'David',
        lastName: 'Wilson',
        role: UserRole.REVIEWER,
        isActive: true,
      },
      {
        email: 'viewer@demo-agency.com',
        firstName: 'Lisa',
        lastName: 'Brown',
        role: UserRole.VIEWER,
        isActive: true,
      },
    ];

    const createdUsers = [];
    for (const userData of users) {
      const user = userRepo.create({
        ...userData,
        organizationId: demoOrg.id,
        password: '$2b$10$demo.password.hash', // In real app, use proper hashing
        emailVerified: true,
        lastLoginAt: new Date(),
      });
      createdUsers.push(await userRepo.save(user));
    }

    // Create demo brands
    console.log('🏢 Creating demo brands...');
    const brands = [
      {
        name: 'TechFlow Solutions',
        description: 'Innovative software solutions for modern businesses',
        industry: 'Technology',
        colors: {
          primary: '#2563eb',
          secondary: '#1e40af',
          accent: '#3b82f6',
        },
        fonts: {
          primary: 'Inter',
          secondary: 'Roboto',
        },
        guidelines: {
          tone: 'Professional yet approachable',
          voice: 'Innovative, reliable, customer-focused',
          do: [
            'Use technical terms appropriately',
            'Focus on business benefits',
            'Include clear calls-to-action',
          ],
          dont: [
            'Use overly casual language',
            'Make unrealistic promises',
            'Ignore target audience',
          ],
        },
      },
      {
        name: 'GreenEats',
        description: 'Sustainable and healthy food delivery service',
        industry: 'Food & Beverage',
        colors: {
          primary: '#059669',
          secondary: '#047857',
          accent: '#10b981',
        },
        fonts: {
          primary: 'Poppins',
          secondary: 'Open Sans',
        },
        guidelines: {
          tone: 'Fresh and energetic',
          voice: 'Healthy, sustainable, community-focused',
          do: [
            'Emphasize sustainability',
            'Use food-related imagery',
            'Highlight health benefits',
          ],
          dont: [
            'Use processed food imagery',
            'Ignore environmental impact',
            'Make health claims without evidence',
          ],
        },
      },
      {
        name: 'FitLife Gym',
        description: 'Premium fitness and wellness center',
        industry: 'Health & Fitness',
        colors: {
          primary: '#dc2626',
          secondary: '#b91c1c',
          accent: '#ef4444',
        },
        fonts: {
          primary: 'Montserrat',
          secondary: 'Lato',
        },
        guidelines: {
          tone: 'Motivational and inspiring',
          voice: 'Energetic, supportive, results-driven',
          do: [
            'Use motivational language',
            'Show real transformation stories',
            'Highlight community aspect',
          ],
          dont: [
            'Use before/after without context',
            'Make unrealistic fitness promises',
            'Exclude diverse body types',
          ],
        },
      },
    ];

    const createdBrands = [];
    for (const brandData of brands) {
      const brand = brandRepo.create({
        ...brandData,
        organizationId: demoOrg.id,
        isActive: true,
        createdBy: createdUsers[0].id,
      });
      createdBrands.push(await brandRepo.save(brand));
    }

    // Create demo campaigns
    console.log('📢 Creating demo campaigns...');
    const campaigns = [
      {
        name: 'TechFlow Q4 Product Launch',
        description: 'Launch campaign for our new AI-powered analytics platform',
        brandId: createdBrands[0].id,
        startDate: new Date('2024-10-01'),
        endDate: new Date('2024-12-31'),
        budget: 50000,
        targetAudience: {
          demographics: {
            age: ['25-45'],
            gender: ['all'],
            location: ['United States', 'Canada'],
            income: ['50000-150000'],
          },
          interests: ['technology', 'business', 'analytics'],
          behaviors: ['early adopters', 'decision makers'],
        },
        goals: {
          awareness: 100000,
          engagement: 5000,
          conversions: 500,
          revenue: 250000,
        },
        platforms: ['linkedin', 'twitter', 'facebook'],
        status: 'active',
      },
      {
        name: 'GreenEats Summer Sustainability',
        description: 'Promoting our eco-friendly packaging and local sourcing',
        brandId: createdBrands[1].id,
        startDate: new Date('2024-06-01'),
        endDate: new Date('2024-08-31'),
        budget: 30000,
        targetAudience: {
          demographics: {
            age: ['18-40'],
            gender: ['all'],
            location: ['United States'],
            income: ['30000-80000'],
          },
          interests: ['sustainability', 'healthy eating', 'environment'],
          behaviors: ['health conscious', 'environmentally aware'],
        },
        goals: {
          awareness: 75000,
          engagement: 3000,
          conversions: 300,
          revenue: 150000,
        },
        platforms: ['instagram', 'tiktok', 'facebook'],
        status: 'active',
      },
      {
        name: 'FitLife New Year Resolution',
        description: 'New Year fitness challenge and membership drive',
        brandId: createdBrands[2].id,
        startDate: new Date('2024-12-15'),
        endDate: new Date('2025-02-28'),
        budget: 40000,
        targetAudience: {
          demographics: {
            age: ['18-50'],
            gender: ['all'],
            location: ['United States'],
            income: ['40000-100000'],
          },
          interests: ['fitness', 'health', 'wellness'],
          behaviors: ['goal setters', 'fitness enthusiasts'],
        },
        goals: {
          awareness: 120000,
          engagement: 6000,
          conversions: 800,
          revenue: 200000,
        },
        platforms: ['instagram', 'youtube', 'facebook'],
        status: 'planning',
      },
    ];

    const createdCampaigns = [];
    for (const campaignData of campaigns) {
      const campaign = campaignRepo.create({
        ...campaignData,
        organizationId: demoOrg.id,
        createdBy: createdUsers[0].id,
      });
      createdCampaigns.push(await campaignRepo.save(campaign));
    }

    // Create demo briefs
    console.log('📝 Creating demo briefs...');
    const briefs = [
      {
        title: 'TechFlow Analytics Platform Launch',
        description: 'Create engaging content to introduce our new AI-powered analytics platform',
        campaignId: createdCampaigns[0].id,
        brandId: createdBrands[0].id,
        targetAudience: {
          role: 'Business Decision Makers',
          industry: 'Technology, Finance, Healthcare',
          painPoints: ['data complexity', 'manual reporting', 'lack of insights'],
        },
        contentRequirements: {
          tone: 'Professional and innovative',
          keyMessages: [
            'AI-powered insights in minutes, not hours',
            'No technical expertise required',
            'Real-time data visualization',
          ],
          callToAction: 'Start your free trial',
          hashtags: ['#AI', '#Analytics', '#BusinessIntelligence'],
        },
        platforms: ['linkedin', 'twitter'],
        variantsPerPlatform: 3,
        status: 'approved',
      },
      {
        title: 'GreenEats Eco-Friendly Packaging',
        description: 'Highlight our commitment to sustainability with new eco-friendly packaging',
        campaignId: createdCampaigns[1].id,
        brandId: createdBrands[1].id,
        targetAudience: {
          role: 'Environmentally Conscious Consumers',
          industry: 'Food & Beverage',
          painPoints: ['plastic waste', 'environmental impact', 'sustainability'],
        },
        contentRequirements: {
          tone: 'Fresh and inspiring',
          keyMessages: [
            '100% biodegradable packaging',
            'Supporting local farmers',
            'Reducing carbon footprint',
          ],
          callToAction: 'Order sustainable meals',
          hashtags: ['#Sustainability', '#EcoFriendly', '#LocalFood'],
        },
        platforms: ['instagram', 'tiktok'],
        variantsPerPlatform: 4,
        status: 'approved',
      },
      {
        title: 'FitLife 30-Day Challenge',
        description: 'Motivate people to join our 30-day fitness challenge',
        campaignId: createdCampaigns[2].id,
        brandId: createdBrands[2].id,
        targetAudience: {
          role: 'Fitness Enthusiasts',
          industry: 'Health & Fitness',
          painPoints: ['lack of motivation', 'no community support', 'unclear goals'],
        },
        contentRequirements: {
          tone: 'Motivational and supportive',
          keyMessages: [
            'Join our supportive community',
            'Achieve your fitness goals',
            '30-day transformation challenge',
          ],
          callToAction: 'Join the challenge',
          hashtags: ['#FitnessChallenge', '#Transformation', '#FitLife'],
        },
        platforms: ['instagram', 'youtube'],
        variantsPerPlatform: 5,
        status: 'draft',
      },
    ];

    const createdBriefs = [];
    for (const briefData of briefs) {
      const brief = briefRepo.create({
        ...briefData,
        organizationId: demoOrg.id,
        createdBy: createdUsers[0].id,
      });
      createdBriefs.push(await briefRepo.save(brief));
    }

    // Create demo posts with generated content
    console.log('📱 Creating demo posts...');
    const postTemplates = [
      {
        platform: 'linkedin',
        content: `🚀 Exciting news! We're launching our AI-powered analytics platform that transforms how businesses make data-driven decisions.

🔍 Key features:
• Real-time insights in minutes
• No technical expertise required
• Beautiful data visualizations
• Seamless integration

Ready to unlock your data's potential? Start your free trial today!

#AI #Analytics #BusinessIntelligence #DataDriven #Innovation`,
        mediaType: 'image',
        status: 'scheduled',
        scheduledAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
      },
      {
        platform: 'twitter',
        content: `Just launched: AI analytics that actually make sense! 📊

No more staring at spreadsheets for hours. Get actionable insights in minutes.

Try it free: [link]

#AI #Analytics #ProductLaunch`,
        mediaType: 'text',
        status: 'published',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      },
      {
        platform: 'instagram',
        content: `🌱 Making sustainability delicious! 

Our new eco-friendly packaging is 100% biodegradable and supports local farmers. Every meal is a step toward a greener future.

What's your favorite sustainable food choice? Share below! 👇

#Sustainability #EcoFriendly #LocalFood #GreenEats`,
        mediaType: 'carousel',
        status: 'scheduled',
        scheduledAt: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
      },
      {
        platform: 'tiktok',
        content: `Day 1 of our 30-day fitness challenge! 💪

Join thousands of people transforming their lives. It's not just about fitness - it's about building a supportive community.

Comment "I'm in" if you're ready to start your journey!

#FitnessChallenge #Transformation #FitLife #Motivation`,
        mediaType: 'video',
        status: 'draft',
      },
    ];

    for (const postTemplate of postTemplates) {
      const post = postRepo.create({
        ...postTemplate,
        briefId: createdBriefs[Math.floor(Math.random() * createdBriefs.length)].id,
        campaignId: createdCampaigns[Math.floor(Math.random() * createdCampaigns.length)].id,
        brandId: createdBrands[Math.floor(Math.random() * createdBrands.length)].id,
        organizationId: demoOrg.id,
        createdBy: createdUsers[0].id,
        metadata: {
          engagement: {
            likes: faker.number.int({ min: 50, max: 500 }),
            comments: faker.number.int({ min: 5, max: 50 }),
            shares: faker.number.int({ min: 10, max: 100 }),
            saves: faker.number.int({ min: 5, max: 30 }),
          },
          reach: faker.number.int({ min: 1000, max: 10000 }),
          impressions: faker.number.int({ min: 2000, max: 15000 }),
          clicks: faker.number.int({ min: 20, max: 200 }),
        },
        scores: {
          brandFit: faker.number.float({ min: 0.7, max: 1.0, precision: 0.01 }),
          readability: faker.number.float({ min: 0.8, max: 1.0, precision: 0.01 }),
          policyRisk: faker.number.float({ min: 0.0, max: 0.2, precision: 0.01 }),
        },
      });
      await postRepo.save(post);
    }

    // Create fake metrics for posts
    console.log('📊 Generating fake metrics...');
    const posts = await postRepo.find();
    
    for (const post of posts) {
      // Generate fake engagement metrics
      const metrics = {
        likes: faker.number.int({ min: 50, max: 500 }),
        comments: faker.number.int({ min: 5, max: 50 }),
        shares: faker.number.int({ min: 10, max: 100 }),
        saves: faker.number.int({ min: 5, max: 30 }),
        reach: faker.number.int({ min: 1000, max: 10000 }),
        impressions: faker.number.int({ min: 2000, max: 15000 }),
        clicks: faker.number.int({ min: 20, max: 200 }),
        ctr: faker.number.float({ min: 0.01, max: 0.05, precision: 0.001 }),
        engagement_rate: faker.number.float({ min: 0.02, max: 0.08, precision: 0.001 }),
      };

      await postRepo.update(post.id, {
        metadata: {
          ...post.metadata,
          engagement: {
            likes: metrics.likes,
            comments: metrics.comments,
            shares: metrics.shares,
            saves: metrics.saves,
          },
          reach: metrics.reach,
          impressions: metrics.impressions,
          clicks: metrics.clicks,
          ctr: metrics.ctr,
          engagement_rate: metrics.engagement_rate,
        },
      });
    }

    console.log('✅ Demo data seeding completed successfully!');
    console.log('\n📋 Summary:');
    console.log(`• Organization: ${demoOrg.name}`);
    console.log(`• Users: ${createdUsers.length}`);
    console.log(`• Brands: ${createdBrands.length}`);
    console.log(`• Campaigns: ${createdCampaigns.length}`);
    console.log(`• Briefs: ${createdBriefs.length}`);
    console.log(`• Posts: ${posts.length}`);
    console.log('\n🔑 Demo Login Credentials:');
    console.log('• Admin: admin@demo-agency.com / demo123');
    console.log('• Manager: manager@demo-agency.com / demo123');
    console.log('• Editor: editor@demo-agency.com / demo123');

  } catch (error) {
    console.error('❌ Error seeding demo data:', error);
    throw error;
  } finally {
    await app.close();
  }
}

bootstrap();
