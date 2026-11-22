export type FlavorId =
  | 'mango'
  | 'avocado'
  | 'dragonfruit'
  | 'guava'
  | 'watermelon'
  | 'melon';

export type CupSizeId = '16oz' | '22oz';

export interface SizeMetrics {
  id: CupSizeId;
  label: string;
  volumeMl: number;
  priceIdr: number;
  fruitMassGrams: number;
  calories: number;
  vitaminCPct: number;
  fiberGrams: number;
  potassiumMg: number;
  cupScaleY: number;
  cupScaleXZ: number;
}

export interface FlavorSpec {
  id: FlavorId;
  name: string;
  indonesianName: string;
  tagline: string;
  funnyHook: string;
  cultivar: string;
  origin: string;
  tastingNotes: string;
  hex: string;
  brightHex: string;
  deepHex: string;
  sssHex: string;
  pulpHex: string;
  foamHex: string;
  accentSoftBg: string;
  accentStrongBg: string;
  inkOnAccent: string;
  pulpDensity: number;
  pulpLabel: string;
  sssIntensity: number;
  sssLabel: string;
  /** Cacao wall drizzle intensity (signature Jus Alpukat) */
  swirlStrength: number;
  /** Fine micro-seed density (Buah Naga / Semangka / Jambu) */
  seedDensity: number;
  /** Fibrous fruit pulp grain */
  fiberLength: number;
  brix: number;
  chunkLabel: string;
  macroFocusNote: string;
  sizes: Record<CupSizeId, SizeMetrics>;
}

export const FUNNY_SLOGANS: string[] = [
  '100% Buah Asli, 0% Drama Mantan',
  'Tropisip: Sruput, Senyum, Repeat!',
  'Mantan Boleh Lewat, Tropisip Jangan Terlewat!',
  'Harga Rp 7.000-an, Mood Auto Jutawan!',
];

export const FLAVORS: Record<FlavorId, FlavorSpec> = {
  mango: {
    id: 'mango',
    name: 'Mangga',
    indonesianName: 'Jus Mangga',
    tagline:
      'Manisnya bikin lupa chat nggak dibales — 100% mangga Arumanis matang pohon, tanpa pemanis palsu!',
    funnyHook: 'Mantan Boleh Lewat, Tropisip Jangan Terlewat!',
    cultivar: 'Mangga Arumanis & Gedong Gincu',
    origin: 'Kebun Probolinggo & Cirebon',
    tastingNotes: 'Nektar madu cerah, wangi tropis meledak, serat mangga lembut super juicy',
    hex: '#FFB800',
    brightHex: '#FFCD1A',
    deepHex: '#EA8600',
    sssHex: '#FFE566',
    pulpHex: '#E67A00',
    foamHex: '#FFE680',
    accentSoftBg: 'rgba(255, 184, 0, 0.34)',
    accentStrongBg: 'rgba(255, 146, 0, 0.24)',
    inkOnAccent: '#07311B',
    pulpDensity: 0.78,
    pulpLabel: '78% Nektar Berserat',
    sssIntensity: 0.9,
    sssLabel: 'Kilau Emas Tropis',
    swirlStrength: 0.0,
    seedDensity: 0.0,
    fiberLength: 0.94,
    brix: 15.8,
    chunkLabel: 'Dadu mangga Arumanis matang pohon',
    macroFocusNote: 'Serat daging mangga emas berkilau di balik embun halus gelas 4 °C.',
    sizes: {
      '16oz': {
        id: '16oz',
        label: '16 oz · Reguler',
        volumeMl: 473,
        priceIdr: 7000,
        fruitMassGrams: 265,
        calories: 168,
        vitaminCPct: 112,
        fiberGrams: 4.4,
        potassiumMg: 420,
        cupScaleY: 1.0,
        cupScaleXZ: 1.0,
      },
      '22oz': {
        id: '22oz',
        label: '22 oz · Jumbo',
        volumeMl: 650,
        priceIdr: 10000,
        fruitMassGrams: 365,
        calories: 230,
        vitaminCPct: 154,
        fiberGrams: 6.1,
        potassiumMg: 575,
        cupScaleY: 1.11,
        cupScaleXZ: 1.03,
      },
    },
  },
  avocado: {
    id: 'avocado',
    name: 'Alpukat',
    indonesianName: 'Jus Alpukat',
    tagline:
      'Kentalnya se-creamy pelukan akhir pekan — alpukat mentega asli plus lelehan cokelat di dinding gelas!',
    funnyHook: 'Kenyang elegan, fokus kerja balik tanpa bikin kantong bolong!',
    cultivar: 'Alpukat Mentega Dataran Tinggi',
    origin: 'Kebun Malang & Garut',
    tastingNotes: 'Gurih mentega super lembut, segar hijau cerah, swirl cokelat khas Indonesia',
    hex: '#6B8E23',
    brightHex: '#B6D957',
    deepHex: '#7EA62B',
    sssHex: '#D8EE89',
    pulpHex: '#43200C',
    foamHex: '#E0F2A2',
    accentSoftBg: 'rgba(154, 206, 52, 0.34)',
    accentStrongBg: 'rgba(107, 142, 35, 0.24)',
    inkOnAccent: '#FAF6ED',
    pulpDensity: 0.94,
    pulpLabel: '94% Kental Mentega',
    sssIntensity: 0.68,
    sssLabel: 'Creamy Hijau Mentega',
    swirlStrength: 0.96,
    seedDensity: 0.0,
    fiberLength: 0.36,
    brix: 11.2,
    chunkLabel: 'Irisan alpukat mentega dataran tinggi',
    macroFocusNote: 'Tekstur creamy alpukat mentega & lelehan cokelat menempel di dinding PP dingin.',
    sizes: {
      '16oz': {
        id: '16oz',
        label: '16 oz · Reguler',
        volumeMl: 473,
        priceIdr: 7000,
        fruitMassGrams: 250,
        calories: 248,
        vitaminCPct: 42,
        fiberGrams: 8.6,
        potassiumMg: 710,
        cupScaleY: 1.0,
        cupScaleXZ: 1.0,
      },
      '22oz': {
        id: '22oz',
        label: '22 oz · Jumbo',
        volumeMl: 650,
        priceIdr: 10000,
        fruitMassGrams: 345,
        calories: 340,
        vitaminCPct: 58,
        fiberGrams: 11.8,
        potassiumMg: 975,
        cupScaleY: 1.11,
        cupScaleXZ: 1.03,
      },
    },
  },
  dragonfruit: {
    id: 'dragonfruit',
    name: 'Buah Naga',
    indonesianName: 'Jus Buah Naga',
    tagline:
      'Merahnya seberani nge-chat duluan! Buah naga merah segar kaya antioksidan, sruput langsung ngejreng.',
    funnyHook: 'Warna ngejreng alami dari buah, bukan pewarna sinetron!',
    cultivar: 'Buah Naga Merah Banyuwangi',
    origin: 'Kebun Sinar Matahari Banyuwangi',
    tastingNotes: 'Segar manis berry-tropis, magenta pekat berkilau, kriuk biji mikro renyah',
    hex: '#E83F5B',
    brightHex: '#E50B6B',
    deepHex: '#9E0548',
    sssHex: '#FF4B94',
    pulpHex: '#18050D',
    foamHex: '#FF7EB3',
    accentSoftBg: 'rgba(232, 20, 108, 0.30)',
    accentStrongBg: 'rgba(232, 63, 91, 0.24)',
    inkOnAccent: '#FAF6ED',
    pulpDensity: 0.84,
    pulpLabel: '84% Magenta Kaya Biji',
    sssIntensity: 0.84,
    sssLabel: 'Tembus Cahaya Magenta',
    swirlStrength: 0.0,
    seedDensity: 0.96,
    fiberLength: 0.35,
    brix: 13.4,
    chunkLabel: 'Potongan buah naga merah berbiji renyah',
    macroFocusNote: 'Biji hitam buah naga asli memantulkan cahaya magenta di balik embun dingin.',
    sizes: {
      '16oz': {
        id: '16oz',
        label: '16 oz · Reguler',
        volumeMl: 473,
        priceIdr: 7000,
        fruitMassGrams: 280,
        calories: 146,
        vitaminCPct: 88,
        fiberGrams: 6.8,
        potassiumMg: 490,
        cupScaleY: 1.0,
        cupScaleXZ: 1.0,
      },
      '22oz': {
        id: '22oz',
        label: '22 oz · Jumbo',
        volumeMl: 650,
        priceIdr: 10000,
        fruitMassGrams: 385,
        calories: 201,
        vitaminCPct: 121,
        fiberGrams: 9.3,
        potassiumMg: 672,
        cupScaleY: 1.11,
        cupScaleXZ: 1.03,
      },
    },
  },
  guava: {
    id: 'guava',
    name: 'Jambu',
    indonesianName: 'Jus Jambu',
    tagline:
      'Jambu biji merah kental manis legit — penyelamat imun pas cuaca lagi labil kayak mood bos.',
    funnyHook: 'Vitamin C-nya melimpah, flu minggir, semangat kerja langsung gas!',
    cultivar: 'Jambu Biji Merah Getas',
    origin: 'Kebun Kendal & Sukabumi',
    tastingNotes: 'Harum jambu merah klasik, tekstur kental lembut, manis segar menenangkan',
    hex: '#F07A7E',
    brightHex: '#F99396',
    deepHex: '#D1565C',
    sssHex: '#FFB6B8',
    pulpHex: '#C85058',
    foamHex: '#FFC7C9',
    accentSoftBg: 'rgba(240, 122, 126, 0.34)',
    accentStrongBg: 'rgba(232, 102, 108, 0.24)',
    inkOnAccent: '#07311B',
    pulpDensity: 0.88,
    pulpLabel: '88% Kental Jambu Merah',
    sssIntensity: 0.78,
    sssLabel: 'Kilau Coral Lembut',
    swirlStrength: 0.0,
    seedDensity: 0.12,
    fiberLength: 0.72,
    brix: 12.6,
    chunkLabel: 'Potongan jambu biji merah harum',
    macroFocusNote: 'Butiran lembut daging jambu merah merata dengan kilau coral dingin.',
    sizes: {
      '16oz': {
        id: '16oz',
        label: '16 oz · Reguler',
        volumeMl: 473,
        priceIdr: 7000,
        fruitMassGrams: 260,
        calories: 158,
        vitaminCPct: 210,
        fiberGrams: 7.4,
        potassiumMg: 520,
        cupScaleY: 1.0,
        cupScaleXZ: 1.0,
      },
      '22oz': {
        id: '22oz',
        label: '22 oz · Jumbo',
        volumeMl: 650,
        priceIdr: 10000,
        fruitMassGrams: 358,
        calories: 216,
        vitaminCPct: 288,
        fiberGrams: 10.2,
        potassiumMg: 715,
        cupScaleY: 1.11,
        cupScaleXZ: 1.03,
      },
    },
  },
  watermelon: {
    id: 'watermelon',
    name: 'Semangka',
    indonesianName: 'Jus Semangka',
    tagline:
      'Gerah level matahari pindah depan rumah? Sruput semangka merah kristal ini — langsung adem sak-detik!',
    funnyHook: 'Hidrasi instan anti-keringat, ringannya bikin pengen nambah dua gelas!',
    cultivar: 'Semangka Merah Non-Biji',
    origin: 'Kebun Indramayu & Lampung',
    tastingNotes: 'Super berair, manis renyah ringan, sensasi es kristal ekstra menyegarkan',
    hex: '#EB3B3B',
    brightHex: '#FF4747',
    deepHex: '#B81C22',
    sssHex: '#FF7C75',
    pulpHex: '#9C1418',
    foamHex: '#FFA19C',
    accentSoftBg: 'rgba(235, 59, 59, 0.30)',
    accentStrongBg: 'rgba(255, 71, 71, 0.22)',
    inkOnAccent: '#FAF6ED',
    pulpDensity: 0.62,
    pulpLabel: '62% Kristal Berair',
    sssIntensity: 0.95,
    sssLabel: 'Tembus Cahaya Merah',
    swirlStrength: 0.0,
    seedDensity: 0.08,
    fiberLength: 0.45,
    brix: 11.8,
    chunkLabel: 'Potongan segitiga semangka merah renyah',
    macroFocusNote: 'Serat berair semangka merah tembus cahaya menyatu dengan es serut.',
    sizes: {
      '16oz': {
        id: '16oz',
        label: '16 oz · Reguler',
        volumeMl: 473,
        priceIdr: 7000,
        fruitMassGrams: 310,
        calories: 108,
        vitaminCPct: 56,
        fiberGrams: 2.1,
        potassiumMg: 360,
        cupScaleY: 1.0,
        cupScaleXZ: 1.0,
      },
      '22oz': {
        id: '22oz',
        label: '22 oz · Jumbo',
        volumeMl: 650,
        priceIdr: 10000,
        fruitMassGrams: 425,
        calories: 148,
        vitaminCPct: 77,
        fiberGrams: 2.9,
        potassiumMg: 495,
        cupScaleY: 1.11,
        cupScaleXZ: 1.03,
      },
    },
  },
  melon: {
    id: 'melon',
    name: 'Melon',
    indonesianName: 'Jus Melon',
    tagline:
      'Ademnya kayak AC 16 derajat pas listrik nggak mati — melon hijau harum segar bikin pikiran jernih!',
    funnyHook: 'Rasa kalem tapi nagih, cocok banget nemenin deadline sampai tuntas!',
    cultivar: 'Melon Hijau Sky Rocket',
    origin: 'Kebun Ngawi & Kulon Progo',
    tastingNotes: 'Harum melon segar, manis bersih super adem, tekstur halus menyejukkan',
    hex: '#9ED148',
    brightHex: '#BCE660',
    deepHex: '#73A624',
    sssHex: '#DEFA96',
    pulpHex: '#6A9C22',
    foamHex: '#E8FCB2',
    accentSoftBg: 'rgba(158, 209, 72, 0.34)',
    accentStrongBg: 'rgba(138, 198, 48, 0.24)',
    inkOnAccent: '#07311B',
    pulpDensity: 0.72,
    pulpLabel: '72% Segar Berair Halus',
    sssIntensity: 0.88,
    sssLabel: 'Kilau Hijau Melon',
    swirlStrength: 0.0,
    seedDensity: 0.0,
    fiberLength: 0.54,
    brix: 13.0,
    chunkLabel: 'Dadu melon hijau Sky Rocket renyah',
    macroFocusNote: 'Tekstur halus melon hijau berkilau embun dingin 4 °C yang super segar.',
    sizes: {
      '16oz': {
        id: '16oz',
        label: '16 oz · Reguler',
        volumeMl: 473,
        priceIdr: 7000,
        fruitMassGrams: 295,
        calories: 124,
        vitaminCPct: 74,
        fiberGrams: 3.2,
        potassiumMg: 485,
        cupScaleY: 1.0,
        cupScaleXZ: 1.0,
      },
      '22oz': {
        id: '22oz',
        label: '22 oz · Jumbo',
        volumeMl: 650,
        priceIdr: 10000,
        fruitMassGrams: 405,
        calories: 170,
        vitaminCPct: 102,
        fiberGrams: 4.4,
        potassiumMg: 665,
        cupScaleY: 1.11,
        cupScaleXZ: 1.03,
      },
    },
  },
};

export const FLAVOR_ORDER: FlavorId[] = [
  'mango',
  'avocado',
  'dragonfruit',
  'guava',
  'watermelon',
  'melon',
];

export function formatIdr(amount: number): string {
  const rounded = Math.round(amount);
  const formatted = rounded.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `Rp ${formatted}`;
}
