import {Args, Command, Flags} from '@oclif/core'

import {readConfig} from '../../config.js'
import {formatAsToon} from '../../format.js'
import {getTableColumns} from '../../supabase/supabase-client.js'

export default class SupabaseTableColumns extends Command {
  static override args = {
    table: Args.string({description: 'Table name to get columns', required: true}),
  }
  static override description = 'List all columns in a table in Supabase database'
  static override examples = ['<%= config.bin %> <%= command.id %>']
  static override flags = {
    toon: Flags.boolean({description: 'Format output as toon', required: false}),
  }

  public async run(): Promise<void> {
    const {args, flags} = await this.parse(SupabaseTableColumns)
    const config = await readConfig(this.config.configDir, this.log.bind(this))
    if (!config) {
      return
    }

    const result = await getTableColumns(config.auth, args.table)

    if (flags.toon) {
      this.log(formatAsToon(result))
    } else {
      this.logJson(result)
    }
  }
}
