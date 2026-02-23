import { api } from "./client";
import type {
  ShipmentResponse,
  CreateShipmentDto,
  UpdateShipmentStatusDto,
} from "@repo/types";

/**
 * Shipments API
 */
export const shipmentsApi = {
  /**
   * Get all shipments
   */
  getAll: () =>
    api.get<ShipmentResponse[]>("/shipments"),

  /**
   * Get shipment by ID
   */
  getById: (id: number) =>
    api.get<ShipmentResponse>(`/shipments/${id}`),

  /**
   * Create shipment
   */
  create: (data: CreateShipmentDto) =>
    api.post<ShipmentResponse>("/shipments", data),

  /**
   * Update shipment status
   */
  updateStatus: (
    id: number,
    data: UpdateShipmentStatusDto
  ) =>
    api.put<ShipmentResponse>(
      `/shipments/${id}/status`,
      data
    ),

  /**
   * Delete shipment
   */
  delete: (id: number) =>
    api.delete(`/shipments/${id}`),
};
