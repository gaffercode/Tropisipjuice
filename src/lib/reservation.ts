import { FLAVORS, FLAVOR_ORDER, type CupSizeId, type FlavorId } from '../data/flavors';

export type OrderMode = 'quick' | 'catering';
export type IceLevel = 'regular' | 'less' | 'extra';
export type SweetnessLevel = 'natural' | 'light-honey' | 'pure-zero-added';

export interface ReservationDraft {
  mode: OrderMode;
  customerName: string;
  contactEmail: string;
  eventOrPickupDate: string;
  fulfillment: 'pickup' | 'delivery';
  size: CupSizeId;
  quantities: Record<FlavorId, number>;
  iceLevel: IceLevel;
  sweetness: SweetnessLevel;
  addChiaMint: boolean;
  notes: string;
}

export interface ReservationPricing {
  totalCups: number;
  rawSubtotalIdr: number;
  chiaMintAddonIdr: number;
  cateringDiscountIdr: number;
  finalTotalIdr: number;
  includesChilledBarSetup: boolean;
}

export interface ValidationResult {
  valid: boolean;
  errors: Partial<Record<'customerName' | 'contactEmail' | 'eventOrPickupDate' | 'quantities', string>>;
}

export const CHIA_MINT_ADDON_PER_CUP_IDR = 1500;
export const CATERING_MIN_CUPS = 25;
export const CHILLED_BAR_THRESHOLD_CUPS = 50;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function calculateReservationPricing(draft: ReservationDraft): ReservationPricing {
  let totalCups = 0;
  let rawSubtotalIdr = 0;

  for (const id of FLAVOR_ORDER) {
    const qty = Math.max(0, Math.floor(draft.quantities[id] || 0));
    totalCups += qty;
    rawSubtotalIdr += qty * FLAVORS[id].sizes[draft.size].priceIdr;
  }

  const chiaMintAddonIdr = draft.addChiaMint ? totalCups * CHIA_MINT_ADDON_PER_CUP_IDR : 0;
  const preDiscount = rawSubtotalIdr + chiaMintAddonIdr;

  // Diskon katering 8% untuk 50+ gelas, 5% untuk 25-49 gelas
  let discountRate = 0;
  if (draft.mode === 'catering') {
    if (totalCups >= 50) {
      discountRate = 0.08;
    } else if (totalCups >= CATERING_MIN_CUPS) {
      discountRate = 0.05;
    }
  }

  const cateringDiscountIdr = Math.round(preDiscount * discountRate);
  const finalTotalIdr = preDiscount - cateringDiscountIdr;

  return {
    totalCups,
    rawSubtotalIdr,
    chiaMintAddonIdr,
    cateringDiscountIdr,
    finalTotalIdr,
    includesChilledBarSetup: draft.mode === 'catering' && totalCups >= CHILLED_BAR_THRESHOLD_CUPS,
  };
}

export function validateReservation(draft: ReservationDraft): ValidationResult {
  const errors: ValidationResult['errors'] = {};
  const pricing = calculateReservationPricing(draft);

  if (draft.customerName.trim().length < 2) {
    errors.customerName = 'Tulis nama pemesan atau nama kantor/komunitas dulu ya.';
  }

  if (!EMAIL_PATTERN.test(draft.contactEmail.trim())) {
    errors.contactEmail = 'Masukkan alamat email aktif untuk kirim ringkasan pesanan.';
  }

  if (!draft.eventOrPickupDate.trim()) {
    errors.eventOrPickupDate = 'Pilih tanggal ambil atau tanggal acara dulu ya.';
  }

  if (draft.mode === 'quick' && pricing.totalCups < 1) {
    errors.quantities = 'Tambahkan minimal 1 gelas jus favorit untuk pesan antar / ambil.';
  }

  if (draft.mode === 'catering' && pricing.totalCups < CATERING_MIN_CUPS) {
    errors.quantities = `Booking katering acara minimal ${CATERING_MIN_CUPS} gelas ya.`;
  }

  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

export function generateReservationCode(draft: ReservationDraft): string {
  const counts = FLAVOR_ORDER.map((id) => draft.quantities[id] || 0).join('-');
  const seed = `${draft.customerName}|${draft.eventOrPickupDate}|${draft.size}|${counts}`;
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const token = (hash >>> 0).toString(36).toUpperCase().padStart(6, '0').slice(0, 6);
  return `TSIP-${token}`;
}
