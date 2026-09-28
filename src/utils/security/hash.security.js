import { hash, compare } from 'bcrypt';
import { SALT_ROUND } from '../../../config.service.js';

export const Hash = async ({ plainText, salt_rounds = SALT_ROUND } = {}) => {
  return await hash(plainText, salt_rounds);
};

export const compare_match = async ({ plainText, cipherText } = {}) => {
  return await compare(plainText, cipherText);
};

export default {
  Hash,
  compare_match,
};
