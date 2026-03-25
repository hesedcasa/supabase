/* eslint-disable @typescript-eslint/no-explicit-any */
import {expect} from 'chai'
import {createSandbox, type SinonStub, stub} from 'sinon'

import {SupabaseApi} from '../../src/supabase/supabase-api.js'

describe('SupabaseApi', () => {
  const mockConfig = {
    apiToken: 'test-api-token',
    email: 'test@example.com',
    host: 'https://myproject.supabase.co',
  }

  let api: SupabaseApi
  let sandbox: ReturnType<typeof createSandbox>
  let fetchStub: SinonStub

  beforeEach(() => {
    api = new SupabaseApi(mockConfig)
    sandbox = createSandbox()
    fetchStub = sandbox.stub(globalThis, 'fetch' as any)
  })

  afterEach(() => {
    sandbox.restore()
  })

  describe('buildGetQuery', () => {
    it('sets key to eq.value on obj', () => {
      const result = api.buildGetQuery({}, {condition: 'eq', keyName: 'id', keyValue: '42'})
      expect(result).to.deep.equal({id: 'eq.42'})
    })

    it('merges into existing obj', () => {
      const result = api.buildGetQuery({status: 'eq.active'}, {condition: 'eq', keyName: 'id', keyValue: '1'})
      expect(result).to.deep.equal({id: 'eq.1', status: 'eq.active'})
    })
  })

  describe('buildOrQuery', () => {
    it('returns condition-formatted string for non-fullText', () => {
      const result = api.buildOrQuery({condition: 'eq', keyName: 'status', keyValue: 'active'})
      expect(result).to.equal('status.eq.active')
    })

    it('returns searchFunction-formatted string for fullText', () => {
      const result = api.buildOrQuery({
        condition: 'fullText',
        keyName: 'body',
        keyValue: 'search term',
        searchFunction: 'fts',
      })
      expect(result).to.equal('body.fts.search term')
    })
  })

  describe('buildQuery', () => {
    it('returns condition-formatted value in obj', () => {
      const result = api.buildQuery({}, {condition: 'gt', keyName: 'age', keyValue: '18'})
      expect(result).to.deep.equal({age: 'gt.18'})
    })

    it('returns searchFunction-formatted value for fullText', () => {
      const result = api.buildQuery(
        {},
        {condition: 'fullText', keyName: 'title', keyValue: 'news', searchFunction: 'plfts'},
      )
      expect(result).to.deep.equal({title: 'plfts.news'})
    })
  })

  describe('getSchemaHeader', () => {
    it('returns empty object when no schema provided', () => {
      expect(api.getSchemaHeader('GET')).to.deep.equal({})
      expect(api.getSchemaHeader('POST')).to.deep.equal({})
    })

    it('returns Content-Profile for POST', () => {
      expect(api.getSchemaHeader('POST', 'custom')).to.deep.equal({'Content-Profile': 'custom'})
    })

    it('returns Content-Profile for PATCH, PUT, DELETE', () => {
      expect(api.getSchemaHeader('PATCH', 'custom')).to.deep.equal({'Content-Profile': 'custom'})
      expect(api.getSchemaHeader('PUT', 'custom')).to.deep.equal({'Content-Profile': 'custom'})
      expect(api.getSchemaHeader('DELETE', 'custom')).to.deep.equal({'Content-Profile': 'custom'})
    })

    it('returns Accept-Profile for GET and HEAD', () => {
      expect(api.getSchemaHeader('GET', 'custom')).to.deep.equal({'Accept-Profile': 'custom'})
      expect(api.getSchemaHeader('HEAD', 'custom')).to.deep.equal({'Accept-Profile': 'custom'})
    })
  })

  describe('request', () => {
    it('makes successful GET request and returns data', async () => {
      const mockData = [{id: 1, name: 'Alice'}]
      fetchStub.resolves({json: stub().resolves(mockData), ok: true})

      const result = await api.request('GET', '/users')

      expect(result.success).to.be.true
      expect(result.data).to.deep.equal(mockData)
      expect(fetchStub.calledOnce).to.be.true
      const [url, options] = fetchStub.firstCall.args
      expect(url).to.include('/rest/v1/users')
      expect(options.method).to.equal('GET')
    })

    it('includes auth headers on every request', async () => {
      fetchStub.resolves({json: stub().resolves([]), ok: true})

      await api.request('GET', '/users')

      const options = fetchStub.firstCall.args[1]
      expect(options.headers.apikey).to.equal('test-api-token')
      expect(options.headers.Authorization).to.equal('Bearer test-api-token')
    })

    it('sends body on POST with data', async () => {
      const body = [{name: 'Alice'}]
      fetchStub.resolves({json: stub().resolves(body), ok: true})

      await api.request('POST', '/users', body)

      const options = fetchStub.firstCall.args[1]
      expect(options.body).to.equal(JSON.stringify(body))
    })

    it('does not send body when body is empty object', async () => {
      fetchStub.resolves({json: stub().resolves([]), ok: true})

      await api.request('GET', '/users', {})

      const options = fetchStub.firstCall.args[1]
      expect(options.body).to.be.undefined
    })

    it('appends query string params to URL', async () => {
      fetchStub.resolves({json: stub().resolves([]), ok: true})

      await api.request('GET', '/users', {}, {limit: '10', offset: '0'})

      const [url] = fetchStub.firstCall.args
      expect(url).to.include('limit=10')
      expect(url).to.include('offset=0')
    })

    it('appends array qs values as repeated params for range filters', async () => {
      fetchStub.resolves({json: stub().resolves([]), ok: true})

      await api.request('GET', '/events', {}, {'updated_at': ['gte.2026-03-16', 'lt.2026-03-22']})

      const [url] = fetchStub.firstCall.args
      expect(url).to.include('updated_at=gte.2026-03-16')
      expect(url).to.include('updated_at=lt.2026-03-22')
    })

    it('uses custom uri when provided', async () => {
      fetchStub.resolves({json: stub().resolves([]), ok: true})
      const customUri = 'https://custom.example.com/endpoint'

      await api.request('GET', '/ignored', {}, {}, customUri)

      const [url] = fetchStub.firstCall.args
      expect(url).to.include('custom.example.com/endpoint')
    })

    it('merges extra headers into request', async () => {
      fetchStub.resolves({json: stub().resolves([]), ok: true})

      await api.request('POST', '/users', {}, {}, undefined, {'Content-Profile': 'custom'})

      const options = fetchStub.firstCall.args[1]
      expect(options.headers['Content-Profile']).to.equal('custom')
    })

    it('returns success: false on non-ok response with error message', async () => {
      fetchStub.resolves({json: stub().resolves({message: 'Row not found'}), ok: false, statusText: 'Not Found'})

      const result = await api.request('GET', '/users/999')

      expect(result.success).to.be.false
      expect(result.error).to.equal('Row not found')
    })

    it('falls back to statusText when error body has no message', async () => {
      fetchStub.resolves({json: stub().resolves({}), ok: false, statusText: 'Not Found'})

      const result = await api.request('GET', '/users/999')

      expect(result.success).to.be.false
      expect(result.error).to.equal('Not Found')
    })

    it('returns success: false when fetch throws', async () => {
      fetchStub.rejects(new Error('Network error'))

      const result = await api.request('GET', '/users')

      expect(result.success).to.be.false
      expect(result.error).to.equal('Network error')
    })
  })

  describe('validateCredentials', () => {
    it('returns success: true when credentials are valid', async () => {
      fetchStub.resolves({ok: true})

      const result = await api.validateCredentials()

      expect(result.success).to.be.true
      const [url] = fetchStub.firstCall.args
      expect(url).to.include('/rest/v1/')
    })

    it('returns success: false when credentials are invalid', async () => {
      fetchStub.resolves({ok: false})

      const result = await api.validateCredentials()

      expect(result.success).to.be.false
    })

    it('returns success: false when fetch throws', async () => {
      fetchStub.rejects(new Error('Connection refused'))

      const result = await api.validateCredentials()

      expect(result.success).to.be.false
      expect(result.error).to.equal('Connection refused')
    })
  })
})
