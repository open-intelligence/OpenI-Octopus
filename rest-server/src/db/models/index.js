'use strict';

const fs = require('fs');
const path = require('path');
const mysqlConfig = require('../../config/dataConfig');
const Sequelize = require('sequelize');
const sequelizeInstance = new Sequelize(mysqlConfig.database, mysqlConfig.user, mysqlConfig.password, mysqlConfig.options);

global.sequelizeModels = {};

fs.readdirSync(__dirname)
    .filter((file) => {
        return (file.indexOf('.') !== 0) && /^.+\.js$/.test(file) && (file !== 'index.js');
    })
    .forEach((file) => {
        const model = sequelizeInstance.import(path.join(__dirname, file));
        sequelizeModels[model.name] = model;
    });

Object.keys(sequelizeModels).forEach((modelName) => {
    if ('associate' in sequelizeModels[modelName]) {
        sequelizeModels[modelName].associate(sequelizeModels);
    }
    if ('postScope' in sequelizeModels[modelName]) {
        sequelizeModels[modelName].postScope(sequelizeModels);
    }
});


sequelizeModels.sequelize = sequelizeInstance;
sequelizeModels.Sequelize = Sequelize;
