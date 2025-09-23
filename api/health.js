module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method Not Allowed' });

  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  return res.status(200).json({ ok: true, env: { GEMINI_API_KEY: hasKey ? 'present' : 'missing' } });
};
