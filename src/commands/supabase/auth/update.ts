import {createAuthUpdateCommand} from '@hesed/plugin-lib'

import {clearClients, testConnection} from '../../../supabase/supabase-client.js'

export default createAuthUpdateCommand({
  clearClients,
  configFile: 'spb-config.json',
  serviceName: 'Supabase',
  testConnection,
})
