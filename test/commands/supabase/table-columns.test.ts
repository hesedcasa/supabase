/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'
import esmock from 'esmock'
import {type SinonStub, stub} from 'sinon'

describe('supabase:table-columns', () => {
  let SupabaseTableColumns: any
  let getTableColumnsStub: SinonStub
  let readConfigStub: SinonStub
  let formatAsToonStub: SinonStub

  const mockAuth = {apiToken: 'test-token', email: 'test@example.com', host: 'https://test.supabase.co'}
  const mockConfig = {auth: mockAuth}
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
    readConfigStub = stub().resolves(mockConfig)
    formatAsToonStub = stub().returns('toon-output')

    const imported = await esmock('../../../src/commands/supabase/table-columns.js', {
      '../../../src/config.js': {readConfig: readConfigStub},
      '../../../src/format.js': {formatAsToon: formatAsToonStub},
      '../../../src/supabase/supabase-client.js': {getTableColumns: getTableColumnsStub},
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

    expect(readConfigStub.calledOnce).to.be.true
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

  it('returns early when config is missing', async () => {
    readConfigStub.resolves()

    const cmd = new SupabaseTableColumns(['users'], {
      configDir: '/tmp/test-config',
      root: process.cwd(),
      runHook: stub().resolves({failures: [], successes: []}),
    } as any)

    await cmd.run()

    expect(getTableColumnsStub.called).to.be.false
  })
})
