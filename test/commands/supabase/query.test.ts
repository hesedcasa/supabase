/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'
import esmock from 'esmock'
import {type SinonStub, stub} from 'sinon'

describe('supabase:query', () => {
  let SupabaseQuery: any
  let executeStub: SinonStub
  let loadAuthConfigStub: SinonStub
  let formatAsToonStub: SinonStub
  let createProfileManagerStub: SinonStub

  const mockAuth = {apiToken: 'test-token', email: 'test@example.com', host: 'https://test.supabase.co'}
  const mockResult = {data: [{email: 'alice@example.com', id: 1}], success: true}

  beforeEach(async () => {
    executeStub = stub().resolves(mockResult)
    loadAuthConfigStub = stub().resolves(mockAuth)
    formatAsToonStub = stub().returns('toon-output')
    createProfileManagerStub = stub().returns({loadAuthConfig: loadAuthConfigStub})

    const imported = await esmock('../../../src/commands/supabase/query.js', {
      '../../../src/supabase/supabase-client.js': {execute: executeStub},
      '@hesed/plugin-lib': {
        createProfileManager: createProfileManagerStub,
        formatAsToon: formatAsToonStub,
      },
    })
    SupabaseQuery = imported.default
  })

  it('executes query with required args and logs JSON result', async () => {
    const cmd = new SupabaseQuery(['users', 'id,email', '--filters', 'id=eq.1'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logJsonStub = stub(cmd, 'logJson')

    await cmd.run()

    expect(loadAuthConfigStub.calledOnce).to.be.true
    expect(executeStub.calledOnce).to.be.true
    const [authArg, optionsArg] = executeStub.firstCall.args
    expect(authArg).to.deep.equal(mockAuth)
    expect(optionsArg.filterMode).to.equal('string')
    expect(optionsArg.filtersString).to.equal('id=eq.1')
    expect(optionsArg.operation).to.equal('get')
    expect(optionsArg.tableId).to.equal('users')
    expect(optionsArg.select).to.equal('id,email')
    expect(logJsonStub.calledOnce).to.be.true
  })

  it('uses --toon flag and logs toon output', async () => {
    const cmd = new SupabaseQuery(['users', 'id,name', '--filters', 'age=gt.18', '--toon'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logStub = stub(cmd, 'log')

    await cmd.run()

    expect(formatAsToonStub.calledOnce).to.be.true
    expect(logStub.calledWith('toon-output')).to.be.true
  })

  it('uses --limit flag when provided', async () => {
    const cmd = new SupabaseQuery(['orders', 'id,total', '--filters', 'status=eq.active', '--limit', '10'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'logJson')

    await cmd.run()

    expect(executeStub.firstCall.args[1].limit).to.equal(10)
  })

  it('loads the requested authentication profile', async () => {
    const cmd = new SupabaseQuery(['users', 'id,email', '--filters', 'id=eq.1', '--profile', 'prod'], {
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

    const cmd = new SupabaseQuery(['users', 'id', '--filters', 'id=eq.1'], {
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

    expect(executeStub.called).to.be.false
  })
})
