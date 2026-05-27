import {createAuthTestCommand} from '@hesed/plugin-lib'

import {clearClients, testConnection} from '../../../supabase/supabase-client.js'

export default createAuthTestCommand({
  clearClients,
  hasHostFlag: true,
  serviceName: 'Supabase',
  testConnection,
})
