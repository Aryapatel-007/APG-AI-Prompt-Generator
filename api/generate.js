// api/generate.js - Using the incredibly fast Groq API with Llama 3

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

  // Securely get the Groq API key from Vercel environment variables
  const GROQ_API_KEY = process.env.GROQ_API_KEY;
  if (!GROQ_API_KEY) {
    console.error('GROQ_API_KEY is not set in environment variables.');
    return res.status(500).json({ error: 'Server misconfiguration: API key is missing.' });
  }

  const API_URL = 'https://api.groq.com/openai/v1/chat/completions';
  const MODEL_NAME = 'llama3-8b-8192'; // Meta's Llama 3 running at light speed

  // Groq uses the same payload structure as OpenAI's Chat Completions API
  const payload = {
    model: MODEL_NAME,
    messages: [
      { role: 'system', content: systemInstruction || "You are a helpful assistant." },
      { role: 'user', content: prompt }
    ]
  };

  try {
    const groqResponse = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Groq uses a Bearer token for authorization
        'Authorization': `Bearer ${GROQ_API_KEY}` 
      },
      body: JSON.stringify(payload),
    });

    const responseData = await groqResponse.json();

    if (!groqResponse.ok) {
      console.error('Groq API Error:', responseData);
      const message = responseData?.error?.message || 'An unknown error occurred with the Groq API.';
      return res.status(groqResponse.status).json({ error: message, upstream: responseData });
    }

    // Safely extract the generated text from the successful response
    const text = responseData?.choices?.[0]?.message?.content;
    if (typeof text === 'string') {
      return res.status(200).json({ text });
    } else {
      console.error('Could not extract text from Groq response:', responseData);
      return res.status(500).json({ error: 'Could not extract text from the AI response.' });
    }

  } catch (error) {
    console.error('Internal Serverless Function Error:', error);
    return res.status(500).json({ error: 'An internal server error occurred.' });
  }
};

