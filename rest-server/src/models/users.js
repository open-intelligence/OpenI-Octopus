
// module dependencies
const crypto = require('crypto');

const mysqlConfig = require('../config/dataConfig');

const logger = require('../config/logger');

const VirtualCluster = require('./vc');

require('../db/models');

const db = sequelizeModels.User;

global.GlobalUsers = {};

const setDefaultAdmin = (callback) => {
    update(mysqlConfig.adminName, mysqlConfig.adminPass, true, (err, isSuccess) => {
        if (err || !isSuccess) {
            logger.error('setDefaultAdmin error:' + err);

            callback(new Error('setDefaultAdmin error'), false);

            return;
        }

        callback(null, true);
    });
};

const initUserList = () => {
    db.findAll({
        attributes: ['username', 'passwordKey', 'admin', 'virtualCluster', 'modifyTime'],
    }).then((users)=>{
        for (let user of users) {
            let userInfo = {
                username: user.dataValues.username,
                admin: user.dataValues.admin,
                passwordKey: user.dataValues.passwordKey,
                virtualCluster: user.dataValues.virtualCluster,
                modifyTime: user.dataValues.modifyTime,
            };

            GlobalUsers[user.dataValues.username] = userInfo;
        }
    }).catch((err)=>{
        logger.error('initUserList error:' + err);
    });
};

const getUserList = (callback) => {
    const userInfoList = [];

    for (let userInfo of GlobalUsers) {
        userInfoList.push(userInfo);
    }

    return callback(null, userInfoList);
};

const getUserInfo = (username) => {
    return GlobalUsers[username];
};

const encrypt = (username, password) => {
    const iterations = 10000;
    const keylen = 64;
    const salt = crypto.createHash('md5').update(username).digest('hex');
    let derivedKey = crypto.pbkdf2Sync(password, salt, iterations, keylen, 'sha512').toString('hex');
    return derivedKey;
};

const update = (username, password, admin, callback) => {
    let derivedKey = encrypt(username, password);

    try {
        let userInfo = {
            username: username,
            passwordKey: derivedKey,
            admin: admin,
            virtualCluster: 'default',
            modifyTime: new Date(),
        };

        db.upsert(userInfo).then(()=>{
            GlobalUsers[username] = userInfo;

            callback(null, true);
        }).catch((err)=>{
            callback(err, false);
        });
    } catch (e) {
        logger.error('update user: ' + username + ' info failed. error:' + e);
    }
};

const updatePassword = (oldPassword, newPassword, condition, callback)=>{
    let derivedKey = encrypt(condition.username, oldPassword);
    if (condition.passwordKey !== derivedKey) {
        return callback(new Error('old password is wrong'), false);
    }
    let newPasswordKey = encrypt(condition.username, newPassword),
        newItem = {
            passwordKey: newPasswordKey,
            modifyTime: new Date(),
        };
    db.update(newItem, {where: condition}).then((result)=>{
        if (!result || !result[0]) {
            return callback(new Error('update password failure'), false);
        }
        GlobalUsers[condition.username] = Object.assign(condition, newItem);
        callback(null, true);
    }).catch((err)=>{
        callback(err, false);
    });
};

const remove = (username, callback) => {
    if (!username) {
       return callback(new Error('user does not exist'), false);
    }

    let userInfo = GlobalUsers[username];

    if (!userInfo) {
        return callback(new Error('user does not exist'), false);
    }

    if (userInfo.admin) {
        return callback(new Error('can not delete admin user'), false);
    }

    db.destroy({
            where: {
                username: username,
            },
        }).then(() =>{
            delete GlobalUsers[username];
            callback(null, true);
        }).catch((err) => {
             callback(new Error('delete user failed'), false);
        });
};


const updateUserVc = (username, virtualClusters, callback) => {
    // virtualClusters is a String
    if (!username) {
       return callback(new Error('user does not exist'), false);
    }

    let userInfo = GlobalUsers[username];

    if (!userInfo) {
        return callback(new Error('user does not exist'), false);
    }

    VirtualCluster.prototype.getVcList((vcList, err) => {
        if (err) {
            logger.warn('[updateUserVc1]:get virtual cluster list error\n%s', err.stack);
        } else if (!vcList) {
            logger.warn('list virtual clusters error, no virtual cluster found');
        } else {
            let updateVcList = userInfo.admin?Object.keys(vcList):virtualClusters.trim()
                .split(',').filter((updateVc) => (updateVc !== ''));

                // 默认有'default',非法的vc名字直接返回
            for (let Vc of updateVcList) {
                if (!vcList.hasOwnProperty(Vc)) {
                    return callback(new Error('InvalidVirtualCluster'), false);
                }
            }

            if (!updateVcList.includes('default')) { // always has 'default' queue
                updateVcList.push('default');
            }

            updateVcList.sort();

            db.update({
                virtualCluster: updateVcList.toString(),
            }, {
                where: {
                    username: username,
                },
            }).then(()=>{
                GlobalUsers[username].virtualCluster = updateVcList.toString();

                callback(null, true);
            }).catch((err)=>{
                logger.error('update %s virtual cluster: %s failed, error :', username, virtualClusters, err);
                callback(err, false);
            });
        }
    });
};


const checkUserVc = (username, virtualCluster, callback) => {
    if (!username) {
       callback(new Error('UnauthorizedUserError'), false);
    }

    let userInfo = GlobalUsers[username];

    if (!userInfo) {
        callback(new Error('UnauthorizedUserError'), false);
    }

    virtualCluster = !virtualCluster ? 'default' : virtualCluster;

    if (virtualCluster === 'default') {
        callback(null, true); // all users have right access to 'default'
    } else {
        VirtualCluster.prototype.getVcList((vcList, err) => {
            if (err) {
                logger.warn('get virtual cluster list error\n%s', err.stack);
            } else if (!vcList) {
                logger.warn('list virtual clusters error, no virtual cluster found');
            } else {
                if (!vcList.hasOwnProperty(virtualCluster)) {
                    return callback(new Error('VirtualClusterNotFound'), false);
                }

                if (virtualCluster === 'vc1') {
                    updateUserVc(username, virtualCluster, (errMsg, res) =>{
                        if (errMsg || !res) {
                            logger.warn('[checkUserVc]unable to set %s virtual cluster %s.', username, virtualCluster);
                            callback(new Error('Can\'t debug job, please contact Administrator!'));
                        } else {
                            logger.warn('[checkUserVc]set virtual cluster %s.', virtualCluster);
                            return callback(null, true);
                        }
                    });
                } else if (virtualCluster === 'vc2') {
                    updateUserVc(username, virtualCluster, (errMsg, res) =>{
                        if (errMsg || !res) {
                            logger.warn('[checkUserVc]unable to set %s virtual cluster %s.', username, virtualCluster);
                            callback(new Error('Can\'t submit job to competition vc, please contact Administrator!'));
                        } else {
                            logger.warn('[checkUserVc]set virtual cluster %s.', virtualCluster);
                            return callback(null, true);
                        }
                    });
                } else {
                    // 其他集群需要用户申请，与用户绑定，否则没有权限访问该集群，返回错误
                    let userVirtualClusters = userInfo.virtualCluster.trim().split(',');

                    for (let item of userVirtualClusters) {
                        if (item === virtualCluster) {
                            return callback(null, true);
                        }
                    }

                    return callback(new Error('NoRightAccessVirtualCluster'), false);
                }
            }
        });
    }
};


setDefaultAdmin((err, isSuccess)=> {
    if (err || !isSuccess) {
        logger.error('setDefaultAdmin error:' + err);
        return;
    }

    logger.info('setDefaultAdmin success');

    initUserList();
});


// module exports
module.exports = {encrypt, db, update, remove, updateUserVc, checkUserVc, getUserList, getUserInfo, updatePassword};
