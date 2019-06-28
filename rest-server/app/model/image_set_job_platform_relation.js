'use strict';

module.exports = app => {
  const { INTEGER } = app.Sequelize;

  const ImageSetJobPlatformRelation = app.model.define('ImageSetJobPlatformRelation', {
    id: {
      field: 'id',
      type: INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    imageSetId: {
      field: 'image_set_id',
      type: INTEGER(11),
      allowNull: false,
    },
    jobPlatformId: {
      field: 'job_platform_id',
      type: INTEGER(11),
      allowNull: false,
    },
  }, {
    comment: '镜像平台关系表',
    tableName: 'image_set_job_platform_r_t',
    indexes: [
        {
          unique: true,
          fields: [ 'image_set_id','job_platform_id' ]
        },
    ]
  });

  return ImageSetJobPlatformRelation;
};
