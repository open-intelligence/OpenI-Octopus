const mysqlConfig = require('../config/dataConfig');
const logger = require('../config/logger');

const marked = require('marked');

require('../db/models');

const db = sequelizeModels.ImageSet;

const getAllImageSet = (callback)=>{
    db.findAll({

    }).then((dbImages)=>{
        let images = {};
        for (let dbImage of dbImages) {
            dbImage.dataValues.description = marked(dbImage.dataValues.description);
            images[dbImage.dataValues.id] = dbImage.dataValues;
        }
        callback(null, images);
    }).catch((err)=>{
        logger.error('getAllImageSet error:' + err);
        callback(err, null);
    });
};

module.exports = {getAllImageSet};
