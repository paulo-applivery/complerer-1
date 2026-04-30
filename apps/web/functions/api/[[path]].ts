const WORKER_URL = 'https://api.complerer.com'

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
