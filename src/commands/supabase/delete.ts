import {Args, Command, Flags} from '@oclif/core'

import {readConfig} from '../../config.js'
import {formatAsToon} from '../../format.js'
import {execute} from '../../supabase/supabase-client.js'

export default class SupabaseDelete extends Command {
  static override args = {
    table: Args.string({description: 'Table name', required: true}),
  }
  static override description = 'Delete row(s) from a Supabase database table'
  static override examples = [
    '<%= config.bin %> <%= command.id %> users --filters "id=eq.42"',
    '<%= config.bin %> <%= command.id %> orders --filters "status=eq.cancelled&created_at=lt.2024-01-01"',
    '<%= config.bin %> <%= command.id %> sessions --filters "user_id=eq.5" --select id',
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
    schema: Flags.string({description: 'PostgREST schema name', required: false}),
    select: Flags.string({description: 'Comma-separated columns to return after delete', required: false}),
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(SupabaseDelete)
    const config = await readConfig(this.config.configDir, this.log.bind(this))
    if (!config) {
      return
    }

    const result = await execute(config.auth, {
      filterMode: 'string',
      filtersString: flags.filters,
      operation: 'delete',
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
