'use strict';

module.exports = app => {
  const { STRING, INTEGER } = app.Sequelize;

  const CommonItem = app.model.define('CommonItem', {
    id: {
      field: 'id',
      type: INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true,
    },
    itemKey: {
      field: 'item_key',
      type: STRING(100),
      allowNull: false,
    },
    itemValue: {
      field: 'item_value',
      type: STRING(100),
      allowNull: false,
    },
    itemName: {
      field: 'item_name',
      type: STRING(80),
      allowNull: false,
    },
    typeId: {
      field: 'type_id',
      type: INTEGER(11),
      allowNull: true,
    },
    description: {
      field: 'description',
      type: STRING,
      allowNull: false,
      defaultValue: '',
    },
  }, {
    tableName: 'common_item_t',
    name: {
      singular: 'commonItem',
      plural: 'commonItems',
    },
  });

  CommonItem.associate = function() {
    CommonItem.belongsTo(app.model.CommonType, { foreignKey: 'typeId', constraints: false });
  };

  return CommonItem;
};
