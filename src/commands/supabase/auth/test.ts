import {createAuthTestCommand} from '@hesed/plugin-lib'

import {clearClients, testConnection} from '../../../supabase/supabase-client.js'

export default createAuthTestCommand({
  clearClients,
  configFile: 'spb-config.json',
  serviceName: 'Supabase',
  testConnection,
})
