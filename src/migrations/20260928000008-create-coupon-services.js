export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('coupon_services', {
    coupon_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      primaryKey: true,
      references: {
        model: 'coupons',
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
      onDelete: 'CASCADE',
    },
  });

  await queryInterface.addIndex('coupon_services', ['service_id'], {
    name: 'coupon_services_index_6',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('coupon_services');
}

export default { up, down };
