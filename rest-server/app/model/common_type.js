'use strict';

module.exports = app => {
  const { STRING, INTEGER } = app.Sequelize;

  const CommonType = app.model.define('CommonType', {
    id: {
      field: 'id',
      type: INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    typeKey: {
      field: 'type_key',
      type: STRING(100),
      allowNull: false,
      unique: true,
    },
    typeName: {
      field: 'type_name',
      type: STRING(80),
      allowNull: false,
    },
    description: {
      field: 'description',
      type: STRING,
      allowNull: true,
      defaultValue: '',
    },
  }, {
    comment: '通用类型表',
    tableName: 'common_type_t',
    name: {
      singular: 'commonType',
      plural: 'commonTypes',
    },
  });

  CommonType.associate = function() {
    CommonType.hasMany(app.model.CommonItem, { foreignKey: 'typeId', constraints: false });
  };

  return CommonType;
};
