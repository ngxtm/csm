"use client";

import { useEffect, useState } from "react";
import { Modal, Button } from "@/components/ui";
import { shipmentsApi } from "@/lib/api/shipments";
import type { CreateShipmentDto } from "@repo/types";

interface CreateShipmentModal {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function CreateShipmentModal({
  isOpen,
  onClose,
  onSuccess,
}: CreateShipmentModal) {
  const [orderId, setOrderId] = useState<number | null>(
    null
  );
  const [isLoading, setIsLoading] =
    useState(false);

  const handleSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!orderId) return;

    try {
      setIsLoading(true);

      const payload: CreateShipmentDto = {
        orderId,
      };

      await shipmentsApi.create(payload);

      onSuccess?.();
    } catch (error) {
      console.error(
        "Create shipment failed:",
        error
      );
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      setOrderId(null);
    }
  }, [isOpen]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Shipment"
    >
      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {/* Shipment Info */}
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div>
            <label className="mb-2 block text-sm font-semibold text-gray-700">
              Order ID{" "}
              <span className="text-red-500">*</span>
            </label>

            <input
              type="number"
              min={1}
              value={orderId ?? ""}
              onChange={(e) =>
                setOrderId(
                  Number(e.target.value)
                )
              }
              placeholder="Enter Order ID"
              className="h-12 w-full rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-gray-900 shadow-sm transition-colors focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              required
            />
          </div>
        </div>

        {/* Info Box */}
        <div className="rounded-lg border-2 border-blue-200 bg-blue-50 p-4">
          <p className="text-sm text-blue-700">
            A shipment will be created for the
            selected order. Shipment code will be
            generated automatically.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col-reverse gap-3 border-t pt-6 sm:flex-row sm:justify-end">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            loading={isLoading}
            disabled={!orderId}
            className="w-full sm:w-auto"
          >
            {isLoading
              ? "Creating..."
              : "Create Shipment"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}