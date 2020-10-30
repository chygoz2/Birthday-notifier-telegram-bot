const { Sequelize, DataTypes } = require("sequelize");
const sequelize = require("../databaseConnection");

const ChatGroup = sequelize.define(
  "ChatGroup",
  {
    // Model attributes are defined here
    id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    chatName: {
      type: DataTypes.STRING,
    },
  },
  {
    // Other model options go here
  }
);

ChatGroup.sync({ alter: true })

module.exports = ChatGroup;
