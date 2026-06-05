import {type AuthConfig, createProfileManager, formatAsToon} from '@hesed/plugin-lib'
import {Command, Flags} from '@oclif/core'

import {getTables} from '../../supabase/supabase-client.js'

export default class SupabaseTables extends Command {
  static override args = {}
  static override description = 'List all tables in Supabase database'
  static override examples = ['<%= config.bin %> <%= command.id %>']
  static override flags = {
    profile: Flags.string({char: 'p', description: 'Authentication profile name', required: false}),
    schema: Flags.string({description: 'PostgREST schema name', required: false}),
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(SupabaseTables)
    const pm = createProfileManager<AuthConfig>(this.config, flags.profile, 'spb-config.json')
    const auth = await pm.loadAuthConfig()
    if (!auth) {
      this.error(`Missing authentication config.`)
    }

    const result = await getTables(auth, flags.schema)

    if (flags.toon) {
      this.log(formatAsToon(result))
    } else {
      this.logJson(result)
    }
  }
}
