var pg = require('pg')
pg.types.setTypeParser(20, 'text', parseInt)
const { Pool } = require('pg')

const RunQuery = async (connection, sql) => {
  const pool = new Pool(connection)
  try {
    const results = await pool.query(sql)
    return { data: results.rows, error: null }
  } catch (error) {
    console.log('PG Error', error)
    throw error
  } finally {
    // Try to close the connection
    // Not necessary?
    try {
      pool.end()
    } catch (error) {
      console.log('pool.end error', error)
    }
  }
}

module.exports = RunQuery
