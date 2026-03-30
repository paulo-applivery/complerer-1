const WORKER_URL = 'https://complerer-api-production.paulo-acb.workers.dev'

export async function onRequest(context: EventContext<Record<string, unknown>, string, Record<string, unknown>>) {
  const url = new URL(context.request.url)
  const target = `${WORKER_URL}${url.pathname}${url.search}`

  const req = new Request(target, {
    method: context.request.method,
    headers: context.request.headers,
    body: ['GET', 'HEAD'].includes(context.request.method) ? undefined : context.request.body,
    redirect: 'follow',
  })

  return fetch(req)
}
