'use strict';

module.exports = app => {
  const { STRING, INTEGER, DATE, BOOLEAN } = app.Sequelize;
  const constants = {
    status: {
      FORBIDDEN: 0, // 禁用
      ZERO_HOUR: 9, // 零时用户
      ALLOW_NOT_ACTIVE: 10, // 正常未激活
      ALLOW_ACTIVE: 11, // 正常激活
    },
  };

  const User = app.model.define('User', {
    id: {
      field: 'id',
      type: INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    username: {
      field: 'username',
      type: STRING,
      allowNull: false,
      unique: true,
    },
    passwordKey: {
      field: 'passwordKey',
      type: STRING,
      allowNull: false,
      defaultValue: '',
    },
    email: {
      field: 'email',
      type: STRING(50),
      unique: true,
    },
    fullName: {
      field: 'full_name',
      type: STRING(36),
    },
    orgId: {
      field: 'org_id',
      type: STRING(32),
    },
    status: {
      field: 'status',
      type: INTEGER,
      defaultValue: constants.status.ALLOW_NOT_ACTIVE,
    },
    teacher: {
      field: 'teacher',
      type: STRING(50),
    },
    phone: {
      field: 'phone',
      type: STRING(20),
    },
    uid: {
      field: 'uid',
      type: STRING(32),
      unique: true,
      defaultValue() {
        return `_${app.generateId(31)}`;
      },
    },
    admin: {
      field: 'admin',
      type: BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    virtualCluster: {
      field: 'virtualCluster',
      type: STRING,
      allowNull: false,
      defaultValue: 'default',
    },
    modifyTime: {
      field: 'modifyTime',
      type: DATE,
      allowNull: false,
      defaultValue: new Date(),
    },
  }, {
    tableName: 'users',
    name: {
      singular: 'user',
      plural: 'users',
    },
    indexes: [
      { fields: [ 'full_name' ] },
      { fields: [ 'org_id' ] },
      { fields: [ 'teacher' ] },
    ],
  });

  User.associate = function() {
    User.belongsTo(app.model.Organization, { foreignKey: 'orgId', constraints: false });
  };

  User.constants = constants;

  return User;
};
