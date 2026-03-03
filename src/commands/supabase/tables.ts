import {Command, Flags} from '@oclif/core'

import {readConfig} from '../../config.js'
import {formatAsToon} from '../../format.js'
import {getTables} from '../../supabase/supabase-client.js'

export default class SupabaseTables extends Command {
  static override args = {}
  static override description = 'List all tables in Supabase database'
  static override examples = ['<%= config.bin %> <%= command.id %>']
  static override flags = {
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<void> {
    const {flags} = await this.parse(SupabaseTables)
    const config = await readConfig(this.config.configDir, this.log.bind(this))
    if (!config) {
      return
    }

    const result = await getTables(config.auth)

    if (flags.toon) {
      this.log(formatAsToon(result))
    } else {
      this.logJson(result)
    }
  }
}
