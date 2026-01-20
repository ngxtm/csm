# FS5: Reports & Dashboard

**Owner:** FS5 | **Priority:** P2 | **Status:** Pending
**Dependencies:** FS1 (Orders), FS2 (Production), FS3 (Inventory), FS4 (Delivery)

## Scope

| Area | Tasks |
|------|-------|
| Backend | Reports module, analytics queries, data aggregation |
| Frontend | Dashboard, charts, export functionality |

## Backend Tasks

### Files to Create

```
apps/api/src/reports/
├── reports.module.ts
├── reports.controller.ts
├── reports.service.ts
└── dto/
    ├── report-query.dto.ts
    └── report-response.dto.ts
```

### Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | /reports/overview | Dashboard overview stats | manager, admin |
| GET | /reports/orders | Orders analytics | manager, admin |
| GET | /reports/production | Production analytics | manager, admin |
| GET | /reports/inventory | Inventory analytics | manager, admin |
| GET | /reports/delivery | Delivery analytics | manager, admin |
| GET | /reports/export | Export report (CSV/PDF) | manager, admin |

### Report Types

```typescript
// Report query parameters
interface ReportQuery {
  type: 'orders' | 'production' | 'inventory' | 'delivery';
  dateFrom: string;
  dateTo: string;
  storeId?: number;
  groupBy: 'day' | 'week' | 'month';
}

// Dashboard overview response
interface DashboardOverview {
  totalOrders: number;
  pendingOrders: number;
  completedOrders: number;
  totalRevenue: number;
  lowStockItems: number;
  pendingDeliveries: number;
}
```

### Analytics Queries

```typescript
// apps/api/src/reports/reports.service.ts
@Injectable()
export class ReportsService {
  constructor(private supabase: SupabaseService) {}

  async getOverview(chainId: number): Promise<DashboardOverview> {
    // Aggregate data from multiple tables
  }

  async getOrdersReport(query: ReportQuery): Promise<OrdersReport> {
    // Orders grouped by date/status
  }

  async getProductionReport(query: ReportQuery): Promise<ProductionReport> {
    // Production batches grouped by product/date
  }

  async getInventoryReport(query: ReportQuery): Promise<InventoryReport> {
    // Stock levels, movements, alerts
  }

  async exportReport(query: ReportQuery, format: 'csv' | 'pdf'): Promise<Buffer> {
    // Generate exportable file
  }
}
```

## Frontend Tasks

### Files to Create

```
apps/web/src/features/reports/
├── pages/
│   ├── dashboard.tsx
│   ├── orders-report.tsx
│   ├── production-report.tsx
│   ├── inventory-report.tsx
│   └── delivery-report.tsx
├── components/
│   ├── stat-card.tsx
│   ├── chart-container.tsx
│   ├── date-range-picker.tsx
│   ├── report-filters.tsx
│   └── export-button.tsx
└── hooks/
    ├── use-dashboard.ts
    └── use-report.ts
```

### Dashboard Components

```tsx
// Overview stats cards
<StatCard title="Total Orders" value={stats.totalOrders} trend="+12%" />
<StatCard title="Pending" value={stats.pendingOrders} status="warning" />
<StatCard title="Revenue" value={formatCurrency(stats.totalRevenue)} />
<StatCard title="Low Stock" value={stats.lowStockItems} status="danger" />

// Charts (using Recharts or similar)
<ChartContainer title="Orders by Day">
  <LineChart data={ordersData} />
</ChartContainer>

<ChartContainer title="Production by Product">
  <BarChart data={productionData} />
</ChartContainer>
```

### Report Pages

| Page | Features |
|------|----------|
| Dashboard | Overview stats, quick charts, alerts |
| Orders Report | Order trends, status breakdown, revenue |
| Production Report | Batch completion, product output |
| Inventory Report | Stock levels, movements, alerts |
| Delivery Report | Delivery times, success rate |

## Database Views (Optional)

```sql
-- Create views for common report queries
CREATE VIEW order_daily_summary AS
SELECT
  DATE(created_at) as date,
  COUNT(*) as total_orders,
  SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
  SUM(total_amount) as revenue
FROM orders
GROUP BY DATE(created_at);
```

## Acceptance Criteria

- [ ] Dashboard shows real-time overview stats
- [ ] Date range filtering works on all reports
- [ ] Charts render correctly with data
- [ ] Export to CSV works
- [ ] Responsive layout for mobile
- [ ] Loading states and error handling

## Notes

- Use React Query for data fetching with proper caching
- Charts should be lazy loaded
- Consider database views for complex aggregations
- Export functionality may need background job for large datasets
