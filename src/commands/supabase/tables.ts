import {type ApiResult, type AuthConfig, createProfileManager, formatAsToon} from '@hesed/plugin-lib'
import {Flags} from '@oclif/core'

import {BaseCommand} from '../../base-command.js'
import {getTables} from '../../supabase/supabase-client.js'

export default class SupabaseTables extends BaseCommand {
  static override args = {}
  static override description = 'List all tables in Supabase database'
  static override examples = ['<%= config.bin %> <%= command.id %>']
  static override flags = {
    profile: Flags.string({char: 'p', description: 'Authentication profile name', required: false}),
    schema: Flags.string({description: 'PostgREST schema name', required: false}),
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<ApiResult> {
    const {flags} = await this.parse(SupabaseTables)
    const pm = createProfileManager<AuthConfig>(this.config, flags.profile, 'spb-config.json')
    const auth = await pm.loadAuthConfig()
    if (!auth) {
      this.error(`Missing authentication config.`)
    }

    const result = await getTables(auth, flags.schema)

    if (flags.toon) {
      this.log(formatAsToon(result))
    }

    return result
  }
}
