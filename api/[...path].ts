import type { VercelRequest, VercelResponse } from '@vercel/node';

const BASE_URL = process.env.OMNILIFE_BASE_URL ?? 'https://uat.omnilife.com.au/api/4';
const USERNAME = process.env.OMNILIFE_USERNAME ?? 'FinuraDigital';
const PASSWORD = process.env.OMNILIFE_PASSWORD ?? '16HahIceQ42WpmurCIdP';

function str(v: string | string[] | undefined): string {
  return Array.isArray(v) ? v[0] : v ?? '';
}

interface Route {
  upstream: string;
  method: 'GET' | 'POST';
  cache?: string;
  hasBody?: boolean;
}

function resolve(segments: string[], query: VercelRequest['query'], rawUrl: string): Route | null {
  const s0 = segments[0];

  if (s0 === 'occupations' && segments.length === 1)
    return { upstream: '/occupations', method: 'GET', cache: 'public, max-age=3600' };

  if (s0 === 'occupation-mappings' && segments.length === 2) {
    const id = encodeURIComponent(segments[1]);
    return { upstream: `/occupations/${id}/mappings`, method: 'GET', cache: 'public, max-age=3600' };
  }

  if (s0 === 'legacy-suppliers' && segments.length === 1)
    return { upstream: '/legacy/suppliers', method: 'POST', cache: 'public, max-age=3600' };

  if (s0 === 'legacy-portfolios' && segments.length === 1)
    return { upstream: '/legacy/portfolios', method: 'POST', cache: 'public, max-age=3600' };

  if (s0 === 'legacy-products' && segments.length === 1) {
    const params = new URLSearchParams();
    if (typeof query.supplierCode === 'string') params.set('supplierCode', query.supplierCode);
    if (typeof query.date === 'string') params.set('date', query.date);
    if (typeof query.coverNeedType === 'string') params.set('coverNeedType', query.coverNeedType);
    return { upstream: `/legacy/products?${params.toString()}`, method: 'POST', cache: 'public, max-age=3600' };
  }

  if (s0 === 'suppliers' && segments.length === 1)
    return { upstream: '/suppliers', method: 'GET', cache: 'public, max-age=3600' };

  if (s0 === 'supplier-occupations' && segments.length === 3 && segments[2] === 'occupations') {
    const code = encodeURIComponent(segments[1]);
    const params = new URLSearchParams();
    const text = str(query.searchText);
    if (text) params.set('searchText', text);
    return { upstream: `/suppliers/${code}/occupations?${params.toString()}`, method: 'GET', cache: 'public, max-age=300' };
  }

  if (s0 === 'quote-portfolio' && segments.length === 1) {
    const qs = rawUrl.includes('?') ? rawUrl.substring(rawUrl.indexOf('?')) : '';
    return { upstream: `/quote/portfolio${qs}`, method: 'POST', hasBody: true };
  }

  if (s0 === 'quote-portfolio' && segments.length === 3 && segments[2] === 'quoteValidation') {
    const code = encodeURIComponent(segments[1]);
    const params = new URLSearchParams();
    const sf = str(query.superFrequency);
    const f = str(query.frequency);
    if (sf) params.set('superFrequency', sf);
    if (f) params.set('frequency', f);
    return { upstream: `/quote/portfolio/${code}/quoteValidation?${params.toString()}`, method: 'POST', hasBody: true };
  }

  if (s0 === 'quote-portfolio-features' && segments.length === 1) {
    const codes = str(query.codes);
    if (!codes) return null;
    const qs = new URLSearchParams();
    for (const [key, val] of Object.entries(query)) {
      if (key !== 'codes' && key !== 'path' && typeof val === 'string') qs.set(key, val);
    }
    return { upstream: `/quote/portfolio/${encodeURIComponent(codes)}/features?${qs.toString()}`, method: 'POST', hasBody: true };
  }

  if (s0 === 'product-options' && segments.length === 1) {
    const portfolioCode = str(query.portfolioCode);
    if (!portfolioCode) return null;
    return { upstream: `/quote/portfolio/${encodeURIComponent(portfolioCode)}/productOptions`, method: 'POST', hasBody: true };
  }

  if (s0 === 'gained-and-lost' && segments.length === 1) {
    const qs = rawUrl.includes('?') ? rawUrl.substring(rawUrl.indexOf('?')) : '';
    return { upstream: `/research/portfolio/gainedAndLost${qs}`, method: 'POST', hasBody: true };
  }

  if (s0 === 'portfolio-features' && segments.length === 1) {
    const qs = rawUrl.includes('?') ? rawUrl.substring(rawUrl.indexOf('?')) : '';
    return { upstream: `/research/portfolio/features${qs}`, method: 'POST', hasBody: true };
  }

  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pathParam = req.query.path;
  const segments: string[] = Array.isArray(pathParam)
    ? pathParam
    : typeof pathParam === 'string'
      ? pathParam.split('/')
      : [];

  const route = resolve(segments, req.query, req.url ?? '');
  if (!route) {
    return res.status(404).json({ error: 'Unknown API route', path: segments.join('/') });
  }

  const url = `${BASE_URL}${route.upstream}`;
  const auth = `Basic ${Buffer.from(`${USERNAME}:${PASSWORD}`).toString('base64')}`;

  const headers: Record<string, string> = {
    Authorization: auth,
    Accept: 'application/json',
  };

  let body: string | undefined;
  if (route.hasBody || route.method === 'POST') {
    if (req.body !== undefined && req.body !== null) {
      body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
      headers['Content-Type'] = 'application/json';
    }
  }

  try {
    const upstream = await fetch(url, {
      method: route.method,
      headers,
      body: route.method === 'POST' ? body : undefined,
      redirect: 'follow',
    });

    const responseBody = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', upstream.headers.get('content-type') ?? 'application/json');
    if (route.cache) res.setHeader('Cache-Control', route.cache);
    res.send(responseBody);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    res.status(502).json({ error: 'Proxy error', detail: message });
  }
}
