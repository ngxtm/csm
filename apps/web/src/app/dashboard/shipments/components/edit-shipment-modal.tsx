/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useEffect, useState } from "react";
import { Modal, Button } from "@/components/ui";
import { shipmentsApi } from "@/lib/api/shipments";
import { AlertCircle, Calendar } from "lucide-react";

export function EditShipmentModal({ shipment, isOpen, onClose, onSuccess }: any) {
  const [driverName, setDriverName] = useState("");
  const [driverPhone, setDriverPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "Chưa cập nhật";
    return new Date(dateString).toLocaleString('vi-VN');
  };

  useEffect(() => {
    if (isOpen && shipment) {
      setDriverName(shipment.driver_name || "");
      setDriverPhone(shipment.driver_phone || "");
      setNotes(shipment.notes || "");
      setError(null);
    }
  }, [isOpen, shipment]);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsLoading(true);
      setError(null);
      
      await shipmentsApi.update(shipment.id, {
        driver_name: driverName, 
        driver_phone: driverPhone, 
        notes: notes
      });

      alert("Cập nhật thành công!");
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || "Không thể cập nhật thông tin");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Chỉnh sửa vận đơn: ${shipment?.shipment_code}`}>
      {/* Thêm text-black ở form để toàn bộ chữ bên trong màu đen */}
      <form onSubmit={handleUpdate} className="p-4 space-y-4 text-black">
        {error && (
          <div className="flex items-center gap-2 p-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 p-3 bg-gray-100 rounded-lg border border-gray-200 mb-4">
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-gray-600 font-bold">Mã Đơn Hàng</label>
            <p className="text-sm font-bold text-black">ORD-{shipment?.order_id}</p>
          </div>
          <div>
            <label className="block text-[10px] uppercase tracking-wider text-gray-600 font-bold">Trạng thái</label>
            <p className="text-sm font-bold capitalize text-blue-700">{shipment?.status}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-bold text-black mb-1">Tên tài xế</label>
            <input
              type="text"
              value={driverName}
              onChange={(e) => setDriverName(e.target.value)}
              className="w-full h-11 border border-gray-300 text-black rounded-lg px-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-black mb-1">Số điện thoại</label>
            <input
              type="text"
              value={driverPhone}
              onChange={(e) => setDriverPhone(e.target.value)}
              className="w-full h-11 border border-gray-300 text-black rounded-lg px-3 focus:ring-2 focus:ring-blue-500 outline-none transition-all placeholder:text-gray-400"
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-black mb-1">Ghi chú</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-24 border border-gray-300 text-black rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 outline-none transition-all resize-none placeholder:text-gray-400"
            />
          </div>
        </div>

        <div className="pt-4 border-t border-gray-200 space-y-2">
          <div className="flex items-center gap-2 text-xs text-gray-700 font-bold">
            <Calendar size={14} />
            <span>Thông tin lộ trình (Tự động cập nhật)</span>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 bg-orange-50 rounded border border-orange-200">
              <span className="block text-[10px] text-orange-700 font-bold uppercase">Ngày xuất kho</span>
              <span className="text-xs font-medium text-black">{formatDate(shipment?.shipped_date)}</span>
            </div>
            <div className="p-2 bg-green-50 rounded border border-green-200">
              <span className="block text-[10px] text-green-700 font-bold uppercase">Ngày hoàn thành</span>
              <span className="text-xs font-medium text-black">{formatDate(shipment?.delivered_date)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200">
          <Button type="button" variant="secondary" onClick={onClose} className="text-black" disabled={isLoading}>
            Hủy
          </Button>
          <Button 
            type="submit" 
            loading={isLoading} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 font-bold"
          >
            Lưu thay đổi
          </Button>
        </div>
      </form>
    </Modal>
  );
}