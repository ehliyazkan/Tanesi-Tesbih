import React, { useState } from 'react';
import { ZoomIn, ZoomOut, X, ArrowRight } from 'lucide-react';
import { ADDITIONAL_DHIKRS, type DhikrDefinition } from '../data/dhikrs';

interface TesbihPosterModalProps {
  open: boolean;
  onClose: () => void;
  onSelectDhikr: (dhikr: DhikrDefinition) => void;
}

const PARCHMENT_IMAGE = '/src/assets/images/tesbih_parchment_sheet_1795165289930.jpg';

export const TesbihPosterModal: React.FC<TesbihPosterModalProps> = ({
  open,
  onClose,
  onSelectDhikr,
}) => {
  const [zoomed, setZoomed] = useState(false);
  const [imgError, setImgError] = useState(false);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-6 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="poster-modal-title"
      onClick={onClose}
    >
      <div
        className="relative flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#D6A83D]/50 bg-[#06452F] shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Üst kontrol çubuğu */}
        <div className="flex items-center justify-between gap-4 border-b border-[#D6A83D]/30 px-4 py-3 text-[#FFF4D8]">
          <div className="min-w-0">
            <h2
              id="poster-modal-title"
              className="font-display text-lg sm:text-xl font-semibold tracking-wide truncate"
            >
              Günlük Virdlere Ek Tesbihler Levhası
            </h2>
            <p className="text-xs text-[#FFF4D8]/75">
              Tezhipli orijinal tesbih görseli ve tam metin listesi
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setZoomed((z) => !z)}
              aria-label={zoomed ? 'Uzaklaştır' : 'Yakınlaştır'}
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-[#D6A83D]/35 bg-[#0B593D] text-[#FFF4D8] hover:border-[#D6A83D] transition-colors"
            >
              {zoomed ? <ZoomOut className="w-5 h-5" /> : <ZoomIn className="w-5 h-5" />}
            </button>
            <button
              type="button"
              onClick={onClose}
              aria-label="Görseli kapat"
              className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-xl border border-[#D6A83D]/35 bg-[#0B593D] text-[#FFF4D8] hover:border-[#D6A83D] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Kaydırılabilir Tezhipli Levha Alanı */}
        <div className="overflow-y-auto p-3 sm:p-6 bg-[#042F20]">
          <div
            className={`relative mx-auto transition-transform duration-200 origin-top ${
              zoomed ? 'max-w-none w-[125%] sm:w-full scale-[1.03]' : 'max-w-2xl'
            }`}
          >
            <div className="relative overflow-hidden rounded-xl border-2 border-[#D6A83D]/70 bg-[#FFF4D8] shadow-2xl">
              {!imgError && (
                <img
                  src={PARCHMENT_IMAGE}
                  alt="Osmanlı tezhip çerçeveli parşömen tesbih levhası"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
                  className="pointer-events-none absolute inset-0 h-full w-full object-cover scale-[1.06] opacity-95"
                />
              )}
              {/* İç parşömen çerçeve — Arapça & Türkçe hat metinleri okunaklı ve kusursuz */}
              <div className="relative z-10 m-6 sm:m-12 md:m-14 rounded-lg border border-[#D6A83D]/60 bg-[#FFF6DF]/94 px-4 py-6 sm:px-8 sm:py-8 text-[#0F271E] shadow-inner">
                <div className="text-center pb-4 border-b border-[#D6A83D]/40">
                  <p className="font-arabic text-xl sm:text-2xl text-[#06452F]" dir="rtl" lang="ar">
                    بِسْمِ اللّٰهِ الرَّحْمٰنِ الرَّحِيمِ
                  </p>
                  <h3 className="mt-1 font-display text-xl sm:text-2xl font-bold text-[#06452F]">
                    Günlük Virdlere İlave Tesbihler
                  </h3>
                </div>

                <ol className="mt-5 space-y-4">
                  {ADDITIONAL_DHIKRS.map((item, idx) => (
                    <li
                      key={item.slug}
                      className="pb-4 border-b border-[#D6A83D]/25 last:border-b-0 last:pb-0"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <span className="font-display text-lg font-bold text-[#B58724] shrink-0 tabular-nums">
                          {idx + 1}.
                        </span>
                        <div className="flex-1 min-w-0">
                          <p
                            className="font-arabic text-right text-lg sm:text-xl text-[#06452F]"
                            dir="rtl"
                            lang="ar"
                          >
                            {item.arabic}
                          </p>
                          <p className="mt-1 text-sm leading-relaxed text-[#1B3A2E]">
                            {item.transliteration}
                          </p>
                          <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-[#546D62]">
                            <span className="font-semibold text-[#06452F] tabular-nums">
                              Tavsiye edilen tekrar:{' '}
                              {item.slug === 'additional-5-rabbena-zalemna' ||
                              item.slug === 'additional-6-yunus-duasi'
                                ? '10 veya 100'
                                : item.defaultTarget}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onSelectDhikr(item);
                              }}
                              className="inline-flex items-center gap-1 font-semibold text-[#06452F] hover:text-[#B58724] transition-colors whitespace-nowrap"
                            >
                              <span>Sayaca Geç</span>
                              <ArrowRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
