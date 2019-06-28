const LError = require("../../error/proto");
const ECode = require("../../error/code");


function checkJobLimit(job,jobLimits){

    if (!jobLimits || !job) {
      return;
    }
    const errors = [];

    Object.keys(jobLimits).forEach(limitKey => {

      if (!jobLimits[limitKey] || !job[limitKey]) {
        return;
      }

      if (job[limitKey] > jobLimits[limitKey]) {
        errors.push(limitKey);
      }


    });

    if (errors.length > 0) {
      throw new LError(ECode.INVALID_PARAM, `${errors.join(',')}`);
    }
}

function checkMinTaskNumber(job){

    let ok = true;

    for (let i = 0; i < job.taskRoles.length; i++) {

      const role = job.taskRoles[i] ;

      if ((role.minFailedTaskCount || 0) > role.taskNumber ){
         ok = false;
      }

      if ((role.minSucceededTaskCount || 0) > role.taskNumber){
        ok = false
      }

      if (false == ok){
         break;
      }

    }

    if(true == ok){
      return 
    }

    throw new LError(ECode.INVALID_PARAM, "minFailedTaskCount or minSucceededTaskCount should not be greater than tasks number.");

}


exports.checkJobLimit = checkJobLimit;

exports.checkMinTaskNumber = checkMinTaskNumber;