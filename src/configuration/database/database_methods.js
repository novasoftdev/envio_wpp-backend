import oracledb from 'oracledb'
import { connectionOracle } from './index_db.js'

export const initialize = async () => {
  await oracledb.createPool(connectionOracle.poolDevelopment)
}

export const close = async () => {
  await oracledb.getPool().close()
}

export const simpleExecute = (statement, binds, opts = {}) => {
  return new Promise(async (resolve, reject) => {
    let conn
    opts.autoCommit = true

    try {
      conn = await oracledb.getConnection()
      const result = await conn.execute(statement, binds, opts)
      resolve(result)
    } catch (err) {
      reject(err)
    } finally {
      if (conn) {
        try {
          await conn.close()
        } catch (err) {
          console.log('Error: ', err)
        }
      }
    }
  })
}

export const simpleExecuteFunction = (statement) => {
  return new Promise(async (resolve, reject) => {
    let conn
    // opts.autoCommit = true;

    try {
      conn = await oracledb.getConnection()
      const result = await conn.execute(statement)
      resolve(result)
    } catch (err) {
      reject(err)
    } finally {
      if (conn) {
        try {
          await conn.close()
        } catch (err) {
          console.log('Error: ', err)
        }
      }
    }
  })
}
