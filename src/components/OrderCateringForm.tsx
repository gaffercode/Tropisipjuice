import React, { memo, useState } from 'react';
import {
  FLAVORS,
  FLAVOR_ORDER,
  formatIdr,
  type CupSizeId,
  type FlavorId,
} from '../data/flavors';
import {
  calculateReservationPricing,
  CATERING_MIN_CUPS,
  CHIA_MINT_ADDON_PER_CUP_IDR,
  CHILLED_BAR_THRESHOLD_CUPS,
  generateReservationCode,
  validateReservation,
  type IceLevel,
  type OrderMode,
  type ReservationDraft,
  type SweetnessLevel,
} from '../lib/reservation';

interface OrderCateringFormProps {
  activeFlavor: FlavorId;
  activeSize: CupSizeId;
  onSelectFlavor: (flavorId: FlavorId) => void;
  onSelectSize: (sizeId: CupSizeId) => void;
}

const CUP_SIZES: readonly CupSizeId[] = ['16oz', '22oz'];

const DEFAULT_QUICK_QTY: Record<FlavorId, number> = {
  mango: 2,
  avocado: 1,
  dragonfruit: 1,
  guava: 0,
  watermelon: 0,
  melon: 0,
};

const DEFAULT_CATERING_QTY: Record<FlavorId, number> = {
  mango: 8,
  avocado: 6,
  dragonfruit: 6,
  guava: 4,
  watermelon: 3,
  melon: 3,
};

function getDefaultDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString().slice(0, 10);
}

export const OrderCateringForm: React.FC<OrderCateringFormProps> = memo(
  ({ activeFlavor, activeSize, onSelectFlavor, onSelectSize }) => {
    const [mode, setMode] = useState<OrderMode>('quick');
    const [customerName, setCustomerName] = useState('');
    const [contactEmail, setContactEmail] = useState('');
    const [eventOrPickupDate, setEventOrPickupDate] = useState(getDefaultDateString);
    const [fulfillment, setFulfillment] = useState<'pickup' | 'delivery'>('delivery');
    const [quantities, setQuantities] = useState<Record<FlavorId, number>>(DEFAULT_QUICK_QTY);
    const [iceLevel, setIceLevel] = useState<IceLevel>('regular');
    const [sweetness, setSweetness] = useState<SweetnessLevel>('natural');
    const [addChiaMint, setAddChiaMint] = useState(false);
    const [notes, setNotes] = useState('');
    const [submittedCode, setSubmittedCode] = useState<string | null>(null);
    const [showErrors, setShowErrors] = useState(false);

    // Derive pricing & validation directly during render (rerender-derived-state-no-effect)
    const draft: ReservationDraft = {
      mode,
      customerName,
      contactEmail,
      eventOrPickupDate,
      fulfillment,
      size: activeSize,
      quantities,
      iceLevel,
      sweetness,
      addChiaMint,
      notes,
    };
    const pricing = calculateReservationPricing(draft);
    const validation = validateReservation(draft);
    const flavor = FLAVORS[activeFlavor];

    const handleModeSwitch = (nextMode: OrderMode) => {
      setMode(nextMode);
      setSubmittedCode(null);
      setShowErrors(false);
      if (nextMode === 'catering' && pricing.totalCups < CATERING_MIN_CUPS) {
        setQuantities(DEFAULT_CATERING_QTY);
      } else if (nextMode === 'quick' && pricing.totalCups >= CATERING_MIN_CUPS) {
        setQuantities(DEFAULT_QUICK_QTY);
      }
    };

    const adjustQuantity = (id: FlavorId, delta: number) => {
      onSelectFlavor(id);
      setSubmittedCode(null);
      setQuantities((prev) => ({
        ...prev,
        [id]: Math.max(0, Math.min(300, (prev[id] || 0) + delta)),
      }));
    };

    const handleSubmit = (event: React.FormEvent) => {
      event.preventDefault();
      setShowErrors(true);
      if (!validation.valid) {
        return;
      }
      setSubmittedCode(generateReservationCode(draft));
    };

    return (
      <section id="order" className="editorial-section order-section" aria-labelledby="order-heading">
        <div className="order-layout">
          <div className="order-spacer" aria-hidden="true" />

          <div className="frosted-panel order-panel">
            <div className="panel-header-row">
              <div>
                <span
                  className="eyebrow-badge mono-label"
                  style={{ backgroundColor: flavor.hex, color: flavor.inkOnAccent }}
                >
                  MENERIMA PESAN ANTAR · SEGAR SAMPAI TEMPATMU!
                </span>
                <h2 id="order-heading" className="section-title">
                  Pesan Cepat &amp; Katering Acara
                </h2>
              </div>

              <div className="mode-segmented" role="tablist" aria-label="Mode Pemesanan">
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'quick'}
                  className={`mode-tab-btn ${mode === 'quick' ? 'is-active' : ''}`}
                  onClick={() => handleModeSwitch('quick')}
                >
                  Pesan Satuan
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={mode === 'catering'}
                  className={`mode-tab-btn ${mode === 'catering' ? 'is-active' : ''}`}
                  onClick={() => handleModeSwitch('catering')}
                >
                  Katering Acara (25+)
                </button>
              </div>
            </div>

            <p className="order-subtitle">
              {mode === 'quick'
                ? 'Diperas segar begitu dipesan & disegel dingin 4 °C. Ambil langsung di bar Tropisip atau pakai kurir pesan antar biar minuman segar langsung mendarat di mejamu!'
                : `Bikin acara kantor, arisan, atau gathering makin segar dan heboh! Pesanan ${CHILLED_BAR_THRESHOLD_CUPS}+ gelas otomatis dapat diskon 8% plus gratis cooler bar dingin & garnish daun mint segar.`}
            </p>

            {submittedCode ? (
              <div className="reservation-receipt" role="status" aria-live="polite">
                <div className="receipt-header">
                  <span className="mono-label receipt-badge">PESANAN TERKONFIRMASI</span>
                  <strong className="receipt-code mono-label">{submittedCode}</strong>
                </div>
                <h3 className="receipt-title">
                  Pesanan Masuk, Mood Auto Happy, {customerName.trim()}!
                </h3>
                <p className="receipt-copy">
                  Reservasi {mode === 'catering' ? 'Katering Acara' : 'Pesan Segar'} sebanyak{' '}
                  <strong>
                    {pricing.totalCups} × {activeSize.toUpperCase()}
                  </strong>{' '}
                  untuk tanggal <strong>{eventOrPickupDate}</strong> (
                  {fulfillment === 'delivery' ? 'Pesan Antar Dingin' : 'Ambil di Bar Tropisip'})
                  sudah masuk antrean. Ringkasan disiapkan untuk{' '}
                  <code>{contactEmail.trim()}</code>.
                </p>

                <div className="receipt-lines mono-label">
                  {FLAVOR_ORDER.map((id) =>
                    quantities[id] > 0 ? (
                      <div key={id} className="receipt-line">
                        <span>
                          {quantities[id]}× {FLAVORS[id].indonesianName} ({activeSize})
                        </span>
                        <span>
                          {formatIdr(quantities[id] * FLAVORS[id].sizes[activeSize].priceIdr)}
                        </span>
                      </div>
                    ) : null,
                  )}
                  {addChiaMint ? (
                    <div className="receipt-line">
                      <span>Topping Biji Chia Organik + Mint Segar</span>
                      <span>{formatIdr(pricing.chiaMintAddonIdr)}</span>
                    </div>
                  ) : null}
                  {pricing.cateringDiscountIdr > 0 ? (
                    <div className="receipt-line is-savings">
                      <span>Hemat Paket Katering</span>
                      <span>-{formatIdr(pricing.cateringDiscountIdr)}</span>
                    </div>
                  ) : null}
                  <div className="receipt-line is-total">
                    <span>ESTIMASI TOTAL</span>
                    <span>{formatIdr(pricing.finalTotalIdr)}</span>
                  </div>
                </div>

                {pricing.includesChilledBarSetup ? (
                  <p className="receipt-perk mono-label">
                    ★ GRATIS COOLER BAR DINGIN &amp; STASIUN GARNISH DAUN MINT SEGAR!
                  </p>
                ) : null}

                <button
                  type="button"
                  className="secondary-btn"
                  onClick={() => setSubmittedCode(null)}
                >
                  Ubah Pesanan
                </button>
              </div>
            ) : (
              <form className="order-form" onSubmit={handleSubmit} noValidate>
                <div className="form-block">
                  <div className="form-block-head">
                    <label className="mono-label">1. PILIH KOMBINASI 6 RASA SEGAR</label>
                    <div
                      className="inline-size-pills"
                      role="group"
                      aria-label="Ukuran Gelas Pesanan"
                    >
                      {CUP_SIZES.map((sId) => (
                        <button
                          key={sId}
                          type="button"
                          className={`mini-size-btn mono-label ${activeSize === sId ? 'is-active' : ''}`}
                          onClick={() => onSelectSize(sId)}
                        >
                          {sId} · {formatIdr(FLAVORS.mango.sizes[sId].priceIdr)}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="qty-rows-grid">
                    {FLAVOR_ORDER.map((id) => {
                      const f = FLAVORS[id];
                      const step = mode === 'catering' ? 5 : 1;
                      const qty = quantities[id] || 0;
                      return (
                        <div
                          key={id}
                          className={`qty-row ${activeFlavor === id ? 'is-highlighted' : ''}`}
                          style={activeFlavor === id ? { borderColor: f.hex } : undefined}
                        >
                          <button
                            type="button"
                            className="qty-flavor-info"
                            onClick={() => onSelectFlavor(id)}
                          >
                            <span
                              className="flavor-dot"
                              style={{ backgroundColor: f.hex }}
                              aria-hidden="true"
                            />
                            <span>
                              <strong>{f.indonesianName}</strong>
                              <small className="mono-label">
                                {formatIdr(f.sizes[activeSize].priceIdr)} / gelas
                              </small>
                            </span>
                          </button>

                          <div className="stepper">
                            <button
                              type="button"
                              className="stepper-btn"
                              onClick={() => adjustQuantity(id, -step)}
                              aria-label={`Kurangi jumlah ${f.indonesianName}`}
                            >
                              −
                            </button>
                            <span className="stepper-val mono-label" aria-live="polite">
                              {qty}
                            </span>
                            <button
                              type="button"
                              className="stepper-btn"
                              onClick={() => adjustQuantity(id, step)}
                              aria-label={`Tambah jumlah ${f.indonesianName}`}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {showErrors && validation.errors.quantities ? (
                    <p className="field-error" role="alert">
                      {validation.errors.quantities}
                    </p>
                  ) : null}
                </div>

                <div className="form-block">
                  <span className="mono-label form-block-label">2. RACIKAN SESUAI SELERA</span>
                  <div className="prefs-grid">
                    <div className="pref-field">
                      <label htmlFor="ice-level" className="mono-label">
                        TAKARAN ES BATU
                      </label>
                      <select
                        id="ice-level"
                        value={iceLevel}
                        onChange={(e) => setIceLevel(e.target.value as IceLevel)}
                      >
                        <option value="regular">Es Normal (Pas Dinginnya)</option>
                        <option value="less">Sedikit Es (Daging Buah Makin Padat)</option>
                        <option value="extra">Ekstra Es (Anti-Gerah Brutal)</option>
                      </select>
                    </div>

                    <div className="pref-field">
                      <label htmlFor="sweetness-level" className="mono-label">
                        TINGKAT MANIS
                      </label>
                      <select
                        id="sweetness-level"
                        value={sweetness}
                        onChange={(e) => setSweetness(e.target.value as SweetnessLevel)}
                      >
                        <option value="natural">Manis Alami Buah Asli</option>
                        <option value="light-honey">Sedikit Madu Hutan</option>
                        <option value="pure-zero-added">Murni 0% Tambahan Gula</option>
                      </select>
                    </div>

                    <label className="chia-toggle">
                      <input
                        type="checkbox"
                        checked={addChiaMint}
                        onChange={(e) => setAddChiaMint(e.target.checked)}
                      />
                      <span>
                        <strong>Tambah Biji Chia Organik &amp; Daun Mint Segar</strong>
                        <small className="mono-label">
                          +{formatIdr(CHIA_MINT_ADDON_PER_CUP_IDR)} / gelas
                        </small>
                      </span>
                    </label>
                  </div>
                </div>

                <div className="form-block">
                  <span className="mono-label form-block-label">3. DATA PENGIRIMAN / RESERVASI</span>
                  <div className="inputs-grid">
                    <div className="input-field">
                      <label htmlFor="customer-name" className="mono-label">
                        NAMA PEMESAN / KANTOR
                      </label>
                      <input
                        id="customer-name"
                        type="text"
                        placeholder="cth. Nadia / Tim Kreatif Pagi"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        required
                      />
                      {showErrors && validation.errors.customerName ? (
                        <span className="field-error">{validation.errors.customerName}</span>
                      ) : null}
                    </div>

                    <div className="input-field">
                      <label htmlFor="contact-email" className="mono-label">
                        EMAIL KONFIRMASI
                      </label>
                      <input
                        id="contact-email"
                        type="email"
                        placeholder="halo@contoh.id"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        required
                      />
                      {showErrors && validation.errors.contactEmail ? (
                        <span className="field-error">{validation.errors.contactEmail}</span>
                      ) : null}
                    </div>

                    <div className="input-field">
                      <label htmlFor="pickup-date" className="mono-label">
                        {mode === 'catering' ? 'TANGGAL ACARA' : 'TANGGAL ANTAR / AMBIL'}
                      </label>
                      <input
                        id="pickup-date"
                        type="date"
                        value={eventOrPickupDate}
                        onChange={(e) => setEventOrPickupDate(e.target.value)}
                        required
                      />
                      {showErrors && validation.errors.eventOrPickupDate ? (
                        <span className="field-error">{validation.errors.eventOrPickupDate}</span>
                      ) : null}
                    </div>

                    <div className="input-field">
                      <label htmlFor="fulfillment-type" className="mono-label">
                        METODE LAYANAN
                      </label>
                      <select
                        id="fulfillment-type"
                        value={fulfillment}
                        onChange={(e) => setFulfillment(e.target.value as 'pickup' | 'delivery')}
                      >
                        <option value="delivery">Pesan Antar Dingin ke Lokasi</option>
                        <option value="pickup">Ambil Sendiri di Bar Tropisip</option>
                      </select>
                    </div>
                  </div>

                  <div className="input-field notes-field">
                    <label htmlFor="order-notes" className="mono-label">
                      CATATAN TAMBAHAN (OPSIONAL)
                    </label>
                    <input
                      id="order-notes"
                      type="text"
                      placeholder="Jam antar, patokan lokasi, atau tulisan lucu di gelas..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                    />
                  </div>
                </div>

                <div className="order-summary-bar">
                  <div className="summary-totals">
                    <span className="mono-label summary-meta">
                      {pricing.totalCups} GELAS · {activeSize.toUpperCase()}
                      {pricing.cateringDiscountIdr > 0
                        ? ` · HEMAT ${formatIdr(pricing.cateringDiscountIdr)}`
                        : ''}
                    </span>
                    <strong className="summary-price mono-label">
                      {formatIdr(pricing.finalTotalIdr)}
                    </strong>
                    {pricing.includesChilledBarSetup ? (
                      <span className="summary-perk mono-label">
                        + Gratis Cooler Bar Dingin &amp; Garnish Mint
                      </span>
                    ) : null}
                  </div>

                  <button type="submit" className="primary-btn submit-order-btn">
                    {mode === 'catering' ? 'Booking Katering Segar' : 'Pesan Jus Sekarang'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </section>
    );
  },
);
OrderCateringForm.displayName = 'OrderCateringForm';
