// Demo-only assistant replies. Clearly labelled in the UI (FR-24): there is no live model in the demo.
// Simple unit conversions are actually computed; known facts are scripted.
import type { StructuredThought } from '../core/types';

const FACTS: [RegExp, string][] = [
  [/capital of belgium/i, 'The capital of Belgium is Brussels.'],
  [/capital of france/i, 'The capital of France is Paris.'],
  [/capital of japan/i, 'The capital of Japan is Tokyo.'],
];

const CONVERSIONS: [RegExp, (n: number) => string][] = [
  [/([\d.]+)\s*(?:miles?|mi)\b.*\b(?:km|kilomet)/i, (n) => `${n} miles is about ${(n * 1.609344).toFixed(2)} kilometers.`],
  [/([\d.]+)\s*(?:km|kilomet\w*)\b.*\bmiles?/i, (n) => `${n} kilometers is about ${(n / 1.609344).toFixed(2)} miles.`],
  [/([\d.]+)\s*(?:pounds?|lbs?)\b.*\b(?:kg|kilo)/i, (n) => `${n} pounds is about ${(n * 0.45359237).toFixed(2)} kilograms.`],
  [/([\d.]+)\s*(?:kg|kilograms?)\b.*\b(?:pounds?|lbs?)/i, (n) => `${n} kilograms is about ${(n / 0.45359237).toFixed(2)} pounds.`],
  [/([\d.]+)\s*(?:°\s*)?(?:f|fahrenheit)\b.*\b(?:c|celsius)\b/i, (n) => `${n}°F is about ${(((n - 32) * 5) / 9).toFixed(1)}°C.`],
  [/([\d.]+)\s*(?:°\s*)?(?:c|celsius)\b.*\b(?:f|fahrenheit)\b/i, (n) => `${n}°C is about ${((n * 9) / 5 + 32).toFixed(1)}°F.`],
];

export function routineReply(text: string): { text: string; scripted: boolean } {
  for (const [re, f] of CONVERSIONS) {
    const m = text.match(re);
    if (m) return { text: f(parseFloat(m[1])), scripted: false };
  }
  for (const [re, a] of FACTS) if (re.test(text)) return { text: a, scripted: true };
  return {
    text: 'The demo has no live model. With the extension installed, this request goes to ChatGPT unchanged.',
    scripted: true,
  };
}

export function skippedReply(): string {
  return 'Skipped. With the extension installed, ChatGPT gets your original request, unchanged. (The demo has no live model.)';
}

export function continuationReply(s: StructuredThought): string {
  const lc = (t: string) => t.charAt(0).toLowerCase() + t.slice(1);
  const isQ = /^(should|what|how|which|is|can|do|does|why|where|when|who)\b/i.test(s.goal.text);
  const parts: string[] = [isQ ? `Building on your thinking about "${s.goal.text}":` : `Building on your plan to ${lc(s.goal.text)}:`];
  if (s.ideas.length) parts.push(`• I'll keep your structure (${s.ideas.map((i) => i.text).join(', ')}) and go through it piece by piece.`);
  if (s.approach.length) parts.push(`• Your approach (${s.approach.map((i) => lc(i.text)).join('; ')}) will be the starting point, and I'll flag anything that could trip you up.`);
  if (s.constraints.length) parts.push(`• I'll stay within what you named: ${s.constraints.map((i) => lc(i.text)).join('; ')}.`);
  if (s.openDecisions.length) parts.push(`• For "${lc(s.openDecisions[0].text)}", I'll set out the options and tradeoffs so you can make the call.`);
  parts.push('This is what ChatGPT receives when you use the extension: your request with your own thinking as its foundation.');
  return parts.join('\n');
}
