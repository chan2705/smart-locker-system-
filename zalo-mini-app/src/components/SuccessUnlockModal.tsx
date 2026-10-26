import React from 'react';
import { useAppStore } from '../store/useAppStore';
import { CheckCircle2, LockKeyholeOpen, X } from 'lucide-react';

export const SuccessUnlockModal: React.FC = () => {
  const { unlockSuccessModal, closeUnlockModal, fetchCabinetStatus } = useAppStore();

  if (!unlockSuccessModal || !unlockSuccessModal.isOpen) return null;

  const handleClose = () => {
    closeUnlockModal();
    fetchCabinetStatus();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 text-center space-y-4 border-2 border-emerald-500 shadow-2xl">
        
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1 rounded-full bg-slate-100"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className="mx-auto w-16 h-16 rounded-full bg-emerald-100 border-2 border-emerald-300 flex items-center justify-center text-emerald-600 shadow-sm">
          <LockKeyholeOpen className="w-8 h-8" />
        </div>

        {/* Title */}
        <div className="space-y-1">
          <span className="text-xs font-black text-emerald-700 uppercase tracking-widest">
            {unlockSuccessModal.title || 'MỞ KHÓA THÀNH CÔNG'}
          </span>
          <div className="text-2xl font-black text-slate-900 flex items-center justify-center gap-2">
            <span>NGĂN SỐ</span>
            <span className="text-3xl text-blue-600 font-mono">
              #{unlockSuccessModal.boxId}
            </span>
          </div>
        </div>

        {/* PIN Code Box if present */}
        {unlockSuccessModal.pinCode && (
          <div className="bg-amber-50 rounded-2xl p-3 border border-amber-200 space-y-1">
            <div className="text-xs text-amber-800 font-bold">Mã PIN gửi đến cư dân:</div>
            <div className="font-mono text-2xl font-black text-amber-900 tracking-widest">
              {unlockSuccessModal.pinCode}
            </div>
            <div className="text-[11px] text-emerald-700 font-bold flex items-center justify-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Đã tự động gửi thông báo</span>
            </div>
          </div>
        )}

        {/* Explanation Message */}
        <p className="text-xs text-slate-600 leading-relaxed font-medium">
          {unlockSuccessModal.message}
        </p>

        {/* Action Button */}
        <button
          onClick={handleClose}
          className="w-full py-3.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-black text-sm active:scale-95 transition"
        >
          Đóng Cửa Tủ (Hoàn Tất)
        </button>

      </div>
    </div>
  );
};
