var assert = require('assert')
const CryptoJS = require('crypto-js')
import axios from 'axios'
import { PG_API_URL, PG_API_PORT, PG_CONNECTION, CRYPTO_KEY } from '../../dist/lib/constants'

const URL = `${PG_API_URL}:${PG_API_PORT}`
const STATUS = {
  SUCCESS: 200,
  ERROR: 500,
}
const PUBLIC_SCHEMA_ID = 2200

console.log('Running tests on ', URL)

describe('/', () => {
  it('GET', async () => {
    const res = await axios.get(`${URL}/`)
    assert.equal(res.status, STATUS.SUCCESS)
    assert.equal(!!res.data.version, true)
  })
})
describe('/health', () => {
  it('GET', async () => {
    const res = await axios.get(`${URL}/health`)
    assert.equal(res.status, STATUS.SUCCESS)
    assert.equal(!!res.data.date, true)
  })
})
describe('When passing an encrypted connection header', () => {
  it('should decrypt the connection and return a result', async () => {
    const encrypted = CryptoJS.AES.encrypt(PG_CONNECTION, CRYPTO_KEY).toString()
    const res = await axios.get(`${URL}/config`, {
      headers: {
        'X-Connection-Encrypted': encrypted,
      },
    })
    // console.log('res.data', res.data)
    const datum = res.data.find((x) => x.name == 'trace_recovery_messages')
    assert.equal(res.status, STATUS.SUCCESS)
    assert.equal(true, !!datum)
  })
  it('should fail with a bad connection', async () => {
    const encrypted = CryptoJS.AES.encrypt('bad connection', CRYPTO_KEY).toString()
    try {
      const res = await axios.get(`${URL}/config`, {
        headers: {
          'X-Connection-Encrypted': encrypted,
        },
      })
      assert.equal(res.status, STATUS.ERROR)
    } catch (error) {
      // console.log('error', error)
      assert.equal(error.response.status, STATUS.ERROR)
    }
  })
})
describe('/query', () => {
  it('POST', async () => {
    const res = await axios.post(`${URL}/query`, { query: 'SELECT * FROM USERS' })
    // console.log('res.data', res.data)
    const datum = res.data.find((x) => x.id == 1)
    assert.equal(res.status, STATUS.SUCCESS)
    assert.equal(datum.name, 'Joe Bloggs')
  })
})
describe('/config', () => {
  it('GET', async () => {
    const res = await axios.get(`${URL}/config`)
    // console.log('res.data', res.data)
    const datum = res.data.find((x) => x.name == 'trace_recovery_messages')
    assert.equal(res.status, STATUS.SUCCESS)
    assert.equal(true, !!datum)
  })
})
describe('/config/version', () => {
  it('GET', async () => {
    const res = await axios.get(`${URL}/config/version`)
    // console.log('res.data', res.data)
    assert.equal(res.status, STATUS.SUCCESS)
    assert.equal(true, res.data.version_number == '120003')
  })
})
describe('/schemas', () => {
  it('GET', async () => {
    const res = await axios.get(`${URL}/schemas`)
    // console.log('res.data', res.data)
    const datum = res.data.find((x) => x.name == 'public')
    const notIncluded = res.data.find((x) => x.name == 'pg_toast')
    assert.equal(res.status, STATUS.SUCCESS)
    assert.equal(true, !!datum)
    assert.equal(true, !notIncluded)
  })
  it('GET with system schemas', async () => {
    const res = await axios.get(`${URL}/schemas?includeSystemSchemas=true`)
    // console.log('res.data', res.data)
    const datum = res.data.find((x) => x.name == 'public')
    const included = res.data.find((x) => x.name == 'pg_toast')
    assert.equal(res.status, STATUS.SUCCESS)
    assert.equal(true, !!datum)
    assert.equal(true, !!included)
  })
  it('POST & PATCH', async () => {
    const res = await axios.post(`${URL}/schemas`, { name: 'api' })
    assert.equal('api', res.data.name)
    const newSchemaId = res.data.id
    const res2 = await axios.patch(`${URL}/schemas/${newSchemaId}`, { name: 'api_updated' })
    assert.equal('api_updated', res2.data.name)
    const res3 = await axios.patch(`${URL}/schemas/${newSchemaId}`, {
      name: 'api',
      owner: 'postgres',
    })
    assert.equal('api', res3.data.name)
  })
})
describe('/types', () => {
  it('GET', async () => {
    const res = await axios.get(`${URL}/types`)
    // console.log('res.data', res.data)
    const datum = res.data.find((x) => x.schema == 'public')
    const notIncluded = res.data.find((x) => x.schema == 'pg_toast')
    assert.equal(res.status, STATUS.SUCCESS)
    assert.equal(true, !!datum)
    assert.equal(true, !notIncluded)
  })
  it('GET with system types', async () => {
    const res = await axios.get(`${URL}/types?includeSystemSchemas=true`)
    // console.log('res.data', res.data)
    const datum = res.data.find((x) => x.schema == 'public')
    const included = res.data.find((x) => x.schema == 'pg_catalog')
    assert.equal(res.status, STATUS.SUCCESS)
    assert.equal(true, !!datum)
    assert.equal(true, !!included)
  })
})
describe('/functions', () => {
  it('GET', async () => {
    const res = await axios.get(`${URL}/functions`)
    // console.log('res.data', res.data)
    const datum = res.data.find((x) => x.schema == 'public')
    const notIncluded = res.data.find((x) => x.schema == 'pg_toast')
    assert.equal(res.status, STATUS.SUCCESS)
    assert.equal(true, !!datum)
    assert.equal(true, !notIncluded)
  })
  it('GET with system functions', async () => {
    const res = await axios.get(`${URL}/functions?includeSystemSchemas=true`)
    // console.log('res.data', res.data)
    const datum = res.data.find((x) => x.schema == 'public')
    const included = res.data.find((x) => x.schema == 'pg_catalog')
    assert.equal(res.status, STATUS.SUCCESS)
    assert.equal(true, !!datum)
    assert.equal(true, !!included)
  })
})
describe('/tables', async () => {
  it('GET', async () => {
    const tables = await axios.get(`${URL}/tables`)
    const datum = tables.data.find((x) => `${x.schema}.${x.name}` === 'public.users')
    const notIncluded = tables.data.find((x) => `${x.schema}.${x.name}` === 'pg_catalog.pg_type')
    assert.equal(tables.status, STATUS.SUCCESS)
    assert.equal(true, !!datum)
    assert.equal(true, !notIncluded)
  })
  it('should return the columns, grants, and policies', async () => {
    const tables = await axios.get(`${URL}/tables`)
    const datum = tables.data.find((x) => `${x.schema}.${x.name}` === 'public.users')
    const idColumn = datum.columns.find((x) => x.name === 'id')
    const nameColumn = datum.columns.find((x) => x.name === 'name')
    assert.equal(true, !!datum)
    assert.equal(datum.columns.length > 0, true)
    assert.equal(datum.primary_keys.length > 0, true)
    assert.equal(idColumn.is_updatable, true)
    assert.equal(idColumn.is_identity, true)
    assert.equal(nameColumn.is_identity, false)
    assert.equal(datum.grants.length > 0, true)
    assert.equal(datum.policies.length == 0, true)
  })
  it('should return the relationships', async () => {
    const tables = await axios.get(`${URL}/tables`)
    const datum = tables.data.find((x) => `${x.schema}.${x.name}` === 'public.users')
    const relationships = datum.relationships
    const relationship = relationships.find(
      (x) => x.source_schema === 'public' && x.source_table_name === 'todos'
    )
    assert.equal(relationships.length > 0, true)
    assert.equal(true, relationship.target_table_schema === 'public')
    assert.equal(true, relationship.target_table_name === 'users')
  })
  it('GET with system tables', async () => {
    const res = await axios.get(`${URL}/tables?includeSystemSchemas=true`)
    const included = res.data.find((x) => `${x.schema}.${x.name}` === 'pg_catalog.pg_type')
    assert.equal(res.status, STATUS.SUCCESS)
    assert.equal(true, !!included)
  })
  it('POST', async () => {
    await axios.post(`${URL}/tables`, {
      schema: 'public',
      name: 'test',
      columns: [
        { name: 'id', is_identity: true, is_nullable: false, data_type: 'bigint' },
        { name: 'data', data_type: 'text' },
      ],
      primary_keys: ['id'],
    })
    const { data: tables } = await axios.get(`${URL}/tables`)
    const test = tables.find((table) => `${table.schema}.${table.name}` === 'public.test')
    const id = test.columns.find((column) => column.name === 'id')
    const data = test.columns.find((column) => column.name === 'data')
    assert.equal(id.is_identity, true)
    assert.equal(id.is_nullable, false)
    assert.equal(id.data_type, 'bigint')
    assert.equal(data.is_identity, false)
    assert.equal(data.is_nullable, true)
    assert.equal(data.data_type, 'text')
    await axios.post(`${URL}/query`, { query: 'DROP TABLE public.test' })
  })
})
describe('/extensions', () => {
  it('GET', async () => {
    const res = await axios.get(`${URL}/extensions`)
    // console.log('res.data', res.data)
    const datum = res.data.find((x) => x.name == 'uuid-ossp')
    assert.equal(res.status, STATUS.SUCCESS)
    assert.equal(true, !!datum)
  })
})
describe('/roles', () => {
  it('GET', async () => {
    const res = await axios.get(`${URL}/roles`)
    // console.log('res', res)
    const datum = res.data.find((x) => x.name == 'postgres')
    const hasSystemSchema = datum.grants.some((x) => x.schema == 'information_schema')
    const hasPublicSchema = datum.grants.some((x) => x.schema == 'public')
    assert.equal(res.status, STATUS.SUCCESS)
    assert.equal(true, !!datum)
    assert.equal(hasSystemSchema, false)
    assert.equal(hasPublicSchema, true)
  })
  it('POST', async () => {
    await axios.post(`${URL}/roles`, {
      name: 'test',
      is_superuser: true,
      can_create_db: true,
      is_replication_role: true,
      can_bypass_rls: true,
      connection_limit: 100,
      valid_until: '2020-01-01T00:00:00.000Z',
    })
    const { data: roles } = await axios.get(`${URL}/roles`)
    const test = roles.find((role) => role.name === 'test')
    assert.equal(test.is_superuser, true)
    assert.equal(test.can_create_db, true)
    assert.equal(test.is_replication_role, true)
    assert.equal(test.can_bypass_rls, true)
    assert.equal(test.connection_limit, 100)
    assert.equal(test.valid_until, '2020-01-01T00:00:00.000Z')
    await axios.post(`${URL}/query`, { query: 'DROP ROLE test;' })
  })
})
