// Copyright (c) Microsoft Corporation
// All rights reserved.
//
// MIT License
//
// Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated
// documentation files (the "Software"), to deal in the Software without restriction, including without limitation
// the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and
// to permit persons to whom the Software is furnished to do so, subject to the following conditions:
// The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED *AS IS*, WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING
// BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
// NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
'use strict';

module.exports = app => {
  const { STRING, INTEGER, DATE, BOOLEAN } = app.Sequelize;

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
      primaryKey: true,
    },
    passwordKey: {
      field: 'passwordKey',
      type: STRING,
      allowNull: false,
      defaultValue: '',
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
    timestamps: false,
  });

  return User;
};
