export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('email_logs', {
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
    to: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    cc: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    sent_at: {
      type: Sequelize.DATE,
      allowNull: true,
    },
    status: {
      type: Sequelize.ENUM('SENT', 'FAILED'),
      allowNull: false,
    },
    error: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
  });

  await queryInterface.addIndex('email_logs', ['invoice_id'], {
    name: 'email_logs_index_22',
  });
  await queryInterface.addIndex('email_logs', ['status'], {
    name: 'email_logs_index_23',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('email_logs');
}

export default { up, down };
