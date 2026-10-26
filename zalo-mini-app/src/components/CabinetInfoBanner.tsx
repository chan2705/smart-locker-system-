import React from 'react';
import { useAppStore } from '../store/useAppStore';

export const CabinetInfoBanner: React.FC = () => {
  const { boxes, cabinet } = useAppStore();

  const availS = boxes.filter((b) => b.size === 'S' && b.status === 'AVAILABLE').length;
  const availM = boxes.filter((b) => b.size === 'M' && b.status === 'AVAILABLE').length;
  const availL = boxes.filter((b) => b.size === 'L' && b.status === 'AVAILABLE').length;
  const totalAvail = availS + availM + availL;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></div>
          <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
            {cabinet?.name || 'Tủ Thông Minh S2.03'}
          </span>
        </div>
        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
          Trống {totalAvail || 8}/12 ngăn
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 flex flex-col items-center text-center">
          <span className="text-[10px] text-slate-500 font-bold">Ngăn Nhỏ (S)</span>
          <span className="text-base font-extrabold text-blue-600 font-mono mt-0.5">{availS || 3}</span>
          <span className="text-[9px] text-slate-400">Tài liệu, ví</span>
        </div>

        <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 flex flex-col items-center text-center">
          <span className="text-[10px] text-slate-500 font-bold">Ngăn Vừa (M)</span>
          <span className="text-base font-extrabold text-blue-600 font-mono mt-0.5">{availM || 2}</span>
          <span className="text-[9px] text-slate-400">Hộp giày, áo</span>
        </div>

        <div className="bg-slate-50 rounded-xl p-2.5 border border-slate-200 flex flex-col items-center text-center">
          <span className="text-[10px] text-slate-500 font-bold">Ngăn Lớn (L)</span>
          <span className="text-base font-extrabold text-blue-600 font-mono mt-0.5">{availL || 3}</span>
          <span className="text-[9px] text-slate-400">Thùng lớn</span>
        </div>
      </div>
    </div>
  );
};
