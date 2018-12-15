
const express = require('express');
const logger = require('../config/logger');
const router = new express.Router();

const imagesetController = require('../controllers/imageset');

const dbQueryAllSet = (req, res) =>{
    imagesetController.dbQueryAllSet((err, imageMap)=>{
        if (err) {
            res.status(500).json(Utils.Response('QueryImagesError', 'QueryImagesError'));
        } else {
            res.status(200).json(Utils.Response('0', '', imageMap));
        }
    });
};

const dbQuerySetdescription = (req, res) =>{
    let setId = req.params.imagesetid;

    lowdbMysql.get().then((mysql)=>{
        let row = mysql.get(lowdbMysql.tables.images)
            .find({id: setId}).value();
        if (row && row.createtime) {
            row.createtime = row.createtime.toString();
        }
        return {
            message: 'query image set successfully',
            data: row,
        };
    }).catch((e)=>{
        logger.info('[SELECT ERROR] - ', e.message);
        return {
            error: 'QueryDataSetError',
            message: 'image set  query error',
        };
    }).then((response)=>{
        if (response.error) {
            res.status(500).json(response);
        } else {
            res.status(202).json(response);
        }
    });
};

// 获取所有镜像信息
router.route('/')
    .get(dbQueryAllSet);

// 获取单个镜像具体信息
router.route('/:imagesetid')
    .get(dbQuerySetdescription);

module.exports = router;
