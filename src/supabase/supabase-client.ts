import type {AuthConfig} from '../config.js'
import type {ApiResult, FilterCondition, IDataObject} from './supabase-api.js'

import {SupabaseApi} from './supabase-api.js'

type FilterMode = 'manual' | 'string'
type MatchType = 'allFilters' | 'anyFilter'
type RowOperation = 'create' | 'delete' | 'get' | 'getAll' | 'update'

interface ExecuteOptions {
  /** Record(s) to insert or update */
  data?: IDataObject | IDataObject[]
  /** Whether to match filters with AND ('allFilters') or OR ('anyFilter') logic */
  filterMode?: FilterMode
  /** Filter conditions for manual mode */
  filters?: FilterCondition[]
  /** Raw PostgREST filter string for string mode (e.g. "name=eq.Alice&age=gt.30") */
  filtersString?: string
  /** Max rows to return when returnAll is false (default: 100) */
  limit?: number
  /** How to combine manual filters (default: 'allFilters') */
  matchType?: MatchType
  /** Row operation to perform */
  operation: RowOperation
  /** Return all rows via pagination (getAll only, default: false) */
  returnAll?: boolean
  /** Optional PostgREST schema name */
  schema?: string
  /** Comma-separated columns to select */
  select?: string
  /** Target table name */
  tableId: string
}

let supabaseApi: null | SupabaseApi

/**
 * Initialize Supabase API
 */
async function initSupabase(config: AuthConfig): Promise<SupabaseApi> {
  if (supabaseApi) return supabaseApi

  try {
    supabaseApi = new SupabaseApi(config)
    return supabaseApi
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    throw new Error(`Failed to initialize Supabase client: ${errorMessage}`)
  }
}

export async function getTables(config: AuthConfig): Promise<ApiResult> {
  const supabase = await initSupabase(config)
  const result = await supabase.request('GET', '/')

  if (result.error || !result.data) {
    return result
  }

  const returnData = []
  const {paths} = result.data

  for (const path of Object.keys(paths as IDataObject)) {
    // omit introspection path
    if (path === '/') continue
    returnData.push({
      name: path.replace('/', ''),
      value: path.replace('/', ''),
    })
  }

  result.data = {returnData}

  return result
}

export async function getTableColumns(config: AuthConfig, tableName: string): Promise<ApiResult> {
  const supabase = await initSupabase(config)
  const result = await supabase.request('GET', '/')

  if (result.error) {
    return result
  }

  if (!result.data) {
    return {error: 'Empty data', success: false}
  }

  const returnData = []
  const {definitions} = result.data

  if (
    !definitions ||
    definitions === undefined ||
    !(definitions as IDataObject)[tableName] ||
    !((definitions as IDataObject)[tableName] as IDataObject).properties
  ) {
    return {error: `Table ${tableName} not found`, success: false}
  }

  for (const column of Object.keys(((definitions as IDataObject)[tableName] as IDataObject).properties as object)) {
    const {type} = (((definitions as IDataObject)[tableName] as IDataObject).properties as IDataObject)[
      column
    ] as IDataObject
    returnData.push({
      name: `${column} - (${type})`,
      value: column,
    })
  }

  result.data = {returnData}

  return result
}

/**
 * Test Supabase API connection
 * @param config - Supabase configuration
 */
export async function testConnection(config: AuthConfig): Promise<ApiResult> {
  const supabase = await initSupabase(config)
  return supabase.validateCredentials()
}

/**
 * Execute a row operation (create, get, update, delete) on a Supabase table.
 *
 * Filter modes:
 *   - 'manual': use the `filters` array with optional `matchType` ('allFilters' for AND, 'anyFilter' for OR)
 *   - 'string': use `filtersString` as a raw PostgREST query string (e.g. "status=eq.active&age=gt.18")
 *
 * getAll pagination:
 *   - `returnAll: false` (default) — single request capped at `limit` rows
 *   - `returnAll: true` — paginates in 1000-row pages and accumulates all results in `data.rows`
 *
 * @param config - Supabase API credentials
 * @param options - Operation parameters
 */
export async function execute(config: AuthConfig, options: ExecuteOptions): Promise<ApiResult> {
  const supabase = await initSupabase(config)
  const {filterMode, filters, filtersString, matchType, operation, schema, select, tableId} = options

  const applyFilters = (qs: Record<string, string>): Record<string, string> => {
    if (filterMode === 'string' && filtersString) {
      for (const part of filtersString.split('&')) {
        const eqIndex = part.indexOf('=')
        if (eqIndex !== -1) {
          const key = decodeURIComponent(part.slice(0, eqIndex))
          const val = decodeURIComponent(part.slice(eqIndex + 1))
          qs[key] = val
        }
      }
    } else if (filters?.length && filters.length > 0) {
      if (matchType === 'allFilters') {
        for (const f of filters) {
          supabase.buildQuery(qs, f)
        }
      } else {
        qs.or = `(${filters.map((f) => supabase.buildOrQuery(f)).join(',')})`
      }
    }

    return qs
  }

  if (operation === 'create') {
    const records = (Array.isArray(options.data) ? options.data : [options.data ?? {}]) as Record<string, unknown>[]
    const qs: Record<string, string> = {}
    if (select) qs.select = select
    return supabase.request('POST', `/${tableId}`, records, qs, undefined, supabase.getSchemaHeader('POST', schema))
  }

  if (operation === 'get') {
    const {limit = 100} = options
    const qs = applyFilters({limit: String(limit), offset: '0'})
    if (select) qs.select = select
    return supabase.request('GET', `/${tableId}`, {}, qs, undefined, supabase.getSchemaHeader('GET', schema))
  }

  if (operation === 'update') {
    const qs = applyFilters({})
    if (select) qs.select = select
    const body = (Array.isArray(options.data) ? options.data[0] : (options.data ?? {})) as Record<string, unknown>
    return supabase.request('PATCH', `/${tableId}`, body, qs, undefined, supabase.getSchemaHeader('PATCH', schema))
  }

  if (operation === 'delete') {
    const qs = applyFilters({})
    if (select) qs.select = select
    return supabase.request('DELETE', `/${tableId}`, {}, qs, undefined, supabase.getSchemaHeader('DELETE', schema))
  }

  return {error: `Unknown operation: ${operation}`, success: false}
}
