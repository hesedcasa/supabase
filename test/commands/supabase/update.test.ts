/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'
import esmock from 'esmock'
import {type SinonStub, stub} from 'sinon'

describe('supabase:update', () => {
  let SupabaseUpdate: any
  let executeStub: SinonStub
  let readConfigStub: SinonStub
  let formatAsToonStub: SinonStub

  const mockAuth = {apiToken: 'test-token', email: 'test@example.com', host: 'https://test.supabase.co'}
  const mockConfig = {auth: mockAuth}
  const mockResult = {data: [{id: 42, status: 'active'}], success: true}

  beforeEach(async () => {
    executeStub = stub().resolves(mockResult)
    readConfigStub = stub().resolves(mockConfig)
    formatAsToonStub = stub().returns('toon-output')

    const imported = await esmock('../../../src/commands/supabase/update.js', {
      '../../../src/config.js': {readConfig: readConfigStub},
      '../../../src/format.js': {formatAsToon: formatAsToonStub},
      '../../../src/supabase/supabase-client.js': {execute: executeStub},
    })
    SupabaseUpdate = imported.default
  })

  it('updates rows and logs JSON result', async () => {
    const cmd = new SupabaseUpdate(['users', '{"status":"active"}', '--filters', 'id=eq.42'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logJsonStub = stub(cmd, 'logJson')

    await cmd.run()

    expect(readConfigStub.calledOnce).to.be.true
    expect(executeStub.calledOnce).to.be.true
    const [authArg, optionsArg] = executeStub.firstCall.args
    expect(authArg).to.deep.equal(mockAuth)
    expect(optionsArg.operation).to.equal('update')
    expect(optionsArg.tableId).to.equal('users')
    expect(optionsArg.data).to.deep.equal({status: 'active'})
    expect(optionsArg.filterMode).to.equal('string')
    expect(optionsArg.filtersString).to.equal('id=eq.42')
    expect(logJsonStub.calledOnce).to.be.true
    expect(logJsonStub.firstCall.args[0]).to.deep.equal(mockResult)
  })

  it('uses --toon flag and logs toon output', async () => {
    const cmd = new SupabaseUpdate(['products', '{"price":19.99}', '--filters', 'name=eq.Widget', '--toon'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    const logStub = stub(cmd, 'log')

    await cmd.run()

    expect(formatAsToonStub.calledOnce).to.be.true
    expect(logStub.calledWith('toon-output')).to.be.true
  })

  it('passes --select flag to execute', async () => {
    const cmd = new SupabaseUpdate(
      ['products', '{"price":19.99}', '--filters', 'name=eq.Widget', '--select', 'id,name,price'],
      {
        configDir: '/tmp/test-config',
        root: process.cwd(),
        runHook: stub().resolves({failures: [], successes: []}),
      } as any,
    )
    stub(cmd, 'logJson')

    await cmd.run()

    expect(executeStub.firstCall.args[1].select).to.equal('id,name,price')
  })

  it('passes --schema flag to execute', async () => {
    const cmd = new SupabaseUpdate(['users', '{"role":"admin"}', '--filters', 'id=eq.1', '--schema', 'private'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'logJson')

    await cmd.run()

    expect(executeStub.firstCall.args[1].schema).to.equal('private')
  })

  it('handles compound filters with & separator', async () => {
    const cmd = new SupabaseUpdate(['orders', '{"status":"shipped"}', '--filters', 'status=eq.pending&total=gte.100'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'logJson')

    await cmd.run()

    expect(executeStub.firstCall.args[1].filtersString).to.equal('status=eq.pending&total=gte.100')
  })

  it('does not call execute for invalid JSON data', async () => {
    const cmd = new SupabaseUpdate(['users', 'not-valid-json', '--filters', 'id=eq.1'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)

    try {
      await cmd.run()
    } catch {
      // this.error() throws
    }

    expect(executeStub.called).to.be.false
  })

  it('returns early when config is missing', async () => {
    readConfigStub.resolves()

    const cmd = new SupabaseUpdate(['users', '{"status":"active"}', '--filters', 'id=eq.1'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)

    await cmd.run()

    expect(executeStub.called).to.be.false
  })
})
