export async function up(queryInterface) {
  await queryInterface.dropTable('settings');
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.createTable('settings', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    key: {
      type: Sequelize.STRING(100),
      allowNull: false,
      unique: true,
    },
    value: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
  });
}

export default { up, down };
