import { z } from "zod";

export const SHIPMENT_STATUS = {
  PENDING: "pending",
  SHIPPING: "shipping",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
} as const;

export const SHIPMENT_STATUS_VALUES = [
  "pending",
  "shipping",
  "delivered",
  "cancelled",
] as const;

export const ShipmentStatusSchema = z.enum(
  SHIPMENT_STATUS_VALUES
);

export type ShipmentStatus =
  z.infer<typeof ShipmentStatusSchema>;

export const shipmentStatusColors: Record<
  ShipmentStatus,
  string
> = {
  pending: "bg-gray-100 text-gray-800",
  shipping: "bg-yellow-100 text-yellow-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export const CreateShipmentDto = z.object({
  orderId: z.number().int().positive(),
});

export type CreateShipmentDto =
  z.infer<typeof CreateShipmentDto>;

export const UpdateShipmentStatusDto = z.object({
  status: ShipmentStatusSchema,
});

export type UpdateShipmentStatusDto =
  z.infer<typeof UpdateShipmentStatusDto>;

export const ShipmentResponse = z.object({
  id: z.number(),
  order_id: z.number(),
  shipment_code: z.string(),
  status: ShipmentStatusSchema,
  created_at: z.string(),
  updated_at: z.string(),
});

export type ShipmentResponse =
  z.infer<typeof ShipmentResponse>;
