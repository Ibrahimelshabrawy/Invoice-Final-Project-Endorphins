import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { Sequelize } from 'sequelize';
import sequelize from '../utils/database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const queryInterface = sequelize.getQueryInterface();

async function ensureMetaTable() {
  await queryInterface.createTable('SequelizeMeta', {
    name: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true,
      primaryKey: true,
    },
  });
}

async function getExecutedMigrations() {
  await ensureMetaTable();
  const [rows] = await sequelize.query('SELECT name FROM SequelizeMeta ORDER BY name ASC;');
  return rows.map((r) => r.name);
}

function getMigrationFiles() {
  const files = fs.readdirSync(__dirname);
  return files
    .filter((f) => /^\d+.*\.js$/.test(f) && f !== path.basename(__filename))
    .sort();
}

async function runUp() {
  const executed = await getExecutedMigrations();
  const allFiles = getMigrationFiles();
  const pending = allFiles.filter((f) => !executed.includes(f));

  if (pending.length === 0) {
    console.log('No pending migrations to run. Database schema is up to date.');
    return;
  }

  console.log(`Found ${pending.length} pending migration(s)...`);

  for (const file of pending) {
    console.log(`Migrating: ${file}`);
    const filePath = path.join(__dirname, file);
    const migration = await import(pathToFileURL(filePath).href);
    const upFn = migration.up || migration.default?.up;

    if (typeof upFn !== 'function') {
      throw new Error(`Migration ${file} does not export an up() function`);
    }

    await upFn(queryInterface, Sequelize);
    await sequelize.query('INSERT INTO SequelizeMeta (name) VALUES (?);', {
      replacements: [file],
    });
    console.log(`Migrated:  ${file}`);
  }

  console.log('All pending migrations executed successfully.');
}

async function runDown() {
  const executed = await getExecutedMigrations();
  if (executed.length === 0) {
    console.log('No migrations found to revert.');
    return;
  }

  const lastMigration = executed[executed.length - 1];
  console.log(`Reverting: ${lastMigration}`);

  const filePath = path.join(__dirname, lastMigration);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Migration file not found: ${filePath}`);
  }

  const migration = await import(pathToFileURL(filePath).href);
  const downFn = migration.down || migration.default?.down;

  if (typeof downFn !== 'function') {
    throw new Error(`Migration ${lastMigration} does not export a down() function`);
  }

  await downFn(queryInterface, Sequelize);
  await sequelize.query('DELETE FROM SequelizeMeta WHERE name = ?;', {
    replacements: [lastMigration],
  });
  console.log(`Reverted:  ${lastMigration}`);
}

async function runStatus() {
  const executed = await getExecutedMigrations();
  const allFiles = getMigrationFiles();

  console.log('\nMigration status:');
  for (const file of allFiles) {
    const status = executed.includes(file) ? '[UP]' : '[DOWN]';
    console.log(`  ${status} ${file}`);
  }
  console.log('');
}

async function main() {
  const arg = process.argv[2];

  try {
    await sequelize.authenticate();
    if (arg === '--undo') {
      await runDown();
    } else if (arg === '--status') {
      await runStatus();
    } else {
      await runUp();
    }
  } catch (err) {
    console.error('Migration failed:', err);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
}

main();
