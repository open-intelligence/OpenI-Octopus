'use strict';

module.exports = app => {
  const { STRING, INTEGER, DATE } = app.Sequelize;

  const ImageSet = app.model.define('ImageSet', {
    id: {
      field: 'id',
      type: INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      field: 'name',
      type: STRING,
      allowNull: false,
      primaryKey: true,
      defaultValue: '',
    },
    place: {
      field: 'place',
      type: STRING,
      allowNull: false,
      defaultValue: '',
    },
    description: {
      field: 'description',
      type: STRING,
      allowNull: false,
      defaultValue: '',
    },
    provider: {
      field: 'provider',
      type: STRING,
      allowNull: false,
      defaultValue: '',
    },
    createtime: {
      field: 'createtime',
      type: DATE,
      allowNull: false,
      defaultValue: new Date(),
    },
    remark: {
      field: 'remark',
      type: STRING,
      allowNull: true,
    },
  }, {
    tableName: 'imageset',
    timestamps: false,
    name: {
      singular: 'imageSet',
      plural: 'imageSets',
    },
  });

  ImageSet.associate = function() {
    ImageSet.belongsToMany(app.model.JobPlatform, {
      through: {
        model: app.model.ImageSetJobPlatformRelation,
        unique: false,
      },
      foreignKey: 'imageSetId',
      constraints: false,
    });
  };

  return ImageSet;
};
