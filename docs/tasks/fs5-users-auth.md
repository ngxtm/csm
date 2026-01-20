# FS5: Users & Auth

**Owner:** FS5 | **Priority:** P1 | **Status:** Pending
**Dependencies:** FS6 (Stores)

## Scope

| Area | Tasks |
|------|-------|
| Backend | Users CRUD, auth guards, RBAC decorators |
| Frontend | Login, profile, user management, auth store |

## Backend Tasks

### Files to Create/Modify

```
apps/api/src/auth/              # ✅ Partial exists
├── auth.module.ts              # ✅ Done
├── auth.controller.ts          # NEW - /auth/me, /auth/logout
├── supabase.strategy.ts        # ✅ Done
├── guards/
│   ├── jwt-auth.guard.ts       # ✅ Done
│   └── roles.guard.ts          # ✅ Done - verify
├── decorators/
│   ├── current-user.decorator.ts # ✅ Done
│   ├── roles.decorator.ts      # ✅ Done
│   └── public.decorator.ts     # NEW - skip auth
└── index.ts

apps/api/src/users/
├── users.module.ts
├── users.controller.ts
├── users.service.ts
└── dto/users.dto.ts
```

### Auth Endpoints

| Method | Endpoint | Description | Auth |
|--------|----------|-------------|------|
| GET | /auth/me | Current user info | Required |
| POST | /auth/logout | Logout (invalidate session) | Required |

### Users Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | /users | List users | admin, manager |
| GET | /users/:id | User detail | admin, manager, self |
| POST | /users | Create user | admin |
| PUT | /users/:id | Update user | admin, self (limited) |
| PUT | /users/:id/role | Change role | admin |
| PUT | /users/:id/status | Activate/deactivate | admin |

### Singleton Auth Store (Backend)

```typescript
// apps/api/src/auth/auth.service.ts
@Injectable()
export class AuthService {
  constructor(private supabase: SupabaseService) {} // Singleton

  async getCurrentUser(userId: string) {
    const { data } = await this.supabase.getClient()
      .from('users')
      .select('*, stores(name)')
      .eq('id', userId)
      .single();
    return data;
  }

  async validateUserRole(userId: string, requiredRoles: string[]) {
    const user = await this.getCurrentUser(userId);
    return requiredRoles.includes(user?.role);
  }
}
```

### RBAC Decorators

```typescript
// Roles decorator (exists, verify working)
@Roles('admin', 'manager')
@Get('protected-route')
protectedRoute() {}

// Public decorator (skip auth)
@Public()
@Get('public-route')
publicRoute() {}
```

### DTOs (packages/types/src/user.ts)

```typescript
export const UserRole = z.enum([
  'admin', 'manager', 'ck_staff', 'store_staff', 'coordinator'
]);

export const CreateUserDto = z.object({
  email: z.string().email(),
  fullName: z.string().min(2),
  phone: z.string().optional(),
  role: UserRole,
  storeId: z.number().optional(),
});

export const UpdateUserDto = z.object({
  fullName: z.string().min(2).optional(),
  phone: z.string().optional(),
  storeId: z.number().optional(),
});

export const UserResponse = z.object({
  id: z.string().uuid(),
  email: z.string(),
  fullName: z.string(),
  phone: z.string().nullable(),
  role: UserRole,
  storeId: z.number().nullable(),
  storeName: z.string().nullable(),
  isActive: z.boolean(),
  createdAt: z.string(),
});
```

---

## Frontend Tasks

### Pages to Create

```
apps/web/src/app/(auth)/
├── login/page.tsx
├── forgot-password/page.tsx
└── reset-password/page.tsx

apps/web/src/app/(dashboard)/
├── profile/page.tsx
└── users/
    ├── page.tsx              # User list (admin only)
    ├── [id]/page.tsx         # User detail
    └── new/page.tsx          # Create user

apps/web/src/components/
├── auth/
│   ├── login-form.tsx
│   ├── auth-provider.tsx
│   └── protected-route.tsx
└── layout/
    ├── user-menu.tsx
    └── role-gate.tsx
```

### Singleton Auth Store (Frontend - Zustand)

```typescript
// apps/web/src/lib/stores/auth.store.ts
interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

// Singleton store
export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({
    user,
    isAuthenticated: !!user,
    isLoading: false,
  }),

  logout: async () => {
    const supabase = getSupabase();
    await supabase.auth.signOut();
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    const supabase = getSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (user) {
      // Fetch full user profile from API
      const profile = await api.get('/auth/me');
      set({ user: profile.data, isAuthenticated: true, isLoading: false });
    } else {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
}));
```

### Auth Provider

```typescript
// apps/web/src/components/auth/auth-provider.tsx
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { checkAuth, isLoading } = useAuthStore();

  useEffect(() => {
    checkAuth();

    // Listen for auth changes
    const supabase = getSupabase();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event) => {
        if (event === 'SIGNED_OUT') {
          useAuthStore.getState().setUser(null);
        } else if (event === 'SIGNED_IN') {
          checkAuth();
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  if (isLoading) return <LoadingScreen />;
  return children;
}
```

### Role Gate Component

```typescript
// apps/web/src/components/layout/role-gate.tsx
interface RoleGateProps {
  allowedRoles: string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function RoleGate({ allowedRoles, children, fallback }: RoleGateProps) {
  const { user } = useAuthStore();

  if (!user || !allowedRoles.includes(user.role)) {
    return fallback || null;
  }

  return children;
}

// Usage
<RoleGate allowedRoles={['admin', 'manager']}>
  <AdminPanel />
</RoleGate>
```

---

## Integration Points

| With | Integration |
|------|-------------|
| All modules | @CurrentUser() decorator provides user context |
| All modules | @Roles() decorator validates permissions |
| All FE pages | useAuthStore() provides auth state |

---

## Success Criteria

- [ ] Login/logout flow works with Supabase Auth
- [ ] JWT validation in NestJS guards
- [ ] RBAC decorators working correctly
- [ ] User CRUD for admin
- [ ] Profile page for self-update
- [ ] Auth store singleton in frontend
- [ ] Role-based UI rendering
