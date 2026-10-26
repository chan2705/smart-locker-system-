import React, { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { LockerApi } from '../services/api';
import { ShieldCheck, CheckCircle2, Scan, X } from 'lucide-react';

export const EkycModal: React.FC = () => {
  const { isEkycModalOpen, setEkycModalOpen, userPhone, checkEkycStatus } = useAppStore();

  const [isScanning, setIsScanning] = useState(false);
  const [isDone, setIsDone] = useState(false);

  if (!isEkycModalOpen) return null;

  const handleSimulateEkyc = async () => {
    setIsScanning(true);
    setTimeout(async () => {
      setIsScanning(false);
      setIsDone(true);
      await LockerApi.verifyEkyc({
        phone: userPhone,
        fullName: 'KHUẤT MINH CHÂN',
        idCardNo: '001202019284',
      });
      await checkEkycStatus();
    }, 1200);
  };

  const handleFinish = () => {
    setEkycModalOpen(false);
    setIsDone(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 space-y-4 border-2 border-slate-200 shadow-2xl">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900">Định Danh eKYC CCCD</h3>
              <p className="text-[11px] text-slate-500 font-medium">Bảo mật giao dịch thuê đồ tự động</p>
            </div>
          </div>
          <button
            onClick={() => setEkycModalOpen(false)}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 bg-slate-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {!isDone ? (
          <div className="space-y-4">
            <div className="w-full h-36 bg-slate-50 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-center p-4 relative overflow-hidden">
              <Scan className="w-10 h-10 text-blue-600 mb-2" />
              <div className="text-xs font-bold text-slate-800">Quét khuôn mặt & CCCD</div>
              <div className="text-[11px] text-slate-500 mt-0.5">Xác thực sinh trắc học tự động</div>
              
              {isScanning && (
                <div className="absolute inset-0 bg-blue-600/10 backdrop-blur-xs flex items-center justify-center">
                  <span className="text-xs font-black text-blue-700 animate-pulse">Đang đối soát AI...</span>
                </div>
              )}
            </div>

            <button
              onClick={handleSimulateEkyc}
              disabled={isScanning}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-black text-sm active:scale-95 transition"
            >
              {isScanning ? 'Đang xác thực...' : 'Giả Lập Quét CCCD & FaceID (1s)'}
            </button>
          </div>
        ) : (
          <div className="space-y-4 text-center py-2">
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-black text-slate-900">ĐÃ XÁC THỰC THÀNH CÔNG!</h4>
              <p className="text-xs text-slate-600 mt-1">Độ khớp khuôn mặt: <strong>98.2% (Định danh Mức 2)</strong></p>
            </div>
            <button
              onClick={handleFinish}
              className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm active:scale-95 transition"
            >
              Tiếp Tục Thuê Đồ
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
