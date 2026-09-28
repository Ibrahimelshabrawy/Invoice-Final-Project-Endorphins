import { z } from 'zod';

export const loginSchema = {
  body: z.object({
    password: z
      .string({ required_error: 'Password is required' })
      .min(1, 'Password is required'),
  }),
};

export default {
  loginSchema,
};
