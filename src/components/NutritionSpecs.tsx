import React, { memo } from 'react';
import {
  FLAVORS,
  FLAVOR_ORDER,
  formatIdr,
  type CupSizeId,
  type FlavorId,
} from '../data/flavors';

interface NutritionSpecsProps {
  activeFlavor: FlavorId;
  activeSize: CupSizeId;
  onSelectFlavor: (flavorId: FlavorId) => void;
  onSelectSize: (sizeId: CupSizeId) => void;
  onOrderFlavor: (flavorId: FlavorId, sizeId: CupSizeId) => void;
}

const CUP_SIZES: readonly CupSizeId[] = ['16oz', '22oz'];

export const NutritionSpecs: React.FC<NutritionSpecsProps> = memo(
  ({ activeFlavor, activeSize, onSelectFlavor, onSelectSize, onOrderFlavor }) => {
    const flavor = FLAVORS[activeFlavor];
    const size = flavor.sizes[activeSize];

    return (
      <section id="specs" className="editorial-section specs-section" aria-labelledby="specs-heading">
        <div className="specs-layout">
          <div className="specs-spacer" aria-hidden="true" />

          <div className="frosted-panel specs-panel">
            <div className="panel-header-row">
              <div>
                <span
                  className="eyebrow-badge mono-label"
                  style={{ backgroundColor: flavor.hex, color: flavor.inkOnAccent }}
                >
                  DAFTAR MENU RESMI · 6 VARIAN SEGAR
                </span>
                <h2 id="specs-heading" className="section-title">
                  Fakta Nutrisi &amp; Harga Jujur
                </h2>
              </div>

              <div className="size-segmented" role="group" aria-label="Pilih Ukuran Gelas">
                {CUP_SIZES.map((sId) => (
                  <button
                    key={sId}
                    type="button"
                    className={`size-seg-btn ${activeSize === sId ? 'is-active' : ''}`}
                    onClick={() => onSelectSize(sId)}
                    aria-pressed={activeSize === sId}
                  >
                    <span className="size-seg-oz">{sId.toUpperCase()}</span>
                    <span className="size-seg-ml mono-label">
                      {sId === '16oz' ? '473ML' : '650ML'}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            <p className="specs-intro">
              Semua varian cuma <strong>Rp 7.000 (16oz)</strong> atau{' '}
              <strong>Rp 10.000 (22oz)</strong>! Klik rasa apa pun buat langsung ganti gelas 3D-nya
              dan cek kandungan buah aslinya.
            </p>

            <div className="flavor-compare-grid" role="list" aria-label="6 Menu Resmi Tropisip">
              {FLAVOR_ORDER.map((id) => {
                const item = FLAVORS[id];
                const isSelected = id === activeFlavor;
                return (
                  <button
                    key={id}
                    type="button"
                    role="listitem"
                    className={`flavor-compare-card ${isSelected ? 'is-active' : ''}`}
                    style={
                      isSelected
                        ? {
                            borderColor: item.hex,
                            boxShadow: `0 12px 26px -14px ${item.accentSoftBg}`,
                          }
                        : undefined
                    }
                    onClick={() => onSelectFlavor(id)}
                    aria-pressed={isSelected}
                  >
                    <div
                      className="compare-ribbon"
                      style={{ backgroundColor: item.hex, color: item.inkOnAccent }}
                    >
                      <strong>{item.indonesianName}</strong>
                    </div>
                    <div className="compare-prices mono-label">
                      <span className={activeSize === '16oz' ? 'is-current' : ''}>
                        16oz · {formatIdr(item.sizes['16oz'].priceIdr)}
                      </span>
                      <span className={activeSize === '22oz' ? 'is-current' : ''}>
                        22oz · {formatIdr(item.sizes['22oz'].priceIdr)}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="active-spec-sheet">
              <div className="active-spec-banner">
                <div>
                  <span className="mono-label active-spec-kicker">
                    {flavor.cultivar.toUpperCase()} · {flavor.origin.toUpperCase()}
                  </span>
                  <h3 className="active-spec-title">{flavor.indonesianName}</h3>
                  <p className="active-spec-notes">{flavor.tastingNotes}</p>
                  <p className="active-funny-hook">“{flavor.funnyHook}”</p>
                </div>
                <div
                  className="active-price-callout"
                  style={{ backgroundColor: flavor.hex, color: flavor.inkOnAccent }}
                >
                  <span className="mono-label">{size.label.toUpperCase()}</span>
                  <strong className="price-figure mono-label">{formatIdr(size.priceIdr)}</strong>
                </div>
              </div>

              <div className="optical-meters">
                <div className="meter-row">
                  <div className="meter-labels">
                    <span className="mono-label">KEPADATAN SERAT BUAH</span>
                    <span className="mono-label">{flavor.pulpLabel}</span>
                  </div>
                  <div className="meter-track">
                    <div
                      className="meter-fill"
                      style={{
                        width: `${Math.round(flavor.pulpDensity * 100)}%`,
                        backgroundColor: flavor.hex,
                      }}
                    />
                  </div>
                </div>

                <div className="meter-row">
                  <div className="meter-labels">
                    <span className="mono-label">KILAU TEMBUS CAHAYA</span>
                    <span className="mono-label">{flavor.sssLabel}</span>
                  </div>
                  <div className="meter-track">
                    <div
                      className="meter-fill"
                      style={{
                        width: `${Math.round(flavor.sssIntensity * 100)}%`,
                        backgroundColor: '#00B5A3',
                      }}
                    />
                  </div>
                </div>
              </div>

              <dl className="nutrition-grid">
                <div className="nutrition-cell">
                  <dt className="mono-label">BERAT BUAH ASLI</dt>
                  <dd className="mono-label">{size.fruitMassGrams} g</dd>
                </div>
                <div className="nutrition-cell">
                  <dt className="mono-label">ENERGI</dt>
                  <dd className="mono-label">{size.calories} kkal</dd>
                </div>
                <div className="nutrition-cell">
                  <dt className="mono-label">VITAMIN C</dt>
                  <dd className="mono-label">{size.vitaminCPct}% AKG</dd>
                </div>
                <div className="nutrition-cell">
                  <dt className="mono-label">SERAT ALAMI</dt>
                  <dd className="mono-label">{size.fiberGrams.toFixed(1)} g</dd>
                </div>
                <div className="nutrition-cell">
                  <dt className="mono-label">MANIS ALAMI BRIX</dt>
                  <dd className="mono-label">{flavor.brix.toFixed(1)} °Bx</dd>
                </div>
                <div className="nutrition-cell">
                  <dt className="mono-label">KALIUM</dt>
                  <dd className="mono-label">{size.potassiumMg} mg</dd>
                </div>
              </dl>

              <div className="spec-footer-row">
                <ul className="purity-badges mono-label">
                  <li>100% BUAH SEGAR</li>
                  <li>TANPA PENGAWET</li>
                  <li>PILIHAN SEHAT</li>
                </ul>

                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => onOrderFlavor(activeFlavor, activeSize)}
                >
                  Pesan {flavor.indonesianName} ({activeSize})
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  },
);
NutritionSpecs.displayName = 'NutritionSpecs';
