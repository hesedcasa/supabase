/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'
import esmock from 'esmock'
import {type SinonStub, stub} from 'sinon'

describe('supabase:table-columns', () => {
  let SupabaseTableColumns: any
  let getTableColumnsStub: SinonStub
  let loadAuthConfigStub: SinonStub
  let formatAsToonStub: SinonStub
  let createProfileManagerStub: SinonStub

  const mockAuth = {apiToken: 'test-token', email: 'test@example.com', host: 'https://test.supabase.co'}
  const mockResult = {
    data: {
      returnData: [
        {name: 'id - (integer)', value: 'id'},
        {name: 'email - (string)', value: 'email'},
      ],
    },
    success: true,
  }

  beforeEach(async () => {
    getTableColumnsStub = stub().resolves(mockResult)
    loadAuthConfigStub = stub().resolves(mockAuth)
    formatAsToonStub = stub().returns('toon-output')
    createProfileManagerStub = stub().returns({loadAuthConfig: loadAuthConfigStub})

    const imported = await esmock('../../../src/commands/supabase/table-columns.js', {
      '../../../src/supabase/supabase-client.js': {getTableColumns: getTableColumnsStub},
      '@hesed/plugin-lib': {
        createProfileManager: createProfileManagerStub,
        formatAsToon: formatAsToonStub,
      },
    })
    SupabaseTableColumns = imported.default
  })

  it('lists columns for a table and logs JSON result', async () => {
    const cmd = new SupabaseTableColumns(['users'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logJsonStub = stub(cmd, 'logJson')

    await cmd.run()

    expect(loadAuthConfigStub.calledOnce).to.be.true
    expect(getTableColumnsStub.calledOnce).to.be.true
    expect(getTableColumnsStub.firstCall.args[0]).to.deep.equal(mockAuth)
    expect(getTableColumnsStub.firstCall.args[1]).to.equal('users')
    expect(logJsonStub.calledOnce).to.be.true
    expect(logJsonStub.firstCall.args[0]).to.deep.equal(mockResult)
  })

  it('uses --toon flag and logs toon output', async () => {
    const cmd = new SupabaseTableColumns(['products', '--toon'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logStub = stub(cmd, 'log')

    await cmd.run()

    expect(formatAsToonStub.calledOnce).to.be.true
    expect(formatAsToonStub.firstCall.args[0]).to.deep.equal(mockResult)
    expect(logStub.calledWith('toon-output')).to.be.true
  })

  it('passes table name argument to getTableColumns', async () => {
    const cmd = new SupabaseTableColumns(['orders'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'logJson')

    await cmd.run()

    expect(getTableColumnsStub.firstCall.args[1]).to.equal('orders')
  })

  it('loads the requested authentication profile', async () => {
    const cmd = new SupabaseTableColumns(['users', '--profile', 'prod'], {
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

    const cmd = new SupabaseTableColumns(['users'], {
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

    expect(getTableColumnsStub.called).to.be.false
  })
})
