import {input} from '@inquirer/prompts'
import {Command, Flags} from '@oclif/core'
import {action} from '@oclif/core/ux'
import {default as fs} from 'fs-extra'
import {default as path} from 'node:path'

import type {ApiResult} from '../../../supabase/supabase-api.js'

import {testConnection} from '../../../supabase/supabase-client.js'

export default class AuthAdd extends Command {
  static override args = {}
  static override description = 'Add a Supabase connection'
  static override enableJsonFlag = true
  static override examples = ['<%= config.bin %> <%= command.id %>']
  static override flags = {
    token: Flags.string({description: 'API Token:', required: !process.stdout.isTTY}),
    url: Flags.string({description: 'Supabase API URL:', required: !process.stdout.isTTY}),
  }

  public async run(): Promise<ApiResult> {
    const {flags} = await this.parse(AuthAdd)

    const apiToken = flags.token ?? (await input({message: 'API token:', required: true}))
    const host = flags.url ?? (await input({message: 'Supabase API URL:', required: true}))
    const configPath = path.join(this.config.configDir, 'spb-config.json')
    const auth = {
      auth: {
        apiToken,
        host,
      },
    }

    const exists = await fs.pathExists(configPath)

    if (!exists) {
      await fs.createFile(configPath)
    }

    await fs.writeJSON(configPath, auth, {
      mode: 0o600, // owner read/write only
    })

    action.start('Authenticating')
    const config = await fs.readJSON(configPath)
    const result = await testConnection(config.auth)

    if (result.success) {
      action.stop('✓ successful')
      this.log('Authentication added successfully')
    } else {
      action.stop('✗ failed')
      this.error('Authentication is invalid. Please check your token, and URL.')
    }

    return result
  }
}
