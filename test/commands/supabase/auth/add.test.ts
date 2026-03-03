/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'
import {stub} from 'sinon'

describe('supabase:auth:add', () => {
  let AuthAdd: any
  let mockFs: any
  let mockTestConnection: any
  let mockAction: any
  let mockInput: any
  let logMessages: string[]

  const mockResult = {success: true}
  const savedConfig = {auth: {apiToken: 'sbp_test', host: 'https://test.supabase.co'}}

  beforeEach(async () => {
    logMessages = []

    mockFs = {
      async createFile() {},
      async pathExists() {
        return false
      },
      async readJSON() {
        return savedConfig
      },
      async writeJSON() {},
    }

    mockTestConnection = async () => mockResult

    mockAction = {
      start() {},
      stop() {},
    }

    mockInput = async ({message}: {message: string}) => {
      if (message.includes('API token')) return 'sbp_test'
      if (message.includes('Supabase API URL')) return 'https://test.supabase.co'
      return ''
    }

    AuthAdd = await esmock('../../../../src/commands/supabase/auth/add.js', {
      '../../../../src/supabase/supabase-client.js': {testConnection: mockTestConnection},
      '@inquirer/prompts': {input: mockInput},
      '@oclif/core/ux': {action: mockAction},
      'fs-extra': mockFs,
    })
  })

  it('adds auth successfully with flags', async () => {
    const cmd = new AuthAdd.default(['--token', 'sbp_test', '--url', 'https://test.supabase.co'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    cmd.log = (msg: string) => {
      logMessages.push(msg)
    }

    const result = await cmd.run()

    expect(result.success).to.be.true
    expect(logMessages).to.include('Authentication added successfully')
  })

  it('handles connection failure', async () => {
    mockTestConnection = async () => ({error: 'Connection refused', success: false})

    AuthAdd = await esmock('../../../../src/commands/supabase/auth/add.js', {
      '../../../../src/supabase/supabase-client.js': {testConnection: mockTestConnection},
      '@inquirer/prompts': {input: mockInput},
      '@oclif/core/ux': {action: mockAction},
      'fs-extra': mockFs,
    })

    const cmd = new AuthAdd.default(['--token', 'bad-token', '--url', 'https://test.supabase.co'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    cmd.log = (msg: string) => {
      logMessages.push(msg)
    }

    let errorThrown = false
    cmd.error = (msg: string) => {
      errorThrown = true
      expect(msg).to.include('Authentication is invalid')
    }

    await cmd.run()

    expect(errorThrown).to.be.true
  })

  it('creates config file if it does not exist', async () => {
    let createFileCalled = false

    mockFs = {
      ...mockFs,
      async createFile() {
        createFileCalled = true
      },
      async pathExists() {
        return false
      },
    }

    AuthAdd = await esmock('../../../../src/commands/supabase/auth/add.js', {
      '../../../../src/supabase/supabase-client.js': {testConnection: mockTestConnection},
      '@inquirer/prompts': {input: mockInput},
      '@oclif/core/ux': {action: mockAction},
      'fs-extra': mockFs,
    })

    const cmd = new AuthAdd.default(['--token', 'sbp_test', '--url', 'https://test.supabase.co'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    cmd.log = () => {}

    await cmd.run()

    expect(createFileCalled).to.be.true
  })

  it('calls testConnection after writing config', async () => {
    let testCalled = false

    mockTestConnection = async () => {
      testCalled = true
      return mockResult
    }

    AuthAdd = await esmock('../../../../src/commands/supabase/auth/add.js', {
      '../../../../src/supabase/supabase-client.js': {testConnection: mockTestConnection},
      '@inquirer/prompts': {input: mockInput},
      '@oclif/core/ux': {action: mockAction},
      'fs-extra': mockFs,
    })

    const cmd = new AuthAdd.default(['--token', 'sbp_test', '--url', 'https://test.supabase.co'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    cmd.log = () => {}

    await cmd.run()

    expect(testCalled).to.be.true
  })
})
