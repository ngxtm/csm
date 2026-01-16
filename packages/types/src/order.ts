import { z } from 'zod';

export const OrderStatus = z.enum([
  'draft',
  'submitted',
  'confirmed',
  'in_production',
  'ready',
  'in_delivery',
  'delivered',
  'cancelled',
]);
export type OrderStatus = z.infer<typeof OrderStatus>;

export const CreateOrderItemDto = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
});
export type CreateOrderItemDto = z.infer<typeof CreateOrderItemDto>;

export const CreateOrderDto = z.object({
  storeId: z.number().int().positive(),
  requestedDate: z.string().date(),
  notes: z.string().optional(),
  items: z.array(CreateOrderItemDto).min(1),
});
export type CreateOrderDto = z.infer<typeof CreateOrderDto>;

export const OrderItemResponse = z.object({
  id: z.number(),
  productId: z.number(),
  productName: z.string(),
  quantity: z.number(),
  unitPrice: z.number().nullable(),
});
export type OrderItemResponse = z.infer<typeof OrderItemResponse>;

export const OrderResponse = z.object({
  id: z.number(),
  chainId: z.number(),
  storeId: z.number(),
  storeName: z.string().optional(),
  orderNumber: z.string(),
  status: OrderStatus,
  requestedDate: z.string(),
  totalAmount: z.number().nullable(),
  items: z.array(OrderItemResponse),
  createdAt: z.string(),
  updatedAt: z.string(),
});
export type OrderResponse = z.infer<typeof OrderResponse>;

export const UpdateOrderStatusDto = z.object({
  status: OrderStatus,
  notes: z.string().optional(),
});
export type UpdateOrderStatusDto = z.infer<typeof UpdateOrderStatusDto>;
