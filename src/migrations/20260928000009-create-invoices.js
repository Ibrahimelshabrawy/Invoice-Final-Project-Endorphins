export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('invoices', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    invoice_number: {
      type: Sequelize.STRING(50),
      allowNull: false,
      unique: true,
    },
    client_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'clients',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    issue_date: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    due_date: {
      type: Sequelize.DATEONLY,
      allowNull: false,
    },
    status: {
      type: Sequelize.ENUM('DRAFT', 'SENT', 'PAID', 'OVERDUE', 'CANCELLED'),
      allowNull: false,
    },
    subtotal: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
    },
    discount_type: {
      type: Sequelize.ENUM('PERCENTAGE', 'FIXED'),
      allowNull: true,
      defaultValue: null,
    },
    discount_value: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0,
    },
    discount: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    tax_total: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
      defaultValue: 0,
    },
    total: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
    },
    currency: {
      type: Sequelize.ENUM('EGP'),
      allowNull: false,
      defaultValue: 'EGP',
    },
    language: {
      type: Sequelize.ENUM('AR', 'EN'),
      allowNull: false,
      defaultValue: 'EN',
    },
    notes: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    payment_terms: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    created_by: {
      type: Sequelize.INTEGER,
      allowNull: true,
    },
  });

  await queryInterface.addIndex('invoices', ['client_id'], {
    name: 'invoices_index_7',
  });
  await queryInterface.addIndex('invoices', ['status'], {
    name: 'invoices_index_8',
  });
  await queryInterface.addIndex('invoices', ['issue_date'], {
    name: 'invoices_index_9',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('invoices');
}

export default { up, down };
