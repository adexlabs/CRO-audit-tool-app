const { callClaude, MODEL } = require('./claudeService');
const { FIX_SYSTEM_PROMPT, buildFixUserPrompt } = require('./prompts');
const { parseFixResponse } = require('./responseParser');

async function generateFix({ issue, fileKey, currentCode }) {
  const userPrompt = buildFixUserPrompt({ issue, fileKey, currentCode });

  const { text, model } = await callClaude({
    system: FIX_SYSTEM_PROMPT,
    messages: [{ role: 'user', content: userPrompt }],
    maxTokens: 6000
  });

  const { fixedCode, explanation } = parseFixResponse(text);

  if (!fixedCode || fixedCode.length < 5) {
    throw new Error('Claude returned an empty or invalid fix.');
  }

  return { fixedCode, explanation, model: model || MODEL };
}

module.exports = { generateFix };
