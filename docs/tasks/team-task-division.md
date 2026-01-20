# Phase 04: Fullstack Team Task Division

**Team:** 6 Fullstack members | **Patterns:** Singleton + Factory Method
**Updated:** 2026-01-19

## Task Division (Option A - By Flow)

| Member | Domain | Backend | Frontend | Priority |
|--------|--------|---------|----------|----------|
| **FS1** | Orders & Status | orders module, order-status factory | Order list, detail, create pages | P1 |
| **FS2** | Production & Recipe | production module, batch management | Production plan, recipe pages | P1 |
| **FS3** | Inventory & Alerts | inventory module, transactions, alerts | Stock dashboard, alerts page | P2 |
| **FS4** | Delivery & Tracking | deliveries module, shipment tracking | Shipment list, tracking page | P2 |
| **FS5** | Users & Auth | users module, auth guards | Login, profile, user management | P1 |
| **FS6** | Stores & Products | stores, products, categories | Store settings, product catalog | P1 |

### Flow Dependencies

```
FS6 (Stores/Products) ──┬──► FS5 (Users/Auth) ──► FS1 (Orders) ──► FS2 (Production)
                        │                               │                  │
                        │                               ▼                  ▼
                        └──────────────────────► FS3 (Inventory) ◄── FS4 (Delivery)
```

---

## Design Patterns

### 1. Singleton Pattern

#### Backend (NestJS)

NestJS default scope là singleton, nhưng ta cần explicit cho shared resources:

```typescript
// apps/api/src/common/services/supabase.service.ts
@Injectable({ scope: Scope.DEFAULT }) // Singleton by default
export class SupabaseService {
  private readonly client: SupabaseClient;

  constructor(private config: ConfigService) {
    this.client = createClient(
      this.config.getOrThrow('SUPABASE_URL'),
      this.config.getOrThrow('SUPABASE_SERVICE_ROLE_KEY'),
    );
  }

  getClient(): SupabaseClient {
    return this.client;
  }
}
```

**Singleton Services (Backend):**

| Service | Purpose | Used By |
|---------|---------|---------|
| `SupabaseService` | DB client | All modules |
| `CodeGeneratorService` | Generate unique codes | Orders, Production, Delivery |
| `StatusMachineService` | Validate state transitions | Orders, Production, Delivery |
| `ConfigService` | Environment variables | All modules (NestJS built-in) |

#### Frontend (React)

```typescript
// apps/web/src/lib/supabase.ts - Singleton Supabase client
let supabaseInstance: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!supabaseInstance) {
    supabaseInstance = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
  }
  return supabaseInstance;
}

// apps/web/src/lib/query-client.ts - Singleton React Query
let queryClientInstance: QueryClient | null = null;

export function getQueryClient(): QueryClient {
  if (!queryClientInstance) {
    queryClientInstance = new QueryClient({
      defaultOptions: { queries: { staleTime: 60 * 1000 } },
    });
  }
  return queryClientInstance;
}
```

**Singleton Instances (Frontend):**

| Instance | Purpose |
|----------|---------|
| Supabase Client | Auth + Realtime subscriptions |
| QueryClient | React Query cache |
| AuthStore | Zustand auth state |

---

### 2. Factory Method Pattern

#### A. Entity Creation Factory

```typescript
// apps/api/src/common/factories/entity.factory.ts
export interface EntityContext {
  userId: string;
  chainId: number;
}

export abstract class EntityFactory<TEntity, TCreateDto> {
  abstract create(dto: TCreateDto, ctx: EntityContext): Promise<TEntity>;

  protected generateCode(prefix: string): string {
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `${prefix}-${date}-${random}`;
  }
}
```

**Entity Factories:**

| Factory | Prefix | Owner |
|---------|--------|-------|
| `OrderFactory` | ORD | FS1 |
| `ProductionPlanFactory` | PP | FS2 |
| `BatchFactory` | BAT | FS2 |
| `ShipmentFactory` | SHP | FS4 |

#### B. Status Transition Factory

```typescript
// apps/api/src/common/factories/status.factory.ts
export interface StatusTransition {
  from: string;
  to: string;
  allowedRoles: string[];
  onTransition?: (entityId: number, ctx: EntityContext) => Promise<void>;
}

export abstract class StatusFactory<TStatus extends string> {
  protected abstract transitions: StatusTransition[];

  validate(from: TStatus, to: TStatus, role: string): boolean {
    const t = this.transitions.find(t => t.from === from && t.to === to);
    if (!t) return false;
    return t.allowedRoles.includes(role) || t.allowedRoles.includes('*');
  }

  async execute(
    entityId: number,
    from: TStatus,
    to: TStatus,
    role: string,
    ctx: EntityContext,
  ): Promise<TStatus> {
    if (!this.validate(from, to, role)) {
      throw new ForbiddenException(`Cannot transition ${from} → ${to} with role ${role}`);
    }
    const t = this.transitions.find(t => t.from === from && t.to === to);
    if (t?.onTransition) {
      await t.onTransition(entityId, ctx);
    }
    return to;
  }
}
```

**Status Factories:**

| Factory | Statuses | Owner |
|---------|----------|-------|
| `OrderStatusFactory` | pending→approved→processing→shipping→delivered | FS1 |
| `ProductionStatusFactory` | planned→in_progress→completed | FS2 |
| `ShipmentStatusFactory` | preparing→shipping→delivered | FS4 |

---

## Shared Code Structure

```
apps/api/src/common/
├── services/
│   ├── supabase.service.ts       # Singleton - Lead
│   └── code-generator.service.ts # Singleton - Lead
├── factories/
│   ├── entity.factory.ts         # Abstract - Lead
│   └── status.factory.ts         # Abstract - Lead
├── dto/
│   └── pagination.dto.ts         # ✅ Done
├── filters/
│   └── http-exception.filter.ts  # ✅ Done
├── interceptors/
│   └── transform.interceptor.ts  # ✅ Done
└── common.module.ts              # Export all - Lead

apps/web/src/lib/
├── supabase.ts                   # Singleton - Lead
├── query-client.ts               # Singleton - Lead
└── stores/
    └── auth.store.ts             # Zustand singleton - FS5
```

---

## Individual Task Files

| File | Owner | Link |
|------|-------|------|
| Orders & Status | FS1 | [fs1-orders-status.md](./fs1-orders-status.md) |
| Production & Recipe | FS2 | [fs2-production-recipe.md](./fs2-production-recipe.md) |
| Inventory & Alerts | FS3 | [fs3-inventory-alerts.md](./fs3-inventory-alerts.md) |
| Delivery & Tracking | FS4 | [fs4-delivery-tracking.md](./fs4-delivery-tracking.md) |
| Users & Auth | FS5 | [fs5-users-auth.md](./fs5-users-auth.md) |
| Stores & Products | FS6 | [fs6-stores-products.md](./fs6-stores-products.md) |

---

## Timeline

| Week | Lead | FS6 | FS5 | FS1 | FS2 | FS3 | FS4 |
|------|------|-----|-----|-----|-----|-----|-----|
| 1 | Shared code, patterns | Stores, Products | Auth guards | - | - | - | - |
| 2 | Review, support | Products FE | Users CRUD, Login | Orders BE | - | Inventory BE | - |
| 3 | Integration | - | User mgmt FE | Orders FE, Status | Production BE | Alerts | Delivery BE |
| 4 | Testing | Polish | Polish | Status workflow | Production FE | Transactions FE | Tracking FE |

---

## Startup Order

1. **Lead:** Tạo shared services + factories (Week 1, Day 1-2)
2. **FS6:** Stores + Products (Week 1, Day 2-5) - Base entities
3. **FS5:** Auth + Users (Week 1-2) - Depends on Stores
4. **FS1 + FS3:** Orders + Inventory (Week 2) - Parallel
5. **FS2:** Production (Week 3) - Depends on Orders
6. **FS4:** Delivery (Week 3) - Depends on Orders + Inventory
