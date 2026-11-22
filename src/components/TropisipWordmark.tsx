import React, { memo } from 'react';

interface TropisipWordmarkProps {
  showTagline?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

/* Hoisted static SVG nodes (rendering-hoist-jsx) */
const WORDMARK_CORE = (
  <>
    <g fill="#0C4B2A">
      <path d="M161 24 C153 16 146 9 148 5 C155 6 164 13 165 23 Z" />
      <path d="M170 22 C169 10 176 2 183 1 C185 10 181 19 172 24 Z" />
      <path d="M178 26 C185 19 194 17 198 20 C194 26 186 29 178 28 Z" />
    </g>
    <text
      x="130"
      y="61"
      textAnchor="middle"
      fill="#0C4B2A"
      fontFamily="Poppins, sans-serif"
      fontWeight="800"
      fontSize="52"
      letterSpacing="-2"
    >
      tropisip
    </text>
    <path
      d="M54 74 Q130 66 206 74"
      stroke="#0C4B2A"
      strokeWidth="3.5"
      strokeLinecap="round"
      fill="none"
    />
    <ellipse cx="42" cy="77" rx="4.2" ry="2.1" transform="rotate(24 42 77)" fill="#0C4B2A" />
    <ellipse cx="47" cy="84" rx="3" ry="1.6" transform="rotate(-18 47 84)" fill="#0C4B2A" />
    <ellipse cx="218" cy="77" rx="4.2" ry="2.1" transform="rotate(-24 218 77)" fill="#0C4B2A" />
    <ellipse cx="213" cy="84" rx="3" ry="1.6" transform="rotate(18 213 84)" fill="#0C4B2A" />
  </>
);

const TAGLINE_TEXT = (
  <text
    x="130"
    y="99"
    textAnchor="middle"
    fill="#0C4B2A"
    fontFamily="Poppins, sans-serif"
    fontWeight="600"
    fontSize="10.2"
    letterSpacing="2.8"
  >
    GOOD JUICE, GOOD VIBES
  </text>
);

export const TropisipWordmark: React.FC<TropisipWordmarkProps> = memo(
  ({ showTagline = false, size = 'md' }) => {
    const width = size === 'sm' ? 116 : size === 'lg' ? 210 : 146;
    const height = showTagline ? Math.round(width * 0.44) : Math.round(width * 0.34);

    return (
      <svg
        width={width}
        height={height}
        viewBox={showTagline ? '0 0 260 112' : '0 0 260 88'}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-label="Tropisip — Good Juice, Good Vibes"
        className="tropisip-wordmark"
      >
        {WORDMARK_CORE}
        {showTagline ? TAGLINE_TEXT : null}
      </svg>
    );
  },
);
TropisipWordmark.displayName = 'TropisipWordmark';
