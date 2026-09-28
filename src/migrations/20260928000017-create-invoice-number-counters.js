export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('invoice_number_counters', {
    year: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: false,
      allowNull: false,
    },
    last_number: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('invoice_number_counters');
}

export default { up, down };
