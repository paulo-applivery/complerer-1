interface Env {
  ASSETS: Fetcher
  API_ORIGIN: string
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    if (url.pathname === '/api' || url.pathname.startsWith('/api/')) {
      const target = `${env.API_ORIGIN}${url.pathname}${url.search}`
      const proxied = new Request(target, request)
      proxied.headers.set('host', new URL(env.API_ORIGIN).host)
      return fetch(proxied)
    }

    return env.ASSETS.fetch(request)
  },
}
