export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('coupons', {
    id: {
      type: Sequelize.INTEGER,
      primaryKey: true,
      autoIncrement: true,
      allowNull: false,
    },
    code: {
      type: Sequelize.STRING(100),
      allowNull: false,
      unique: true,
    },
    discount_type: {
      type: Sequelize.ENUM('PERCENTAGE', 'FIXED'),
      allowNull: false,
    },
    discount_value: {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: false,
    },
    scope: {
      type: Sequelize.ENUM('INVOICE', 'SERVICE'),
      allowNull: false,
    },
    max_uses: {
      type: Sequelize.INTEGER,
      allowNull: false,
    },
    used_count: {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
    is_active: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  });

  await queryInterface.addIndex('coupons', ['code'], {
    name: 'coupons_index_4',
  });
  await queryInterface.addIndex('coupons', ['is_active'], {
    name: 'coupons_index_5',
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('coupons');
}

export default { up, down };
