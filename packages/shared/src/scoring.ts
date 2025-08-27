import { Platform } from './types';
import { PLATFORM_LIMITS } from './constants';

export interface ScoreBreakdown {
  brandFit: number;
  readability: number;
  policyRisk: number;
  overall: number;
}

export function scoreReadability(content: string): number {
  const sentences = Math.max(1, (content.match(/[.!?]/g) || []).length);
  const words = Math.max(1, content.trim().split(/\s+/).length);
  const chars = content.replace(/\s/g, '').length;
  const avgWordLen = chars / words;
  // Simple heuristic: shorter words and moderate sentences score higher
  const wordLenScore = Math.max(0, Math.min(1, (6 - Math.abs(avgWordLen - 5)) / 5));
  const sentenceLen = words / sentences;
  const sentenceScore = Math.max(0, Math.min(1, (30 - Math.abs(sentenceLen - 20)) / 30));
  return Number(((wordLenScore * 0.5 + sentenceScore * 0.5)).toFixed(2));
}

export function scorePolicyRisk(content: string): number {
  const bannedPatterns = [/free money/i, /click here/i, /guaranteed/i, /buy now/i, /act now/i];
  const hits = bannedPatterns.reduce((acc, re) => acc + (re.test(content) ? 1 : 0), 0);
  const urlCount = (content.match(/https?:\/\/\S+/g) || []).length;
  const hashtagCount = (content.match(/#\w+/g) || []).length;
  // More spammy cues → higher risk, but we return 0..1 risk then invert for score later where needed
  const risk = Math.min(1, (hits * 0.3) + (urlCount * 0.1) + Math.max(0, (hashtagCount - 10)) * 0.02);
  // Convert to score: lower risk → higher score
  return Number((1 - risk).toFixed(2));
}

export function scoreBrandFit(content: string, guidelines?: string): number {
  if (!guidelines) return 0.75;
  const tokens = guidelines.toLowerCase().split(/\W+/).filter(Boolean);
  const uniq = new Set(tokens);
  const matches = [...uniq].filter(t => content.toLowerCase().includes(t)).length;
  const ratio = Math.min(1, matches / Math.max(5, uniq.size));
  return Number((0.5 + ratio * 0.5).toFixed(2));
}

export function scoreLengthCompliance(content: string, platform: Platform): number {
  const limit = PLATFORM_LIMITS[platform].maxLength;
  const len = content.length;
  const ideal = Math.min(limit, 0.8 * limit);
  const dist = Math.abs(len - ideal);
  const score = Math.max(0, 1 - dist / limit);
  return Number(score.toFixed(2));
}

export function computeOverallScore(parts: { brandFit: number; readability: number; policyRisk: number; lengthCompliance?: number; }): number {
  const lengthWeight = parts.lengthCompliance !== undefined ? 0.2 : 0;
  const baseWeight = 1 - lengthWeight; // 0.8 if length included
  const weights = {
    brandFit: 0.4 * baseWeight,
    readability: 0.3 * baseWeight,
    policyRisk: 0.3 * baseWeight,
    lengthCompliance: lengthWeight,
  } as const;
  const val = parts.brandFit * weights.brandFit + parts.readability * weights.readability + parts.policyRisk * weights.policyRisk + (parts.lengthCompliance ?? 0) * weights.lengthCompliance;
  return Number(val.toFixed(2));
}

export function scoreContent(content: string, platform: Platform, guidelines?: string): ScoreBreakdown {
  const brandFit = scoreBrandFit(content, guidelines);
  const readability = scoreReadability(content);
  const policyRisk = scorePolicyRisk(content);
  const lengthCompliance = scoreLengthCompliance(content, platform);
  const overall = computeOverallScore({ brandFit, readability, policyRisk, lengthCompliance });
  return { brandFit, readability, policyRisk, overall };
}


