export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('invoice_items', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
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
    item_type: {
      type: Sequelize.ENUM('SERVICE', 'BUNDLE'),
      allowNull: false,
    },
    ref_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      comment: 'References services.id or bundles.id based on item_type',
    },
    description: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    quantity: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
    },
    unit_price: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      comment: 'Price snapshot at invoice creation',
    },
    coupon_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'coupons',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    discount: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    line_total: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
    },
  });

  await queryInterface.addIndex('invoice_items', ['invoice_id'], {
    name: 'invoice_items_index_11',
  });
  await queryInterface.addIndex('invoice_items', ['item_type'], {
    name: 'invoice_items_index_12',
  });
  await queryInterface.addIndex('invoice_items', ['ref_id'], {
    name: 'invoice_items_index_13',
  });
  await queryInterface.addIndex('invoice_items', ['coupon_id'], {
    name: 'invoice_items_index_14',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('invoice_items');
}

export default { up, down };
