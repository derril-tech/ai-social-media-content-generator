import { Platform } from '../types';
import { PLATFORM_FORMATTING } from './constants';

export function formatContentForPlatform(content: string, platform: Platform): string {
  const rules = PLATFORM_FORMATTING[platform];
  let result = content.trim();

  // Normalize line breaks
  result = result.replace(/\r\n|\r/g, '\n');
  if (rules.lineBreaks.style === 'single') {
    result = result.replace(/\n{3,}/g, '\n\n');
  } else if (rules.lineBreaks.style === 'double') {
    result = result.replace(/\n{2,}/g, '\n\n');
  } else {
    result = result.replace(/\n+/g, ' ');
  }

  // Trim consecutive spaces
  result = result.replace(/\s{3,}/g, ' ');

  return result.trim();
}


