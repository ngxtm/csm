import { api } from "./client";
import type {
  ShipmentItemResponse,
  CreateShipmentItemDto,
  UpdateShipmentItemDto,
} from "@repo/types";

/**
 * Shipment Items API
 */
export const shipmentItemsApi = {
  /**
   * Get items of a shipment
   */
  getByShipmentId: (shipmentId: number) =>
    api.get<ShipmentItemResponse[]>(
      `/shipments/${shipmentId}/items`
    ),

  /**
   * Add item to shipment
   */
  create: (
    shipmentId: number,
    data: CreateShipmentItemDto
  ) =>
    api.post<ShipmentItemResponse>(
      `/shipments/${shipmentId}/items`,
      data
    ),

  /**
   * Update shipment item
   */
  update: (
    id: number,
    data: UpdateShipmentItemDto
  ) =>
    api.put<ShipmentItemResponse>(
      `/shipment-items/${id}`,
      data
    ),

  /**
   * Delete shipment item
   */
  delete: (id: number) =>
    api.delete(`/shipment-items/${id}`),
};
