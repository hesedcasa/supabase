import {type AuthConfig, createProfileManager, formatAsToon} from '@hesed/plugin-lib'
import {Args, Command, Flags} from '@oclif/core'

import type {IDataObject} from '../../supabase/supabase-api.js'

import {execute} from '../../supabase/supabase-client.js'

export default class SupabaseCreate extends Command {
  /* eslint-disable perfectionist/sort-objects */
  static override args = {
    table: Args.string({description: 'Table name', required: true}),
    data: Args.string({description: 'JSON object or array of objects to insert', required: true}),
  }
  /* eslint-enable perfectionist/sort-objects */
  static override description = 'Insert row(s) into a Supabase database table'
  static override examples = [
    '<%= config.bin %> <%= command.id %> users \'{"name":"Alice","email":"alice@example.com"}\'',
    '<%= config.bin %> <%= command.id %> users \'[{"name":"Alice"},{"name":"Bob"}]\'',
    '<%= config.bin %> <%= command.id %> products \'{"name":"Widget","price":9.99}\' --select id,name',
  ]
  static override flags = {
    format: Flags.string({
      default: 'json',
      description: 'Output format',
      options: ['json', 'toon'],
    }),
    schema: Flags.string({description: 'PostgREST schema name', required: false}),
    select: Flags.string({description: 'Comma-separated columns to return after insert', required: false}),
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(SupabaseCreate)
    const pm = createProfileManager<AuthConfig>(this.config)
    const auth = await pm.loadAuthConfig()
    if (!auth) {
      this.error(`Missing authentication config.`)
    }

    let data: IDataObject | IDataObject[]
    try {
      data = JSON.parse(args.data) as IDataObject | IDataObject[]
    } catch {
      this.error('Invalid JSON for data argument')
    }

    const result = await execute(auth, {
      data,
      operation: 'create',
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
