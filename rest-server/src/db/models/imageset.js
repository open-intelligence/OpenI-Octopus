
module.exports = (sequelize, DataTypes) => {
    return sequelize.define('ImageSet', {
        id: {
            field: 'id',
            type: DataTypes.INTEGER(11),
            allowNull: false,
            primaryKey: true,
            autoIncrement: true,
        },
        name: {
            field: 'name',
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: true,
            defaultValue: '',
        },
        place: {
            field: 'place',
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '',
        },
        description: {
            field: 'description',
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '',
        },
        provider: {
            field: 'provider',
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: '',
        },
        createtime: {
            field: 'createtime',
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: new Date(),
        },
        remark: {
            field: 'remark',
            type: DataTypes.STRING,
            allowNull: true,
        },
    }, {
        tableName: 'imageset',
        timestamps: false,
    });
};
