import {type AuthConfig, createProfileManager, formatAsToon} from '@hesed/plugin-lib'
import {Args, Command, Flags} from '@oclif/core'

import {getTableColumns} from '../../supabase/supabase-client.js'

export default class SupabaseTableColumns extends Command {
  static override args = {
    table: Args.string({description: 'Table name to get columns', required: true}),
  }
  static override description = 'List all columns in a table in Supabase database'
  static override examples = ['<%= config.bin %> <%= command.id %>']
  static override flags = {
    schema: Flags.string({description: 'PostgREST schema name', required: false}),
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(SupabaseTableColumns)
    const pm = createProfileManager<AuthConfig>(this.config)
    const auth = await pm.loadAuthConfig()
    if (!auth) {
      this.error(`Missing authentication config.`)
    }

    const result = await getTableColumns(auth, args.table, flags.schema)

    if (flags.toon) {
      this.log(formatAsToon(result))
    } else {
      this.logJson(result)
    }
  }
}
