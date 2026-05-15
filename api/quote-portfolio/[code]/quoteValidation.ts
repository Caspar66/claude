import type { VercelRequest, VercelResponse } from '@vercel/node';

const BASE_URL = process.env.OMNILIFE_BASE_URL ?? 'https://uat.omnilife.com.au/api/4';
const USERNAME = process.env.OMNILIFE_USERNAME ?? 'FinuraDigital';
const PASSWORD = process.env.OMNILIFE_PASSWORD ?? '16HahIceQ42WpmurCIdP';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { code, superFrequency, frequency } = req.query;
  const portfolioCode = Array.isArray(code) ? code[0] : code;
  if (!portfolioCode) {
    return res.status(400).json({ error: 'Missing portfolio code' });
  }

  const params = new URLSearchParams();
  const sf = Array.isArray(superFrequency) ? superFrequency[0] : superFrequency;
  const f = Array.isArray(frequency) ? frequency[0] : frequency;
  if (sf) params.set('superFrequency', sf);
  if (f) params.set('frequency', f);

  const url = `${BASE_URL}/quote/portfolio/${encodeURIComponent(portfolioCode)}/quoteValidation?${params.toString()}`;
  const auth = `Basic ${Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64')}`;

  try {
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const upstream = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: auth,
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body,
      redirect: 'follow',
    });

    const responseBody = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/json');
    res.send(responseBody);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(502).json({ error: 'Proxy error', detail: message });
  }
}
