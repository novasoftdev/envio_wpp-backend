import {simpleExecute} from "../configuration/database/database_methods.js";
import {opts} from "../configuration/database/oracle_db_configuration.js";


export const selectWppParametros = async () => {
    try{
        const query = `SELECT TELEFONO, EMPRESA, ACTIVO, ID, DESCRIPCION, HORARIO_INICIO, CODIGO_QR, ESTADO, HORARIO_FIN
        FROM STOCK.ST_WPP_PARAMETROS
        WHERE ACTIVO = 1`

        const result = await simpleExecute(query,{}, opts)
        return result.rows
    } catch (e) {
        throw e;
    }
}

// update CODIGO_QR
export const updateQrCode = async (CODIGO_QR, ID) => {
    try{
        const query = `UPDATE STOCK.ST_WPP_PARAMETROS SET CODIGO_QR = :CODIGO_QR WHERE ID = :ID`

        const result = await simpleExecute(query, {CODIGO_QR, ID}, opts)
        return result
    } catch (e) {
        throw e;
    }
}

//update ESTADO and LOG
export const updateEstado = async (ESTADO, LOG, ID) => {
    try{
        const query = `UPDATE STOCK.ST_WPP_PARAMETROS SET ESTADO = :ESTADO, LOG = :LOG WHERE ID = :ID`

        const result = await simpleExecute(query, {ESTADO, LOG, ID}, opts)
        return result
    } catch (e) {
        throw e;
    }
}