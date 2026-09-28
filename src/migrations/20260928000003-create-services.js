export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('services', {
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
    description: {
      type: Sequelize.TEXT,
      allowNull: true,
    },
    unit_price: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
    },
    unit_type: {
      type: Sequelize.ENUM('FIXED', 'HOURLY', 'MONTHLY'),
      allowNull: false,
    },
    category_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'categories',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'RESTRICT',
    },
    subcategory_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'categories',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    default_tax_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'taxes',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    is_active: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  });

  await queryInterface.addIndex('services', ['category_id'], {
    name: 'services_index_1',
  });
  await queryInterface.addIndex('services', ['subcategory_id'], {
    name: 'services_index_2',
  });
  await queryInterface.addIndex('services', ['default_tax_id'], {
    name: 'services_index_3',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('services');
}

export default { up, down };
