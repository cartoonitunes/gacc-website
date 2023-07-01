'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class RevealedKittenMetadata extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  RevealedKittenMetadata.init({
    token: DataTypes.STRING,
    metadata: DataTypes.JSONB
  }, {
    sequelize,
    modelName: 'RevealedKittenMetadata',
  });
  return RevealedKittenMetadata;
};