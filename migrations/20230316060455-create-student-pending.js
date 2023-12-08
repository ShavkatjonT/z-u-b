'use strict';
/** @type {import('sequelize-cli').Migration} */
const { DataTypes, Model } = require("sequelize");
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('StudentPendings', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        allowNull: false,
        primaryKey: true,
      },
      firstname: { type: DataTypes.STRING },
      gender: { type: DataTypes.STRING },
      birthday: { type: DataTypes.STRING },
      lastname: { type: DataTypes.STRING },
      fathername: { type: DataTypes.STRING },
      address: { type: DataTypes.STRING },
      fatherPhone: { type: DataTypes.STRING },
      motherPhone: { type: DataTypes.STRING },
      group_id: { type: DataTypes.STRING },
      class:{type:DataTypes.STRING},
      status: { type: DataTypes.STRING, defaultValue: "active" },
      updatedAt: { type: DataTypes.DATE },
      createdAt: { type: DataTypes.DATE },
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('StudentPendings');
  }
};