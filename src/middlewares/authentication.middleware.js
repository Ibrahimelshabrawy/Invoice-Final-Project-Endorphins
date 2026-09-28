import { ACCESS_SECRET_KEY, TOKEN_PREFIX } from '../../config.service.js';
import { VerifyToken } from '../utils/jwt/token.service.js';

export const authenticate = (req, res, next) => {
  const { authorization } = req.headers;

  if (!authorization) {
    throw new Error('token is required', { cause: 401 });
  }

  const [prefix, token] = authorization.split(' ');
  if (!prefix || prefix.toLowerCase() !== TOKEN_PREFIX.toLowerCase()) {
    throw new Error('Invalid prefix', { cause: 401 });
  }

  if (!token) {
    throw new Error('token is required', { cause: 401 });
  }

  const verify = VerifyToken({ token, secret_key: ACCESS_SECRET_KEY });

  if (!verify || verify.role !== 'admin') {
    throw new Error('Invalid Token', { cause: 401 });
  }

  req.admin = { role: verify.role };
  req.verify = verify;

  next();
};

export default authenticate;
