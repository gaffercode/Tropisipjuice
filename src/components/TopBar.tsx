import React, { memo } from 'react';
import { FLAVORS, FLAVOR_ORDER, type FlavorId } from '../data/flavors';
import { TropisipWordmark } from './TropisipWordmark';

interface TopBarProps {
  activeFlavor: FlavorId;
  onSelectFlavor: (flavorId: FlavorId) => void;
  macroEnabled: boolean;
  onToggleMacro: () => void;
  audioEnabled: boolean;
  onToggleAudio: () => void;
  onJumpToSection: (sectionId: string) => void;
}

/* Hoisted static icon JSX (rendering-hoist-jsx) */
const MACRO_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="2" />
    <path d="M20 20L16.2 16.2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M11 8V14M8 11H14" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export const TopBar: React.FC<TopBarProps> = memo(
  ({
    activeFlavor,
    onSelectFlavor,
    macroEnabled,
    onToggleMacro,
    audioEnabled,
    onToggleAudio,
    onJumpToSection,
  }) => {
    return (
      <header className="topbar" role="banner">
        <div className="topbar-inner">
          <button
            type="button"
            className="brand-btn"
            onClick={() => onJumpToSection('hero')}
            aria-label="Kembali ke puncak halaman Tropisip"
          >
            <TropisipWordmark size="sm" />
          </button>

          <nav className="topbar-flavors" aria-label="Pilih Varian Rasa Jus Tropisip">
            {FLAVOR_ORDER.map((id) => {
              const flavor = FLAVORS[id];
              const isActive = activeFlavor === id;
              return (
                <button
                  key={id}
                  type="button"
                  className={`flavor-pill ${isActive ? 'is-active' : ''}`}
                  style={
                    isActive
                      ? {
                          backgroundColor: flavor.hex,
                          borderColor: flavor.hex,
                          color: flavor.inkOnAccent,
                        }
                      : undefined
                  }
                  onClick={() => onSelectFlavor(id)}
                  aria-pressed={isActive}
                  data-flavor={id}
                >
                  <span
                    className="flavor-dot"
                    style={{
                      backgroundColor: isActive ? flavor.inkOnAccent : flavor.hex,
                    }}
                    aria-hidden="true"
                  />
                  <span>{flavor.name}</span>
                </button>
              );
            })}
          </nav>

          <div className="topbar-controls">
            <button
              type="button"
              className={`tool-pill ${macroEnabled ? 'is-active' : ''}`}
              onClick={onToggleMacro}
              aria-pressed={macroEnabled}
              title="Buka Lensa Makro Optik 2,6× (Tekan M)"
            >
              {MACRO_ICON}
              <span className="mono-label">MAKRO 2,6×</span>
            </button>

            <button
              type="button"
              className={`tool-pill ${audioEnabled ? 'is-active' : ''}`}
              onClick={onToggleAudio}
              aria-pressed={audioEnabled}
              title="Nyalakan Suara ASMR Tuangan Jus & Es Batu"
            >
              <span className={`audio-bars ${audioEnabled ? 'is-live' : ''}`} aria-hidden="true">
                <i />
                <i />
                <i />
              </span>
              <span className="mono-label">{audioEnabled ? 'ASMR NYALA' : 'ASMR'}</span>
            </button>

            <button
              type="button"
              className="order-cta-pill"
              onClick={() => onJumpToSection('order')}
            >
              Pesan Sekarang
            </button>
          </div>
        </div>
      </header>
    );
  },
);
TopBar.displayName = 'TopBar';
