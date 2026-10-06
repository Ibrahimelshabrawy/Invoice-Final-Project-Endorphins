export async function up(queryInterface, Sequelize) {
  // 1. Add column `name`
  await queryInterface.addColumn('invoice_items', 'name', {
    type: Sequelize.STRING(255),
    allowNull: false,
    defaultValue: '',
  });

  // 2. Backfill existing invoice items with service/bundle names
  await queryInterface.sequelize.query(`
    UPDATE invoice_items i
    INNER JOIN services s ON i.ref_id = s.id
    SET i.name = s.name
    WHERE i.item_type = 'SERVICE' AND (i.name = '' OR i.name IS NULL);
  `);

  await queryInterface.sequelize.query(`
    UPDATE invoice_items i
    INNER JOIN bundles b ON i.ref_id = b.id
    SET i.name = b.name
    WHERE i.item_type = 'BUNDLE' AND (i.name = '' OR i.name IS NULL);
  `);
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('invoice_items', 'name');
}
