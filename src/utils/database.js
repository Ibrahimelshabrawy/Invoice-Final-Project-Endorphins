import { Sequelize } from 'sequelize';
import {
  DB_NAME,
  DB_USER,
  DB_PASSWORD,
  DB_HOST,
  DB_PORT,
  NODE_ENV,
} from '../../config.service.js';

const sequelize = new Sequelize(DB_NAME, DB_USER, DB_PASSWORD, {
  host: DB_HOST,
  port: DB_PORT,
  dialect: 'mysql',
  logging: NODE_ENV === 'development' ? console.log : false,
});

export const connectionDB = async () => {
  try {
    await sequelize.authenticate();
    console.log(`Database connection to ${DB_NAME} established successfully.`);
  } catch (error) {
    console.error(`Unable to connect to the Database ${DB_NAME}:`, error.message);
  }
};

export { sequelize };
export default sequelize;
