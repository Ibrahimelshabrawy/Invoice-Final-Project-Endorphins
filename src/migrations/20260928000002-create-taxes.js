export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('taxes', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: Sequelize.STRING(100),
      allowNull: false,
    },
    rate: {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: false,
    },
    is_active: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('taxes');
}

export default { up, down };
