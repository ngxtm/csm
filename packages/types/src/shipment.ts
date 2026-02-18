import { z } from "zod";

export const SHIPMENT_STATUS = {
  PENDING: "pending",
  SHIPPING: "shipping",
  DELIVERED: "delivered",
  CANCELLED: "cancelled",
} as const;

export type ShipmentStatus =
  typeof SHIPMENT_STATUS[keyof typeof SHIPMENT_STATUS];

export const SHIPMENT_STATUS_VALUES =
  Object.values(SHIPMENT_STATUS);

export const shipmentStatusColors: Record<
  ShipmentStatus,
  string
> = {
  [SHIPMENT_STATUS.PENDING]:
    "bg-gray-100 text-gray-800",

  [SHIPMENT_STATUS.SHIPPING]:
    "bg-yellow-100 text-yellow-800",

  [SHIPMENT_STATUS.DELIVERED]:
    "bg-green-100 text-green-800",

  [SHIPMENT_STATUS.CANCELLED]:
    "bg-red-100 text-red-800",
};

export const CreateShipmentDto = z.object({
  orderId: z.number().int().positive(),
});

export type CreateShipmentDto =
  z.infer<typeof CreateShipmentDto>;

export const UpdateShipmentStatusDto = z.object({
  status: SHIPMENT_STATUS_VALUES,
});

export type UpdateShipmentStatusDto =
  z.infer<typeof UpdateShipmentStatusDto>;

export const ShipmentResponse = z.object({
  id: z.number(),
  orderId: z.number(),
  shipmentCode: z.string(),
  status: SHIPMENT_STATUS_VALUES,
  createdAt: z.string(),
  updatedAt: z.string(),
});

export type ShipmentResponse =
  z.infer<typeof ShipmentResponse>;
