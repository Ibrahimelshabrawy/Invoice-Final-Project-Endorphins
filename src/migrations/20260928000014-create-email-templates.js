export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('email_templates', {
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
    subject: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    body: {
      type: Sequelize.TEXT,
      allowNull: false,
    },
    language: {
      type: Sequelize.ENUM('AR', 'EN'),
      allowNull: false,
      defaultValue: 'EN',
    },
    is_default: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('email_templates');
}

export default { up, down };
