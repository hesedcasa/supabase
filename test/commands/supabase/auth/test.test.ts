import {expect} from 'chai'

describe('auth:test', () => {
  // Auth:test command is a thin wrapper around @hesed/plugin-lib's createAuthTestCommand.
  // The detailed functionality is tested in plugin-lib's own test suite.
  // Here we only test the Supabase-specific integration points.
  it('exports correct integration points', async () => {
    const {default: AuthTest} = await import('../../../../src/commands/supabase/auth/test.js')
    const {clearClients, testConnection} = await import('../../../../src/supabase/supabase-client.js')

    // Verify the command exists and is a function
    expect(AuthTest).to.be.a('function')

    // Verify the integration points exist
    expect(clearClients).to.be.a('function')
    expect(testConnection).to.be.a('function')
  })
})
