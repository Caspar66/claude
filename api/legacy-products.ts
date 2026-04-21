import type { VercelRequest, VercelResponse } from '@vercel/node';

const BASE_URL = process.env.OMNILIFE_BASE_URL ?? 'https://uat.omnilife.com.au/api/4';
const USERNAME = process.env.OMNILIFE_USERNAME ?? 'FinuraDigital';
const PASSWORD = process.env.OMNILIFE_PASSWORD ?? '16HahIceQ42WpmurCIdP';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const q = req.query;
  const params = new URLSearchParams();
  if (typeof q.supplierCode === 'string') params.set('supplierCode', q.supplierCode);
  if (typeof q.date === 'string') params.set('date', q.date);
  if (typeof q.coverNeedType === 'string') params.set('coverNeedType', q.coverNeedType);
  if (typeof q.ownership === 'string') params.set('ownership', q.ownership);
  if (typeof q.mandatory === 'string') params.set('mandatory', q.mandatory);

  const url = `${BASE_URL}/legacy/products?${params.toString()}`;
  const auth = `Basic ${Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64')}`;

  try {
    const upstream = await fetch(url, {
      method: 'POST',
      headers: {
        Authorization: auth,
        Accept: 'application/json',
      },
      redirect: 'follow',
    });

    const body = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/json');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.send(body);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(502).json({ error: 'Proxy error', detail: message });
  }
}
