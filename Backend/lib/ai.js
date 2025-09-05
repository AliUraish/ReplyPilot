const AI_BASE_URL = process.env.AI_BASE_URL || 'https://api.openai.com/v1';
const API_KEY_GATEWAY = process.env.API_KEY_GATEWAY;
const DEFAULT_MODEL = process.env.AI_MODEL || 'gpt-5';

function buildDraftPrompt({ handle, tone, tweetText, authorHandle, language = 'en' }) {
  return [
    { role: 'system', content: `You draft concise, helpful X (Twitter) replies. Tone: ${tone || 'friendly, professional'}. Constraints: <= 280 chars, plain text, no hashtags unless directly helpful, no links unless asked, avoid emojis unless on-tone. Language: ${language}.` },
    { role: 'user', content: `Mention to @${handle} from @${authorHandle} says: "${tweetText}"\nWrite a helpful reply.` },
  ];
}

async function chatComplete({ model = DEFAULT_MODEL, messages, temperature = 0.5, max_tokens = 180 }) {
  if (!API_KEY_GATEWAY) {
    throw new Error('API_KEY_GATEWAY not set');
  }
  const res = await fetch(`${AI_BASE_URL}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${API_KEY_GATEWAY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages, temperature, max_tokens, stream: false }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`AI error ${res.status}: ${txt}`);
  }
  const json = await res.json();
  const content = json.choices?.[0]?.message?.content?.trim() || '';
  return content;
}

async function generateDraft({ model = DEFAULT_MODEL, handle, tone, tweetText, authorHandle, language }) {
  const messages = buildDraftPrompt({ handle, tone, tweetText, authorHandle, language });
  const reply = await chatComplete({ model, messages, temperature: 0.4 });
  return sanitizeReply(reply);
}

function sanitizeReply(text) {
  const trimmed = (text || '').replace(/^"|"$/g, '').replace(/\s+/g, ' ').trim();
  if (trimmed.length <= 280) return trimmed;
  return trimmed.slice(0, 277) + '...';
}

module.exports = {
  generateDraft,
};
