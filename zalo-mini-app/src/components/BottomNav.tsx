import React from 'react';
import { useAppStore, AppTab } from '../store/useAppStore';
import { PackagePlus, PackageCheck, Wrench } from 'lucide-react';

export const BottomNav: React.FC = () => {
  const { currentTab, setCurrentTab, residentParcels } = useAppStore();

  const tabs: { id: AppTab; label: string; icon: React.ReactNode; badge?: number }[] = [
    {
      id: 'shipper',
      label: 'Gửi Đồ',
      icon: <PackagePlus className="w-5 h-5" />,
    },
    {
      id: 'resident',
      label: 'Nhận Đồ',
      icon: <PackageCheck className="w-5 h-5" />,
      badge: residentParcels.length,
    },
    {
      id: 'rental',
      label: 'Thuê Đồ',
      icon: <Wrench className="w-5 h-5" />,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 pb-safe shadow-sm">
      <div className="max-w-md mx-auto grid grid-cols-3 px-2 py-1.5">
        {tabs.map((tab) => {
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCurrentTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-2 px-1 rounded-xl transition-all duration-150 active:scale-95 ${
                isActive
                  ? 'text-blue-600 font-extrabold'
                  : 'text-slate-500 hover:text-slate-800 font-semibold'
              }`}
            >
              <div className="relative">
                {tab.icon}
                {Boolean(tab.badge && tab.badge > 0) && (
                  <span className="absolute -top-1 -right-2 bg-red-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight">{tab.label}</span>
              {isActive && (
                <span className="w-6 h-0.5 bg-blue-600 rounded-full mt-0.5"></span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
