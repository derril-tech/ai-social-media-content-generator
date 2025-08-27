import { Platform, PLATFORM_LIMITS } from '../constants';
import { PlatformLimits, PlatformFormatting } from './types';

// Platform-specific limits and formatting rules
export const PLATFORM_LIMITS_DETAILED: Record<Platform, PlatformLimits> = {
  twitter: {
    maxLength: PLATFORM_LIMITS.twitter.maxLength,
    maxLines: 10,
    maxHashtags: PLATFORM_LIMITS.twitter.maxHashtags,
    maxMentions: PLATFORM_LIMITS.twitter.maxMentions,
    maxUrls: 4,
    maxMedia: 4,
    supportsMedia: true,
    supportsPolls: true,
    supportsThreads: true,
    supportsStories: false,
    supportsLinks: true,
    supportsHashtags: true,
    supportsMentions: true,
    characterLimit: PLATFORM_LIMITS.twitter.maxLength,
    optimalLength: {
      min: 100,
      max: 240,
    },
  },
  linkedin: {
    maxLength: PLATFORM_LIMITS.linkedin.maxLength,
    maxLines: 20,
    maxHashtags: PLATFORM_LIMITS.linkedin.maxHashtags,
    maxMentions: PLATFORM_LIMITS.linkedin.maxMentions,
    maxUrls: 10,
    maxMedia: 9,
    supportsMedia: true,
    supportsPolls: false,
    supportsThreads: false,
    supportsStories: false,
    supportsLinks: true,
    supportsHashtags: true,
    supportsMentions: true,
    characterLimit: PLATFORM_LIMITS.linkedin.maxLength,
    optimalLength: {
      min: 200,
      max: 2200,
    },
  },
  instagram: {
    maxLength: PLATFORM_LIMITS.instagram.maxLength,
    maxLines: 15,
    maxHashtags: PLATFORM_LIMITS.instagram.maxHashtags,
    maxMentions: PLATFORM_LIMITS.instagram.maxMentions,
    maxUrls: 1,
    maxMedia: 10,
    supportsMedia: true,
    supportsPolls: false,
    supportsThreads: false,
    supportsStories: true,
    supportsLinks: false,
    supportsHashtags: true,
    supportsMentions: true,
    characterLimit: PLATFORM_LIMITS.instagram.maxLength,
    optimalLength: {
      min: 50,
      max: 150,
    },
  },
  facebook: {
    maxLength: PLATFORM_LIMITS.facebook.maxLength,
    maxLines: 25,
    maxHashtags: PLATFORM_LIMITS.facebook.maxHashtags,
    maxMentions: PLATFORM_LIMITS.facebook.maxMentions,
    maxUrls: 10,
    maxMedia: 10,
    supportsMedia: true,
    supportsPolls: true,
    supportsThreads: false,
    supportsStories: false,
    supportsLinks: true,
    supportsHashtags: true,
    supportsMentions: true,
    characterLimit: PLATFORM_LIMITS.facebook.maxLength,
    optimalLength: {
      min: 100,
      max: 63206,
    },
  },
  tiktok: {
    maxLength: PLATFORM_LIMITS.tiktok.maxLength,
    maxLines: 8,
    maxHashtags: PLATFORM_LIMITS.tiktok.maxHashtags,
    maxMentions: PLATFORM_LIMITS.tiktok.maxMentions,
    maxUrls: 2,
    maxMedia: 1,
    supportsMedia: true,
    supportsPolls: false,
    supportsThreads: false,
    supportsStories: false,
    supportsLinks: true,
    supportsHashtags: true,
    supportsMentions: true,
    characterLimit: PLATFORM_LIMITS.tiktok.maxLength,
    optimalLength: {
      min: 50,
      max: 150,
    },
  },
  youtube: {
    maxLength: PLATFORM_LIMITS.youtube.maxLength,
    maxLines: 15,
    maxHashtags: PLATFORM_LIMITS.youtube.maxHashtags,
    maxMentions: PLATFORM_LIMITS.youtube.maxMentions,
    maxUrls: 5,
    maxMedia: 1,
    supportsMedia: true,
    supportsPolls: false,
    supportsThreads: false,
    supportsStories: false,
    supportsLinks: true,
    supportsHashtags: true,
    supportsMentions: true,
    characterLimit: PLATFORM_LIMITS.youtube.maxLength,
    optimalLength: {
      min: 100,
      max: 5000,
    },
  },
  threads: {
    maxLength: PLATFORM_LIMITS.threads.maxLength,
    maxLines: 10,
    maxHashtags: PLATFORM_LIMITS.threads.maxHashtags,
    maxMentions: PLATFORM_LIMITS.threads.maxMentions,
    maxUrls: 5,
    maxMedia: 10,
    supportsMedia: true,
    supportsPolls: false,
    supportsThreads: false,
    supportsStories: false,
    supportsLinks: true,
    supportsHashtags: true,
    supportsMentions: true,
    characterLimit: PLATFORM_LIMITS.threads.maxLength,
    optimalLength: {
      min: 50,
      max: 500,
    },
  },
  pinterest: {
    maxLength: PLATFORM_LIMITS.pinterest.maxLength,
    maxLines: 5,
    maxHashtags: PLATFORM_LIMITS.pinterest.maxHashtags,
    maxMentions: PLATFORM_LIMITS.pinterest.maxMentions,
    maxUrls: 1,
    maxMedia: 1,
    supportsMedia: true,
    supportsPolls: false,
    supportsThreads: false,
    supportsStories: false,
    supportsLinks: true,
    supportsHashtags: true,
    supportsMentions: true,
    characterLimit: PLATFORM_LIMITS.pinterest.maxLength,
    optimalLength: {
      min: 20,
      max: 500,
    },
  },
};

export const PLATFORM_FORMATTING: Record<Platform, PlatformFormatting> = {
  twitter: {
    lineBreaks: {
      style: 'single',
      maxConsecutive: 2,
    },
    hashtags: {
      position: 'end',
      separator: ' ',
      maxPerLine: 3,
    },
    mentions: {
      position: 'inline',
      separator: ' ',
    },
    urls: {
      shortening: true,
      tracking: true,
      position: 'inline',
    },
    emojis: {
      allowed: true,
      maxCount: 3,
      position: 'inline',
    },
  },
  linkedin: {
    lineBreaks: {
      style: 'double',
      maxConsecutive: 3,
    },
    hashtags: {
      position: 'end',
      separator: ' ',
      maxPerLine: 5,
    },
    mentions: {
      position: 'inline',
      separator: ' ',
    },
    urls: {
      shortening: false,
      tracking: true,
      position: 'inline',
    },
    emojis: {
      allowed: true,
      maxCount: 5,
      position: 'inline',
    },
  },
  instagram: {
    lineBreaks: {
      style: 'single',
      maxConsecutive: 2,
    },
    hashtags: {
      position: 'end',
      separator: ' ',
      maxPerLine: 10,
    },
    mentions: {
      position: 'inline',
      separator: ' ',
    },
    urls: {
      shortening: true,
      tracking: false,
      position: 'end',
    },
    emojis: {
      allowed: true,
      maxCount: 10,
      position: 'inline',
    },
  },
  facebook: {
    lineBreaks: {
      style: 'single',
      maxConsecutive: 2,
    },
    hashtags: {
      position: 'inline',
      separator: ' ',
      maxPerLine: 5,
    },
    mentions: {
      position: 'inline',
      separator: ' ',
    },
    urls: {
      shortening: false,
      tracking: true,
      position: 'inline',
    },
    emojis: {
      allowed: true,
      maxCount: 10,
      position: 'inline',
    },
  },
  tiktok: {
    lineBreaks: {
      style: 'single',
      maxConsecutive: 1,
    },
    hashtags: {
      position: 'end',
      separator: ' ',
      maxPerLine: 50,
    },
    mentions: {
      position: 'inline',
      separator: ' ',
    },
    urls: {
      shortening: true,
      tracking: true,
      position: 'inline',
    },
    emojis: {
      allowed: true,
      maxCount: 20,
      position: 'inline',
    },
  },
  youtube: {
    lineBreaks: {
      style: 'double',
      maxConsecutive: 2,
    },
    hashtags: {
      position: 'end',
      separator: ' ',
      maxPerLine: 8,
    },
    mentions: {
      position: 'inline',
      separator: ' ',
    },
    urls: {
      shortening: false,
      tracking: true,
      position: 'inline',
    },
    emojis: {
      allowed: true,
      maxCount: 15,
      position: 'inline',
    },
  },
  threads: {
    lineBreaks: {
      style: 'single',
      maxConsecutive: 2,
    },
    hashtags: {
      position: 'end',
      separator: ' ',
      maxPerLine: 5,
    },
    mentions: {
      position: 'inline',
      separator: ' ',
    },
    urls: {
      shortening: true,
      tracking: true,
      position: 'inline',
    },
    emojis: {
      allowed: true,
      maxCount: 10,
      position: 'inline',
    },
  },
  pinterest: {
    lineBreaks: {
      style: 'single',
      maxConsecutive: 1,
    },
    hashtags: {
      position: 'end',
      separator: ' ',
      maxPerLine: 10,
    },
    mentions: {
      position: 'inline',
      separator: ' ',
    },
    urls: {
      shortening: true,
      tracking: true,
      position: 'inline',
    },
    emojis: {
      allowed: true,
      maxCount: 5,
      position: 'inline',
    },
  },
};

// Platform-specific best practices
export const PLATFORM_BEST_PRACTICES = {
  twitter: [
    'Use 1-2 relevant hashtags',
    'Include a call-to-action',
    'Keep it conversational',
    'Use emojis sparingly',
    'Ask questions to encourage engagement',
  ],
  linkedin: [
    'Focus on professional value',
    'Use 3-5 relevant hashtags',
    'Include industry insights',
    'Encourage professional discussion',
    'Share thought leadership',
  ],
  instagram: [
    'Use 5-10 relevant hashtags',
    'Create curiosity with questions',
    'Use emojis strategically',
    'Tell a story or provide value',
    'Include calls-to-action',
  ],
  facebook: [
    'Focus on community building',
    'Use 2-5 relevant hashtags',
    'Include questions or polls',
    'Share valuable content',
    'Encourage sharing',
  ],
  tiktok: [
    'Use trending hashtags',
    'Create engaging hooks',
    'Keep it entertaining',
    'Use popular sounds/music',
    'Include calls-to-action',
  ],
  youtube: [
    'Use 5-10 relevant hashtags',
    'Include compelling titles',
    'Focus on educational value',
    'Use thumbnails effectively',
    'Include timestamps in descriptions',
  ],
  threads: [
    'Keep it authentic and personal',
    'Use 3-5 relevant hashtags',
    'Encourage conversation',
    'Share behind-the-scenes content',
    'Be conversational',
  ],
  pinterest: [
    'Use descriptive titles',
    'Include keywords in descriptions',
    'Use high-quality images',
    'Include 5-10 relevant hashtags',
    'Link to valuable content',
  ],
} as const;

// Content types supported by each platform
export const PLATFORM_CONTENT_TYPES = {
  twitter: ['post', 'thread', 'poll'],
  linkedin: ['post', 'article', 'poll'],
  instagram: ['post', 'reel', 'story', 'carousel'],
  facebook: ['post', 'story', 'live', 'poll'],
  tiktok: ['video', 'duet', 'stitch'],
  youtube: ['video', 'short', 'live'],
  threads: ['post', 'thread'],
  pinterest: ['pin', 'board'],
} as const;
