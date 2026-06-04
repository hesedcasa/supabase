import {createAuthAddCommand} from '@hesed/plugin-lib'

import {clearClients, testConnection} from '../../../supabase/supabase-client.js'

export default createAuthAddCommand({
  clearClients,
  configFile: 'spb-config.json',
  serviceName: 'Supabase',
  testConnection,
})
