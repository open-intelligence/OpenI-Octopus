'use strict';
  
module.exports = app => {
    const { STRING, DATE } = app.Sequelize;
 
    const Runtime = app.model.define('Runtime', {
        jobId: {
          field: 'job_id',
          type: STRING(64),
          primaryKey: true,
          allowNull: false,
        },
        namespace: {
          field: 'namespace',
          type: STRING(64),
          allowNull: false,
        },
        beginTime: {
          field: 'begin_time',
          type: DATE,
          allowNull: false,
        },
      }, {
        comment: '运行时间',
        tableName: 'run_time',
        name: {
            singular: 'runTime',
            plural: 'runTimes',
        },
      });
  
    return Runtime;
};