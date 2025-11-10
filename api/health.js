// api/health.js
module.exports = (req, res) => {
  // ... (CORS headers) ...
  if (req.method === 'OPTIONS') { return res.status(204).end(); }
  if (req.method !== 'GET') { return res.status(405).json({ message: 'Method Not Allowed' }); }

  // This check MUST match your Vercel setting
  const hasKey = Boolean(process.env.CLAUDE_API_KEY);

  return res.status(200).json({ 
    ok: true, 
    env: { 
      CLAUDE_API_KEY: hasKey ? 'present' : 'missing' 
    } 
  });
};
