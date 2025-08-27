// Core shared types for the AI Social Media Content Generator

export type Platform =
  | 'twitter'
  | 'linkedin'
  | 'instagram'
  | 'facebook'
  | 'tiktok'
  | 'youtube'
  | 'threads'
  | 'pinterest';

export type UserRole = 'owner' | 'admin' | 'editor' | 'reviewer' | 'viewer';

export type PostStatus =
  | 'draft'
  | 'pending_approval'
  | 'approved'
  | 'scheduled'
  | 'published'
  | 'failed';

export type Tone =
  | 'professional'
  | 'casual'
  | 'humorous'
  | 'educational'
  | 'promotional'
  | 'controversial';

export interface Brand {
  id: string;
  orgId: string;
  name: string;
  colors: string[];
  fonts: string[];
  guidelines: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface VoiceModel {
  id: string;
  brandId: string;
  embedding: number[];
  constraints: {
    tone: Tone;
    sentenceLength: { min: number; max: number };
    emojiThreshold: number;
    jargonThreshold: number;
  };
  createdAt: Date;
}

export interface Brief {
  id: string;
  campaignId: string;
  topic: string;
  audience: string;
  tone: Tone;
  languages: string[];
  platforms: Platform[];
  regions: string[];
  competitors: string[];
  constraints: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Variant {
  id: string;
  postId: string;
  platform: Platform;
  content: string;
  language: string;
  hashtags: string[];
  score: {
    brandFit: number;
    readability: number;
    policyRisk: number;
    overall: number;
  };
  createdAt: Date;
}

export interface Post {
  id: string;
  briefId: string;
  status: PostStatus;
  scheduledAt?: Date;
  publishedAt?: Date;
  externalId?: string;
  variants: Variant[];
  createdAt: Date;
  updatedAt: Date;
}
