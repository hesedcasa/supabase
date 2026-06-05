import {type AuthConfig, createProfileManager, formatAsToon} from '@hesed/plugin-lib'
import {Args, Command, Flags} from '@oclif/core'

import {execute, type IDataObject} from '../../supabase/supabase-client.js'

export default class SupabaseUpdate extends Command {
  /* eslint-disable perfectionist/sort-objects */
  static override args = {
    table: Args.string({description: 'Table name', required: true}),
    data: Args.string({description: 'JSON object with fields to update', required: true}),
  }
  /* eslint-enable perfectionist/sort-objects */
  static override description = 'Update row(s) in a Supabase database table'
  static override examples = [
    '<%= config.bin %> <%= command.id %> users \'{"status":"active"}\' --filters "id=eq.42"',
    '<%= config.bin %> <%= command.id %> products \'{"price":19.99}\' --filters "name=eq.Widget" --select id,name,price',
    '<%= config.bin %> <%= command.id %> orders \'{"status":"shipped"}\' --filters "status=eq.pending&total=gte.100"',
  ]
  static override flags = {
    filters: Flags.string({
      description: `format: <column>=<operator>.<value>, combine multiple filters with & (AND)
comparison: eq, neq, gt, gte, lt, lte
pattern: like (case-sensitive, use * as wildcard), ilike (case-insensitive)
regex: match (~), imatch (~*)
list: in.(v1,v2), not.in.(v1,v2)
bool: is.null, is.true, is.false
logic: or=(col1.op.val,col2.op.val), not.<op>.<val>
array: cs.{v1,v2} (contains), cd.{v1,v2} (contained by)
full-text: fts.query, plfts.query, phfts.query, wfts.query`,
      required: true,
      summary: 'PostgREST filter string (e.g. "id=eq.42")',
    }),
    profile: Flags.string({char: 'p', description: 'Authentication profile name', required: false}),
    schema: Flags.string({description: 'PostgREST schema name', required: false}),
    select: Flags.string({description: 'Comma-separated columns to return after update', required: false}),
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(SupabaseUpdate)
    const pm = createProfileManager<AuthConfig>(this.config, flags.profile, 'spb-config.json')
    const auth = await pm.loadAuthConfig()
    if (!auth) {
      this.error(`Missing authentication config.`)
    }

    let data: IDataObject
    try {
      data = JSON.parse(args.data) as IDataObject
    } catch {
      this.error('Invalid JSON for data argument')
    }

    const result = await execute(auth, {
      data,
      filterMode: 'string',
      filtersString: flags.filters,
      operation: 'update',
      schema: flags.schema,
      select: flags.select,
      tableId: args.table,
    })

    if (flags.toon) {
      this.log(formatAsToon(result))
    } else {
      this.logJson(result)
    }
  }
}
