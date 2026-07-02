const Anthropic = require('@anthropic-ai/sdk');
require('dotenv').config();

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-6';

async function callClaude({ system, messages, maxTokens = 4000 }) {
  const response = await anthropic.messages.create({
    model: MODEL,
    max_tokens: maxTokens,
    system,
    messages
  });

  const textBlock = response.content.find((b) => b.type === 'text');
  return {
    text: textBlock ? textBlock.text : '',
    model: response.model,
    usage: response.usage
  };
}

module.exports = { callClaude, MODEL };
