import { Router } from 'express';
import {
  loginWithGoogle,
  registerUserWithGoogle,
  verifyAdminMfa,
} from '../modules/auth/auth.controller';

const authRoutes = Router();
const pathAuth = '/auth';

authRoutes.post(`${pathAuth}/register`, registerUserWithGoogle);
authRoutes.post(`${pathAuth}/login`, loginWithGoogle);
authRoutes.post(`${pathAuth}/verify/mfa`, verifyAdminMfa);

export default authRoutes;
