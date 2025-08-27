// Shared constants for the AI Social Media Content Generator

export const PLATFORMS = {
  TWITTER: 'twitter',
  LINKEDIN: 'linkedin',
  INSTAGRAM: 'instagram',
  FACEBOOK: 'facebook',
  TIKTOK: 'tiktok',
  YOUTUBE: 'youtube',
  THREADS: 'threads',
  PINTEREST: 'pinterest'
} as const;

export const USER_ROLES = {
  OWNER: 'owner',
  ADMIN: 'admin',
  EDITOR: 'editor',
  REVIEWER: 'reviewer',
  VIEWER: 'viewer'
} as const;

export const POST_STATUSES = {
  DRAFT: 'draft',
  PENDING_APPROVAL: 'pending_approval',
  APPROVED: 'approved',
  SCHEDULED: 'scheduled',
  PUBLISHED: 'published',
  FAILED: 'failed'
} as const;

export const TONES = {
  PROFESSIONAL: 'professional',
  CASUAL: 'casual',
  HUMOROUS: 'humorous',
  EDUCATIONAL: 'educational',
  PROMOTIONAL: 'promotional',
  CONTROVERSIAL: 'controversial'
} as const;

// Platform-specific limits
export const PLATFORM_LIMITS = {
  [PLATFORMS.TWITTER]: {
    maxLength: 280,
    maxHashtags: 3,
    maxMentions: 10
  },
  [PLATFORMS.LINKEDIN]: {
    maxLength: 3000,
    maxHashtags: 5,
    maxMentions: 30
  },
  [PLATFORMS.INSTAGRAM]: {
    maxLength: 2200,
    maxHashtags: 30,
    maxMentions: 20
  },
  [PLATFORMS.FACEBOOK]: {
    maxLength: 63206,
    maxHashtags: 10,
    maxMentions: 50
  },
  [PLATFORMS.TIKTOK]: {
    maxLength: 2200,
    maxHashtags: 100,
    maxMentions: 50
  },
  [PLATFORMS.YOUTUBE]: {
    maxLength: 5000,
    maxHashtags: 15,
    maxMentions: 10
  },
  [PLATFORMS.THREADS]: {
    maxLength: 500,
    maxHashtags: 10,
    maxMentions: 30
  },
  [PLATFORMS.PINTEREST]: {
    maxLength: 500,
    maxHashtags: 20,
    maxMentions: 10
  }
} as const;

// Default values
export const DEFAULT_VARIANT_COUNT = 3;
export const DEFAULT_LANGUAGE = 'en';
export const DEFAULT_REGION = 'US';
