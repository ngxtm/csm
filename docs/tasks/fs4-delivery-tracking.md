# FS4: Delivery & Tracking

**Owner:** FS4 | **Priority:** P2 | **Status:** Pending
**Dependencies:** FS1 (Orders), FS3 (Inventory)

## Scope

| Area | Tasks |
|------|-------|
| Backend | Shipments, shipment items, tracking, batch traceability |
| Frontend | Shipment list, tracking page, delivery confirmation |

## Backend Tasks

### Files to Create

```
apps/api/src/deliveries/
├── deliveries.module.ts
├── deliveries.controller.ts
├── deliveries.service.ts
├── shipment.factory.ts          # EntityFactory
├── shipment-status.factory.ts   # StatusFactory
└── dto/delivery.dto.ts
```

### Shipment Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | /deliveries | List shipments | coordinator, admin |
| GET | /deliveries/:id | Shipment detail | coordinator, store_staff, admin |
| POST | /deliveries | Create shipment | coordinator, admin |
| PUT | /deliveries/:id | Update shipment | coordinator, admin |
| PUT | /deliveries/:id/status | Update status | coordinator, store_staff, admin |
| GET | /deliveries/:id/tracking | Tracking history | all |

### Shipment Items

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | /deliveries/:id/items | List items | coordinator, store_staff, admin |
| POST | /deliveries/:id/items | Add item with batch | coordinator |
| PUT | /deliveries/:id/items/:itemId | Update quantity | coordinator |
| DELETE | /deliveries/:id/items/:itemId | Remove item | coordinator |

### Traceability

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /deliveries/trace/:batchId | Trace batch → shipments |
| GET | /deliveries/:id/trace | Full traceability for shipment |

### Factories

```typescript
// ShipmentFactory
@Injectable()
export class ShipmentFactory extends EntityFactory<Shipment, CreateShipmentDto> {
  async create(dto: CreateShipmentDto, ctx: EntityContext) {
    const shipmentCode = this.generateCode('SHP');

    // 1. Validate order status = 'processing'
    // 2. Create shipment
    // 3. Create shipment_items with batch links
    // 4. Export from inventory
    return shipment;
  }

  async createFromOrder(orderId: number, ctx: EntityContext) {
    // Auto-create shipment from order items
    // Select batches using FIFO (oldest first)
  }
}

// ShipmentStatusFactory
@Injectable()
export class ShipmentStatusFactory extends StatusFactory<ShipmentStatus> {
  protected transitions = [
    {
      from: 'preparing',
      to: 'shipping',
      allowedRoles: ['admin', 'coordinator'],
      onTransition: async (id) => {
        // Set shipped_date, update order status
      }
    },
    {
      from: 'shipping',
      to: 'delivered',
      allowedRoles: ['admin', 'coordinator', 'store_staff'],
      onTransition: async (id) => {
        // Set delivered_date, update order, import to store inventory
      }
    },
    {
      from: 'shipping',
      to: 'failed',
      allowedRoles: ['admin', 'coordinator'],
      onTransition: async (id) => {
        // Return items to source inventory
      }
    },
  ];
}
```

### DTOs (packages/types/src/delivery.ts)

```typescript
export const ShipmentStatus = z.enum(['preparing', 'shipping', 'delivered', 'failed']);

export const CreateShipmentDto = z.object({
  orderId: z.number(),
  driverName: z.string().optional(),
  driverPhone: z.string().optional(),
  notes: z.string().optional(),
});

export const AddShipmentItemDto = z.object({
  orderItemId: z.number(),
  batchId: z.number(),
  quantityShipped: z.number().positive(),
  note: z.string().optional(),
});

export const ShipmentResponse = z.object({
  id: z.number(),
  shipmentCode: z.string(),
  orderId: z.number(),
  orderCode: z.string(),
  storeName: z.string(),
  storeAddress: z.string(),
  status: ShipmentStatus,
  driverName: z.string().nullable(),
  driverPhone: z.string().nullable(),
  shippedDate: z.string().nullable(),
  deliveredDate: z.string().nullable(),
  items: z.array(z.object({
    id: z.number(),
    itemName: z.string(),
    batchCode: z.string(),
    expiryDate: z.string(),
    quantityShipped: z.number(),
  })),
});

export const TraceabilityResponse = z.object({
  shipment: z.object({ id: z.number(), code: z.string() }),
  batch: z.object({ id: z.number(), code: z.string(), expiryDate: z.string() }),
  production: z.object({ id: z.number(), planCode: z.string(), completedAt: z.string() }).nullable(),
});
```

---

## Frontend Tasks

### Pages to Create

```
apps/web/src/app/(dashboard)/deliveries/
├── page.tsx                    # Shipment list
├── [id]/page.tsx               # Shipment detail + tracking
├── new/page.tsx                # Create shipment (from order)
└── components/
    ├── shipment-table.tsx
    ├── shipment-form.tsx
    ├── shipment-items-table.tsx
    ├── batch-selector.tsx
    ├── tracking-timeline.tsx
    └── delivery-confirmation.tsx
```

### Key Features

| Feature | Description |
|---------|-------------|
| Batch Selector | FIFO suggestion, show expiry dates |
| Tracking Timeline | Visual timeline của shipment status |
| Delivery Confirmation | Store staff xác nhận nhận hàng |
| Traceability View | Drill-down từ shipment → batch → production |

### Delivery Confirmation Flow

```typescript
// Store staff xác nhận delivery
export function DeliveryConfirmation({ shipmentId }: { shipmentId: number }) {
  const { mutate: confirmDelivery } = useUpdateShipmentStatus();
  const { data: shipment } = useShipment(shipmentId);

  const handleConfirm = () => {
    confirmDelivery({
      id: shipmentId,
      dto: { status: 'delivered', notes: 'Received in good condition' },
    });
  };

  // Show items to verify, then confirm button
}
```

---

## Business Logic

### FIFO Batch Selection

```typescript
async selectBatchesFIFO(itemId: number, quantity: number) {
  // Get active batches ordered by expiry (oldest first)
  const { data: batches } = await this.supabase.getClient()
    .from('batches')
    .select('*')
    .eq('item_id', itemId)
    .eq('status', 'active')
    .gt('current_quantity', 0)
    .order('expiry_date', { ascending: true });

  // Allocate quantity across batches
  const allocations = [];
  let remaining = quantity;
  for (const batch of batches || []) {
    if (remaining <= 0) break;
    const take = Math.min(batch.current_quantity, remaining);
    allocations.push({ batchId: batch.id, quantity: take });
    remaining -= take;
  }

  if (remaining > 0) throw new BadRequestException('Insufficient stock');
  return allocations;
}
```

### Complete Delivery → Update Inventory

```typescript
async markDelivered(shipmentId: number, ctx: EntityContext) {
  // 1. Update shipment status + delivered_date
  // 2. Update order status = 'delivered'
  // 3. For each shipment_item:
  //    - Create import transaction at destination store
  //    - Update store inventory
}
```

---

## Integration Points

| With | Trigger | Action |
|------|---------|--------|
| FS1 (Orders) | Order → shipping | Create shipment |
| FS3 (Inventory) | Shipment created | Export from CK inventory |
| FS3 (Inventory) | Shipment delivered | Import to store inventory |
| FS2 (Production) | Traceability | Link to production batches |

---

## Success Criteria

- [ ] Shipment CRUD with batch linking
- [ ] FIFO batch selection
- [ ] Status transitions với inventory updates
- [ ] Delivery confirmation flow
- [ ] Full traceability: shipment → batch → production
