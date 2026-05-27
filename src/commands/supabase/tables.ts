import {createProfileManager, formatAsToon} from '@hesed/plugin-lib'
import {Command, Flags} from '@oclif/core'

import type {AuthConfig} from '../../supabase/supabase-api.js'

import {getTables} from '../../supabase/supabase-client.js'

export default class SupabaseTables extends Command {
  static override args = {}
  static override description = 'List all tables in Supabase database'
  static override examples = ['<%= config.bin %> <%= command.id %>']
  static override flags = {
    schema: Flags.string({description: 'PostgREST schema name', required: false}),
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(SupabaseTables)
    const pm = createProfileManager<AuthConfig>(this.config)
    const auth = await pm.loadAuthConfig()
    if (!auth) {
      this.error('Not authenticated. Run spb auth add first.')
      return
    }

    const result = await getTables(auth, flags.schema)

    if (flags.toon) {
      this.log(formatAsToon(result))
    } else {
      this.logJson(result)
    }
  }
}
