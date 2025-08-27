// Shared utility functions for the AI Social Media Content Generator

import { Platform, PLATFORM_LIMITS } from './constants';

/**
 * Generate a unique ID using ULID format
 */
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}-${random}`;
}

/**
 * Validate content length for a specific platform
 */
export function validateContentLength(content: string, platform: Platform): boolean {
  const limit = PLATFORM_LIMITS[platform].maxLength;
  return content.length <= limit;
}

/**
 * Count hashtags in content
 */
export function countHashtags(content: string): number {
  const hashtagRegex = /#\w+/g;
  const matches = content.match(hashtagRegex);
  return matches ? matches.length : 0;
}

/**
 * Extract hashtags from content
 */
export function extractHashtags(content: string): string[] {
  const hashtagRegex = /#\w+/g;
  const matches = content.match(hashtagRegex);
  return matches ? matches.map(tag => tag.substring(1)) : [];
}

/**
 * Validate hashtag count for a specific platform
 */
export function validateHashtagCount(content: string, platform: Platform): boolean {
  const count = countHashtags(content);
  const limit = PLATFORM_LIMITS[platform].maxHashtags;
  return count <= limit;
}

/**
 * Count mentions in content
 */
export function countMentions(content: string): number {
  const mentionRegex = /@\w+/g;
  const matches = content.match(mentionRegex);
  return matches ? matches.length : 0;
}

/**
 * Validate mention count for a specific platform
 */
export function validateMentionCount(content: string, platform: Platform): boolean {
  const count = countMentions(content);
  const limit = PLATFORM_LIMITS[platform].maxMentions;
  return count <= limit;
}

/**
 * Slugify text for URLs
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Capitalize first letter of each word
 */
export function capitalize(text: string): string {
  return text.replace(/\b\w/g, l => l.toUpperCase());
}

/**
 * Truncate text to specified length with ellipsis
 */
export function truncate(text: string, length: number): string {
  if (text.length <= length) return text;
  return text.substring(0, length).trim() + '...';
}
