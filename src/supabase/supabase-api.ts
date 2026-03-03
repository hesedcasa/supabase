import type {AuthConfig} from '../config.js'

type HttpMethod = 'DELETE' | 'GET' | 'HEAD' | 'PATCH' | 'POST' | 'PUT'

/**
 * Generic API result
 */
export interface ApiResult {
  data?: IDataObject
  error?: unknown
  success: boolean
}

/**
 * Generic data object for node parameters and data.
 * Supports nested objects and arrays.
 */
export interface IDataObject {
  [key: string]:
    | Array<boolean | IDataObject | null | number | object | string>
    | boolean
    | IDataObject
    | null
    | number
    | object
    | string
    | undefined
}

export interface FilterCondition {
  condition: string
  keyName: string
  keyValue: string
  searchFunction?: string
}

export class SupabaseApi {
  private config: AuthConfig

  constructor(config: AuthConfig) {
    this.config = config
  }

  buildGetQuery(obj: Record<string, string>, value: FilterCondition): Record<string, string> {
    return Object.assign(obj, {[value.keyName]: `eq.${value.keyValue}`})
  }

  buildOrQuery(key: FilterCondition): string {
    if (key.condition === 'fullText') {
      return `${key.keyName}.${key.searchFunction}.${key.keyValue}`
    }

    return `${key.keyName}.${key.condition}.${key.keyValue}`
  }

  buildQuery(obj: Record<string, string>, value: FilterCondition): Record<string, string> {
    if (value.condition === 'fullText') {
      return Object.assign(obj, {[value.keyName]: `${value.searchFunction}.${value.keyValue}`})
    }

    return Object.assign(obj, {[value.keyName]: `${value.condition}.${value.keyValue}`})
  }

  getSchemaHeader(method: HttpMethod, schema?: string): Record<string, string> {
    if (!schema) return {}

    const headers: Record<string, string> = {}

    if (['DELETE', 'PATCH', 'POST', 'PUT'].includes(method)) {
      headers['Content-Profile'] = schema
    } else if (['GET', 'HEAD'].includes(method)) {
      headers['Accept-Profile'] = schema
    }

    return headers
  }

  // eslint-disable-next-line max-params
  async request(
    method: HttpMethod,
    resource: string,
    body: Record<string, unknown> | Record<string, unknown>[] = {},
    qs: Record<string, string> = {},
    uri?: string,
    headers: Record<string, string> = {},
  ): Promise<ApiResult> {
    try {
      const url = new URL(uri ?? `${this.config.host}/rest/v1${resource}`)

      for (const [key, value] of Object.entries(qs)) {
        url.searchParams.set(key, value)
      }

      const requestHeaders: Record<string, string> = {
        apikey: this.config.apiToken,
        Authorization: `Bearer ${this.config.apiToken}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
        ...headers,
      }

      const hasBody = Array.isArray(body) ? body.length > 0 : Object.keys(body).length > 0

      // eslint-disable-next-line n/no-unsupported-features/node-builtins
      const response = await fetch(url.toString(), {
        ...(hasBody ? {body: JSON.stringify(body)} : {}),
        headers: requestHeaders,
        method,
      })

      if (!response.ok) {
        const error = await response.json().catch(() => ({message: response.statusText}))
        throw new Error((error as {message?: string}).message ?? response.statusText)
      }

      return {
        data: await response.json(),
        success: true,
      }
    } catch (error: unknown) {
      return {
        error: error instanceof Error ? error.message : error,
        success: false,
      }
    }
  }

  async validateCredentials(): Promise<ApiResult> {
    try {
      // eslint-disable-next-line n/no-unsupported-features/node-builtins
      const response = await fetch(`${this.config.host}/rest/v1/`, {
        headers: {
          apikey: this.config.apiToken,
          Authorization: `Bearer ${this.config.apiToken}`,
        },
        method: 'GET',
      })

      return {
        success: response.ok,
      }
    } catch (error: unknown) {
      return {
        error: error instanceof Error ? error.message : error,
        success: false,
      }
    }
  }
}
