'use strict';

const { ECode, LError } = require('../../../lib');

const Constants = require('./constants');


/**
 * @param {String} next_state state of job
 * @return {Array} valid state list
 * @api private
 */

function current_valid_state(next_state) {

  if (Constants.FRAMEWORK_STATUS.UNKNOWN === next_state) {
    return [
      Constants.FRAMEWORK_STATUS.WAITING,
      Constants.FRAMEWORK_STATUS.RUNNING,
      Constants.FRAMEWORK_STATUS.FAILED,
      Constants.FRAMEWORK_STATUS.STOPPED,
      Constants.FRAMEWORK_STATUS.SUCCEEDED,
      Constants.FRAMEWORK_STATUS.UNKNOWN,
    ];
  }

  if (Constants.FRAMEWORK_STATUS.RUNNING === next_state) {
    return [
      Constants.FRAMEWORK_STATUS.WAITING,
      Constants.FRAMEWORK_STATUS.UNKNOWN,
      next_state,
    ];
  }

  if (Constants.FRAMEWORK_STATUS.WAITING === next_state) {
    return [
      Constants.FRAMEWORK_STATUS.UNKNOWN,
      next_state,
    ];
  }


  const exited_state = [
    Constants.FRAMEWORK_STATUS.FAILED,
    Constants.FRAMEWORK_STATUS.STOPPED,
    Constants.FRAMEWORK_STATUS.SUCCEEDED,
  ];

  if (exited_state.includes(next_state)) {
    return [
      Constants.FRAMEWORK_STATUS.UNKNOWN,
      Constants.FRAMEWORK_STATUS.WAITING,
      Constants.FRAMEWORK_STATUS.RUNNING,
      next_state,
    ];
  }

  return [];
}


/**
 *
 * @param {JSON} job_config config of the job
 * @api public
 */
function checkMinTaskNumber(job_config) {

  let ok = true;

  for (let i = 0; i < job_config.taskRoles.length; i++) {

    const role = job_config.taskRoles[i];

    if ((role.minFailedTaskCount || 0) > role.taskNumber) {
      ok = false;
    }

    if ((role.minSucceededTaskCount || 0) > role.taskNumber) {
      ok = false;
    }

    if (ok === false) {
      break;
    }

  }

  if (ok === true) {
    return;
  }

  throw new LError(ECode.INVALID_PARAM, 'minFailedTaskCount or minSucceededTaskCount should not be greater than tasks number.');

}


exports.current_valid_state = current_valid_state;

exports.checkMinTaskNumber = checkMinTaskNumber;
