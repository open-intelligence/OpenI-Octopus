
const imagesetModel = require('../models/imageset');


const dbQueryAllSet = (callback) =>{
    imagesetModel.getAllImageSet((err,images)=>{
        callback(err,images);
    });
};


module.exports ={ dbQueryAllSet };