// api/generate.js - Final version using the Anthropic Claude API

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  // Handle preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // Ensure the request method is POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { prompt, systemInstruction } = req.body || {};
  if (!prompt) {
    return res.status(400).json({ error: 'A prompt is required.' });
  }

  // IMPORTANT: The environment variable must be named CLAUDE_API_KEY in Vercel
  const CLAUDE_API_KEY = process.env.CLAUDE_API_KEY;
  if (!CLAUDE_API_KEY) {
    console.error('CLAUDE_API_KEY is not set in environment variables.');
    return res.status(500).json({ error: 'Server misconfiguration: API key is missing.' });
  }

  const API_URL = 'https://api.anthropic.com/v1/messages';
  // We'll use Claude 3 Haiku - it's fast, smart, and cost-effective.
  const MODEL_NAME = 'claude-3-haiku-20240307';

  // Anthropic's payload structure is different from Mistral/OpenAI
  const payload = {
    model: MODEL_NAME,
    system: systemInstruction || "You are a helpful assistant.", // System prompt is a top-level key
    messages: [
      { role: 'user', content: prompt }
    ],
    max_tokens: 1024 // Set a reasonable limit
  };

  try {
    const claudeResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Anthropic requires a version header
        'anthropic-version': '2023-06-01',
        // Anthropic uses 'x-api-key' for authorization, not 'Bearer'
        'x-api-key': CLAUDE_API_KEY
      },
      body: JSON.stringify(payload),
    });

    const responseData = await claudeResponse.json();

    if (!claudeResponse.ok) {
      console.error('Claude API Error:', responseData);
      const message = responseData?.error?.message || 'An unknown error occurred with the Claude API.';
      return res.status(claudeResponse.status).json({ error: message, upstream: responseData });
    }

    // Safely extract the generated text from Claude's successful response
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
