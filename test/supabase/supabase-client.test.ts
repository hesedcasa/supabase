/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'
import esmock from 'esmock'
import {type SinonStub, stub} from 'sinon'

const buildQueryFake = (obj: Record<string, string>, f: any): Record<string, string> => {
  obj[f.keyName] = `${f.condition}.${f.keyValue}`
  return obj
}

const buildOrQueryFake = (f: any): string => `${f.keyName}.${f.condition}.${f.keyValue}`

describe('supabase-client', () => {
  let getTables: any
  let getTableColumns: any
  let testConnection: any
  let execute: any
  let MockSupabaseApi: SinonStub
  let mockSupabaseApi: {
    buildOrQuery: SinonStub
    buildQuery: SinonStub
    getSchemaHeader: SinonStub
    request: SinonStub
    validateCredentials: SinonStub
  }

  const mockConfig = {
    apiToken: 'test-token',
    email: 'test@example.com',
    host: 'https://test.supabase.co',
  }

  beforeEach(async () => {
    mockSupabaseApi = {
      buildOrQuery: stub(),
      buildQuery: stub(),
      getSchemaHeader: stub().returns({}),
      request: stub(),
      validateCredentials: stub(),
    }
    MockSupabaseApi = stub().returns(mockSupabaseApi)

    const imported = await esmock('../../src/supabase/supabase-client.js', {
      '../../src/supabase/supabase-api.js': {SupabaseApi: MockSupabaseApi},
    })
    getTables = imported.getTables
    getTableColumns = imported.getTableColumns
    testConnection = imported.testConnection
    execute = imported.execute
  })

  describe('getTables', () => {
    it('returns table names extracted from API paths', async () => {
      mockSupabaseApi.request.resolves({
        data: {paths: {'/': {}, '/orders': {}, '/users': {}}},
        success: true,
      })

      const result = await getTables(mockConfig)

      expect(result.success).to.be.true
      expect(result.data.returnData).to.deep.include({name: 'users', value: 'users'})
      expect(result.data.returnData).to.deep.include({name: 'orders', value: 'orders'})
    })

    it('omits the introspection path "/" from results', async () => {
      mockSupabaseApi.request.resolves({
        data: {paths: {'/': {}, '/users': {}}},
        success: true,
      })

      const result = await getTables(mockConfig)

      const names = result.data.returnData.map((r: any) => r.name)
      expect(names).not.to.include('/')
      expect(names).not.to.include('')
    })

    it('calls request GET on root path', async () => {
      mockSupabaseApi.request.resolves({data: {paths: {'/': {}}}, success: true})

      await getTables(mockConfig)

      expect(mockSupabaseApi.request.calledWith('GET', '/')).to.be.true
    })

    it('returns result directly when API call fails', async () => {
      mockSupabaseApi.request.resolves({error: 'Connection failed', success: false})

      const result = await getTables(mockConfig)

      expect(result.success).to.be.false
      expect(result.error).to.equal('Connection failed')
    })

    it('returns result directly when data is absent', async () => {
      mockSupabaseApi.request.resolves({success: true})

      const result = await getTables(mockConfig)

      expect(result.data).to.be.undefined
    })
  })

  describe('getTableColumns', () => {
    const mockApiResponse = {
      data: {
        definitions: {
          users: {
            properties: {
              email: {type: 'string'},
              id: {type: 'integer'},
              name: {type: 'string'},
            },
          },
        },
      },
      success: true,
    }

    it('returns column names and types for a table', async () => {
      mockSupabaseApi.request.resolves(mockApiResponse)

      const result = await getTableColumns(mockConfig, 'users')

      expect(result.success).to.be.true
      expect(result.data.returnData).to.deep.include({name: 'id - (integer)', value: 'id'})
      expect(result.data.returnData).to.deep.include({name: 'name - (string)', value: 'name'})
      expect(result.data.returnData).to.deep.include({name: 'email - (string)', value: 'email'})
    })

    it('returns error when table is not in definitions', async () => {
      mockSupabaseApi.request.resolves(mockApiResponse)

      const result = await getTableColumns(mockConfig, 'nonexistent')

      expect(result.success).to.be.false
      expect(result.error).to.include('nonexistent')
    })

    it('returns error when API call fails', async () => {
      mockSupabaseApi.request.resolves({error: 'Network error', success: false})

      const result = await getTableColumns(mockConfig, 'users')

      expect(result.success).to.be.false
    })

    it('returns error when data is absent', async () => {
      mockSupabaseApi.request.resolves({success: true})

      const result = await getTableColumns(mockConfig, 'users')

      expect(result.success).to.be.false
      expect(result.error).to.equal('Empty data')
    })
  })

  describe('testConnection', () => {
    it('returns success from validateCredentials', async () => {
      mockSupabaseApi.validateCredentials.resolves({success: true})

      const result = await testConnection(mockConfig)

      expect(result.success).to.be.true
      expect(mockSupabaseApi.validateCredentials.calledOnce).to.be.true
    })

    it('returns failure from validateCredentials', async () => {
      mockSupabaseApi.validateCredentials.resolves({error: 'Invalid token', success: false})

      const result = await testConnection(mockConfig)

      expect(result.success).to.be.false
      expect(result.error).to.equal('Invalid token')
    })
  })

  describe('execute', () => {
    describe('create operation', () => {
      it('calls POST with data object', async () => {
        mockSupabaseApi.request.resolves({data: [{id: 1}], success: true})

        const result = await execute(mockConfig, {
          data: {email: 'alice@example.com', name: 'Alice'},
          operation: 'create',
          tableId: 'users',
        })

        expect(result.success).to.be.true
        const [method, resource] = mockSupabaseApi.request.firstCall.args
        expect(method).to.equal('POST')
        expect(resource).to.equal('/users')
      })

      it('wraps single object in array for POST body', async () => {
        mockSupabaseApi.request.resolves({data: [{id: 1}], success: true})

        await execute(mockConfig, {data: {name: 'Alice'}, operation: 'create', tableId: 'users'})

        const body = mockSupabaseApi.request.firstCall.args[2]
        expect(Array.isArray(body)).to.be.true
        expect(body[0]).to.deep.equal({name: 'Alice'})
      })

      it('passes array data directly to POST body', async () => {
        mockSupabaseApi.request.resolves({data: [{id: 1}, {id: 2}], success: true})

        await execute(mockConfig, {
          data: [{name: 'Alice'}, {name: 'Bob'}],
          operation: 'create',
          tableId: 'users',
        })

        const body = mockSupabaseApi.request.firstCall.args[2]
        expect(body).to.deep.equal([{name: 'Alice'}, {name: 'Bob'}])
      })

      it('includes select in query params when provided', async () => {
        mockSupabaseApi.request.resolves({data: [{id: 1}], success: true})

        await execute(mockConfig, {data: {name: 'Alice'}, operation: 'create', select: 'id,name', tableId: 'users'})

        const qs = mockSupabaseApi.request.firstCall.args[3]
        expect(qs.select).to.equal('id,name')
      })
    })

    describe('get operation', () => {
      it('calls GET with default limit 100 and offset 0', async () => {
        mockSupabaseApi.request.resolves({data: [], success: true})

        await execute(mockConfig, {operation: 'get', tableId: 'users'})

        const [method, resource, , qs] = mockSupabaseApi.request.firstCall.args
        expect(method).to.equal('GET')
        expect(resource).to.equal('/users')
        expect(qs.limit).to.equal('100')
        expect(qs.offset).to.equal('0')
      })

      it('uses custom limit when provided', async () => {
        mockSupabaseApi.request.resolves({data: [], success: true})

        await execute(mockConfig, {limit: 50, operation: 'get', tableId: 'users'})

        const qs = mockSupabaseApi.request.firstCall.args[3]
        expect(qs.limit).to.equal('50')
      })

      it('applies string filter mode to query params', async () => {
        mockSupabaseApi.request.resolves({data: [], success: true})

        await execute(mockConfig, {
          filterMode: 'string',
          filtersString: 'status=eq.active&age=gt.18',
          operation: 'get',
          tableId: 'users',
        })

        const qs = mockSupabaseApi.request.firstCall.args[3]
        expect(qs.status).to.equal('eq.active')
        expect(qs.age).to.equal('gt.18')
      })

      it('includes select in query params when provided', async () => {
        mockSupabaseApi.request.resolves({data: [], success: true})

        await execute(mockConfig, {operation: 'get', select: 'id,email', tableId: 'users'})

        const qs = mockSupabaseApi.request.firstCall.args[3]
        expect(qs.select).to.equal('id,email')
      })
    })

    describe('update operation', () => {
      it('calls PATCH with data and string filters', async () => {
        mockSupabaseApi.request.resolves({data: [{id: 1}], success: true})

        await execute(mockConfig, {
          data: {status: 'active'},
          filterMode: 'string',
          filtersString: 'id=eq.42',
          operation: 'update',
          tableId: 'users',
        })

        const [method, resource, body, qs] = mockSupabaseApi.request.firstCall.args
        expect(method).to.equal('PATCH')
        expect(resource).to.equal('/users')
        expect(body).to.deep.equal({status: 'active'})
        expect(qs.id).to.equal('eq.42')
      })

      it('includes select in query params when provided', async () => {
        mockSupabaseApi.request.resolves({data: [{id: 1}], success: true})

        await execute(mockConfig, {
          data: {status: 'active'},
          filterMode: 'string',
          filtersString: 'id=eq.1',
          operation: 'update',
          select: 'id,status',
          tableId: 'users',
        })

        const qs = mockSupabaseApi.request.firstCall.args[3]
        expect(qs.select).to.equal('id,status')
      })
    })

    describe('delete operation', () => {
      it('calls DELETE with string filters', async () => {
        mockSupabaseApi.request.resolves({data: [], success: true})

        await execute(mockConfig, {
          filterMode: 'string',
          filtersString: 'id=eq.5',
          operation: 'delete',
          tableId: 'sessions',
        })

        const [method, resource, , qs] = mockSupabaseApi.request.firstCall.args
        expect(method).to.equal('DELETE')
        expect(resource).to.equal('/sessions')
        expect(qs.id).to.equal('eq.5')
      })

      it('includes select in query params when provided', async () => {
        mockSupabaseApi.request.resolves({data: [], success: true})

        await execute(mockConfig, {
          filterMode: 'string',
          filtersString: 'user_id=eq.5',
          operation: 'delete',
          select: 'id',
          tableId: 'sessions',
        })

        const qs = mockSupabaseApi.request.firstCall.args[3]
        expect(qs.select).to.equal('id')
      })
    })

    describe('manual filter mode', () => {
      it('calls buildQuery for each filter with allFilters matchType', async () => {
        mockSupabaseApi.request.resolves({data: [], success: true})
        mockSupabaseApi.buildQuery.callsFake(buildQueryFake)

        await execute(mockConfig, {
          filterMode: 'manual',
          filters: [
            {condition: 'eq', keyName: 'status', keyValue: 'active'},
            {condition: 'gt', keyName: 'age', keyValue: '18'},
          ],
          matchType: 'allFilters',
          operation: 'get',
          tableId: 'users',
        })

        expect(mockSupabaseApi.buildQuery.callCount).to.equal(2)
        const qs = mockSupabaseApi.request.firstCall.args[3]
        expect(qs.status).to.equal('eq.active')
        expect(qs.age).to.equal('gt.18')
      })

      it('builds or param for anyFilter matchType', async () => {
        mockSupabaseApi.request.resolves({data: [], success: true})
        mockSupabaseApi.buildOrQuery.callsFake(buildOrQueryFake)

        await execute(mockConfig, {
          filterMode: 'manual',
          filters: [
            {condition: 'eq', keyName: 'status', keyValue: 'active'},
            {condition: 'eq', keyName: 'status', keyValue: 'pending'},
          ],
          matchType: 'anyFilter',
          operation: 'get',
          tableId: 'users',
        })

        const qs = mockSupabaseApi.request.firstCall.args[3]
        expect(qs.or).to.include('status.eq.active')
        expect(qs.or).to.include('status.eq.pending')
      })
    })

    describe('unknown operation', () => {
      it('returns error without making a request', async () => {
        const result = await execute(mockConfig, {operation: 'unknown' as any, tableId: 'users'})

        expect(result.success).to.be.false
        expect(result.error).to.include('Unknown operation')
        expect(mockSupabaseApi.request.called).to.be.false
      })
    })
  })
})
