import { Platform, Tone } from '../types';

export interface PlatformLimits {
  maxLength: number;
  maxLines?: number;
  maxHashtags: number;
  maxMentions: number;
  maxUrls: number;
  maxMedia: number;
  supportsMedia: boolean;
  supportsPolls: boolean;
  supportsThreads: boolean;
  supportsStories: boolean;
  supportsLinks: boolean;
  supportsHashtags: boolean;
  supportsMentions: boolean;
  characterLimit: number;
  optimalLength: {
    min: number;
    max: number;
  };
}

export interface PlatformFormatting {
  lineBreaks: {
    style: 'double' | 'single' | 'none';
    maxConsecutive: number;
  };
  hashtags: {
    position: 'end' | 'inline' | 'both';
    separator: string;
    maxPerLine: number;
  };
  mentions: {
    position: 'inline' | 'end';
    separator: string;
  };
  urls: {
    shortening: boolean;
    tracking: boolean;
    position: 'inline' | 'end';
  };
  emojis: {
    allowed: boolean;
    maxCount: number;
    position: 'inline' | 'end';
  };
}

export interface PlatformTemplate {
  id: string;
  name: string;
  platform: Platform;
  category: 'post' | 'thread' | 'carousel' | 'story' | 'reel' | 'video';
  tone: Tone;
  template: string;
  variables: string[];
  constraints: {
    minLength: number;
    maxLength: number;
    requiredElements: string[];
    optionalElements: string[];
  };
  examples: string[];
  tags: string[];
}

export interface ContentValidation {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
  score: {
    length: number;
    engagement: number;
    readability: number;
    compliance: number;
    overall: number;
  };
}

export interface PlatformContext {
  platform: Platform;
  audience: string;
  tone: Tone;
  language: string;
  region: string;
  brand: {
    name: string;
    colors: string[];
    fonts: string[];
    guidelines: string;
  };
  constraints: {
    maxLength: number;
    includeHashtags: boolean;
    includeCallToAction: boolean;
    includeEmojis: boolean;
    bannedWords: string[];
  };
}

export interface GeneratedContent {
  platform: Platform;
  content: string;
  characterCount: number;
  wordCount: number;
  lineCount: number;
  hashtagCount: number;
  mentionCount: number;
  emojiCount: number;
  hasCallToAction: boolean;
  hasLink: boolean;
  validation: ContentValidation;
  metadata: {
    generatedAt: Date;
    generationTime: number;
    templateId: string;
    voiceModelUsed: string;
  };
}
