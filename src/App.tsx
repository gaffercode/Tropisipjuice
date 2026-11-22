import React, { useCallback, useEffect, useRef, useState } from 'react';
import Lenis from 'lenis';
import { TropisipFoleyEngine } from './audio/foleyEngine';
import { LayerRail } from './components/LayerRail';
import { NutritionSpecs } from './components/NutritionSpecs';
import { OrderCateringForm } from './components/OrderCateringForm';
import { StageCanvas } from './components/StageCanvas';
import { TopBar } from './components/TopBar';
import { TropisipWordmark } from './components/TropisipWordmark';
import {
  FLAVORS,
  FLAVOR_ORDER,
  formatIdr,
  FUNNY_SLOGANS,
  type CupSizeId,
  type FlavorId,
} from './data/flavors';
import { BOTANICAL_LAYERS } from './data/layers';
import { computeStageKinematics } from './three/kinematics';

const HERO_PILLARS = (
  <div className="hero-pillars mono-label">
    <span>100% BUAH SEGAR</span>
    <span>·</span>
    <span>TANPA PENGAWET</span>
    <span>·</span>
    <span>PILIHAN SEHAT</span>
    <span>·</span>
    <span>KESEGARAN DI SETIAP TEGUK</span>
  </div>
);

export const App: React.FC = () => {
  const [activeFlavor, setActiveFlavor] = useState<FlavorId>('mango');
  const [activeSize, setActiveSize] = useState<CupSizeId>('16oz');
  const [macroEnabled, setMacroEnabled] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [activeLayerIndex, setActiveLayerIndex] = useState(-1);

  // Transient refs prevent scroll-driven & callback-read React re-renders (rerender-use-ref-transient-values)
  const scrollProgressRef = useRef(0);
  const percentRef = useRef<HTMLSpanElement | null>(null);
  const activeFlavorRef = useRef<FlavorId>('mango');
  const lastPercentRef = useRef(-1);
  const lenisRef = useRef<Lenis | null>(null);
  const foleyRef = useRef<TropisipFoleyEngine | null>(null);

  useEffect(() => {
    const foley = new TropisipFoleyEngine();
    foleyRef.current = foley;

    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      touchMultiplier: 1.5,
    });
    lenisRef.current = lenis;

    const syncFromScroll = (velocity = 0) => {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.max(0, Math.min(1, window.scrollY / maxScroll));
      scrollProgressRef.current = progress;

      const kinematics = computeStageKinematics(progress, window.innerWidth < 960);
      foley.onScroll(velocity, kinematics.activeLayerIndex);

      // Update percentage indicator directly in DOM — zero App re-renders on scroll!
      const pct = Math.round(progress * 100);
      if (pct !== lastPercentRef.current) {
        lastPercentRef.current = pct;
        if (percentRef.current) {
          percentRef.current.textContent = `${pct}%`;
        }
      }

      // Only trigger React state update when active layer chapter actually changes
      setActiveLayerIndex((prev) =>
        prev === kinematics.activeLayerIndex ? prev : kinematics.activeLayerIndex,
      );
    };

    lenis.on('scroll', (instance) => {
      syncFromScroll(instance.velocity);
    });

    const onNativeScroll = () => syncFromScroll(0);
    window.addEventListener('scroll', onNativeScroll, { passive: true });

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = window.requestAnimationFrame(raf);
    };
    rafId = window.requestAnimationFrame(raf);

    syncFromScroll(0);

    return () => {
      window.cancelAnimationFrame(rafId);
      window.removeEventListener('scroll', onNativeScroll);
      lenis.destroy();
      foley.dispose();
      lenisRef.current = null;
      foleyRef.current = null;
    };
  }, []);

  // Pintasan keyboard: tekan M untuk membuka/tutup Lensa Makro 2,6×
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')
      ) {
        return;
      }
      if (e.key.toLowerCase() === 'm') {
        setMacroEnabled((prev) => {
          foleyRef.current?.playMacroClick();
          return !prev;
        });
      } else if (e.key === 'Escape') {
        setMacroEnabled(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const handleSelectFlavor = useCallback((flavorId: FlavorId) => {
    activeFlavorRef.current = flavorId;
    setActiveFlavor(flavorId);
    foleyRef.current?.playFlavorSwitch(flavorId);
  }, []);

  const handleToggleMacro = useCallback(() => {
    setMacroEnabled((prev) => {
      foleyRef.current?.playMacroClick();
      return !prev;
    });
  }, []);

  const handleOpenMacro = useCallback(() => {
    setMacroEnabled((prev) => {
      if (prev) return prev;
      foleyRef.current?.playMacroClick();
      return true;
    });
  }, []);

  const handleCloseMacro = useCallback(() => {
    setMacroEnabled(false);
  }, []);

  // Defer reading activeFlavor via ref so callback stays 100% stable (rerender-defer-reads)
  const handleToggleAudio = useCallback(async () => {
    const foley = foleyRef.current;
    if (!foley) return;
    if (foley.isEnabled()) {
      foley.disable();
      setAudioEnabled(false);
    } else {
      const ok = await foley.enable();
      foley.setFlavorProfile(activeFlavorRef.current);
      setAudioEnabled(ok);
    }
  }, []);

  const handleJumpToSection = useCallback((sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (!el) return;
    if (lenisRef.current) {
      lenisRef.current.scrollTo(el, { offset: -72 });
    } else {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);

  const handleSelectLayer = useCallback(
    (layerIndex: number) => {
      const layer = BOTANICAL_LAYERS[layerIndex];
      if (!layer) return;
      handleJumpToSection(`layer-${layer.key}`);
    },
    [handleJumpToSection],
  );

  const handleOrderFlavor = useCallback(
    (flavorId: FlavorId, sizeId: CupSizeId) => {
      handleSelectFlavor(flavorId);
      setActiveSize(sizeId);
      handleJumpToSection('order');
    },
    [handleJumpToSection, handleSelectFlavor],
  );

  const flavor = FLAVORS[activeFlavor];
  const activeSizeMetrics = flavor.sizes[activeSize];

  return (
    <div className="page-root">
      <div className="linen-grain-overlay" aria-hidden="true" />

      <StageCanvas
        flavorId={activeFlavor}
        sizeId={activeSize}
        scrollProgressRef={scrollProgressRef}
        macroEnabled={macroEnabled}
        onCloseMacro={handleCloseMacro}
      />

      <TopBar
        activeFlavor={activeFlavor}
        onSelectFlavor={handleSelectFlavor}
        macroEnabled={macroEnabled}
        onToggleMacro={handleToggleMacro}
        audioEnabled={audioEnabled}
        onToggleAudio={handleToggleAudio}
        onJumpToSection={handleJumpToSection}
      />

      <LayerRail
        activeLayerIndex={activeLayerIndex}
        percentRef={percentRef}
        onSelectLayer={handleSelectLayer}
      />

      <main className="editorial-main">
        <section id="hero" className="editorial-section hero-section" aria-labelledby="hero-heading">
          <div className="hero-column">
            <div className="hero-badge-row">
              <span
                className="editorial-pill is-vibrant mono-label"
                style={{
                  backgroundColor: flavor.hex,
                  borderColor: flavor.hex,
                  color: flavor.inkOnAccent,
                }}
              >
                {FUNNY_SLOGANS[0].toUpperCase()}
              </span>
              <span className="editorial-pill mono-label">MULAI RP 7.000 · TANPA PENGAWET</span>
            </div>

            <div className="hero-wordmark-lockup">
              <TropisipWordmark showTagline size="lg" />
            </div>

            <h1 id="hero-heading" className="hero-headline">
              Tropisip:{' '}
              <span className="hero-headline-accent" style={{ textDecorationColor: flavor.hex }}>
                Sruput, Senyum, Repeat!
              </span>
            </h1>

            <p className="hero-lead">
              <strong>GOOD JUICE. GOOD VIBES.</strong> 6 varian jus buah asli dingin 4 °C—Mangga,
              Alpukat, Buah Naga, Jambu, Semangka, dan Melon—harganya bikin dompet senyum, segernya
              bikin mood auto happy. Gulir ke bawah untuk bedah 6 lapisannya!
            </p>

            <div className="frosted-panel hero-flavor-card">
              <div className="hero-flavor-card-top">
                <span className="mono-label">GANTI RASA LIVE DI GELAS 3D (6 MENU RESMI)</span>
                <span
                  className="hero-price-pill mono-label"
                  style={{ backgroundColor: flavor.hex, color: flavor.inkOnAccent }}
                >
                  {activeSize.toUpperCase()} · {formatIdr(activeSizeMetrics.priceIdr)}
                </span>
              </div>

              <div
                className="hero-flavor-buttons"
                role="group"
                aria-label="Pilih 6 Varian Jus Tropisip"
              >
                {FLAVOR_ORDER.map((id) => {
                  const item = FLAVORS[id];
                  const isActive = activeFlavor === id;
                  return (
                    <button
                      key={id}
                      type="button"
                      className={`hero-flavor-btn ${isActive ? 'is-active' : ''}`}
                      style={
                        isActive
                          ? {
                              backgroundColor: item.hex,
                              borderColor: item.hex,
                              color: item.inkOnAccent,
                            }
                          : undefined
                      }
                      onClick={() => handleSelectFlavor(id)}
                      aria-pressed={isActive}
                    >
                      <span
                        className="hero-flavor-swatch"
                        style={{ backgroundColor: isActive ? item.inkOnAccent : item.hex }}
                        aria-hidden="true"
                      />
                      <span className="hero-flavor-text">
                        <strong>{item.name}</strong>
                        <small className="mono-label">
                          {formatIdr(item.sizes[activeSize].priceIdr)}
                        </small>
                      </span>
                    </button>
                  );
                })}
              </div>

              <p className="hero-flavor-note">{flavor.tagline}</p>

              <div className="hero-actions">
                <button
                  type="button"
                  className="primary-btn"
                  onClick={() => handleJumpToSection('layer-domedLid')}
                >
                  Bedah 6 Lapisan Gelas
                </button>
                <button type="button" className="secondary-btn" onClick={handleToggleMacro}>
                  {macroEnabled ? 'Tutup Lensa Makro 2,6×' : 'Intip Pakai Makro 2,6×'}
                </button>
              </div>
            </div>

            {HERO_PILLARS}
          </div>
        </section>

        <div className="anatomy-chapters" aria-label="6 Lapisan Botanikal Gelas Tropisip">
          {BOTANICAL_LAYERS.map((layer) => {
            const isActive = activeLayerIndex === layer.index;
            const showLiveFlavorStrip = layer.key === 'juiceCore' || layer.key === 'fruitChunks';
            return (
              <section
                key={layer.key}
                id={`layer-${layer.key}`}
                className={`editorial-section layer-section is-${layer.align}`}
                aria-labelledby={`heading-${layer.key}`}
              >
                <article
                  className={`frosted-panel layer-card ${isActive ? 'is-spotlight' : ''}`}
                  style={isActive ? { borderColor: flavor.hex } : undefined}
                >
                  <div className="layer-card-meta mono-label">
                    <span
                      className="layer-index-chip"
                      style={{ backgroundColor: flavor.hex, color: flavor.inkOnAccent }}
                    >
                      LAPISAN {layer.code} / 06
                    </span>
                    <span>{layer.eyebrow.toUpperCase()}</span>
                  </div>

                  <h2 id={`heading-${layer.key}`} className="layer-card-title">
                    {layer.title}
                  </h2>

                  <p className="layer-card-body">{layer.description}</p>

                  {showLiveFlavorStrip ? (
                    <div
                      className="layer-live-flavor-strip"
                      style={{ borderLeftColor: flavor.hex }}
                    >
                      <span className="mono-label">
                        VARIAN AKTIF · {flavor.indonesianName.toUpperCase()}
                      </span>
                      <p>
                        {layer.key === 'juiceCore'
                          ? `${flavor.pulpLabel} · ${flavor.sssLabel} · ${flavor.brix.toFixed(1)} °Bx`
                          : `${flavor.chunkLabel} — ${flavor.tastingNotes}`}
                      </p>
                    </div>
                  ) : null}

                  <div className="layer-card-footer">
                    <div className="layer-spec-kv">
                      <span className="mono-label">{layer.specLabel}</span>
                      <strong>{layer.specValue}</strong>
                    </div>

                    <button
                      type="button"
                      className="inline-macro-trigger mono-label"
                      onClick={handleOpenMacro}
                    >
                      MAKRO 2,6×
                    </button>
                  </div>
                </article>
              </section>
            );
          })}
        </div>

        <NutritionSpecs
          activeFlavor={activeFlavor}
          activeSize={activeSize}
          onSelectFlavor={handleSelectFlavor}
          onSelectSize={setActiveSize}
          onOrderFlavor={handleOrderFlavor}
        />

        <OrderCateringForm
          activeFlavor={activeFlavor}
          activeSize={activeSize}
          onSelectFlavor={handleSelectFlavor}
          onSelectSize={setActiveSize}
        />
      </main>

      <footer className="editorial-footer">
        <div className="footer-inner">
          <div className="footer-brand">
            <TropisipWordmark showTagline size="md" />
            <p className="footer-caption">
              <strong>{FUNNY_SLOGANS[3]}</strong> — 100% buah segar, tanpa pengawet, pilihan sehat,
              dan kesegaran di setiap teguk. Menerima pesan antar sampai ke tempatmu!
            </p>
          </div>

          <div className="footer-meta mono-label">
            <span>{FUNNY_SLOGANS[2].toUpperCase()}</span>
            <span>CLASSIC LINEN #FAF6ED · BRUNSWICK GREEN #0C4B2A</span>
            <p className="footer-credit">
              Website built &amp; animated by{' '}
              <a
                href="https://github.com/drnovia"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-credit-author"
              >
                dr. Novia DA
              </a>{' '}
              ·{' '}
              <a
                href="https://github.com/Sentra-Artificial-Intelligence"
                target="_blank"
                rel="noopener noreferrer"
                className="footer-credit-studio"
              >
                Sentra Mitra Design
              </a>
            </p>
            <button
              type="button"
              className="back-to-top-btn mono-label"
              onClick={() => handleJumpToSection('hero')}
            >
              ↑ KEMBALI KE ATAS
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
