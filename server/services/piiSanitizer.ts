import type { PiiDetectionSummary } from '../../src/shared/schemas.ts';

interface PiiRule {
  label: string;
  regex: RegExp;
  replacement: string;
}

const PII_RULES: PiiRule[] = [
  {
    label: 'US Social Security Number',
    regex: /\b(?!000|666|9\d{2})\d{3}-(?!00)\d{2}-(?!0000)\d{4}\b/g,
    replacement: '[REDACTED_SSN]',
  },
  {
    label: 'Payment Card Number',
    regex: /\b(?:\d[ -]*?){13,16}\b/g,
    replacement: '[REDACTED_CARD]',
  },
  {
    label: 'API Key / Secret Token',
    regex: /\b(?:sk-[A-Za-z0-9_-]{16,}|AIza[0-9A-Za-z_-]{30,}|ghp_[A-Za-z0-9]{24,}|AKIA[0-9A-Z]{16})\b/g,
    replacement: '[REDACTED_API_KEY]',
  },
  {
    label: 'Email Address',
    regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    replacement: '[REDACTED_EMAIL]',
  },
  {
    label: 'Phone Number',
    regex: /\b(?:\+1[-.\s]?)?\(?\d{3}\)?[-.\s]\d{3}[-.\s]\d{4}\b/g,
    replacement: '[REDACTED_PHONE]',
  },
];

export interface SanitizedPayload {
  sanitizedPrompt: string;
  sanitizedResponse: string;
  summary: PiiDetectionSummary;
}

export function inspectAndSanitizePii(
  promptText: string,
  responseText: string,
  redactBeforeUpstream: boolean
): SanitizedPayload {
  let sanitizedPrompt = promptText;
  let sanitizedResponse = responseText;
  let totalMatches = 0;
  const detectedTypes: string[] = [];

  for (const rule of PII_RULES) {
    const promptMatches = promptText.match(rule.regex) ?? [];
    const responseMatches = responseText.match(rule.regex) ?? [];
    const count = promptMatches.length + responseMatches.length;

    if (count > 0) {
      totalMatches += count;
      detectedTypes.push(`${rule.label} (${count})`);
      if (redactBeforeUpstream) {
        sanitizedPrompt = sanitizedPrompt.replace(rule.regex, rule.replacement);
        sanitizedResponse = sanitizedResponse.replace(rule.regex, rule.replacement);
      }
    }
  }

  return {
    sanitizedPrompt,
    sanitizedResponse,
    summary: {
      redacted: redactBeforeUpstream && totalMatches > 0,
      totalMatches,
      detectedTypes,
    },
  };
}
