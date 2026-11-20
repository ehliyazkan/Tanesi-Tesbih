import React, { useEffect, useState } from 'react';
import { TanesiProvider, useTanesi } from './context/TanesiContext';
import type { DhikrDefinition } from './data/dhikrs';
import { HomeView } from './components/HomeView';
import { CounterView } from './components/CounterView';
import { StatsView } from './components/StatsView';
import { ListView } from './components/ListView';
import { NotificationsView } from './components/NotificationsView';
import { SettingsView } from './components/SettingsView';
import { BottomNav, type NavTabId } from './components/BottomNav';
import { OfflineIndicator } from './components/OrnamentPrimitives';

const TanesiShell: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NavTabId>('home');
  const [activeDhikr, setActiveDhikr] = useState<DhikrDefinition | null>(null);
  const { settings } = useTanesi();

  // Ekran geçişlerinde sayfa başına yumuşak kaydır
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
  }, [activeTab, activeDhikr]);

  // Tarayıcı içi zamanlı hatırlatma kontrolü (dakikada bir)
  useEffect(() => {
    let lastNotifiedKey = '';
    const checkReminders = () => {
      if (
        typeof window === 'undefined' ||
        !('Notification' in window) ||
        Notification.permission !== 'granted'
      ) {
        return;
      }
      const now = new Date();
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(
        now.getMinutes()
      ).padStart(2, '0')}`;
      const dayNum = now.getDay();

      for (const rem of settings.reminders) {
        if (!rem.enabled || rem.time !== hhmm) continue;
        if (rem.days.length > 0 && !rem.days.includes(dayNum)) continue;
        const key = `${rem.id}-${now.toDateString()}-${hhmm}`;
        if (key === lastNotifiedKey) continue;
        lastNotifiedKey = key;
        try {
          new Notification(`TANESİ · ${rem.title}`, {
            body: rem.description,
            icon: '/pwa-192x192.png',
          });
        } catch {
          // Sessiz geç
        }
      }
    };

    const interval = window.setInterval(checkReminders, 30_000);
    return () => window.clearInterval(interval);
  }, [settings.reminders]);

  const handleOpenCounter = (dhikr: DhikrDefinition) => {
    setActiveDhikr(dhikr);
  };

  const handleSelectTab = (tab: NavTabId) => {
    setActiveDhikr(null);
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen parchment-canvas text-[#0F271E] dark:text-[#F6EED9] transition-colors duration-200">
      {activeDhikr ? (
        <CounterView dhikr={activeDhikr} onBack={() => setActiveDhikr(null)} />
      ) : (
        <>
          {activeTab === 'home' && (
            <HomeView
              onOpenCounter={handleOpenCounter}
              onOpenSettings={() => handleSelectTab('settings')}
            />
          )}
          {activeTab === 'stats' && <StatsView />}
          {activeTab === 'list' && <ListView onOpenCounter={handleOpenCounter} />}
          {activeTab === 'notifications' && <NotificationsView />}
          {activeTab === 'settings' && <SettingsView />}
        </>
      )}

      <OfflineIndicator />
      <BottomNav activeTab={activeTab} onSelectTab={handleSelectTab} />
    </div>
  );
};

export default function App() {
  return (
    <TanesiProvider>
      <TanesiShell />
    </TanesiProvider>
  );
}
