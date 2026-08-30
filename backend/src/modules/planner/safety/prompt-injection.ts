import { AppError } from "../../../shared/errors/app-error";

const INJECTION_PATTERNS = [
  /\bignore\s+(?:all\s+)?instructions\b/i,
  /\bignore\s+(all\s+)?(previous|prior|system)\s+(instructions|rules|prompts|commands)\b/i,
  /\bdisregard\s+(all\s+)?(previous|prior|system)\s+(instructions|rules|prompts|commands)\b/i,
  /\byou\s+are\s+now\s+(in\s+)?(developer\s+mode|dan|jailbreak|unrestricted)\b/i,
  /\b(dan\s+mode|jailbreak|unrestricted\s+mode|system\s+override|prompt\s+leak|jailbreak\s+prompt)\b/i,
  /\bshow\s+(me\s+)?(your\s+)?(system\s+prompt|hidden\s+instructions|developer\s+message|api\s*keys?|secrets|env)\b/i,
  /\bprint\s+(the\s+)?(developer\s+message|system\s+prompt|environment\s+variables|api\s*keys?|secrets|env)\b/i,
  /\b(drop\s+table|delete\s+from|select\s+\*\s+from\s+users)\b/i,
  /<\/?(?:system|developer|admin|root)>/i,
  /\[\/?(?:inst|system)\]/i,
  /<\|(?:im_start|im_end|endoftext)\|>/i,
];

export function detectPromptInjection(text: string): boolean {
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(text)) {
      return true;
    }
  }
  return false;
}

export function validateInputAgainstInjection(text: string): void {
  if (detectPromptInjection(text)) {
    throw new AppError(
      400,
      "PROMPT_INJECTION_DETECTED",
      "Input contains disallowed instructions or prompt injection patterns",
    );
  }
}

export function wrapUntrustedContent(tag: string, content: string): string {
  // Strip potential closing/opening tag injections
  const sanitized = content.replace(
    /<\/?(?:system|user|assistant|tool_call|user_input|evidence|search_snippet|document_excerpt|developer|admin)>/gi,
    "",
  );
  return `<${tag}>\n${sanitized}\n</${tag}>`;
}
