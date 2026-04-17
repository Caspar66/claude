import type { VercelRequest, VercelResponse } from '@vercel/node';

// NOTE: the path case matters. `/api/4/*` returns JSON; `/API/4/*` returns
// the HTML documentation test page.
const BASE_URL = process.env.OMNILIFE_BASE_URL ?? 'https://uat.omnilife.com.au/api/4';
const USERNAME = process.env.OMNILIFE_USERNAME ?? 'FinuraDigital';
const PASSWORD = process.env.OMNILIFE_PASSWORD ?? '16HahIceQ42WpmurCIdP';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pathSegments = req.query.path;
  const subPath = Array.isArray(pathSegments) ? pathSegments.join('/') : pathSegments ?? '';
  const url = `${BASE_URL}/${subPath}`;

  try {
    const upstream = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Basic ${Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64')}`,
        Accept: 'application/json',
      },
    });

    const body = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/json');
    res.send(body);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(502).json({ error: 'Proxy error', detail: message });
  }
}
