import oracledb from 'oracledb'

export const opts = {
  outFormat: oracledb.OUT_FORMAT_OBJECT
}

export const optsCursor = {
  dir: oracledb.BIND_OUT, outFormat: oracledb.OUT_FORMAT_OBJECT, type: oracledb.CURSOR
}

export const optsImages = {
  outFormat: oracledb.OUT_FORMAT_OBJECT,
  fetchInfo: {
    blob_data: {
      type: oracledb.BUFFER
    }
  }
}
