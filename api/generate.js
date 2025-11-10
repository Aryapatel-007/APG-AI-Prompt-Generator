// api/generate.js
module.exports = async (req, res) => {
  // ... (CORS headers) ...
  if (req.method === 'OPTIONS') { return res.status(204).end(); }
  if (req.method !== 'POST') { return res.status(405).json({ error: 'Method Not Allowed' }); }

  const { prompt, systemInstruction } = req.body || {};
  if (!prompt) { return res.status(400).json({ error: 'A prompt is required.' }); }

  // IMPORTANT: This line MUST match your Vercel setting
  const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;

  if (!CLAUDE_API_KEY) {
    console.error('CLAUDE_API_KEY is not set in environment variables.');
    return res.status(500).json({ error: 'Server misconfiguration: API key is missing.' });
  }

  const API_URL = 'https://api.anthropic.com/v1/messages';
  const MODEL_NAME = 'claude-3-haiku-20240307';

  const payload = {
    model: MODEL_NAME,
    system: systemInstruction || "You are a helpful assistant.",
    messages: [ { role: 'user', content: prompt } ],
    max_tokens: 1024
  };

  try {
    const claudeResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
        'x-api-key': CLAUDE_API_KEY // Key is used here
      },
      body: JSON.stringify(payload),
    });

    const responseData = await claudeResponse.json();

    if (!claudeResponse.ok) {
      console.error('Claude API Error:', responseData);
      const message = responseData?.error?.message || 'An unknown error occurred with the Claude API.';
      return res.status(claudeResponse.status).json({ error: message, upstream: responseData });
    }

    const text = responseData?.content?.[0]?.text;
    if (typeof text === 'string') {
      return res.status(200).json({ text });
    } else {
      console.error('Could not extract text from Claude response:', responseData);
      return res.status(500).json({ error: 'Could not extract text from the AI response.' });
    }

  } catch (error) {
    console.error('Internal Serverless Function Error:', error);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
};
