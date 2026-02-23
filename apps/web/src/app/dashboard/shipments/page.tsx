"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/";
import { shipmentsApi } from "@/lib/api/shipments";
import type {
  ShipmentResponse,
  ShipmentStatus,
} from "@repo/types";
import { shipmentStatusColors } from "@repo/types";
import CreateShipmentModal from "./components/create-shipment-modal";

export default function ShipmentsPage() {
  const [data, setData] = useState<ShipmentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);

  const fetchShipments = async () => {
  try {
    const res = await shipmentsApi.getAll();
    console.log("Dữ liệu nhận về:", res);
    setData(Array.isArray(res.data) ? res.data : []);
  } catch (error) {
    console.error("Failed to fetch shipments:", error);
    setData([]);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchShipments();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-black">
          Shipments
        </h1>

        <Button onClick={() => setIsFormOpen(true)}>
          Add Shipment
        </Button>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-lg border bg-white">
        <table className="w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-3">ID</th>
              <th className="p-3">Order ID</th>
              <th className="p-3">Shipment Code</th>
              <th className="p-3">Status</th>
              <th className="p-3">Created At</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-6 text-center"
                >
                  Loading...
                </td>
              </tr>
            ) : (data?.length ?? 0) === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="p-6 text-center text-gray-500"
                >
                  No shipments found
                </td>
              </tr>
            ) : (
              data.map((shipment) => (
                <tr
                  key={shipment.id}
                  className="border-t hover:bg-gray-50"
                >
                  <td className="p-3">
                    {shipment.id}
                  </td>
                  <td className="p-3">
                    {shipment.order_id}
                  </td>
                  <td className="p-3">
                    {shipment.shipment_code}
                  </td>
                  <td className="p-3">
                    <StatusBadge
                      status={shipment.status}
                    />
                  </td>
                  <td className="p-3">
                    {new Date(
                      shipment.created_at
                    ).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isFormOpen && (
        <CreateShipmentModal
                  onSuccess={() => {
                      setIsFormOpen(false);
                      fetchShipments();
                  } } isOpen={isFormOpen} onClose={() => setIsFormOpen(false)}        />
      )}
    </div>
  );
}

function StatusBadge({
  status,
}: {
  status: ShipmentStatus;
}) {
  const base =
    "rounded-full px-3 py-1 text-xs font-medium";

  const color =
    shipmentStatusColors[status];

  return (
    <span className={`${base} ${color}`}>
      {status}
    </span>
  );
}