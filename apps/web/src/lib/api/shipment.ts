import { api } from "./client";
import type {
  Shipment,
  CreateShipmentDto,
  UpdateShipmentStatusDto,
} from "@repo/types";

/**
 * Shipments API Service
 */
export const shipmentsApi = {
  /**
   * Get all shipments
   */
  getAll: () => api.get<Shipment[]>("/shipments"),

  /**
   * Get shipment by ID
   */
  getById: (id: number) =>
    api.get<Shipment>(`/shipments/${id}`),

  /**
   * Create shipment
   */
  create: (data: CreateShipmentDto) =>
    api.post<Shipment>("/shipments", data),

  /**
   * Update shipment status
   */
  updateStatus: (id: number, data: UpdateShipmentStatusDto) =>
    api.put<Shipment>(`/shipments/${id}/status`, data),
};
