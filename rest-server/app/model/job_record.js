'use strict';

module.exports = app => {
  const { STRING, DATE } = app.Sequelize;
  const jobRecord = app.model.define('JobRecord', {
    job_id: {
      field: 'job_id',
      type: STRING(64),
      primaryKey: true,
      allowNull: false,
    },
    job_name: {
      field: 'job_name',
      type: STRING(80),
      allowNull: false,
    },
    job_type: {
      field: 'job_type',
      type: STRING(100),
      allowNull: true,
    },
    user_id: {
      field: 'user_id',
      type: STRING(64),
      allowNull: false,
    },
    org_id: {
      field: 'org_id',
      type: STRING(100),
      allowNull: true,
    },
    resource_usage: {
      field: 'resource_usage',
      type: app.Sequelize.JSON,
      allowNull: false,
    },
    job_state: {
      field: 'job_state',
      type: STRING(80),
      allowNull: true,
    },
    created_at: {
      field: 'created_at',
      type: DATE,
      allowNull: false,
    },
    completed_at: {
      field: 'completed_at',
      type: DATE,
      allowNull: true,
    },
    job_config: {
      field: 'job_config',
      type: app.Sequelize.JSON,
      allowNull: false,
    },
    job_detail: {
      field: 'job_detail',
      type: app.Sequelize.JSON,
      allowNull: false,
    },
  }, {
    comment: '任务记录',
    tableName: 'job_record',
    indexes: [
      { fields: [ 'user_id' ] },
      { fields: [ 'job_name' ] },
      { fields: [ 'job_state' ] },
      { fields: [ 'completed_at' ] },
    ],
  });

  return jobRecord;
};

 