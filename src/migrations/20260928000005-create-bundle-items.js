export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('bundle_items', {
    bundle_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'bundles',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    service_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'services',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    quantity: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('bundle_items');
}

export default { up, down };
