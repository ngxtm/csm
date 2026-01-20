# FS2: Production & Recipe

**Owner:** FS2 | **Priority:** P1 | **Status:** Pending
**Dependencies:** FS1 (Orders), FS3 (Inventory)

## Scope

| Area | Tasks |
|------|-------|
| Backend | Production plans, batches, recipe/BOM management |
| Frontend | Production dashboard, batch tracking, recipe editor |

## Backend Tasks

### Files to Create

```
apps/api/src/production/
├── production.module.ts
├── production.controller.ts
├── production.service.ts
├── production-plan.factory.ts    # EntityFactory
├── batch.factory.ts              # EntityFactory
├── production-status.factory.ts  # StatusFactory
└── dto/production.dto.ts

apps/api/src/recipes/
├── recipes.module.ts
├── recipes.controller.ts
├── recipes.service.ts
└── dto/recipe.dto.ts
```

### Production Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | /production/plans | List plans | ck_staff, manager, admin |
| GET | /production/plans/:id | Plan detail | ck_staff, manager, admin |
| POST | /production/plans | Create plan | ck_staff, admin |
| PUT | /production/plans/:id | Update plan | ck_staff, admin |
| PUT | /production/plans/:id/status | Update status | ck_staff, admin |
| POST | /production/plans/:id/details | Add production item | ck_staff |
| PUT | /production/plans/:id/details/:detailId | Update produced qty | ck_staff |

### Batch Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | /production/batches | List batches | ck_staff, coordinator, admin |
| GET | /production/batches/:id | Batch detail | ck_staff, coordinator, admin |
| POST | /production/batches | Create batch | ck_staff, admin |
| PUT | /production/batches/:id | Update batch | ck_staff, admin |

### Recipe Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | /recipes | List recipes | ck_staff, manager, admin |
| GET | /recipes/:productId | Get recipe for product | ck_staff, manager, admin |
| POST | /recipes | Create/update recipe | admin |
| DELETE | /recipes/:id | Delete recipe line | admin |

### Factories

```typescript
// ProductionPlanFactory
@Injectable()
export class ProductionPlanFactory extends EntityFactory<ProductionPlan, CreatePlanDto> {
  async create(dto: CreatePlanDto, ctx: EntityContext) {
    const planCode = this.generateCode('PP');
    // Insert plan + details
  }

  // Hook: Tạo plan từ order
  async createFromOrder(orderId: number, ctx: EntityContext) {
    // 1. Get order items
    // 2. Create plan with items as details
  }
}

// BatchFactory
@Injectable()
export class BatchFactory extends EntityFactory<Batch, CreateBatchDto> {
  async create(dto: CreateBatchDto, ctx: EntityContext) {
    const batchCode = this.generateCode('BAT');
    // Insert batch + update inventory
  }
}

// ProductionStatusFactory
@Injectable()
export class ProductionStatusFactory extends StatusFactory<ProductionStatus> {
  protected transitions = [
    { from: 'planned', to: 'in_progress', allowedRoles: ['admin', 'ck_staff'] },
    { from: 'in_progress', to: 'completed', allowedRoles: ['admin', 'ck_staff'] },
    { from: 'planned', to: 'cancelled', allowedRoles: ['admin', 'manager'] },
  ];

  // Hook: completed → tạo batches, update inventory
}
```

### DTOs (packages/types/src/production.ts)

```typescript
export const ProductionStatus = z.enum(['planned', 'in_progress', 'completed', 'cancelled']);
export const BatchStatus = z.enum(['active', 'depleted', 'expired']);

export const CreatePlanDto = z.object({
  startDate: z.string().date(),
  endDate: z.string().date(),
  notes: z.string().optional(),
  details: z.array(z.object({
    itemId: z.number(),
    quantityPlanned: z.number().positive(),
  })),
});

export const CreateBatchDto = z.object({
  itemId: z.number(),
  manufactureDate: z.string().date(),
  expiryDate: z.string().date(),
  initialQuantity: z.number().positive(),
  productionDetailId: z.number().optional(),
});

export const RecipeDetailDto = z.object({
  productId: z.number(),
  materialId: z.number(),
  quantity: z.number().positive(),
});
```

---

## Frontend Tasks

### Pages to Create

```
apps/web/src/app/(dashboard)/production/
├── page.tsx                    # Production plans list
├── [id]/page.tsx               # Plan detail
├── new/page.tsx                # Create plan
├── batches/page.tsx            # Batch list
└── components/
    ├── plan-table.tsx
    ├── plan-form.tsx
    ├── production-detail-table.tsx
    ├── batch-table.tsx
    └── material-calculator.tsx

apps/web/src/app/(dashboard)/recipes/
├── page.tsx                    # Recipe list
├── [productId]/page.tsx        # Recipe editor
└── components/
    ├── recipe-table.tsx
    └── recipe-form.tsx
```

### Key Features

| Feature | Description |
|---------|-------------|
| Material Calculator | Tính nguyên liệu cần dựa trên recipe × quantity |
| Batch Tracker | Track batch codes, expiry dates |
| Production Progress | Visual progress bar cho mỗi detail |

---

## Business Logic

### Calculate Materials Needed

```typescript
async calculateMaterials(planId: number) {
  const { data } = await this.supabase.getClient()
    .from('production_details')
    .select(`
      quantity_planned,
      items!inner (
        recipe_details (
          material_id,
          quantity,
          materials:items!material_id (name, unit)
        )
      )
    `)
    .eq('plan_id', planId);

  // Aggregate: SUM(recipe.quantity × detail.quantity_planned) GROUP BY material_id
}
```

### Complete Production → Create Batch

```typescript
async completeDetail(detailId: number, quantityProduced: number) {
  // 1. Update production_detail
  // 2. Create batch with quantityProduced
  // 3. Update inventory (add stock)
  // 4. Deduct materials from inventory
}
```

---

## Integration Points

| With | Trigger | Action |
|------|---------|--------|
| FS1 (Orders) | Order → processing | Create plan from order items |
| FS3 (Inventory) | Production complete | Add product stock, deduct materials |

---

## Success Criteria

- [ ] Production plan CRUD works
- [ ] Batch creation with auto-generated code
- [ ] Recipe/BOM management
- [ ] Material calculation from recipes
- [ ] Production dashboard with progress tracking
