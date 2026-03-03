/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'
import {stub} from 'sinon'

describe('supabase:auth:test', () => {
  let AuthTest: any
  let mockReadConfig: any
  let mockTestConnection: any
  let mockAction: any
  let logOutput: string[]
  let errorOutput: null | string
  let actionStarted: null | string
  let actionStopped: null | string

  const mockAuth = {apiToken: 'sbp_test', email: 'test@example.com', host: 'https://test.supabase.co'}
  const mockJsonConfig = {auth: mockAuth}

  beforeEach(async () => {
    logOutput = []
    errorOutput = null
    actionStarted = null
    actionStopped = null

    mockReadConfig = async () => mockJsonConfig

    mockTestConnection = async () => ({success: true})

    mockAction = {
      start(message: string) {
        actionStarted = message
      },
      stop(message: string) {
        actionStopped = message
      },
    }

    AuthTest = await esmock('../../../../src/commands/supabase/auth/test.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/supabase/supabase-client.js': {testConnection: mockTestConnection},
      '@oclif/core/ux': {action: mockAction},
    })
  })

  it('successfully tests connection with valid config', async () => {
    const cmd = new AuthTest.default([], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    cmd.log = (output: string) => {
      logOutput.push(output)
    }

    const result = await cmd.run()

    expect(result.success).to.be.true
    expect(actionStarted).to.equal('Authenticating connection')
    expect(actionStopped).to.equal('✓ successful')
    expect(logOutput).to.include('Successfully connected to Supabase')
  })

  it('returns error when config is not available', async () => {
    mockReadConfig = async () => null

    AuthTest = await esmock('../../../../src/commands/supabase/auth/test.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/supabase/supabase-client.js': {testConnection: mockTestConnection},
      '@oclif/core/ux': {action: mockAction},
    })

    const cmd = new AuthTest.default([], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)

    const result = await cmd.run()

    expect(result.success).to.be.false
    expect(result.error).to.equal('Missing authentication config')
  })

  it('handles connection failure gracefully', async () => {
    mockTestConnection = async () => ({error: 'Connection refused', success: false})

    AuthTest = await esmock('../../../../src/commands/supabase/auth/test.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/supabase/supabase-client.js': {testConnection: mockTestConnection},
      '@oclif/core/ux': {action: mockAction},
    })

    const cmd = new AuthTest.default([], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)

    cmd.error = (message: string) => {
      errorOutput = message
      throw new Error(message)
    }

    try {
      await cmd.run()
    } catch {
      // Expected to throw
    }

    expect(actionStarted).to.equal('Authenticating connection')
    expect(actionStopped).to.equal('✗ failed')
    expect(errorOutput).to.include('Failed to connect to Supabase')
  })

  it('does not call testConnection when config is missing', async () => {
    mockReadConfig = async () => null
    let testCalled = false

    mockTestConnection = async () => {
      testCalled = true
      return {success: true}
    }

    AuthTest = await esmock('../../../../src/commands/supabase/auth/test.js', {
      '../../../../src/config.js': {readConfig: mockReadConfig},
      '../../../../src/supabase/supabase-client.js': {testConnection: mockTestConnection},
      '@oclif/core/ux': {action: mockAction},
    })

    const cmd = new AuthTest.default([], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)

    await cmd.run()

    expect(testCalled).to.be.false
  })
})
