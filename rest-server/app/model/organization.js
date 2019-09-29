'use strict';

module.exports = app => {
  const { STRING } = app.Sequelize;

  const Organization = app.model.define('Organization', {
    id: {
      field: 'id',
      type: STRING(32),
      allowNull: false,
      primaryKey: true,
      defaultValue() {
        return `${app.generateId(11)}`;
      },
    },
    name: {
      field: 'name',
      type: STRING(50),
      allowNull: false,
    },
    ids: {
      field: 'ids',
      type: STRING(255),
      allowNull: false,
    },
    names: {
      field: 'names',
      type: STRING(255),
      allowNull: false,
    },
    pid: {
      field: 'pid',
      type: STRING(20),
    },
    typ: {
      field: 'typ',
      type: STRING(10),
    },
    description: {
      field: 'description',
      type: STRING,
      allowNull: true,
    },
  }, {
    comment: '组织结构表',
    tableName: 'organization_t',
    name: {
      singular: 'organization',
      plural: 'organizations',
    },
  });

  Organization.associate = function() {
    Organization.hasMany(app.model.User, { foreignKey: 'orgId', constraints: false });
  };

  return Organization;
};
