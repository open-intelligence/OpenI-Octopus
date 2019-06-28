'use strict';

module.exports = app => {
  const { STRING, INTEGER } = app.Sequelize;

  const DataSet = app.model.define('DataSet', {
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
    remark: {
      field: 'remark',
      type: STRING,
      allowNull: true,
    },
  }, {
    tableName: 'data_set_t',
    name: {
      singular: 'dataSet',
      plural: 'dataSets',
    },
  });

  return DataSet;
};
