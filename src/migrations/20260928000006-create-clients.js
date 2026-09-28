export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('clients', {
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
    company: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },
    email: {
      type: Sequelize.STRING(255),
      allowNull: true,
    },
    phone: {
      type: Sequelize.STRING(50),
      allowNull: true,
    },
    address: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    tax_number: {
      type: Sequelize.STRING(100),
      allowNull: true,
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('clients');
}

export default { up, down };
