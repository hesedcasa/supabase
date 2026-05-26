import {createAuthDeleteCommand} from '@hesed/plugin-lib'

import {clearClients, testConnection} from '../../../supabase/supabase-client.js'

export default createAuthDeleteCommand({
  clearClients,
  hasHostFlag: false,
  serviceName: 'Supabase',
  testConnection: async (auth) => {
    try {
      return await testConnection(auth)
    } catch (error) {
      return {error, success: false}
    }
  },
})
