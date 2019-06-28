'use strict';

exports.SUCCESS = {
  code: 'S000',
  msg: 'SUCCESS',
};

/**
 * @apiDefine NotFoundError
 * @apiError (Errors) NotFoundError resource not found.
 * @apiErrorExample {json} NotFoundError-Response:
 *     HTTP/1.1 200
 *     {
 *       "code": "S400",
 *       "msg": "NOT FOUND"
 *     }
 */
exports.NOT_FOUND = {
  code: 'S400',
  msg: 'NOT FOUND',
};

/**
 * @apiDefine FailureError
 * @apiError (Errors) FailureError failure.
 * @apiErrorExample {json} FailureError-Response:
 *     HTTP/1.1 200
 *     {
 *       "code": "S100",
 *       "msg": "FAILURE"
 *     }
 */
exports.FAILURE = {
  code: 'S100',
  msg: 'FAILURE',
};

/**
 * @apiDefine WrongPasswordError
 * @apiError (Errors) WrongPasswordError user authentication error.
 * @apiErrorExample {json} WrongPasswordError-Response:
 *     HTTP/1.1 200
 *     {
 *       "code": "S200",
 *       "msg": "WRONG PASSWORD"
 *     }
 */
exports.WRONG_PASSWORD = {
  code: 'S200',
  msg: 'WRONG PASSWORD',
};

/**
 * @apiDefine LackParameterError
 * @apiError (Errors) LackParameterError lack of required parameters.
 * @apiErrorExample {json} LackParameterError-Response:
 *     HTTP/1.1 200
 *     {
 *       "code": "S201",
 *       "msg": "LACK PARAM"
 *     }
 */
exports.LACK_PARAM = {
  code: 'S201',
  msg: 'LACK PARAM',
};

/**
 * @apiDefine InvalidParameterError
 * @apiError (Errors) InvalidParameterError parameter format error.
 * @apiErrorExample {json} InvalidParameterError-Response:
 *     HTTP/1.1 200
 *     {
 *       "code": "S202",
 *       "msg": "INVALID PARAM"
 *     }
 */
exports.INVALID_PARAM = {
  code: 'S202',
  msg: 'INVALID PARAM',
};

/**
 * @apiDefine IncompleteInfoError
 * @apiError (Errors) IncompleteInfoError parameter is incomplete.
 * @apiErrorExample {json} IncompleteInfoError-Response:
 *     HTTP/1.1 200
 *     {
 *       "code": "S203",
 *       "msg": "INCOMPLETE_INFO"
 *     }
 */
exports.INCOMPLETE_INFO = {
  code: 'S203',
  msg: 'INCOMPLETE INFO',
};

/**
 * @apiDefine OverMaxSizeError
 * @apiError (Errors) OverMaxSizeError format error.
 * @apiErrorExample {json} OverMaxSizeError-Response:
 *     HTTP/1.1 200
 *     {
 *       "code": "S204",
 *       "msg": "OVER MAX SIZE"
 *     }
 */
exports.OVER_MAX_SIZE = {
    code: 'S204',
    msg: 'OVER MAX SIZE',
};

/**
 * @apiDefine ResourceOverloadError
 * @apiError (Errors) ResourceOverloadError the resource already exist.
 * @apiErrorExample {json} ResourceOverloadError-Response:
 *     HTTP/1.1 200
 *     {
 *       "code": "S410",
 *       "msg": "RESOURCES_OVERLOAD"
 *     }
 */
exports.RESOURCES_OVERLOAD = {
  code: 'S410',
  msg: 'RESOURCES_OVERLOAD',
};

/**
 * @apiDefine AccessDeniedError
 * @apiError (Errors) AccessDeniedError request denial of access,maybe missing token.
 * @apiErrorExample {json} AccessDeniedError-Response:
 *     HTTP/1.1 200
 *     {
 *       "code": "S401",
 *       "msg": "ACCESS DENIED"
 *     }
 */
exports.ACCESS_DENIED = {
  code: 'S401',
  msg: 'ACCESS DENIED',
};

/**
 * @apiDefine OperationForbiddenError
 * @apiError (Errors) OperationForbiddenError operations are prohibited and privileges are lacking.
 * @apiErrorExample {json} OperationForbiddenError-Response:
 *     HTTP/1.1 200
 *     {
 *       "code": "S402",
 *       "msg": "OPERATION FORBIDDEN"
 *     }
 */
exports.OPERATION_FORBIDDEN = {
  code: 'S402',
  msg: 'OPERATION FORBIDDEN',
};

/**
 * @apiDefine ResourceConflictError
 * @apiError (Errors) ResourceConflictError operations are prohibited and privileges are lacking.
 * @apiErrorExample {json} ResourceConflictError-Response:
 *     HTTP/1.1 200
 *     {
 *       "code": "S409",
 *       "msg": "RESOURCE CONFLICT"
 *     }
 */
exports.RESOURCE_CONFLICT = {
  code: 'S409',
  msg: 'RESOURCE CONFLICT',
};

/**
 * @apiDefine RemoteInvokeError
 * @apiError (Errors) RemoteInvokeError invoke remote server to failure
 * @apiErrorExample {json} RemoteInvokeError-Response:
 *     HTTP/1.1 200
 *     {
 *       "code": "S505",
 *       "msg": "REMOTE INVOKE ERROR"
 *     }
 */
exports.REMOTE_INVOKE_ERROR = {
  code: 'S505',
  msg: 'REMOTE INVOKE ERROR',
};

/**
 * @apiDefine InternalError
 * @apiError (Errors) InternalError internal server error.
 * @apiErrorExample {json} InternalError-Response:
 *     HTTP/1.1 200
 *     {
 *       "code": "S500",
 *       "msg": "INTERNAL ERROR"
 *     }
 */
exports.INTERNAL_ERROR = {
  code: 'S500',
  msg: 'INTERNAL ERROR',
};

