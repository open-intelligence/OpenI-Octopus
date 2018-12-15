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

// module dependencies
const userModel = require('../models/users');
const logger = require('../config/logger');
const subProcess = require('child_process');
const launcherConfig = require('../config/launcher');

/**
 * Create / update a user.
 */
const update = (req, res) => {
  const username = req.body.username;
  const password = req.body.password;

  if (req.user.admin) {
      let userInfo = userModel.getUserInfo(username);

      let admin = userInfo?userInfo.admin:false;

      userModel.update(username, password, admin, (err, state) => {
      if (err || !state) {
        logger.warn('update user %s failed', username);
        return res.status(500).json(Utils.Response(500, 'update user info failed'));
      } else {
          subProcess.exec(
              `HADOOP_USER_NAME=root hdfs dfs -mkdir -p ${launcherConfig.hdfsUri}/userlogs`,
              (err, stdout, stderr) => {
              if (err) {
                  logger.warn('create user log dir error \n%s', err.stack);
              }
          });

          subProcess.exec(
              `HADOOP_USER_NAME=root hdfs dfs -chmod -R 777 ${launcherConfig.hdfsUri}/userlogs`,
              (err, stdout, stderr) => {
              if (err) {
                  logger.warn('change user log dir authority error \n%s', err.stack);
              }
          });

          return res.status(201).json(Utils.Response(200, 'update user info successfully'));
      }
    });
  } else {
    return res.status(401).json(Utils.Response(401, 'No Admin Authorized'));
  }
};

/**
 * Remove a user.
 */
const remove = (req, res) => {
  const username = req.body.username;
  if (req.user.admin) {
    userModel.remove(username, (err, state) => {
      if (err || !state) {
        logger.warn('remove user %s failed', username);
        return res.status(500).json({
          error: 'RemoveFailed',
          message: 'remove failed',
        });
      } else {
        return res.status(200).json({
          message: 'remove successfully',
        });
      }
    });
  } else {
    return res.status(401).json({
      error: 'NotAuthorized',
      message: 'not authorized',
    });
  }
};

/**
 * Update user virtual clusters.
 */
const updateUserVc = (req, res) => {
  const username = req.params.username;
  const virtualClusters = req.body.virtualClusters;
  if (req.user.admin) {
    userModel.updateUserVc(username, virtualClusters, (err, state) => {
      if (err || !state) {
        logger.warn('update %s virtual cluster %s failed', username, virtualClusters);
        if (err.message === 'InvalidVirtualCluster') {
          return res.status(500).json({
            error: 'InvalidVirtualCluster',
            message: `update virtual cluster failed: could not find virtual cluster ${virtualClusters}`,
          });
        } else {
          return res.status(500).json({
            error: 'UpdateVcFailed',
            message: 'update user virtual cluster failed',
          });
        }
      } else {
        return res.status(201).json({
          message: 'update user virtual clusters successfully',
        });
      }
    });
  } else {
    return res.status(401).json({
      error: 'NotAuthorized',
      message: 'not authorized',
    });
  }
};

/**
 * Update user list.
 */
const getUserList = (req, res, next) => {
  if (req.user.admin) {
    userModel.getUserList((err, userList) => {
      if (err) {
        return next(createError.unknown(err));
      }
      return res.status(200).json(userList);
    });
  } else {
    next(createError('Forbidden', 'ForbiddenUserError', `Non-admin is not allowed to do this operation.`));
  }
};

/**
 * update a user password.
 */
const updatePassword = (req, res) => {
    const {username, oldPassword, newPassword} = req.body;

    if (oldPassword === newPassword) {
        return res.status(500).json(Utils.Response(500, 'oldPassword&newPassword cannot equal'));
    }

    let userInfo = userModel.getUserInfo(username);
    if (!userInfo) {
        return res.status(401).json(Utils.Response(401, 'NotAuthorized'));
    }

    userModel.updatePassword(oldPassword, newPassword, userInfo, (err, state)=>{
        if (err || !state) {
            logger.warn('update user %s password failed', username);
            return res.status(500).json(Utils.Response(500, (err?err.message:'update user password failed')));
        }
        res.status(201).json(Utils.Response(200, 'update user password successfully'));
    });
};

// module exports
module.exports = {update, remove, updateUserVc, getUserList, updatePassword};
