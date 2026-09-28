export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('coupon_usages', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    coupon_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'coupons',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    invoice_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'invoices',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    used_at: {
      type: Sequelize.DATE,
      allowNull: false,
    },
  });

  await queryInterface.addIndex('coupon_usages', ['coupon_id', 'invoice_id'], {
    name: 'coupon_usages_index_19',
    unique: true,
  });
  await queryInterface.addIndex('coupon_usages', ['coupon_id'], {
    name: 'coupon_usages_index_20',
  });
  await queryInterface.addIndex('coupon_usages', ['invoice_id'], {
    name: 'coupon_usages_index_21',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('coupon_usages');
}

export default { up, down };
