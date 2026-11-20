import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { DhikrDefinition } from '../data/dhikrs';
import type { CustomDhikrInput } from '../utils/dhikrLogic';

interface CustomDhikrModalProps {
  open: boolean;
  editingDhikr?: DhikrDefinition | null;
  onClose: () => void;
  onSubmit: (input: CustomDhikrInput, existingSlug?: string) => { ok: boolean; error?: string };
}

const TARGET_PRESETS = [33, 99, 100, 300, 1000];

export const CustomDhikrModal: React.FC<CustomDhikrModalProps> = ({
  open,
  editingDhikr,
  onClose,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [arabic, setArabic] = useState('');
  const [transliteration, setTransliteration] = useState('');
  const [meaning, setMeaning] = useState('');
  const [note, setNote] = useState('');
  const [defaultTarget, setDefaultTarget] = useState('100');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    if (editingDhikr) {
      setTitle(editingDhikr.title);
      setArabic(editingDhikr.arabic);
      setTransliteration(editingDhikr.transliteration);
      setMeaning(editingDhikr.meaning);
      setNote(editingDhikr.note ?? '');
      setDefaultTarget(String(editingDhikr.defaultTarget));
    } else {
      setTitle('');
      setArabic('');
      setTransliteration('');
      setMeaning('');
      setNote('');
      setDefaultTarget('100');
    }
    setError(null);
  }, [open, editingDhikr]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsedTarget = parseInt(defaultTarget, 10);
    const res = onSubmit(
      {
        title,
        arabic,
        transliteration,
        meaning,
        note,
        defaultTarget: Number.isNaN(parsedTarget) ? 0 : parsedTarget,
      },
      editingDhikr?.slug
    );
    if (!res.ok) {
      setError(res.error || 'Lütfen alanları kontrol edin.');
      return;
    }
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 p-3 sm:p-6 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="custom-dhikr-modal-title"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl border border-[#D6A83D]/55 bg-[#FFF9EB] dark:bg-[#0B261C] text-[#0F271E] dark:text-[#F6EED9] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-3 border-b border-[#D6A83D]/30 bg-[#06452F] px-5 py-4 text-[#FFF4D8]">
          <div>
            <h2
              id="custom-dhikr-modal-title"
              className="font-display text-xl sm:text-2xl font-bold"
            >
              {editingDhikr ? 'Tesbihi Düzenle' : 'Yeni Tesbih Ekle'}
            </h2>
            <p className="text-xs text-[#E8C97A]/90">
              Kendi özel zikrinizi veya duanızı sayaç listenize ekleyin
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Kapat"
            className="min-h-[42px] min-w-[42px] inline-flex items-center justify-center rounded-xl border border-[#D6A83D]/35 bg-[#0B593D] text-[#FFF4D8] hover:border-[#D6A83D] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4" noValidate>
          <div>
            <label
              htmlFor="custom-dhikr-title"
              className="block text-xs font-semibold text-[#06452F] dark:text-[#E8C97A] mb-1.5"
            >
              Tesbih / Zikir Adı *
            </label>
            <input
              id="custom-dhikr-title"
              type="text"
              maxLength={120}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Örn. Yâ Latîf veya Salât-ı Tefriciye"
              className="w-full min-h-[44px] rounded-xl border border-[#D6A83D]/50 bg-white dark:bg-[#071D15] px-3.5 text-sm text-[#06452F] dark:text-[#FFF4D8] focus:border-[#06452F] dark:focus:border-[#D6A83D] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="custom-dhikr-arabic"
              className="block text-xs font-semibold text-[#06452F] dark:text-[#E8C97A] mb-1.5"
            >
              Arapça Metin (İsteğe bağlı)
            </label>
            <textarea
              id="custom-dhikr-arabic"
              rows={2}
              dir="rtl"
              lang="ar"
              value={arabic}
              onChange={(e) => {
                setArabic(e.target.value);
                if (error) setError(null);
              }}
              placeholder="مثال: يَا لَطِيفُ"
              className="w-full rounded-xl border border-[#D6A83D]/50 bg-white dark:bg-[#071D15] px-3.5 py-2.5 font-arabic text-xl text-right text-[#06452F] dark:text-[#FFF4D8] focus:border-[#06452F] dark:focus:border-[#D6A83D] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="custom-dhikr-transliteration"
              className="block text-xs font-semibold text-[#06452F] dark:text-[#E8C97A] mb-1.5"
            >
              Türkçe Okunuş *
            </label>
            <textarea
              id="custom-dhikr-transliteration"
              rows={2}
              value={transliteration}
              onChange={(e) => {
                setTransliteration(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Örn. Yâ Latîf Celle Celâlühû"
              className="w-full rounded-xl border border-[#D6A83D]/50 bg-white dark:bg-[#071D15] px-3.5 py-2.5 text-sm text-[#06452F] dark:text-[#FFF4D8] focus:border-[#06452F] dark:focus:border-[#D6A83D] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="custom-dhikr-meaning"
              className="block text-xs font-semibold text-[#06452F] dark:text-[#E8C97A] mb-1.5"
            >
              Türkçe Anlamı (İsteğe bağlı)
            </label>
            <input
              id="custom-dhikr-meaning"
              type="text"
              value={meaning}
              onChange={(e) => setMeaning(e.target.value)}
              placeholder="Örn. Lütfu ve ihsanı bol olan Allah."
              className="w-full min-h-[44px] rounded-xl border border-[#D6A83D]/50 bg-white dark:bg-[#071D15] px-3.5 text-sm text-[#06452F] dark:text-[#FFF4D8] focus:border-[#06452F] dark:focus:border-[#D6A83D] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="custom-dhikr-note"
              className="block text-xs font-semibold text-[#06452F] dark:text-[#E8C97A] mb-1.5"
            >
              Kısa Not / Vakit (İsteğe bağlı)
            </label>
            <input
              id="custom-dhikr-note"
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Örn. Sabah namazı sonrası okunur."
              className="w-full min-h-[44px] rounded-xl border border-[#D6A83D]/50 bg-white dark:bg-[#071D15] px-3.5 text-sm text-[#06452F] dark:text-[#FFF4D8] focus:border-[#06452F] dark:focus:border-[#D6A83D] focus:outline-none"
            />
          </div>

          <div>
            <label
              htmlFor="custom-dhikr-target"
              className="block text-xs font-semibold text-[#06452F] dark:text-[#E8C97A] mb-1.5"
            >
              Günlük Hedef Tekrar Sayısı *
            </label>
            <div className="flex flex-wrap items-center gap-2">
              {TARGET_PRESETS.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => {
                    setDefaultTarget(String(preset));
                    if (error) setError(null);
                  }}
                  className={`min-h-[38px] px-3 rounded-lg border text-xs font-semibold tabular-nums transition-colors ${
                    defaultTarget === String(preset)
                      ? 'border-[#D6A83D] bg-[#06452F] text-[#FFF4D8]'
                      : 'border-[#D6A83D]/40 text-[#06452F] dark:text-[#C5D8CE] hover:border-[#D6A83D]'
                  }`}
                >
                  {preset}
                </button>
              ))}
              <input
                id="custom-dhikr-target"
                type="number"
                min={1}
                max={100000}
                value={defaultTarget}
                onChange={(e) => {
                  setDefaultTarget(e.target.value);
                  if (error) setError(null);
                }}
                className="w-24 min-h-[38px] rounded-lg border border-[#D6A83D]/55 bg-white dark:bg-[#071D15] px-3 text-sm font-semibold text-[#06452F] dark:text-[#FFF4D8] tabular-nums"
              />
            </div>
          </div>

          {error && (
            <p
              role="alert"
              className="rounded-xl border border-[#9E2A2B]/35 bg-[#9E2A2B]/10 px-3.5 py-2.5 text-xs font-medium text-[#9E2A2B] dark:text-[#F09A9A]"
            >
              {error}
            </p>
          )}

          <div className="pt-2 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="min-h-[44px] rounded-xl border border-[#D6A83D]/45 px-4 text-sm font-medium text-[#06452F] dark:text-[#FFF4D8] hover:bg-[#06452F]/5 dark:hover:bg-white/5 transition-colors"
            >
              Vazgeç
            </button>
            <button
              type="submit"
              className="min-h-[44px] rounded-xl bg-[#06452F] border border-[#D6A83D]/60 px-5 text-sm font-semibold text-[#FFF4D8] hover:bg-[#0B593D] transition-colors"
            >
              {editingDhikr ? 'Değişiklikleri Kaydet' : 'Tesbihi Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
