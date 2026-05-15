import type { VercelRequest, VercelResponse } from '@vercel/node';

const BASE_URL = process.env.OMNILIFE_BASE_URL ?? 'https://uat.omnilife.com.au/api/4';
const USERNAME = process.env.OMNILIFE_USERNAME ?? 'FinuraDigital';
const PASSWORD = process.env.OMNILIFE_PASSWORD ?? '16HahIceQ42WpmurCIdP';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const { supplierCode, searchText } = req.query;
  const code = Array.isArray(supplierCode) ? supplierCode[0] : supplierCode;
  if (!code) {
    res.status(400).json({ error: 'Missing supplierCode' });
    return;
  }

  const params = new URLSearchParams();
  const text = Array.isArray(searchText) ? searchText[0] : searchText;
  if (text) params.set('searchText', text);

  const url = `${BASE_URL}/suppliers/${encodeURIComponent(code)}/occupations?${params.toString()}`;
  const auth = `Basic ${Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64')}`;

  try {
    const upstream = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: auth,
        Accept: 'application/json',
      },
      redirect: 'follow',
    });

    const body = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.send(body);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(502).json({ error: 'Proxy error', detail: message });
  }
}
