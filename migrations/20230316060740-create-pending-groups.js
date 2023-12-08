'use strict';
/** @type {import('sequelize-cli').Migration} */
const { DataTypes, Model } = require("sequelize");
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PendingGroups', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      name: { type: DataTypes.STRING },
      students:{type:DataTypes.JSON},
      count_students: { type: DataTypes.STRING, defaultValue: "0" },
      status: { type: DataTypes.STRING, defaultValue: "active" },
      updatedAt: { type: DataTypes.DATE },
      createdAt: { type: DataTypes.DATE },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('PendingGroups');
  }
};