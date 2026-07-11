import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SKILL_PATH = path.resolve(__dirname, '../../.claude/skills/jargon-translator/SKILL.md');

function loadSkillInstructions() {
  const raw = readFileSync(SKILL_PATH, 'utf-8');
  return raw.replace(/^---\n[\s\S]*?\n---\n/, '').trim();
}

const SKILL_INSTRUCTIONS = loadSkillInstructions();
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

let anthropic;
function client() {
  if (!anthropic) {
    if (!process.env.ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY is not set — copy .env.example to .env and add a key.');
    }
    anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  }
  return anthropic;
}

function stripCodeFences(text) {
  return text
    .trim()
    .replace(/^```(?:json)?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();
}

export async function runSkill({ term, role }) {
  const response = await client().messages.create({
    model: MODEL,
    max_tokens: 512,
    system: SKILL_INSTRUCTIONS,
    messages: [
      {
        role: 'user',
        content: JSON.stringify({ term, role: role ?? null }),
      },
    ],
  });

  const raw = response.content?.find((block) => block.type === 'text')?.text ?? '';
  const cleaned = stripCodeFences(raw);

  let parsed;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`Skill returned invalid JSON: ${cleaned.slice(0, 200)}`);
  }

  if (typeof parsed.output !== 'string') {
    throw new Error('Skill response is missing the "output" field');
  }

  return {
    output: parsed.output,
    analogy: parsed.analogy ?? null,
    caution: parsed.caution ?? null,
  };
}
