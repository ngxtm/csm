# FS6: Stores & Products

**Owner:** FS6 | **Priority:** P1 | **Status:** Pending
**Dependencies:** None (Base entities)

## Scope

| Area | Tasks |
|------|-------|
| Backend | Stores CRUD, Products CRUD, Categories |
| Frontend | Store settings, product catalog, category management |

## Backend Tasks

### Files to Create

```
apps/api/src/stores/
├── stores.module.ts
├── stores.controller.ts
├── stores.service.ts
└── dto/store.dto.ts

apps/api/src/products/
├── products.module.ts
├── products.controller.ts
├── products.service.ts
└── dto/product.dto.ts

apps/api/src/categories/
├── categories.module.ts
├── categories.controller.ts
├── categories.service.ts
└── dto/category.dto.ts
```

### Stores Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | /stores | List stores | all |
| GET | /stores/:id | Store detail | all |
| POST | /stores | Create store | admin |
| PUT | /stores/:id | Update store | admin, manager |
| PUT | /stores/:id/settings | Update settings | admin, manager |
| DELETE | /stores/:id | Deactivate store | admin |

### Products Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | /products | List products | all |
| GET | /products/:id | Product detail | all |
| POST | /products | Create product | admin |
| PUT | /products/:id | Update product | admin |
| DELETE | /products/:id | Deactivate product | admin |
| GET | /products/by-category/:categoryId | Filter by category | all |

### Categories Endpoints

| Method | Endpoint | Description | Roles |
|--------|----------|-------------|-------|
| GET | /categories | List categories | all |
| POST | /categories | Create category | admin |
| PUT | /categories/:id | Update category | admin |
| DELETE | /categories/:id | Delete category | admin |

### Service Pattern (Using Singleton SupabaseService)

```typescript
// apps/api/src/stores/stores.service.ts
@Injectable()
export class StoresService {
  constructor(private supabase: SupabaseService) {} // Singleton injection

  async findAll(pagination: PaginationDto) {
    const { page, limit } = pagination;
    const offset = (page - 1) * limit;

    const { data, error, count } = await this.supabase.getClient()
      .from('stores')
      .select('*', { count: 'exact' })
      .eq('is_active', true)
      .order('name')
      .range(offset, offset + limit - 1);

    if (error) throw new InternalServerErrorException('Failed to fetch stores');

    return {
      data: this.transformStores(data || []),
      meta: { total: count || 0, page, limit, totalPages: Math.ceil((count || 0) / limit) },
    };
  }

  async create(dto: CreateStoreDto) {
    const { data, error } = await this.supabase.getClient()
      .from('stores')
      .insert({
        name: dto.name,
        address: dto.address,
        type: dto.type,
        phone: dto.phone,
        settings: dto.settings || {},
      })
      .select()
      .single();

    if (error) throw new InternalServerErrorException('Failed to create store');
    return this.transformStore(data);
  }

  private transformStore(store: StoreRow) {
    return {
      id: store.id,
      name: store.name,
      address: store.address,
      type: store.type,
      phone: store.phone,
      isActive: store.is_active,
      settings: store.settings,
      createdAt: store.created_at,
    };
  }
}
```

### DTOs

**packages/types/src/store.ts:**
```typescript
export const StoreType = z.enum(['franchise', 'central_kitchen']);

export const CreateStoreDto = z.object({
  name: z.string().min(2),
  address: z.string(),
  type: StoreType,
  phone: z.string().optional(),
  settings: z.record(z.unknown()).optional(),
});

export const StoreResponse = z.object({
  id: z.number(),
  name: z.string(),
  address: z.string(),
  type: StoreType,
  phone: z.string().nullable(),
  isActive: z.boolean(),
  settings: z.record(z.unknown()),
  createdAt: z.string(),
});
```

**packages/types/src/product.ts:**
```typescript
export const ItemType = z.enum(['material', 'semi_finished', 'finished_product']);

export const CreateProductDto = z.object({
  name: z.string().min(2),
  sku: z.string().min(3),
  categoryId: z.number(),
  unit: z.string(),
  type: ItemType,
  description: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

export const ProductResponse = z.object({
  id: z.number(),
  name: z.string(),
  sku: z.string(),
  categoryId: z.number(),
  categoryName: z.string(),
  unit: z.string(),
  type: ItemType,
  description: z.string().nullable(),
  imageUrl: z.string().nullable(),
  isActive: z.boolean(),
});
```

**packages/types/src/category.ts:**
```typescript
export const CreateCategoryDto = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
});

export const CategoryResponse = z.object({
  id: z.number(),
  name: z.string(),
  description: z.string().nullable(),
  productCount: z.number().optional(),
});
```

---

## Frontend Tasks

### Pages to Create

```
apps/web/src/app/(dashboard)/stores/
├── page.tsx                    # Store list
├── [id]/page.tsx               # Store detail/settings
├── new/page.tsx                # Create store (admin)
└── components/
    ├── store-table.tsx
    ├── store-form.tsx
    └── store-settings-form.tsx

apps/web/src/app/(dashboard)/products/
├── page.tsx                    # Product catalog
├── [id]/page.tsx               # Product detail
├── new/page.tsx                # Create product
└── components/
    ├── product-table.tsx
    ├── product-form.tsx
    ├── product-card.tsx
    └── category-filter.tsx

apps/web/src/app/(dashboard)/categories/
├── page.tsx                    # Category list (simple)
└── components/
    └── category-form.tsx
```

### Key Features

| Feature | Description |
|---------|-------------|
| Store Selector | Dropdown in navbar for multi-store users |
| Product Catalog | Grid/table view với category filter |
| Image Upload | Upload product images to Supabase Storage |
| Store Settings | JSON editor for custom settings |

### React Query Hooks

```typescript
// apps/web/src/hooks/use-stores.ts
export function useStores() {
  return useQuery({
    queryKey: ['stores'],
    queryFn: () => api.get('/stores'),
  });
}

export function useStore(id: number) {
  return useQuery({
    queryKey: ['stores', id],
    queryFn: () => api.get(`/stores/${id}`),
    enabled: !!id,
  });
}

// apps/web/src/hooks/use-products.ts
export function useProducts(params?: { categoryId?: number }) {
  return useQuery({
    queryKey: ['products', params],
    queryFn: () => api.get('/products', { params }),
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ['categories'],
    queryFn: () => api.get('/categories'),
    staleTime: 5 * 60 * 1000, // Cache 5 minutes
  });
}
```

---

## Image Upload (Supabase Storage)

```typescript
// apps/api/src/products/products.service.ts
async uploadImage(file: Express.Multer.File): Promise<string> {
  const fileName = `products/${Date.now()}-${file.originalname}`;

  const { error } = await this.supabase.getClient()
    .storage
    .from('images')
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
    });

  if (error) throw new InternalServerErrorException('Failed to upload image');

  const { data } = this.supabase.getClient()
    .storage
    .from('images')
    .getPublicUrl(fileName);

  return data.publicUrl;
}
```

---

## Integration Points

| With | Usage |
|------|-------|
| FS5 (Users) | Users belong to stores (store_id FK) |
| FS1 (Orders) | Orders reference stores (store_id FK) |
| FS3 (Inventory) | Inventory per store (store_id FK) |
| FS2 (Production) | Production uses products/items |

---

## Startup Priority

**Week 1 focus - này là base entities, phải xong trước:**

1. Day 1-2: Categories CRUD (simple, quick)
2. Day 2-3: Stores CRUD + basic FE
3. Day 3-5: Products CRUD + catalog FE

---

## Success Criteria

- [ ] Stores CRUD works via Swagger
- [ ] Products CRUD with category filter
- [ ] Categories management
- [ ] Image upload for products
- [ ] Store selector in navbar
- [ ] Product catalog with grid/table view
