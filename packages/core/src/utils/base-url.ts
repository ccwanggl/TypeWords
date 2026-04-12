const ABSOLUTE_URL_RE = /^[a-z][a-z\d+.-]*:/i

export function normalizeBaseURL(baseURL: string = '/') {
  if (!baseURL) return '/'

  let normalizedBaseURL = baseURL.trim()

  if (!normalizedBaseURL.startsWith('/')) {
    normalizedBaseURL = `/${normalizedBaseURL}`
  }
  if (!normalizedBaseURL.endsWith('/')) {
    normalizedBaseURL = `${normalizedBaseURL}/`
  }

  return normalizedBaseURL.replace(/\/{2,}/g, '/')
}

export function getAppBaseURL() {
  const runtimeBaseURL =
    typeof globalThis !== 'undefined' ? (globalThis as any).__NUXT__?.config?.app?.baseURL : undefined
  const viteBaseURL = import.meta.env?.BASE_URL
  const envBaseURL = typeof process !== 'undefined' ? process.env?.NUXT_APP_BASE_URL : undefined

  return normalizeBaseURL(runtimeBaseURL || viteBaseURL || envBaseURL || '/')
}

export function withAppBaseURL(path: string = '', baseURL: string = getAppBaseURL()) {
  if (!path || ABSOLUTE_URL_RE.test(path) || path.startsWith('//') || !path.startsWith('/')) {
    return path
  }

  const normalizedBaseURL = normalizeBaseURL(baseURL)

  if (normalizedBaseURL === '/') {
    return path
  }

  const basePath = normalizedBaseURL.slice(0, -1)

  if (path === '/') {
    return normalizedBaseURL
  }
  if (path === basePath || path.startsWith(`${basePath}/`)) {
    return path
  }

  return `${basePath}${path}`
}

export function toSiteURL(path: string, origin: string, baseURL: string = getAppBaseURL()) {
  return new URL(withAppBaseURL(path, baseURL), origin).toString()
}
