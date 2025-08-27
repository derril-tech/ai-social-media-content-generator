# Created automatically by Cursor AI (2024-12-19)

import { NextRequest, NextResponse } from 'next/server';
import dayjs from 'dayjs';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { dateRange, platforms, campaigns } = body;

    // Mock metrics data - in production, this would query the database
    const mockMetricsData = {
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
    };

    return NextResponse.json(mockMetricsData);
  } catch (error) {
    console.error('Error fetching metrics dashboard:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics dashboard' },
      { status: 500 }
    );
  }
}
