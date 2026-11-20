export type DhikrCategory = 'daily' | 'weekly' | 'additional' | 'special' | 'custom';

export interface DhikrDefinition {
  slug: string;
  category: DhikrCategory;
  weekday?: number; // 0 = Pazar, 1 = Pazartesi, ..., 6 = Cumartesi
  weekdayLabel?: string;
  title: string;
  arabic: string;
  transliteration: string;
  meaning: string;
  note?: string;
  defaultTarget: number;
  targetOptions?: number[];
  sortOrder: number;
}

export const WEEKDAY_NAMES_TR: Record<number, string> = {
  1: 'Pazartesi',
  2: 'Salı',
  3: 'Çarşamba',
  4: 'Perşembe',
  5: 'Cuma',
  6: 'Cumartesi',
  0: 'Pazar',
};

export const WEEKDAY_SHORT_TR: Record<number, string> = {
  1: 'Pzt',
  2: 'Sal',
  3: 'Çar',
  4: 'Per',
  5: 'Cum',
  6: 'Cmt',
  0: 'Paz',
};

// Pazartesi'den Pazar'a sıralama
export const WEEKDAY_ORDER: number[] = [1, 2, 3, 4, 5, 6, 0];

export const DHIKR_CATALOG: DhikrDefinition[] = [
  // BÖLÜM A: GÜNLÜK VİRDLERİM (Toplam hedef: 1.400)
  {
    slug: 'daily-istigfar',
    category: 'daily',
    title: 'İstiğfar',
    arabic: 'أَسْتَغْفِرُ اللّٰهَ الْعَظِيمَ',
    transliteration: 'Estağfirullah el-Azîm',
    meaning: 'Yüce Allah’tan bağışlanma dilerim.',
    defaultTarget: 100,
    targetOptions: [33, 100, 300],
    sortOrder: 1,
  },
  {
    slug: 'daily-tevhid',
    category: 'daily',
    title: 'Lâ ilâhe illallah',
    arabic: 'لَا إِلٰهَ إِلَّا اللّٰهُ',
    transliteration: 'Lâ ilâhe illallah',
    meaning: 'Allah’tan başka hiçbir ilâh yoktur.',
    defaultTarget: 100,
    targetOptions: [33, 100, 300],
    sortOrder: 2,
  },
  {
    slug: 'daily-salavat',
    category: 'daily',
    title: 'Salât-ı Şerife',
    arabic: 'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ',
    transliteration: 'Allahümme salli alâ Muhammed',
    meaning: 'Allah’ım! Efendimiz Muhammed’e (s.a.v.) salât ve rahmet eyle.',
    defaultTarget: 100,
    targetOptions: [33, 100, 300],
    sortOrder: 3,
  },
  {
    slug: 'daily-ihlas',
    category: 'daily',
    title: 'İhlâs-ı Şerif',
    arabic: 'قُلْ هُوَ اللّٰهُ أَحَدٌ',
    transliteration: 'Kul hüvallahü ehad',
    meaning: 'De ki: O Allah bir tektir.',
    defaultTarget: 100,
    targetOptions: [11, 33, 100],
    sortOrder: 4,
  },
  {
    slug: 'daily-allah',
    category: 'daily',
    title: 'Allah',
    arabic: 'اللّٰهُ',
    transliteration: 'Allah',
    meaning: 'Yüce Yaratıcı’nın Lafza-i Celâl ismi şerifi.',
    note: 'Hafifçe dilinle söyle.',
    defaultTarget: 1000,
    targetOptions: [100, 500, 1000],
    sortOrder: 5,
  },

  // BÖLÜM B: HAFTANIN GÜNLÜK TESBİHİ (Her gün 100 tekrar)
  {
    slug: 'weekly-pazartesi',
    category: 'weekly',
    weekday: 1,
    weekdayLabel: 'Pazartesi',
    title: 'Pazartesi Tesbihi',
    arabic: 'لَا إِلٰهَ إِلَّا اللّٰهُ عَزِيزٌ جَلِيلٌ يَا عَزِيزُ يَا جَلِيلُ',
    transliteration: 'Lâ ilâhe illallah Azîzün Celîl, yâ Azîzü yâ Celîl.',
    meaning:
      'Azîz ve Celîl olan Allah’tan başka ilâh yoktur. Ey mutlak izzet ve yücelik sahibi Allah’ım.',
    defaultTarget: 100,
    targetOptions: [33, 100],
    sortOrder: 11,
  },
  {
    slug: 'weekly-sali',
    category: 'weekly',
    weekday: 2,
    weekdayLabel: 'Salı',
    title: 'Salı Tesbihi',
    arabic:
      'اللَّهُمَّ صَلِّ عَلَى مُحَمَّدٍ وَعَلَى آلِ مُحَمَّدٍ وَسَلِّمْ تَسْلِيمًا كَثِيرًا',
    transliteration:
      'Allahümme salli alâ Muhammedin ve alâ âli Muhammedin ve sellim teslîmen kesîrâ.',
    meaning:
      'Allah’ım! Muhammed’e ve Muhammed’in âline salât eyle ve çokça selâm eyle.',
    defaultTarget: 100,
    targetOptions: [33, 100],
    sortOrder: 12,
  },
  {
    slug: 'weekly-carsamba',
    category: 'weekly',
    weekday: 3,
    weekdayLabel: 'Çarşamba',
    title: 'Çarşamba Tesbihi',
    arabic: 'لَا إِلٰهَ إِلَّا اللّٰهُ خَالِصًا مُخْلِصًا',
    transliteration: 'Lâ ilâhe illallah hâlisan muhlisâ.',
    meaning:
      'Samimiyetle ve yalnızca O’na yönelerek şehadet ederim ki Allah’tan başka ilâh yoktur.',
    defaultTarget: 100,
    targetOptions: [33, 100],
    sortOrder: 13,
  },
  {
    slug: 'weekly-persembe',
    category: 'weekly',
    weekday: 4,
    weekdayLabel: 'Perşembe',
    title: 'Perşembe Tesbihi',
    arabic:
      'لَا إِلٰهَ إِلَّا اللّٰهُ خَالِقُ كُلِّ شَيْءٍ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
    transliteration:
      "Lâ ilâhe illallah Hâliku külli şey'in ve hüve alâ külli şey'in kadîr.",
    meaning:
      'Her şeyin yaratıcısı olan Allah’tan başka ilâh yoktur ve O’nun her şeye gücü yeter.',
    defaultTarget: 100,
    targetOptions: [33, 100],
    sortOrder: 14,
  },
  {
    slug: 'weekly-cuma',
    category: 'weekly',
    weekday: 5,
    weekdayLabel: 'Cuma',
    title: 'Cuma Tesbihi',
    arabic:
      'سُبْحَانَ اللّٰهِ وَالْحَمْدُ لِلّٰهِ وَلَا إِلٰهَ إِلَّا اللّٰهُ وَاللّٰهُ أَكْبَرُ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰهِ الْعَلِيِّ الْعَظِيمِ',
    transliteration:
      'Sübhânallahi velhamdülillahi ve lâ ilâhe illallahu vallahu ekber ve lâ havle ve lâ kuvvete illâ billâhil aliyyil azîm.',
    meaning:
      'Allah her türlü noksanlıktan münezzehtir, hamd Allah’adır, Allah’tan başka ilâh yoktur, Allah en büyüktür; güç ve kuvvet ancak yüce ve büyük olan Allah’ındır.',
    defaultTarget: 100,
    targetOptions: [33, 100],
    sortOrder: 15,
  },
  {
    slug: 'weekly-cumartesi',
    category: 'weekly',
    weekday: 6,
    weekdayLabel: 'Cumartesi',
    title: 'Cumartesi Tesbihi',
    arabic: 'لَا إِلٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ',
    transliteration: 'Lâ ilâhe illâ ente sübhâneke innî küntü minez zâlimîn.',
    meaning:
      'Senden başka hiçbir ilâh yoktur. Seni bütün noksanlıklardan tenzih ederim. Şüphesiz ben nefsine zulmedenlerden oldum.',
    defaultTarget: 100,
    targetOptions: [33, 100],
    sortOrder: 16,
  },
  {
    slug: 'weekly-pazar',
    category: 'weekly',
    weekday: 0,
    weekdayLabel: 'Pazar',
    title: 'Pazar Tesbihi',
    arabic: 'لَا إِلٰهَ إِلَّا اللّٰهُ الْمَلِكُ الْحَقُّ الْمُبِينُ',
    transliteration: 'Lâ ilâhe illallahül Melikül Hakkul Mübin.',
    meaning:
      'Mülkün gerçek sahibi, hak ve apaçık olan Allah’tan başka ilâh yoktur.',
    defaultTarget: 100,
    targetOptions: [33, 100],
    sortOrder: 17,
  },

  // BÖLÜM C: GÜNLÜK VİRDLERE EK TESBİHLER (7 adet)
  {
    slug: 'additional-1-vahdehu',
    category: 'additional',
    title: '1. Tevhid-i Şerif',
    arabic:
      'لَا إِلٰهَ إِلَّا اللّٰهُ وَحْدَهُ لَا شَرِيكَ لَهُ، لَهُ الْمُلْكُ وَلَهُ الْحَمْدُ يُحْيِي وَيُمِيتُ وَهُوَ عَلَى كُلِّ شَيْءٍ قَدِيرٌ',
    transliteration:
      "Lâ ilâhe illallâhu vahdehû lâ şerîke leh, lehü'l-mülkü ve lehü'l-hamdü, yuhyî ve yumît ve hüve alâ külli şey'in kadîr.",
    meaning:
      'Allah’tan başka ilâh yoktur; O tektir, ortağı yoktur. Mülk O’nundur, hamd O’nadır. Dirilten ve öldüren O’dur; O’nun her şeye gücü yeter.',
    defaultTarget: 100,
    targetOptions: [10, 33, 100],
    sortOrder: 21,
  },
  {
    slug: 'additional-2-bakiyat',
    category: 'additional',
    title: '2. Bâkıyât-ı Sâlihât',
    arabic:
      'سُبْحَانَ اللّٰهِ وَالْحَمْدُ لِلّٰهِ وَلَا إِلٰهَ إِلَّا اللّٰهُ وَاللّٰهُ أَكْبَرُ وَلَا حَوْلَ وَلَا قُوَّةَ إِلَّا بِاللّٰهِ الْعَلِيِّ الْعَظِيمِ',
    transliteration:
      'Sübhânallahi velhamdülillahi ve lâ ilâhe illallahu vallahu ekber ve lâ havle ve lâ kuvvete illâ billâhil aliyyil azîm.',
    meaning:
      'Allah’ı tesbih ederim, hamd Allah’adır, Allah’tan başka ilâh yoktur, Allah en büyüktür; güç ve kuvvet ancak yüce ve büyük olan Allah’ındır.',
    defaultTarget: 100,
    targetOptions: [10, 33, 100],
    sortOrder: 22,
  },
  {
    slug: 'additional-3-tesbih-istigfar',
    category: 'additional',
    title: '3. Tesbih ve İstiğfar',
    arabic:
      'سُبْحَانَ اللّٰهِ وَبِحَمْدِهِ، سُبْحَانَ اللّٰهِ الْعَظِيمِ وَبِحَمْدِهِ أَسْتَغْفِرُ اللّٰهَ',
    transliteration:
      'Sübhânallahi ve bihamdihî, sübhânallâhil azîm ve bihamdihî estağfirullah.',
    meaning:
      'Allah’ı hamd ile tesbih ederim; yüce Allah’ı hamd ile tesbih eder ve O’ndan bağışlanma dilerim.',
    defaultTarget: 100,
    targetOptions: [10, 33, 100],
    sortOrder: 23,
  },
  {
    slug: 'additional-4-melikul-hak',
    category: 'additional',
    title: '4. Melikül Hakkul Mübin',
    arabic:
      'لَا إِلٰهَ إِلَّا اللّٰهُ الْمَلِكُ الْحَقُّ الْمُبِينُ، مُحَمَّدٌ رَسُولُ اللّٰهِ صَادِقُ الْوَعْدِ الْأَمِينُ',
    transliteration:
      "Lâ ilâhe illallâhul Melikül Hakkul Mübin, Muhammedün Resûlullah sâdikul va'dil emîn.",
    meaning:
      'Mülkün hakiki ve apaçık sahibi Allah’tan başka ilâh yoktur. Muhammed (s.a.v.) vaadinde sadık ve güvenilir Allah elçisidir.',
    defaultTarget: 100,
    targetOptions: [10, 33, 100],
    sortOrder: 24,
  },
  {
    slug: 'additional-5-rabbena-zalemna',
    category: 'additional',
    title: '5. Tevbe ve Mağfiret Duası',
    arabic:
      'رَبَّنَا ظَلَمْنَا أَنْفُسَنَا وَإِنْ لَمْ تَغْفِرْ لَنَا وَتَرْحَمْنَا لَنَكُونَنَّ مِنَ الْخَاسِرِينَ',
    transliteration:
      'Rabbenâ zalemnâ enfusenâ ve in lem tağfir lenâ ve terhamnâ le nekûnenne minel hâsirîn.',
    meaning:
      'Ey Rabbimiz! Biz kendimize zulmettik. Eğer bizi bağışlamaz ve bize merhamet etmezsen elbette ziyana uğrayanlardan oluruz.',
    note: '10 veya 100 tekrar olarak okunabilir.',
    defaultTarget: 10,
    targetOptions: [10, 100],
    sortOrder: 25,
  },
  {
    slug: 'additional-6-yunus-duasi',
    category: 'additional',
    title: '6. Hz. Yûnus (a.s.) Tesbihi',
    arabic: 'لَا إِلٰهَ إِلَّا أَنْتَ سُبْحَانَكَ إِنِّي كُنْتُ مِنَ الظَّالِمِينَ',
    transliteration: 'Lâ ilâhe illâ ente sübhâneke innî küntü minez zâlimîn.',
    meaning:
      'Senden başka ilâh yoktur. Seni her türlü eksiklikten tenzih ederim. Şüphesiz ben zulmedenlerden oldum.',
    note: '10 veya 100 tekrar olarak okunabilir.',
    defaultTarget: 10,
    targetOptions: [10, 100],
    sortOrder: 26,
  },
  {
    slug: 'additional-7-rabbena-la-tuzig',
    category: 'additional',
    title: '7. Hidayet ve Sebat Duası',
    arabic:
      'رَبَّنَا لَا تُزِغْ قُلُوبَنَا بَعْدَ إِذْ هَدَيْتَنَا وَهَبْ لَنَا مِنْ لَدُنْكَ رَحْمَةً إِنَّكَ أَنْتَ الْوَهَّابُ',
    transliteration:
      "Rabbenâ lâ tüziğ kulûbenâ ba'de iz hedeytenâ ve heb lenâ min ledünke rahmeh inneke entel vehhâb.",
    meaning:
      'Ey Rabbimiz! Bizi hidayete erdirdikten sonra kalplerimizi eğriltme ve bize katından bir rahmet bağışla. Şüphesiz sen çok bağışlayansın.',
    defaultTarget: 10,
    targetOptions: [10, 33, 100],
    sortOrder: 27,
  },

  // BÖLÜM D: ÖZEL ZİKİR
  {
    slug: 'special-subhanallah-bihamdihi',
    category: 'special',
    title: 'Sübhânallahi ve Bihamdihî',
    arabic: 'سُبْحَانَ اللّٰهِ وَبِحَمْدِهِ سُبْحَانَ اللّٰهِ الْعَظِيمِ',
    transliteration: 'Sübhânallahi ve bihamdihî, sübhânallâhil azîm.',
    meaning:
      'Allah’ı hamd ile tesbih ederim; yüce Allah’ı bütün noksanlıklardan tenzih ederim.',
    note: 'Dilde hafif, mizanda ağır, Rahmân’a sevgili iki kelime.',
    defaultTarget: 100,
    targetOptions: [33, 100, 300],
    sortOrder: 31,
  },
];

export const DAILY_DHIKRS = DHIKR_CATALOG.filter((d) => d.category === 'daily');
export const WEEKLY_DHIKRS = DHIKR_CATALOG.filter((d) => d.category === 'weekly');
export const ADDITIONAL_DHIKRS = DHIKR_CATALOG.filter((d) => d.category === 'additional');
export const SPECIAL_DHIKRS = DHIKR_CATALOG.filter((d) => d.category === 'special');

export function getDhikrBySlug(slug: string): DhikrDefinition | undefined {
  return DHIKR_CATALOG.find((d) => d.slug === slug);
}

export function getWeeklyDhikrByWeekday(weekday: number): DhikrDefinition {
  return (
    WEEKLY_DHIKRS.find((d) => d.weekday === weekday) ?? WEEKLY_DHIKRS[0]
  );
}
