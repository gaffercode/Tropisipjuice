import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { FLAVORS, FLAVOR_ORDER, formatIdr, FUNNY_SLOGANS } from '../src/data/flavors';
import { BOTANICAL_LAYERS } from '../src/data/layers';
import {
  calculateReservationPricing,
  generateReservationCode,
  validateReservation,
  type ReservationDraft,
} from '../src/lib/reservation';
import { computeStageKinematics } from '../src/three/kinematics';

function collectFiles(dir: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      results.push(...collectFiles(full));
    } else {
      results.push(full);
    }
  }
  return results;
}

describe('Katalog 6 Produk Resmi Tropisip & Slogan Lucu', () => {
  it('memuat 6 menu resmi sesuai poster (Mangga, Alpukat, Buah Naga, Jambu, Semangka, Melon)', () => {
    expect(FLAVOR_ORDER).toEqual([
      'mango',
      'avocado',
      'dragonfruit',
      'guava',
      'watermelon',
      'melon',
    ]);
    expect(FLAVORS.mango.hex).toBe('#FFB800');
    expect(FLAVORS.dragonfruit.hex).toBe('#E83F5B');
    expect(FLAVORS.avocado.hex).toBe('#6B8E23');
    expect(FUNNY_SLOGANS.length).toBeGreaterThanOrEqual(4);
  });

  it('menerapkan harga resmi 16oz Rp 7.000 dan 22oz Rp 10.000 untuk semua 6 varian', () => {
    for (const id of FLAVOR_ORDER) {
      const f = FLAVORS[id];
      expect(f.sizes['16oz'].priceIdr).toBe(7000);
      expect(f.sizes['22oz'].priceIdr).toBe(10000);
      expect(f.sizes['22oz'].volumeMl).toBeGreaterThan(f.sizes['16oz'].volumeMl);
      expect(f.sizes['22oz'].cupScaleY).toBeGreaterThan(f.sizes['16oz'].cupScaleY);
      expect(f.pulpDensity).toBeGreaterThan(0);
      expect(f.pulpDensity).toBeLessThanOrEqual(1);
    }
    expect(formatIdr(7000)).toBe('Rp 7.000');
    expect(formatIdr(10000)).toBe('Rp 10.000');
  });
});

describe('Kinematika Ledakan 6 Lapisan Botanikal', () => {
  it('mendefinisikan tepat 6 lapisan gelas dalam Bahasa Indonesia', () => {
    expect(BOTANICAL_LAYERS).toHaveLength(6);
    expect(BOTANICAL_LAYERS.map((l) => l.key)).toEqual([
      'domedLid',
      'ppCup',
      'juiceCore',
      'fruitChunks',
      'iceInfusion',
      'baseGrip',
    ]);
  });

  it('menjaga gelas utuh di Hero, meledak rapi saat scroll tengah, dan menyatu kembali di Nutrisi/Order', () => {
    const hero = computeStageKinematics(0);
    expect(hero.explodeFactor).toBe(0);
    expect(hero.activeLayerIndex).toBe(-1);
    expect(hero.layers.domedLid.offsetY).toBe(0);
    expect(hero.layers.baseGrip.offsetY).toBe(0);

    const mid = computeStageKinematics(0.45);
    expect(mid.explodeFactor).toBe(1);
    expect(mid.activeLayerIndex).toBeGreaterThanOrEqual(0);
    expect(mid.activeLayerIndex).toBeLessThanOrEqual(5);
    expect(mid.layers.domedLid.offsetY).toBeGreaterThan(mid.layers.ppCup.offsetY);
    expect(mid.layers.ppCup.offsetY).toBeGreaterThan(mid.layers.juiceCore.offsetY);
    expect(mid.layers.juiceCore.offsetY).toBeGreaterThan(mid.layers.baseGrip.offsetY);

    const specs = computeStageKinematics(0.92);
    expect(specs.explodeFactor).toBe(0);
    expect(specs.activeLayerIndex).toBe(-1);
  });
});

describe('Kalkulator Pesan Cepat & Katering Acara', () => {
  const baseDraft: ReservationDraft = {
    mode: 'quick',
    customerName: 'Nadia Studio',
    contactEmail: 'nadia@contoh.id',
    eventOrPickupDate: '2026-12-01',
    fulfillment: 'delivery',
    size: '16oz',
    quantities: {
      mango: 2,
      avocado: 1,
      dragonfruit: 1,
      guava: 1,
      watermelon: 0,
      melon: 0,
    },
    iceLevel: 'regular',
    sweetness: 'natural',
    addChiaMint: true,
    notes: '',
  };

  it('menghitung subtotal 16oz (Rp 7.000/gelas) + topping chia/mint dengan tepat', () => {
    const pricing = calculateReservationPricing(baseDraft);
    // 5 gelas * 7000 = 35000; chia/mint 5 * 1500 = 7500 => 42500
    expect(pricing.totalCups).toBe(5);
    expect(pricing.rawSubtotalIdr).toBe(35000);
    expect(pricing.chiaMintAddonIdr).toBe(7500);
    expect(pricing.cateringDiscountIdr).toBe(0);
    expect(pricing.finalTotalIdr).toBe(42500);
    expect(pricing.includesChilledBarSetup).toBe(false);
  });

  it('menerapkan diskon katering 8% & gratis cooler bar untuk 50+ gelas', () => {
    const cateringDraft: ReservationDraft = {
      ...baseDraft,
      mode: 'catering',
      size: '22oz',
      quantities: {
        mango: 10,
        avocado: 10,
        dragonfruit: 10,
        guava: 8,
        watermelon: 6,
        melon: 6,
      },
      addChiaMint: false,
    };
    const pricing = calculateReservationPricing(cateringDraft);
    // 50 * 10000 = 500000; diskon 8% = 40000 => 460000
    expect(pricing.totalCups).toBe(50);
    expect(pricing.rawSubtotalIdr).toBe(500000);
    expect(pricing.cateringDiscountIdr).toBe(40000);
    expect(pricing.finalTotalIdr).toBe(460000);
    expect(pricing.includesChilledBarSetup).toBe(true);
  });

  it('memvalidasi form Bahasa Indonesia & menghasilkan kode TSIP deterministik', () => {
    expect(validateReservation(baseDraft).valid).toBe(true);

    const badCatering = validateReservation({
      ...baseDraft,
      mode: 'catering',
      customerName: 'A',
      contactEmail: 'salah-email',
      quantities: {
        mango: 5,
        avocado: 0,
        dragonfruit: 0,
        guava: 0,
        watermelon: 0,
        melon: 0,
      },
    });
    expect(badCatering.valid).toBe(false);
    expect(badCatering.errors.customerName).toContain('nama');
    expect(badCatering.errors.contactEmail).toContain('email');
    expect(badCatering.errors.quantities).toContain('25 gelas');

    const code1 = generateReservationCode(baseDraft);
    const code2 = generateReservationCode(baseDraft);
    expect(code1).toMatch(/^TSIP-[A-Z0-9]{6}$/);
    expect(code1).toBe(code2);
  });
});

describe('Audit 100% Prosedural, Nol Aset Eksternal & Nol PII', () => {
  it('bebas URL aset eksternal dan nomor telepon pribadi di index.html & src/', () => {
    const root = resolve(__dirname, '..');
    const files = [join(root, 'index.html'), ...collectFiles(join(root, 'src'))];

    // Allow W3C SVG namespace & explicit footer GitHub credit links; block all external runtime assets/CDNs
    const externalAssetPattern =
      /https?:\/\/(?!(?:www\.w3\.org\/2000\/svg|github\.com\/(?:drnovia|Sentra-Artificial-Intelligence)\b))/i;
    const phonePattern = /\+?62[\s-]?\d{3}[\s-]?\d{3,4}[\s-]?\d{3,4}/;

    for (const filePath of files) {
      const content = readFileSync(filePath, 'utf-8');
      expect(content, `Unexpected external URL in ${filePath}`).not.toMatch(externalAssetPattern);
      expect(content, `Unexpected phone number in ${filePath}`).not.toMatch(phonePattern);
    }

    const html = readFileSync(join(root, 'index.html'), 'utf-8');
    expect(html).toContain('lang="id"');
  });
});
