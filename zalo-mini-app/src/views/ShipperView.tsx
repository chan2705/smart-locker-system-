import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { LockerApi } from '../services/api';
import { BoxSize } from '../types';
import { CabinetInfoBanner } from '../components/CabinetInfoBanner';
import { Unlock, Phone } from 'lucide-react';

export const ShipperView: React.FC = () => {
  const {
    shipperPhone,
    boxes,
    qrParams,
    openUnlockModal,
    fetchCabinetStatus,
  } = useAppStore();

  const [selectedSize, setSelectedSize] = useState<BoxSize>('S');
  const [recipientPhone, setRecipientPhone] = useState('0912.345.678');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const availS = boxes.filter((b) => b.size === 'S' && b.status === 'AVAILABLE').length;
  const availM = boxes.filter((b) => b.size === 'M' && b.status === 'AVAILABLE').length;
  const availL = boxes.filter((b) => b.size === 'L' && b.status === 'AVAILABLE').length;

  const handleDropoff = async () => {
    if (!recipientPhone.trim()) {
      setErrorMsg('Vui lòng nhập số điện thoại người nhận!');
      return;
    }

    setErrorMsg(null);
    setIsSubmitting(true);

    try {
      const res = await LockerApi.shipperDropoff({
        size: selectedSize,
        recipientPhone: recipientPhone.trim(),
        cab: qrParams?.cab,
        ts: qrParams?.ts,
        nonce: qrParams?.nonce,
        sig: qrParams?.sig,
      });

      setIsSubmitting(false);

      openUnlockModal({
        title: `ĐÃ MỞ NGĂN #${String(res.boxId).padStart(2, '0')}`,
        message: `Cửa tủ đã mở thành công. Vui lòng bỏ hàng vào và đóng chặt cửa lại. Mã PIN cư dân: ${res.pinCode}`,
        boxId: res.boxId,
        pinCode: res.pinCode,
      });

      await fetchCabinetStatus();
    } catch (err: any) {
      setIsSubmitting(false);
      setErrorMsg(err.message || 'Không thể mở ngăn tủ');
    }
  };

  return (
    <div className="space-y-4 pb-20">
      <CabinetInfoBanner />

      <div className="bg-white border-2 border-slate-200 rounded-3xl p-5 space-y-4 shadow-sm">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Gửi Đồ Vào Tủ</h2>
          <p className="text-xs text-slate-500 font-medium">Chọn cỡ ngăn và nhập số điện thoại người nhận</p>
        </div>

        {errorMsg && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-bold">
            {errorMsg}
          </div>
        )}

        {/* 1. Box Size Selector */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
            1. Chọn cỡ ngăn tủ
          </label>

          <div className="grid grid-cols-3 gap-2.5">
            <button
              type="button"
              onClick={() => setSelectedSize('S')}
              className={`p-3 rounded-2xl border-2 text-center transition-all active:scale-95 flex flex-col items-center ${
                selectedSize === 'S'
                  ? 'border-blue-600 bg-blue-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <span className="text-xs font-black text-slate-900">Cỡ Nhỏ (S)</span>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5">Tài liệu, ví</span>
              <span className="text-xs font-bold text-blue-600 mt-1">Trống: {availS || 3}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedSize('M')}
              className={`p-3 rounded-2xl border-2 text-center transition-all active:scale-95 flex flex-col items-center ${
                selectedSize === 'M'
                  ? 'border-blue-600 bg-blue-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <span className="text-xs font-black text-slate-900">Cỡ Vừa (M)</span>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5">Hộp giày, áo</span>
              <span className="text-xs font-bold text-blue-600 mt-1">Trống: {availM || 2}</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedSize('L')}
              className={`p-3 rounded-2xl border-2 text-center transition-all active:scale-95 flex flex-col items-center ${
                selectedSize === 'L'
                  ? 'border-blue-600 bg-blue-50 shadow-sm'
                  : 'border-slate-200 bg-white hover:bg-slate-50'
              }`}
            >
              <span className="text-xs font-black text-slate-900">Cỡ Lớn (L)</span>
              <span className="text-[10px] text-slate-500 font-medium mt-0.5">Thùng lớn</span>
              <span className="text-xs font-bold text-blue-600 mt-1">Trống: {availL || 3}</span>
            </button>
          </div>
        </div>

        {/* 2. Recipient Phone */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-700 uppercase tracking-wide block">
            2. Số điện thoại người nhận
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="tel"
              value={recipientPhone}
              onChange={(e) => setRecipientPhone(e.target.value)}
              className="w-full bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white pl-10 pr-4 py-3 rounded-2xl text-sm font-bold text-slate-900 outline-none transition"
              placeholder="0912 345 678"
            />
          </div>

          <div className="flex items-center gap-1.5 pt-1">
            <button
              type="button"
              onClick={() => setRecipientPhone('0912.345.678')}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700"
            >
              0912...678 (Nam)
            </button>
            <button
              type="button"
              onClick={() => setRecipientPhone('0988.777.666')}
              className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700"
            >
              0988...666 (Linh)
            </button>
          </div>
        </div>

        {/* Big Action Button */}
        <button
          onClick={handleDropoff}
          disabled={isSubmitting}
          className="w-full py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-base shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 active:scale-95 transition"
        >
          {isSubmitting ? (
            <span>Đang kích mở ngăn tủ...</span>
          ) : (
            <>
              <Unlock className="w-5 h-5" />
              <span>MỞ TỦ NGAY</span>
            </>
          )}
        </button>

      </div>
    </div>
  );
};
