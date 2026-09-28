import { ADMIN_EMAIL, ADMIN_PASSWORD } from '../../config.service.js';
import { sequelize } from './database.js';
import Admin from '../models/Admin.js';
import { Hash } from './security/hash.security.js';

export const createAdminAccount = async () => {
  try {
    await sequelize.authenticate();

    if (!ADMIN_EMAIL) {
      console.error('Error: ADMIN_EMAIL is not defined in the environment variables.');
      process.exit(1);
    }

    if (!ADMIN_PASSWORD) {
      console.error('Error: ADMIN_PASSWORD is not defined in the environment variables.');
      process.exit(1);
    }

    // Check whether the account already exists
    const existingAdmin = await Admin.findOne({
      where: { email: ADMIN_EMAIL },
    });

    if (existingAdmin) {
      console.log(`Admin account with email "${ADMIN_EMAIL}" already exists (ID: ${existingAdmin.id}). Skipping creation.`);
      return existingAdmin;
    }

    // Hash the plain text password from .env
    const hashedPassword = await Hash({ plainText: ADMIN_PASSWORD });

    // Create the admin account with hashed password
    const newAdmin = await Admin.create({
      email: ADMIN_EMAIL,
      password: hashedPassword,
      name: 'Admin',
    });

    console.log(`Admin account created successfully! (ID: ${newAdmin.id}, Email: ${newAdmin.email})`);
    return newAdmin;
  } catch (error) {
    console.error('Failed to create admin account:', error.message);
    throw error;
  } finally {
    await sequelize.close();
  }
};

// If run directly from CLI
if (process.argv[1] && process.argv[1].replace(/\\/g, '/').endsWith('createAdmin.js')) {
  createAdminAccount()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

export default createAdminAccount;
