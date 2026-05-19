# Project Knowledge

## API Proxy Routing

All OmniLife API calls must be routed through **two** proxy layers:

### 1. Vite Dev Proxy (`vite.config.ts`)

Used during local development only (`npm run dev`).

- Location: `/home/user/claude/vite.config.ts` → `server.proxy` object
- Auth is injected automatically via `authHeader` (Basic auth from env vars)
- Each route maps a local `/api/<name>` path to the upstream OmniLife endpoint
- **Route ordering matters**: more specific paths (e.g. `/api/supplier-documents`) must appear BEFORE less specific prefixes (e.g. `/api/suppliers`) to avoid incorrect matching

Example:
```ts
'/api/supplier-documents': {
  target,              // https://uat.omnilife.com.au/api/4
  changeOrigin: true,
  rewrite: (p: string) => p.replace('/api/supplier-documents', '/suppliers/documents'),
  secure: true,
  headers: { Authorization: authHeader },
},
```

### 2. Vercel Serverless Proxy (`api/proxy.ts`)

Used in production/preview deployments on Vercel. **This is required for any API route to work in deployed environments.**

- Location: `/home/user/claude/api/proxy.ts`
- Vercel rewrites (`vercel.json`) route all `/api/*` requests to this single function: `/api/proxy?_path=<route>`
- The `resolve()` function maps path segments + query params to upstream OmniLife URLs
- Auth is injected via Basic auth from env vars

Example — adding a new route:
```ts
// In the resolve() function:
if (s0 === 'supplier-documents' && segments.length === 1) {
  return { upstream: `/suppliers/documents${forwardQs(query)}`, method: 'GET', cache: 'public, max-age=3600' };
}
```

### Adding a New API Endpoint — Checklist

1. **Add Vite proxy** in `vite.config.ts` under `server.proxy` (for local dev)
   - Watch for prefix collisions with existing routes
2. **Add route** in `api/proxy.ts` `resolve()` function (for Vercel production)
3. **Add fetch function** in `src/services/omnilifeApi.ts` that calls `/api/<name>`
4. All three must use the same `/api/<name>` path convention

### Route Config Reference

| Method | Route interface fields |
|--------|----------------------|
| `upstream` | The OmniLife API path (appended to base URL) |
| `method` | `'GET'` or `'POST'` |
| `cache` | Optional Cache-Control header value |
| `hasBody` | Set `true` if the request sends a JSON body |

### Environment Variables

- `OMNILIFE_BASE_URL` — API base (default: `https://uat.omnilife.com.au/api/4`)
- `OMNILIFE_USERNAME` — Basic auth username (default: `FinuraDigital`)
- `OMNILIFE_PASSWORD` — Basic auth password
