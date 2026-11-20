import React, { useMemo, useState } from 'react';
import { ArrowRight, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import {
  DHIKR_CATALOG,
  type DhikrCategory,
  type DhikrDefinition,
} from '../data/dhikrs';
import { useTanesi } from '../context/TanesiContext';
import { calculateProgressPercent } from '../utils/dhikrLogic';
import { CustomDhikrModal } from './CustomDhikrModal';

interface ListViewProps {
  onOpenCounter: (dhikr: DhikrDefinition) => void;
}

type FilterOption = 'all' | DhikrCategory;

const FILTER_TABS: Array<{ id: FilterOption; label: string }> = [
  { id: 'all', label: 'Tümü' },
  { id: 'daily', label: 'Günlük Virdler' },
  { id: 'weekly', label: 'Haftanın Tesbihleri' },
  { id: 'additional', label: 'İlave Tesbihler' },
  { id: 'special', label: 'Özel Zikirler' },
  { id: 'custom', label: 'Kendi Tesbihlerim' },
];

const CATEGORY_TITLES: Record<DhikrCategory, string> = {
  daily: 'Günlük Virdler',
  weekly: 'Haftanın Tesbihleri',
  additional: 'İlave Tesbihler',
  special: 'Özel Zikirler',
  custom: 'Kendi Tesbihlerim',
};

const CATEGORY_ORDER: DhikrCategory[] = [
  'daily',
  'weekly',
  'additional',
  'special',
  'custom',
];

export const ListView: React.FC<ListViewProps> = ({ onOpenCounter }) => {
  const {
    customDhikrs,
    getCountOnDate,
    getTarget,
    saveCustomDhikr,
    deleteCustomDhikr,
  } = useTanesi();

  const [filter, setFilter] = useState<FilterOption>('all');
  const [query, setQuery] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingDhikr, setEditingDhikr] = useState<DhikrDefinition | null>(null);
  const [deletingDhikr, setDeletingDhikr] = useState<DhikrDefinition | null>(null);

  const allDhikrs = useMemo(
    () => [...DHIKR_CATALOG, ...customDhikrs],
    [customDhikrs]
  );

  const filteredGroups = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr-TR');
    const categories = filter === 'all' ? CATEGORY_ORDER : [filter];

    return categories
      .map((cat) => {
        const items = allDhikrs.filter((d) => {
          if (d.category !== cat) return false;
          if (!q) return true;
          return (
            d.title.toLocaleLowerCase('tr-TR').includes(q) ||
            d.transliteration.toLocaleLowerCase('tr-TR').includes(q) ||
            d.meaning.toLocaleLowerCase('tr-TR').includes(q) ||
            d.arabic.includes(query.trim())
          );
        });
        return { category: cat, items };
      })
      .filter((group) => group.items.length > 0);
  }, [allDhikrs, filter, query]);

  return (
    <div className="pb-28">
      <header className="border-b border-[#D6A83D]/35 bg-[#06452F] text-[#FFF4D8]">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-display text-2xl sm:text-3xl font-bold">
                Zikir Listem
              </h1>
              <p className="mt-1 text-sm text-[#E8C97A]/90">
                Tüm günlük virdler, haftanın tesbihleri, ilave tesbihler ve kendi eklediğiniz özel zikirler
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingDhikr(null);
                setModalOpen(true);
              }}
              className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-[#D6A83D] px-4 py-2 text-sm font-semibold text-[#063222] hover:bg-[#E2B852] transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span>Yeni Tesbih Ekle</span>
            </button>
          </div>

          {/* Arama ve kategori filtresi */}
          <div className="mt-5 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div className="relative flex-1 max-w-md">
              <Search
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#E8C97A]"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Zikir adı, okunuş veya anlam ara..."
                aria-label="Zikir ara"
                className="w-full min-h-[44px] rounded-xl border border-[#D6A83D]/40 bg-[#042E1F] pl-10 pr-4 text-sm text-[#FFF4D8] placeholder:text-[#FFF4D8]/55 focus:border-[#D6A83D] focus:outline-none"
              />
            </div>

            <div
              className="flex items-center gap-1.5 overflow-x-auto pb-1 lg:pb-0"
              role="tablist"
              aria-label="Zikir kategorileri"
            >
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={filter === tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`min-h-[40px] px-3.5 rounded-xl text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                    filter === tab.id
                      ? 'bg-[#D6A83D] text-[#063222] font-semibold'
                      : 'bg-[#0B593D]/80 text-[#FFF4D8] hover:bg-[#0E6B4A]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 pt-7 space-y-9">
        {filteredGroups.length === 0 ? (
          <div className="rounded-2xl border border-[#D6A83D]/35 bg-[#FFF9EB] dark:bg-[#0B261C] p-8 text-center text-sm text-[#546D62] dark:text-[#A9BFB4]">
            {filter === 'custom' && !query.trim() ? (
              <div className="space-y-3">
                <p>Henüz kendi eklediğiniz bir tesbih bulunmuyor.</p>
                <button
                  type="button"
                  onClick={() => {
                    setEditingDhikr(null);
                    setModalOpen(true);
                  }}
                  className="min-h-[44px] inline-flex items-center gap-2 rounded-xl bg-[#06452F] px-4 text-sm font-medium text-[#FFF4D8] hover:bg-[#0B593D] transition-colors"
                >
                  <Plus className="w-4 h-4 text-[#E8C97A]" />
                  <span>Yeni Tesbih Ekle</span>
                </button>
              </div>
            ) : (
              'Aramanızla eşleşen bir zikir bulunamadı.'
            )}
          </div>
        ) : (
          filteredGroups.map((group) => (
            <section key={group.category} aria-labelledby={`cat-${group.category}`}>
              <div className="flex items-baseline justify-between mb-4">
                <h2
                  id={`cat-${group.category}`}
                  className="font-display text-2xl font-bold text-[#06452F] dark:text-[#FFF4D8]"
                >
                  {CATEGORY_TITLES[group.category]}
                </h2>
                <span className="text-xs text-[#546D62] dark:text-[#A9BFB4] tabular-nums">
                  {group.items.length} zikir
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {group.items.map((dhikr) => {
                  const count = getCountOnDate(dhikr.slug);
                  const target = getTarget(dhikr.slug);
                  const pct = calculateProgressPercent(count, target);
                  const isCustom = dhikr.category === 'custom';

                  return (
                    <article
                      key={dhikr.slug}
                      className="flex flex-col justify-between rounded-2xl border border-[#D6A83D]/35 bg-[#FFF9EB] dark:bg-[#0B261C] p-5"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="text-base font-semibold text-[#06452F] dark:text-[#FFF4D8]">
                            {dhikr.title}
                          </h3>
                          <span className="text-xs font-semibold text-[#B58724] dark:text-[#E8C97A] tabular-nums">
                            {count} / {target} (%{pct})
                          </span>
                        </div>

                        {dhikr.arabic && (
                          <p
                            className="mt-3 font-arabic arabic-md text-right text-[#06452F] dark:text-[#FFF4D8]"
                            dir="rtl"
                            lang="ar"
                          >
                            {dhikr.arabic}
                          </p>
                        )}

                        <p className="mt-2 text-sm font-medium text-[#1B3A2E] dark:text-[#E2ECE6] body-scaled">
                          {dhikr.transliteration}
                        </p>

                        {dhikr.meaning && (
                          <p className="mt-1.5 text-xs sm:text-sm text-[#4A6358] dark:text-[#A9BFB4] leading-relaxed">
                            <span className="font-medium text-[#06452F] dark:text-[#C5D8CE]">
                              Anlamı:{' '}
                            </span>
                            {dhikr.meaning}
                          </p>
                        )}

                        {dhikr.note && (
                          <p className="mt-1.5 text-xs italic text-[#546D62] dark:text-[#A9BFB4]">
                            {dhikr.note}
                          </p>
                        )}
                      </div>

                      <div className="mt-4 pt-3 border-t border-[#D6A83D]/20 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1">
                          {isCustom && (
                            <>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingDhikr(dhikr);
                                  setModalOpen(true);
                                }}
                                aria-label={`${dhikr.title} tesbihini düzenle`}
                                className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-lg text-[#4A6358] dark:text-[#A9BFB4] hover:bg-[#06452F]/10 dark:hover:bg-white/10 transition-colors"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingDhikr(dhikr)}
                                aria-label={`${dhikr.title} tesbihini sil`}
                                className="min-h-[38px] min-w-[38px] inline-flex items-center justify-center rounded-lg text-[#8A2E2E] dark:text-[#F09A9A] hover:bg-[#8A2E2E]/10 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => onOpenCounter(dhikr)}
                          className="min-h-[42px] inline-flex items-center gap-1.5 rounded-xl bg-[#06452F] px-4 py-2 text-xs font-medium text-[#FFF4D8] hover:bg-[#0B593D] transition-colors whitespace-nowrap"
                        >
                          <span>Sayaca Geç</span>
                          <ArrowRight className="w-3.5 h-3.5 text-[#E8C97A]" />
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </main>

      <CustomDhikrModal
        open={modalOpen}
        editingDhikr={editingDhikr}
        onClose={() => {
          setModalOpen(false);
          setEditingDhikr(null);
        }}
        onSubmit={saveCustomDhikr}
      />

      {deletingDhikr && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="list-delete-custom-title"
        >
          <div className="w-full max-w-sm rounded-2xl border border-[#D6A83D]/50 bg-[#FFF9EB] dark:bg-[#0B261C] p-6 text-[#0F271E] dark:text-[#F6EED9] shadow-2xl">
            <h2 id="list-delete-custom-title" className="font-display text-xl font-bold">
              Tesbihi Sil
            </h2>
            <p className="mt-2 text-sm text-[#4A6358] dark:text-[#C5D8CE] leading-relaxed">
              <strong>{deletingDhikr.title}</strong> tesbihini listenizden kaldırmak istediğinizden emin misiniz?
            </p>
            <div className="mt-6 flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeletingDhikr(null)}
                className="min-h-[44px] rounded-xl border border-[#D6A83D]/40 px-4 text-sm font-medium text-[#06452F] dark:text-[#FFF4D8] hover:bg-[#06452F]/5 dark:hover:bg-white/5"
              >
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteCustomDhikr(deletingDhikr.slug);
                  setDeletingDhikr(null);
                }}
                className="min-h-[44px] rounded-xl bg-[#9E2A2B] px-4 text-sm font-semibold text-white hover:bg-[#822223]"
              >
                Evet, Sil
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
