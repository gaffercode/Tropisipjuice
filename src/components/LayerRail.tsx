import React, { memo } from 'react';
import { BOTANICAL_LAYERS } from '../data/layers';

interface LayerRailProps {
  activeLayerIndex: number;
  percentRef: React.RefObject<HTMLSpanElement | null>;
  onSelectLayer: (layerIndex: number) => void;
}

export const LayerRail: React.FC<LayerRailProps> = memo(
  ({ activeLayerIndex, percentRef, onSelectLayer }) => {
    return (
      <aside className="layer-rail" aria-label="Indeks 6 Lapisan Gelas Tropisip">
        <div className="layer-rail-head mono-label">
          <span>ANATOMI</span>
          <span ref={percentRef}>0%</span>
        </div>
        <ol className="layer-rail-list">
          {BOTANICAL_LAYERS.map((layer) => {
            const isActive = activeLayerIndex === layer.index;
            return (
              <li key={layer.key}>
                <button
                  type="button"
                  className={`layer-rail-btn ${isActive ? 'is-active' : ''}`}
                  onClick={() => onSelectLayer(layer.index)}
                  aria-current={isActive ? 'step' : undefined}
                >
                  <span className="layer-rail-code mono-label">{layer.code}</span>
                  <span className="layer-rail-tick" aria-hidden="true" />
                  <span className="layer-rail-name">{layer.shortTitle}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </aside>
    );
  },
);
LayerRail.displayName = 'LayerRail';
