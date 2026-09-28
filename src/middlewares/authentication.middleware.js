import { ACCESS_SECRET_KEY, TOKEN_PREFIX } from '../../config.service.js';
import Admin from '../models/Admin.js';
import { VerifyToken } from '../utils/jwt/token.service.js';

export const authentication = async (req, res, next) => {
  try {
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

    let verify;
    try {
      verify = VerifyToken({ token, secret_key: ACCESS_SECRET_KEY });
    } catch (err) {
      throw new Error('Invalid Token', { cause: 401 });
    }

    if (!verify || !verify.id) {
      throw new Error('Invalid Token', { cause: 401 });
    }

    const admin = await Admin.findByPk(verify.id);

    if (!admin) {
      throw new Error('Admin Not Found', { cause: 404 });
    }

    req.admin = admin;
    req.verify = verify;

    next();
  } catch (error) {
    next(error);
  }
};

export default authentication;
