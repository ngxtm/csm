# FS1: Orders & Status

**Owner:** FS1 | **Priority:** P1 | **Status:** Pending
**Dependencies:** FS6 (Stores, Products), FS5 (Auth)

## Scope

| Area | Tasks |
|------|-------|
| Backend | Orders CRUD, OrderStatusFactory, order items |
| Frontend | Order list, detail, create, status workflow UI |

## Backend Tasks

### Files to Create/Modify

```
apps/api/src/orders/          # ✅ Template exists
├── orders.module.ts          # ✅ Done
├── orders.controller.ts      # ✅ Done - enhance
├── orders.service.ts         # ✅ Done - enhance
├── orders.factory.ts         # NEW - EntityFactory
├── order-status.factory.ts   # NEW - StatusFactory
└── dto/order.dto.ts          # ✅ Done - add enum validation
```

### Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | /orders | List orders (paginated) | all |
| GET | /orders/:id | Order detail | all |
| POST | /orders | Create order | store_staff, manager |
| PUT | /orders/:id | Update order (draft only) | store_staff |
| DELETE | /orders/:id | Delete order (draft only) | store_staff |
| PUT | /orders/:id/status | Update status | role-based |
| POST | /orders/:id/items | Add item | store_staff |
| PUT | /orders/:id/items/:itemId | Update item | store_staff |
| DELETE | /orders/:id/items/:itemId | Remove item | store_staff |

### OrderFactory (Entity Creation)

```typescript
// apps/api/src/orders/orders.factory.ts
@Injectable()
export class OrderFactory extends EntityFactory<Order, CreateOrderDto> {
  constructor(private supabase: SupabaseService) { super(); }

  async create(dto: CreateOrderDto, ctx: EntityContext): Promise<Order> {
    const orderCode = this.generateCode('ORD');

    const { data, error } = await this.supabase.getClient()
      .from('orders')
      .insert({
        order_code: orderCode,
        store_id: dto.storeId,
        status: 'pending',
        delivery_date: dto.deliveryDate,
        notes: dto.notes,
        created_by: ctx.userId,
      })
      .select()
      .single();

    if (error) throw new InternalServerErrorException('Failed to create order');
    return data;
  }
}
```

### OrderStatusFactory (Status Transitions)

```typescript
// apps/api/src/orders/order-status.factory.ts
@Injectable()
export class OrderStatusFactory extends StatusFactory<OrderStatus> {
  protected transitions = [
    { from: 'pending', to: 'approved', allowedRoles: ['admin', 'manager'] },
    { from: 'approved', to: 'processing', allowedRoles: ['admin', 'ck_staff'] },
    { from: 'processing', to: 'shipping', allowedRoles: ['admin', 'coordinator'] },
    { from: 'shipping', to: 'delivered', allowedRoles: ['admin', 'coordinator', 'store_staff'] },
    { from: 'pending', to: 'cancelled', allowedRoles: ['admin', 'manager', 'store_staff'] },
    { from: 'approved', to: 'cancelled', allowedRoles: ['admin', 'manager'] },
  ];

  // Hook: Khi approved → processing, trigger FS2 tạo production plan
  // Hook: Khi processing → shipping, trigger FS4 tạo shipment
}
```

### DTOs (packages/types/src/order.ts)

```typescript
export const OrderStatus = z.enum([
  'pending', 'approved', 'processing', 'shipping', 'delivered', 'cancelled'
]);

export const CreateOrderDto = z.object({
  storeId: z.number(),
  deliveryDate: z.string().date(),
  notes: z.string().optional(),
  items: z.array(z.object({
    itemId: z.number(),
    quantity: z.number().positive(),
    unitPrice: z.number().optional(),
  })),
});

export const UpdateOrderStatusDto = z.object({
  status: OrderStatus,
  notes: z.string().optional(),
});
```

---

## Frontend Tasks

### Pages to Create

```
apps/web/src/app/(dashboard)/orders/
├── page.tsx              # Order list
├── [id]/page.tsx         # Order detail
├── new/page.tsx          # Create order
└── components/
    ├── order-table.tsx
    ├── order-form.tsx
    ├── order-status-badge.tsx
    └── order-status-actions.tsx
```

### Components

| Component | Description |
|-----------|-------------|
| OrderTable | DataTable với pagination, filter by status |
| OrderForm | Form tạo/edit order với item selection |
| OrderStatusBadge | Badge màu theo status |
| OrderStatusActions | Buttons cho status transitions dựa trên role |

### React Query Hooks

```typescript
// apps/web/src/hooks/use-orders.ts
export function useOrders(params: { page: number; status?: string }) {
  return useQuery({
    queryKey: ['orders', params],
    queryFn: () => api.get('/orders', { params }),
  });
}

export function useOrder(id: number) {
  return useQuery({
    queryKey: ['orders', id],
    queryFn: () => api.get(`/orders/${id}`),
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (dto: CreateOrderDto) => api.post('/orders', dto),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['orders'] }),
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, dto }: { id: number; dto: UpdateOrderStatusDto }) =>
      api.put(`/orders/${id}/status`, dto),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['orders'] });
      queryClient.invalidateQueries({ queryKey: ['orders', id] });
    },
  });
}
```

---

## Integration Points

| With | Trigger | Action |
|------|---------|--------|
| FS2 (Production) | Status → processing | Create production plan |
| FS4 (Delivery) | Status → shipping | Create shipment |
| FS3 (Inventory) | Status → delivered | Update store inventory |

---

## Test Cases

1. Store staff tạo order → status = pending
2. Manager approve → status = approved, confirmed_by set
3. Non-manager approve → 403 Forbidden
4. Update order khi status != pending → 400 Bad Request
5. Cancel order khi status = processing → 400 Bad Request

## Success Criteria

- [ ] All CRUD endpoints work via Swagger
- [ ] Status transitions validate role permissions
- [ ] Order list page with filtering/pagination
- [ ] Create order flow with item selection
- [ ] Status workflow buttons based on user role
