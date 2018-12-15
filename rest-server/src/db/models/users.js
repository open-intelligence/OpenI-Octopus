
module.exports = (sequelize, DataTypes) => {
    return sequelize.define('User', {
        id: {
            field: 'id',
            type: DataTypes.INTEGER(11),
            allowNull: false,
            primaryKey: true,
            autoIncrement: true
        },
        username: {
            field: 'username',
            type: DataTypes.STRING,
            allowNull: false,
            primaryKey: true,
        },
        passwordKey: {
            field: 'passwordKey',
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: ''
        },
        admin: {
            field: 'admin',
            type: DataTypes.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        virtualCluster: {
            field: 'virtualCluster',
            type: DataTypes.STRING,
            allowNull: false,
            defaultValue: 'default'
        },
        modifyTime: {
            field: 'modifyTime',
            type: DataTypes.DATE,
            allowNull: false,
            defaultValue: new Date()
        }
    }, {
        tableName: 'users',
        timestamps: false,
    });
};