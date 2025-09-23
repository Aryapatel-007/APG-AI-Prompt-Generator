// api/generate.js - Final version using the Anthropic Claude 3 Haiku model

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  // Add 'x-api-key' to allowed headers for Claude
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key');

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

  // IMPORTANT: The environment variable must be named ANTHROPIC_API_KEY in Vercel
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  if (!ANTHROPIC_API_KEY) {
    console.error('ANTHROPIC_API_KEY is not set in environment variables.');
    return res.status(500).json({ error: 'Server misconfiguration: API key is missing.' });
  }

  const API_URL = 'https://api.anthropic.com/v1/messages';
  const MODEL_NAME = 'claude-3-haiku-20240307'; // Fast, reliable, and high-quality

  // The payload structure for Claude is different from Groq/OpenAI
  const payload = {
    model: MODEL_NAME,
    max_tokens: 2048, // You can adjust this value as needed
    system: systemInstruction, // Claude has a dedicated top-level 'system' parameter
    messages: [
      { role: 'user', content: prompt }
    ]
  };

  try {
    const claudeResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,      // Claude's specific API key header
        'anthropic-version': '2023-06-01' // Required by the Claude API
      },
      body: JSON.stringify(payload),
    });

    const responseData = await claudeResponse.json();

    if (!claudeResponse.ok) {
      console.error('Claude API Error:', responseData);
      const message = responseData?.error?.message || 'An unknown error occurred with the Claude API.';
      return res.status(claudeResponse.status).json({ error: message, upstream: responseData });
    }

    // The response structure for Claude is also slightly different
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

