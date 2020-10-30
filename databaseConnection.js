const { Sequelize } = require('sequelize');
const pgConnectionString = process.env.PG_CONNECTION_STRING;

const sequelize = new Sequelize(pgConnectionString);

module.exports = sequelize