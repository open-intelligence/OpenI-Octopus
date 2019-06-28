// License please refer to: http://www.aitisa.org.cn/uploadfile/2018/0910/20180910031548314.pdf

'use strict';


module.exports = app => {
  const { STRING, INTEGER } = app.Sequelize;

  const ThirdUser = app.model.define('ThirdUser', {
    id: {
      field: 'id',
      type: INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    thirdId: {
      field: 'third_id',
      type: STRING,
      allowNull: false,
    },
    platform: {
      field: 'platform',
      type: STRING,
      allowNull: false,
    },
    originData: {
      field: 'origin_data',
      type: STRING,
      get() {
        const originData = this.getDataValue('originData');
        if (!originData) {
          return originData;
        }
        try {
          return JSON.parse(originData);
        } catch (e) {
          app.logger.error(e);
          return originData;
        }
      },
      set(val) {
        try {
          this.setDataValue('originData', JSON.stringify(val));
        } catch (e) {
          app.logger.error(e);
          throw e;
        }
      },
    },
    userId: {
      field: 'user_id',
      type: INTEGER,
    },
  }, {
    comment: '第三方用户',
    tableName: 'third_user_t',
    name: {
      singular: 'thirdUser',
      plural: 'thirdUsers',
    },
    indexes: [
      { fields: [ 'third_id', 'platform' ] },
      { fields: [ 'user_id' ] },
    ],
  });

  ThirdUser.associate = function() {
    ThirdUser.belongsTo(app.model.User, { foreignKey: 'userId', constraints: false });
  };

  return ThirdUser;
};
