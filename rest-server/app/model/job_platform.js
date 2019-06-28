'use strict';

module.exports = app => {
  const {TEXT, STRING, INTEGER,ENUM } = app.Sequelize;

  const JobPlatform = app.model.define('JobPlatform', {
    id: {
      field: 'id',
      type: INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    platformKey: {
      field: 'platform_key',
      type: STRING(100),
      allowNull: false,
      unique: true,
    },
    name: {
      field: 'name',
      type: STRING(80),
      allowNull: false,
    },
    standard: {
      field: 'standard',
      type: TEXT,
      allowNull: true,
      get() {
        const standard = this.getDataValue('standard');
        return JSON.parse(standard);
      },
      set(value) {
        this.setDataValue('standard', JSON.stringify(value));
      },
    },
    description: {
      field: 'description',
      type: STRING,
      allowNull: true,
      defaultValue: '',
    },
    action: {
        field: 'action',
        type: ENUM('debug', 'no_debug', 'ssh', 'no_ssh'),
        allowNull: false,
    },
  }, {
    comment: '任务平台表',
    tableName: 'job_platform_t',
    name: {
      singular: 'jobPlatform',
      plural: 'jobPlatforms',
    },
  });

  JobPlatform.associate = function() {
    JobPlatform.belongsToMany(app.model.ImageSet, {
      through: {
        model: app.model.ImageSetJobPlatformRelation,
        unique: false,
      },
      foreignKey: 'jobPlatformId',
      constraints: false,
    });
  };

  return JobPlatform;
};
