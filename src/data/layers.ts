export type LayerKey =
  | 'domedLid'
  | 'ppCup'
  | 'juiceCore'
  | 'fruitChunks'
  | 'iceInfusion'
  | 'baseGrip';

export interface LayerSpec {
  index: number;
  code: string;
  key: LayerKey;
  title: string;
  shortTitle: string;
  eyebrow: string;
  description: string;
  specLabel: string;
  specValue: string;
  align: 'left' | 'right';
  explodedFocusY: number;
}

export const BOTANICAL_LAYERS: LayerSpec[] = [
  {
    index: 0,
    code: '01',
    key: 'domedLid',
    title: 'Tutup Dome & Sedotan',
    shortTitle: 'Tutup Dome',
    eyebrow: 'Pengunci Aroma Buah',
    description:
      'Tutup PET bening kristal dengan bibir klik 95mm yang rapat dan sedotan hijau Brunswick miring—mengunci aroma buah segar sekaligus menjaga potongan buah & es tetap melimpah di puncak.',
    specLabel: 'MATERIAL / SEGEL',
    specValue: 'PET Bening Bebas BPA · Klik 95mm',
    align: 'left',
    explodedFocusY: 2.45,
  },
  {
    index: 1,
    code: '02',
    key: 'ppCup',
    title: 'Gelas PP Berembun Dingin',
    shortTitle: 'Gelas & Embun',
    eyebrow: 'Dingin Menggoda 4 °C',
    description:
      'Gelas PP food-grade bening sebening kaca yang langsung berkeringat begitu dituang jus 4 °C. Lebih dari 420 butir embun halus & tetesan air alami memeluk logo Tropisip hijau ikonik.',
    specLabel: 'DINDING / SUHU',
    specValue: 'Embun Dingin 4 °C · 420+ Butir Air',
    align: 'right',
    explodedFocusY: 1.0,
  },
  {
    index: 2,
    code: '03',
    key: 'juiceCore',
    title: 'Inti Jus Buah Peras Dingin',
    shortTitle: 'Inti Jus Asli',
    eyebrow: '100% Buah Asli, No Drama',
    description:
      'Bukan bubuk, bukan sirup perisa, nol pengawet! Cahaya matahari menembus serat daging buah asli yang kental segar, lengkap dengan busa buah alami di permukaan atasnya.',
    specLabel: 'KOMPOSISI',
    specValue: '100% Buah Segar · 0% Pengawet',
    align: 'left',
    explodedFocusY: 0.1,
  },
  {
    index: 3,
    code: '04',
    key: 'fruitChunks',
    title: 'Potongan Buah Segar Asli',
    shortTitle: 'Potongan Buah',
    eyebrow: 'Dipotong Tiap Pagi',
    description:
      'Bukan cuma buat foto! Dadu mangga Arumanis, potongan buah naga merah berbiji, atau irisan alpukat mentega ikut melayang di tiap gelas biar setiap sruputan punya sensasi kunyah yang jujur.',
    specLabel: 'POTONGAN',
    specValue: 'Dadu 14mm · Panen Segar Harian',
    align: 'right',
    explodedFocusY: 0.82,
  },
  {
    index: 4,
    code: '05',
    key: 'iceInfusion',
    title: 'Es Kristal, Mint & Biji Chia',
    shortTitle: 'Es, Mint & Chia',
    eyebrow: 'Kriuk Dingin Anti-Gerah',
    description:
      'Kristal es bening dingin yang bikin suara klak-klik ASMR saat digoyang, dipadu robekan daun mint kebun dan biji chia organik terhidrasi untuk sensasi sejuk yang nampol.',
    specLabel: 'INFUSI SEGAR',
    specValue: '28 Kristal Es · Daun Mint + Chia',
    align: 'left',
    explodedFocusY: -0.62,
  },
  {
    index: 5,
    code: '06',
    key: 'baseGrip',
    title: 'Dasar Gelas Berulir Bening',
    shortTitle: 'Dasar Gelas',
    eyebrow: 'Nyaman Digenggam Pas Gerah',
    description:
      'Kaki gelas PP bening dingin dengan 28 alur pegangan ergonomis tipis dan aksen cincin hijau Tropisip—kokoh di meja kerja, mantap digenggam tanpa licin meski gelas penuh embun.',
    specLabel: 'ERGONOMI',
    specValue: '28 Alur Bening · Stabil Anti-Selip',
    align: 'right',
    explodedFocusY: -1.9,
  },
];

/** O(1) lookup map for WebGL raycast telemetry (js-index-maps) */
export const LAYER_BY_KEY: ReadonlyMap<LayerKey, LayerSpec> = new Map(
  BOTANICAL_LAYERS.map((layer) => [layer.key, layer]),
);
