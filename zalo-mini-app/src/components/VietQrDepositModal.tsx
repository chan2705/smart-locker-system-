import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { LockerApi } from '../services/api';
import { QrCode, X, Sparkles } from 'lucide-react';

export const VietQrDepositModal: React.FC = () => {
  const {
    isVietQrModalOpen,
    setVietQrModalOpen,
    activeRentalOrder,
    openUnlockModal,
    fetchCabinetStatus,
    fetchUserRentalOrders,
  } = useAppStore();

  const [isProcessing, setIsProcessing] = useState(false);

  if (!isVietQrModalOpen || !activeRentalOrder) return null;

  const depositAmount = activeRentalOrder.deposit_amount;
  const orderId = activeRentalOrder.id;

  const handleSimulateWebhook = async () => {
    setIsProcessing(true);
    try {
      const res = await LockerApi.simulateDepositWebhook(orderId, depositAmount);
      setIsProcessing(false);
      setVietQrModalOpen(false);

      openUnlockModal({
        title: `ĐÃ MỞ NGĂN #${String(res.boxId).padStart(2, '0')}`,
        message: `Đã nhận tiền cọc ${depositAmount.toLocaleString('vi-VN')}đ. Cửa tủ đã mở để quý khách nhận thiết bị!`,
        boxId: res.boxId,
        pinCode: activeRentalOrder.pin_code,
      });

      await fetchCabinetStatus();
      await fetchUserRentalOrders();
    } catch (err: any) {
      setIsProcessing(false);
      alert(err.message || 'Lỗi xử lý thanh toán webhook');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-5 space-y-4 border-2 border-slate-200 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Đặt Cọc Qua VietQR</h3>
              <p className="text-[11px] text-slate-500 font-medium">Hoàn trả 100% khi trả lại đồ</p>
            </div>
          </div>
          <button
            onClick={() => setVietQrModalOpen(false)}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Dynamic VietQR Image Display */}
        <div className="bg-slate-50 rounded-2xl p-4 flex flex-col items-center justify-center border border-slate-200 text-center">
          <div className="text-xs font-black text-blue-600 mb-2">VietQR • MB BANK</div>
          <div className="w-40 h-40 bg-white border-2 border-slate-300 rounded-xl p-2 flex items-center justify-center shadow-sm">
            <svg viewBox="0 0 100 100" className="w-32 h-32 fill-slate-900">
              <rect x="0" y="0" width="30" height="30" />
              <rect x="5" y="5" width="20" height="20" fill="#fff" />
              <rect x="10" y="10" width="10" height="10" />
              <rect x="70" y="0" width="30" height="30" />
              <rect x="75" y="5" width="20" height="20" fill="#fff" />
              <rect x="80" y="10" width="10" height="10" />
              <rect x="0" y="70" width="30" height="30" />
              <rect x="5" y="75" width="20" height="20" fill="#fff" />
              <rect x="10" y="80" width="10" height="10" />
              <rect x="40" y="10" width="10" height="20" />
              <rect x="40" y="40" width="20" height="20" />
              <rect x="70" y="50" width="20" height="10" />
              <rect x="50" y="70" width="30" height="20" />
            </svg>
          </div>
          <div className="text-lg font-black text-slate-900 mt-2">
            {depositAmount.toLocaleString('vi-VN')} VNĐ
          </div>
          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
            Nội dung: {orderId}
          </div>
        </div>

        {/* Action button */}
        <button
          onClick={handleSimulateWebhook}
          disabled={isProcessing}
          className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-md shadow-emerald-600/25 flex items-center justify-center gap-2 active:scale-95 transition"
        >
          {isProcessing ? (
            <span>Đang xác nhận tiền cọc...</span>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Giả Lập Khách Đã Chuyển Khoản</span>
            </>
          )}
        </button>

      </div>
    </div>
  );
};
