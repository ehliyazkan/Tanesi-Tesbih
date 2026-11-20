import React from 'react';
import {
  BarChart3,
  Bell,
  BookMarked,
  Home,
  Settings,
} from 'lucide-react';

export type NavTabId = 'home' | 'stats' | 'list' | 'notifications' | 'settings';

interface BottomNavProps {
  activeTab: NavTabId;
  onSelectTab: (tab: NavTabId) => void;
}

const NAV_ITEMS: Array<{
  id: NavTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: 'home', label: 'Ana Sayfa', icon: Home },
  { id: 'stats', label: 'İstatistik', icon: BarChart3 },
  { id: 'list', label: 'Listem', icon: BookMarked },
  { id: 'notifications', label: 'Bildirimler', icon: Bell },
  { id: 'settings', label: 'Ayarlar', icon: Settings },
];

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
}) => {
  return (
    <nav
      aria-label="Ana navigasyon"
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#D6A83D]/45 bg-[#06452F]/97 backdrop-blur-md pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.18)]"
    >
      <div className="mx-auto grid h-16 max-w-4xl grid-cols-5 items-center px-1 sm:px-4">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              aria-current={isActive ? 'page' : undefined}
              className={`relative flex h-full min-h-[48px] flex-col items-center justify-center gap-1 transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#D6A83D] cursor-pointer ${
                isActive
                  ? 'text-[#E8C97A]'
                  : 'text-[#FFF4D8]/70 hover:text-[#FFF4D8]'
              }`}
            >
              {isActive && (
                <span
                  aria-hidden="true"
                  className="absolute top-0 h-[2.5px] w-10 rounded-b-full bg-[#D6A83D]"
                />
              )}
              <Icon className="w-[21px] h-[21px]" />
              <span className="text-[11px] font-medium tracking-tight whitespace-nowrap">
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
