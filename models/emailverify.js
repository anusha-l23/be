'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class emailVerify extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  emailVerify.init({
    userId: DataTypes.INTEGER,
    code: DataTypes.STRING,
    expiry: DataTypes.DATE
  }, {
    sequelize,
    modelName: 'emailVerify',
  });
  return emailVerify;
};