// Vercel Serverless Function (Node.js) - Corrected for compatibility
// This securely handles requests from the frontend using the USER'S API key.

// Helper to read JSON body for Vercel Node serverless (when req.body is undefined)
function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (e) {
        reject(e);
      }
    });
    req.on('error', reject);
  });
}

module.exports = async function handler(req, res) {
  // Basic CORS (safe default; same-origin will also work)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  // 1. Only allow POST requests
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  // 2. Parse body robustly across environments
  let body = req.body;
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    try {
      body = await readJsonBody(req);
    } catch (e) {
      console.error('Invalid JSON body:', e);
      return res.status(400).json({ error: 'Invalid JSON body' });
    }
  }

  const { prompt, systemInstruction } = body || {};

  // 3. Validate inputs
  if (!prompt && !systemInstruction) {
    return res.status(400).json({ error: 'Prompt or system instruction is required.' });
  }

  // Use a single server-side API key from environment (do NOT expose to client)
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    console.error('GEMINI_API_KEY is not set in environment variables.');
    return res.status(500).json({ error: 'Server misconfiguration: API key missing.' });
  }

  // Use header-based auth and gemini-2.0-flash model as per user's API usage example
  const API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

  const payload = {
    contents: [
      {
        role: 'user',
        parts: [{ text: prompt || '' }],
      },
    ],
    ...(systemInstruction
      ? { systemInstruction: { parts: [{ text: systemInstruction }] } }
      : {}),
  };

  try {
    // 4. Make the call to the official Gemini API
    const headers = {
      'Content-Type': 'application/json',
      'X-goog-api-key': GEMINI_API_KEY,
    };
    const geminiResponse = await fetch(API_URL, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload),
    });

    const rawText = await geminiResponse.text();
    let responseData = {};
    try { responseData = rawText ? JSON.parse(rawText) : {}; } catch (e) {
      responseData = { parse_error: true, raw: rawText };
    }

    if (!geminiResponse.ok) {
      console.error('Gemini API Error:', responseData);
      const status = geminiResponse.status || 500;
      const message = (responseData && responseData.error && responseData.error.message)
        ? responseData.error.message
        : 'An error occurred with the Gemini API.';
      return res.status(status).json({ error: message, upstream: responseData });
    }

    // 5. Safely extract text
    const text = responseData?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (typeof text === 'string' && text.length > 0) {
      return res.status(200).json({ text });
    }
    // Fall back to returning the whole response for debugging if no text present
    return res.status(200).json({ text: '', raw: responseData });
  } catch (error) {
    console.error('Internal Serverless Function Error:', error);
    return res.status(500).json({ error: 'An internal server error occurred on the backend.', details: String(error && error.message || error) });
  }
};

// Ensure compatibility with different import styles
exports.default = module.exports;
