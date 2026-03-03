/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'
import esmock from 'esmock'
import {type SinonStub, stub} from 'sinon'

describe('supabase:create', () => {
  let SupabaseCreate: any
  let executeStub: SinonStub
  let readConfigStub: SinonStub
  let formatAsToonStub: SinonStub

  const mockAuth = {apiToken: 'test-token', email: 'test@example.com', host: 'https://test.supabase.co'}
  const mockConfig = {auth: mockAuth}
  const mockResult = {data: [{id: 1, name: 'Alice'}], success: true}

  beforeEach(async () => {
    executeStub = stub().resolves(mockResult)
    readConfigStub = stub().resolves(mockConfig)
    formatAsToonStub = stub().returns('toon-output')

    const imported = await esmock('../../../src/commands/supabase/create.js', {
      '../../../src/config.js': {readConfig: readConfigStub},
      '../../../src/format.js': {formatAsToon: formatAsToonStub},
      '../../../src/supabase/supabase-client.js': {execute: executeStub},
    })
    SupabaseCreate = imported.default
  })

  it('inserts a single row and logs JSON result', async () => {
    const cmd = new SupabaseCreate(['users', '{"name":"Alice","email":"alice@example.com"}'], {
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
    expect(optionsArg.operation).to.equal('create')
    expect(optionsArg.tableId).to.equal('users')
    expect(optionsArg.data).to.deep.equal({email: 'alice@example.com', name: 'Alice'})
    expect(logJsonStub.calledOnce).to.be.true
    expect(logJsonStub.firstCall.args[0]).to.deep.equal(mockResult)
  })

  it('inserts multiple rows from JSON array', async () => {
    const cmd = new SupabaseCreate(['users', '[{"name":"Alice"},{"name":"Bob"}]'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'logJson')

    await cmd.run()

    const optionsArg = executeStub.firstCall.args[1]
    expect(optionsArg.data).to.deep.equal([{name: 'Alice'}, {name: 'Bob'}])
  })

  it('uses --toon flag and logs toon output', async () => {
    const cmd = new SupabaseCreate(['users', '{"name":"Alice"}', '--toon'], {
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
    const cmd = new SupabaseCreate(['users', '{"name":"Alice"}', '--select', 'id,name'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'logJson')

    await cmd.run()

    expect(executeStub.firstCall.args[1].select).to.equal('id,name')
  })

  it('passes --schema flag to execute', async () => {
    const cmd = new SupabaseCreate(['users', '{"name":"Alice"}', '--schema', 'custom'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)
    stub(cmd, 'logJson')

    await cmd.run()

    expect(executeStub.firstCall.args[1].schema).to.equal('custom')
  })

  it('does not call execute for invalid JSON data', async () => {
    const cmd = new SupabaseCreate(['users', 'not-valid-json'], {
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

    const cmd = new SupabaseCreate(['users', '{"name":"Alice"}'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)

    await cmd.run()

    expect(executeStub.called).to.be.false
  })
})
