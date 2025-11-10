// api/generate.js - Final version using the Mistral AI API

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

  // IMPORTANT: The environment variable must be named MISTRAL_API_KEY in Vercel
  const MISTRAL_API_KEY = process.env.MISTRAL_API_KEY;
  if (!MISTRAL_API_KEY) {
    console.error('MISTRAL_API_KEY is not set in environment variables.');
    return res.status(500).json({ error: 'Server misconfiguration: API key is missing.' });
  }

  const API_URL = 'https://api.mistral.ai/v1/chat/completions';
  const MODEL_NAME = 'open-mistral-7b'; // This corresponds to Mistral-7B-Instruct-v0.2

  // Mistral uses a payload structure similar to OpenAI's
  const payload = {
    model: MODEL_NAME,
    messages: [
      { role: 'system', content: systemInstruction || "You are a helpful assistant." },
      { role: 'user', content: prompt }
    ]
  };

  try {
    const mistralResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Mistral uses a Bearer token for authorization
        'Authorization': Bearer ${MISTRAL_API_KEY} 
      },
      body: JSON.stringify(payload),
    });

    const responseData = await mistralResponse.json();

    if (!mistralResponse.ok) {
      console.error('Mistral API Error:', responseData);
      const message = responseData?.message || 'An unknown error occurred with the Mistral API.';
      return res.status(mistralResponse.status).json({ error: message, upstream: responseData });
    }

    // Safely extract the generated text from the successful response
    const text = responseData?.choices?.[0]?.message?.content;
    if (typeof text === 'string') {
      return res.status(200).json({ text });
    } else {
      console.error('Could not extract text from Mistral response:', responseData);
      return res.status(500).json({ error: 'Could not extract text from the AI response.' });
    }

  } catch (error) {
    console.error('Internal Serverless Function Error:', error);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
};
