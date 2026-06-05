/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'
import esmock from 'esmock'
import {type SinonStub, stub} from 'sinon'

describe('supabase:tables', () => {
  let SupabaseTables: any
  let getTablesStub: SinonStub
  let loadAuthConfigStub: SinonStub
  let formatAsToonStub: SinonStub
  let createProfileManagerStub: SinonStub

  const mockAuth = {apiToken: 'test-token', email: 'test@example.com', host: 'https://test.supabase.co'}
  const mockResult = {
    data: {
      returnData: [
        {name: 'orders', value: 'orders'},
        {name: 'users', value: 'users'},
      ],
    },
    success: true,
  }

  beforeEach(async () => {
    getTablesStub = stub().resolves(mockResult)
    loadAuthConfigStub = stub().resolves(mockAuth)
    formatAsToonStub = stub().returns('toon-output')
    createProfileManagerStub = stub().returns({loadAuthConfig: loadAuthConfigStub})

    const imported = await esmock('../../../src/commands/supabase/tables.js', {
      '../../../src/supabase/supabase-client.js': {getTables: getTablesStub},
      '@hesed/plugin-lib': {
        createProfileManager: createProfileManagerStub,
        formatAsToon: formatAsToonStub,
      },
    })
    SupabaseTables = imported.default
  })

  it('lists tables and logs JSON result', async () => {
    const cmd = new SupabaseTables([], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logJsonStub = stub(cmd, 'logJson')

    await cmd.run()

    expect(loadAuthConfigStub.calledOnce).to.be.true
    expect(getTablesStub.calledOnce).to.be.true
    expect(getTablesStub.firstCall.args[0]).to.deep.equal(mockAuth)
    expect(logJsonStub.calledOnce).to.be.true
    expect(logJsonStub.firstCall.args[0]).to.deep.equal(mockResult)
  })

  it('uses --toon flag and logs toon output', async () => {
    const cmd = new SupabaseTables(['--toon'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logStub = stub(cmd, 'log')

    await cmd.run()

    expect(formatAsToonStub.calledOnce).to.be.true
    expect(logStub.calledWith('toon-output')).to.be.true
  })

  it('loads the requested authentication profile', async () => {
    const cmd = new SupabaseTables(['--profile', 'prod'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'logJson')

    await cmd.run()

    expect(createProfileManagerStub.firstCall.args[1]).to.equal('prod')
    expect(createProfileManagerStub.firstCall.args[2]).to.equal('spb-config.json')
  })

  it('throws error when config is missing', async () => {
    loadAuthConfigStub.resolves()

    const cmd = new SupabaseTables([], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)

    try {
      await cmd.run()
      expect.fail('Should have thrown an error')
    } catch (error: unknown) {
      expect((error as Error).message).to.include('Missing authentication config.')
    }

    expect(getTablesStub.called).to.be.false
  })
})
