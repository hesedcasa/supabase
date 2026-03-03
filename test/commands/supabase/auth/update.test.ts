/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable new-cap */
import {expect} from 'chai'
import esmock from 'esmock'
import {stub} from 'sinon'

describe('supabase:auth:update', () => {
  let AuthUpdate: any
  let mockFs: any
  let mockTestConnection: any
  let mockAction: any
  let mockConfirm: any
  let mockInput: any
  let logMessages: string[]

  const mockResult = {success: true}
  const existingConfig = {auth: {apiToken: 'old-token', host: 'https://old.supabase.co'}}

  beforeEach(async () => {
    logMessages = []

    mockFs = {
      async readJSON() {
        return existingConfig
      },
      async writeJSON() {},
    }

    mockTestConnection = async () => mockResult

    mockAction = {
      start() {},
      stop() {},
    }

    mockConfirm = async () => true

    mockInput = async ({default: defaultVal}: {default: string; message: string}) => defaultVal ?? ''

    AuthUpdate = await esmock('../../../../src/commands/supabase/auth/update.js', {
      '../../../../src/supabase/supabase-client.js': {testConnection: mockTestConnection},
      '@inquirer/prompts': {confirm: mockConfirm, input: mockInput},
      '@oclif/core/ux': {action: mockAction},
      'fs-extra': mockFs,
    })
  })

  it('updates auth successfully with flags', async () => {
    const cmd = new AuthUpdate.default(['--token', 'new-token', '--url', 'https://new.supabase.co'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    cmd.log = (msg: string) => {
      logMessages.push(msg)
    }

    const result = await cmd.run()

    expect(result.success).to.be.true
    expect(logMessages).to.include('Authentication updated successfully')
  })

  it('handles connection failure', async () => {
    mockTestConnection = async () => ({error: 'Connection refused', success: false})

    AuthUpdate = await esmock('../../../../src/commands/supabase/auth/update.js', {
      '../../../../src/supabase/supabase-client.js': {testConnection: mockTestConnection},
      '@inquirer/prompts': {confirm: mockConfirm, input: mockInput},
      '@oclif/core/ux': {action: mockAction},
      'fs-extra': mockFs,
    })

    const cmd = new AuthUpdate.default(['--token', 'bad-token', '--url', 'https://new.supabase.co'], {
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

  it('exits when config file does not exist', async () => {
    mockFs = {
      async readJSON() {
        const error: any = new Error('no such file or directory')
        error.message = 'no such file or directory'
        throw error
      },
    }

    AuthUpdate = await esmock('../../../../src/commands/supabase/auth/update.js', {
      '../../../../src/supabase/supabase-client.js': {testConnection: mockTestConnection},
      '@inquirer/prompts': {confirm: mockConfirm, input: mockInput},
      '@oclif/core/ux': {action: mockAction},
      'fs-extra': mockFs,
    })

    const cmd = new AuthUpdate.default(['--token', 'token', '--url', 'https://new.supabase.co'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    cmd.log = (msg: string) => {
      logMessages.push(msg)
    }

    await cmd.run()

    expect(logMessages).to.include('Run auth:add instead')
  })

  it('exits when user cancels confirmation', async () => {
    mockConfirm = async () => false

    AuthUpdate = await esmock('../../../../src/commands/supabase/auth/update.js', {
      '../../../../src/supabase/supabase-client.js': {testConnection: mockTestConnection},
      '@inquirer/prompts': {confirm: mockConfirm, input: mockInput},
      '@oclif/core/ux': {action: mockAction},
      'fs-extra': mockFs,
    })

    const cmd = new AuthUpdate.default(['--token', 'token', '--url', 'https://new.supabase.co'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    cmd.log = (msg: string) => {
      logMessages.push(msg)
    }

    const result = await cmd.run()

    expect(result).to.be.undefined
    expect(logMessages).to.not.include('Authentication updated successfully')
  })

  it('calls testConnection after writing config', async () => {
    let testCalled = false

    mockTestConnection = async () => {
      testCalled = true
      return mockResult
    }

    AuthUpdate = await esmock('../../../../src/commands/supabase/auth/update.js', {
      '../../../../src/supabase/supabase-client.js': {testConnection: mockTestConnection},
      '@inquirer/prompts': {confirm: mockConfirm, input: mockInput},
      '@oclif/core/ux': {action: mockAction},
      'fs-extra': mockFs,
    })

    const cmd = new AuthUpdate.default(['--token', 'new-token', '--url', 'https://new.supabase.co'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    cmd.log = () => {}

    await cmd.run()

    expect(testCalled).to.be.true
  })
})
