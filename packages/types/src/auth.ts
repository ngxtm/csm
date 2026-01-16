import { z } from 'zod';

export const UserRole = z.enum([
  'admin',
  'manager',
  'supply_coordinator',
  'kitchen_staff',
  'store_staff',
]);
export type UserRole = z.infer<typeof UserRole>;

export const AuthUser = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  chainId: z.number().int().positive(),
  role: UserRole,
});
export type AuthUser = z.infer<typeof AuthUser>;

export const JwtPayload = z.object({
  sub: z.string().uuid(),
  email: z.string().email(),
  app_metadata: z.object({
    chain_id: z.number(),
    role: UserRole,
  }),
  aud: z.string(),
  exp: z.number(),
});
export type JwtPayload = z.infer<typeof JwtPayload>;
