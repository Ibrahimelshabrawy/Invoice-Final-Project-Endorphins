export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('invoice_item_taxes', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    invoice_item_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'invoice_items',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'CASCADE',
    },
    tax_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'taxes',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    name: {
      type: Sequelize.STRING(100),
      allowNull: false,
      comment: 'Tax name snapshot',
    },
    rate: {
      type: Sequelize.DECIMAL(5, 2),
      allowNull: false,
      comment: 'Tax rate snapshot',
    },
    amount: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
    },
  });

  await queryInterface.addIndex('invoice_item_taxes', ['invoice_item_id'], {
    name: 'invoice_item_taxes_index_17',
  });
  await queryInterface.addIndex('invoice_item_taxes', ['tax_id'], {
    name: 'invoice_item_taxes_index_18',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('invoice_item_taxes');
}

export default { up, down };
