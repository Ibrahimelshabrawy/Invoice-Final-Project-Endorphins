export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('invoice_taxes', {
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

  await queryInterface.addIndex('invoice_taxes', ['invoice_id'], {
    name: 'invoice_taxes_index_15',
  });
  await queryInterface.addIndex('invoice_taxes', ['tax_id'], {
    name: 'invoice_taxes_index_16',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('invoice_taxes');
}

export default { up, down };
