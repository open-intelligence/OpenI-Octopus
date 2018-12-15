
class HTTPResponse {
    /**
     * @param {String} retCode - 返回错误码
     * @param {String} retMsg - 返回错误信息
     * @param {Object} result - 返回的内容
     * @return {Object} - 返回HTTPResponse
     */
    constructor(retCode, retMsg, result={}) {

    }
}

const logger = require('../config/logger');

class Utils {
    static MissingError(paramName) {
        logger.error('Missing Parameter:'+paramName);
    }

    /**
     * @param {String} retCode - 返回错误码
     * @param {String} retMsg - 返回错误信息
     * @param {Object} result - 返回的内容
     * @return {Object} - 返回HTTPResponse
     */
    static Response(retCode = MissingError('retCode'), retMsg = MissingError('retMsg'), result={}) {
        return {retCode, retMsg, result};
    }
}

module.exports = Utils;
