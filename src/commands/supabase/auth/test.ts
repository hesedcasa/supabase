import {Command} from '@oclif/core'
import {action} from '@oclif/core/ux'

import type {ApiResult} from '../../../supabase/supabase-api.js'

import {readConfig} from '../../../config.js'
import {testConnection} from '../../../supabase/supabase-client.js'

export default class AuthTest extends Command {
  static override args = {}
  static override description = 'Test Supabase authentication and connection'
  static override enableJsonFlag = true
  static override examples = ['<%= config.bin %> <%= command.id %>']
  static override flags = {}

  public async run(): Promise<ApiResult> {
    const config = await readConfig(this.config.configDir, this.log.bind(this))
    if (!config) {
      return {
        error: 'Missing authentication config',
        success: false,
      }
    }

    action.start('Authenticating connection')
    const result = await testConnection(config.auth)

    if (result.success) {
      action.stop('✓ successful')
      this.log('Successfully connected to Supabase')
    } else {
      action.stop('✗ failed')
      this.error('Failed to connect to Supabase.')
    }

    return result
  }
}
