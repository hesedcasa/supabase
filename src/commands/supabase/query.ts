import {Args, Command, Flags} from '@oclif/core'

import {readConfig} from '../../config.js'
import {formatAsToon} from '../../format.js'
import {execute} from '../../supabase/supabase-client.js'

export default class SupabaseQuery extends Command {
  /* eslint-disable perfectionist/sort-objects */
  static override args = {
    table: Args.string({description: 'Table name', required: true}),
    select: Args.string({description: 'Columns to return in the result', required: true}),
  }
  /* eslint-enable perfectionist/sort-objects */
  static override description = 'Execute query on Supabase database table'
  static override examples = [
    '<%= config.bin %> <%= command.id %> users first_name,last_name,email --filters "created_at=gt.2017-01-01"',
    '<%= config.bin %> <%= command.id %> users id,email --filters "age=gte.18&status=eq.active"',
    '<%= config.bin %> <%= command.id %> products name,price --filters "name=ilike.*phone*"',
    '<%= config.bin %> <%= command.id %> orders id,total --filters "status=in.(pending,processing)&total=gte.100"',
    '<%= config.bin %> <%= command.id %> posts id,title --filters "or=(author_id.eq.5,featured.is.true)"',
    '<%= config.bin %> <%= command.id %> events id,name --filters "tags=cs.{sale,featured}"',
    '<%= config.bin %> <%= command.id %> articles id,title --filters "body=fts.climate%20change"',
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
      summary: 'PostgREST filter string (e.g. "age=gte.18&status=eq.active")',
    }),
    limit: Flags.integer({description: 'Max rows to return', required: false}),
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(SupabaseQuery)
    const config = await readConfig(this.config.configDir, this.log.bind(this))
    if (!config) {
      return
    }

    const result = await execute(config.auth, {
      filterMode: 'string',
      filtersString: flags.filters,
      limit: flags.limit,
      operation: 'get',
      select: args.select,
      tableId: args.table,
    })

    if (flags.toon) {
      this.log(formatAsToon(result))
    } else {
      this.logJson(result)
    }
  }
}
