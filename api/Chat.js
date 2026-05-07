const https = require('https');

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { messages, system } = req.body;

    const body = JSON.stringify({
      model: 'llama-3.3-70b-versatile',
      max_tokens: 800,
      temperature: 0.8,
      messages: [
        { role: 'system', content: system },
        ...messages
      ]
    });

    const reply = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.groq.com',
        path: '/openai/v1/chat/completions',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Length': Buffer.byteLength(body)
        }
      };

      const request = https.request(options, (response) => {
        let data = '';
        response.on('data', chunk => data += chunk);
        response.on('end', () => {
          try {
            const parsed = JSON.parse(data);
            if (parsed.error) return reject(new Error(parsed.error.message));
            resolve(parsed.choices?.[0]?.message?.content || '');
          } catch (e) { reject(e); }
        });
      });

      request.on('error', reject);
      request.write(body);
      request.end();
    });

    return res.status(200).json({ reply });

  } catch (err) {
    console.error('Erreur:', err.message);
    return res.status(500).json({ error: err.message });
  }
};
