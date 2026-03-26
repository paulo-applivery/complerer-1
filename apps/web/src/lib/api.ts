const BASE_URL = '/api'

function getUserId(): string | null {
  return localStorage.getItem('userId')
}

function getHeaders(): HeadersInit {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }
  const userId = getUserId()
  if (userId) {
    headers['X-User-Id'] = userId
  }
  return headers
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${path}`
  const response = await fetch(url, {
    ...options,
    headers: {
      ...getHeaders(),
      ...options.headers,
    },
  })

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }))
    throw new Error(error.message || `HTTP ${response.status}`)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return response.json()
}

export const api = {
  get<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'GET' })
  },

  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    })
  },

  patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    })
  },

  put<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  },

  delete<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'DELETE' })
  },

  upload<T>(path: string, formData: FormData): Promise<T> {
    const url = `${BASE_URL}${path}`
    const headers: HeadersInit = {}
    const userId = getUserId()
    if (userId) headers['X-User-Id'] = userId
    // Don't set Content-Type — browser sets it with boundary for multipart
    return fetch(url, { method: 'POST', headers, body: formData }).then(async (res) => {
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: 'Upload failed' }))
        throw new Error(error.message || `HTTP ${res.status}`)
      }
      return res.json()
    })
  },
}
