export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('bundles', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    name: {
      type: Sequelize.STRING(255),
      allowNull: false,
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    price: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
    },
    service_ids: {
      type: Sequelize.JSON,
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
  await queryInterface.dropTable('bundles');
}

export default { up, down };
