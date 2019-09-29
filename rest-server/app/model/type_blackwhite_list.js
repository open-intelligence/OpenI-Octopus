'use strict';

module.exports = app => {
  const { STRING, TEXT, ENUM } = app.Sequelize;

  const TypeBlackWhiteList = app.model.define('TypeBlackWhiteList', {
    id: {
      field: 'type',
      type: STRING,
      allowNull: false,
      primaryKey: true,
    },
    localLimit: {
      field: 'local_limit',
      type: ENUM('black', 'white'),
      allowNull: false,
      defaultValue: 'black',
    },
    localUsers: {
      field: 'local_users',
      type: TEXT,
      allowNull: false,
      defaultValue: '',
    },
    globalLimit: {
      field: 'global_limit',
      type: ENUM('black', 'white'),
      allowNull: false,
      defaultValue: 'black',
    },
    description: {
      field: 'description',
      type: STRING,
      allowNull: false,
      defaultValue: '',
    },
  }, {
    tableName: 'type_blackwhite_t',
    name: {
      singular: 'typeBlackWhite',
      plural: 'typeBlackWhiteList',
    },
  });

  return TypeBlackWhiteList;
};
