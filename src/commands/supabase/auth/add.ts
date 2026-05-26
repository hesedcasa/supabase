import {createAuthAddCommand, type FieldDef} from '@hesed/plugin-lib'

import {clearClients, testConnection} from '../../../supabase/supabase-client.js'

const fields: FieldDef[] = [
  {char: 't', description: 'API token', masked: true, message: 'API token:', name: 'apiToken'},
  {char: 'u', description: 'Supabase API URL', message: 'Supabase API URL:', name: 'host'},
]

export default createAuthAddCommand({
  clearClients,
  fields,
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
