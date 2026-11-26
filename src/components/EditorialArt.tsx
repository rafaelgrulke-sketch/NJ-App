import React from 'react';
import { NJ_LOGO_PATH } from '../data/initialData';

export const BrandLogoMark: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
  size = 'sm',
  className = '',
}) => {
  const dims =
    size === 'lg' ? 'h-14 w-14 rounded-xl' : size === 'md' ? 'h-10 w-10 rounded-lg' : 'h-8 w-8 rounded-md';
  return (
    <img
      src={NJ_LOGO_PATH}
      alt="Logo Oficial NJ App — Nova Jerusalém Sampaio"
      referrerPolicy="no-referrer"
      className={`${dims} shrink-0 object-cover border border-[#5D705D]/50 ${className}`}
    />
  );
};

export const SanctuaryArchitectureArt: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`${className.includes('absolute') ? '' : 'relative '}overflow-hidden bg-[#0F7656] text-white ${className}`}
    aria-hidden="true"
  >
    <svg
      viewBox="0 0 800 540"
      className="h-full w-full object-cover"
      preserveAspectRatio="xMidYMid slice"
      fill="none"
    >
      <defs>
        <linearGradient id="njSanctuaryBg" x1="0" y1="0" x2="800" y2="540" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#0A5C43" />
          <stop offset="50%" stopColor="#127F5D" />
          <stop offset="100%" stopColor="#1EA179" />
        </linearGradient>
        <linearGradient id="njWarmOliveBeam" x1="180" y1="0" x2="620" y2="540" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#D1FAE5" stopOpacity="0.30" />
          <stop offset="52%" stopColor="#6EE7B7" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#0A5C43" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect width="800" height="540" fill="url(#njSanctuaryBg)" />
      <polygon points="180,0 520,0 740,540 280,540" fill="url(#njWarmOliveBeam)" />
      <path d="M100 540V230C100 130 180 60 280 60C380 60 460 130 460 230V540" stroke="#A7F3D0" strokeOpacity="0.36" strokeWidth="1.6" />
      <path d="M220 540V250C220 155 295 90 390 90C485 90 560 155 560 250V540" stroke="#FFFFFF" strokeOpacity="0.28" strokeWidth="1.4" />
      <path d="M350 540V270C350 180 420 120 510 120C600 120 670 180 670 270V540" stroke="#A7F3D0" strokeOpacity="0.32" strokeWidth="1.3" />
      <line x1="0" y1="110" x2="800" y2="110" stroke="#FFFFFF" strokeOpacity="0.10" />
      <line x1="0" y1="190" x2="800" y2="190" stroke="#FFFFFF" strokeOpacity="0.09" />
      <line x1="0" y1="420" x2="800" y2="420" stroke="#A7F3D0" strokeOpacity="0.30" />
      <line x1="400" y1="138" x2="400" y2="372" stroke="#FFFFFF" strokeOpacity="0.96" strokeWidth="5.5" strokeLinecap="round" />
      <line x1="336" y1="208" x2="464" y2="208" stroke="#FFFFFF" strokeOpacity="0.96" strokeWidth="5.5" strokeLinecap="round" />
      <circle cx="400" cy="208" r="76" stroke="#A7F3D0" strokeOpacity="0.45" strokeWidth="1.5" />
      <line x1="120" y1="468" x2="680" y2="468" stroke="#FFFFFF" strokeOpacity="0.18" strokeWidth="1.5" />
      <line x1="70" y1="504" x2="730" y2="504" stroke="#A7F3D0" strokeOpacity="0.20" strokeWidth="1.5" />
    </svg>
  </div>
);

export const AlbumCoverArt: React.FC<{
  variant: number;
  title: string;
  year?: number;
  coverImageUrl?: string;
  className?: string;
}> = ({ variant, title, year, coverImageUrl, className = '' }) => {
  const [imgFailed, setImgFailed] = React.useState(false);

  const palettes = [
    { from: '#0B5E44', via: '#12815F', to: '#1FA078', accent: '#FDE68A', motif: 'rays' },
    { from: '#0E6B50', via: '#178A68', to: '#B47B2B', accent: '#FEF3C7', motif: 'arch' },
    { from: '#0F6258', via: '#168779', to: '#0D5C46', accent: '#A7F3D0', motif: 'rings' },
    { from: '#12694E', via: '#238F6D', to: '#0B543D', accent: '#FFFFFF', motif: 'cross' },
    { from: '#0C6A5B', via: '#1A8C7A', to: '#28A68E', accent: '#D1FAE5', motif: 'waves' },
    { from: '#16654B', via: '#B47B2B', to: '#0F6047', accent: '#FEF3C7', motif: 'horizon' },
    { from: '#0A5A46', via: '#148266', to: '#1D9C7B', accent: '#A7F3D0', motif: 'vinyl' },
    { from: '#116852', via: '#1F8B70', to: '#0D523E', accent: '#FDE68A', motif: 'arch' },
    { from: '#0F6E54', via: '#1B9472', to: '#B47B2B', accent: '#FEF3C7', motif: 'rays' },
    { from: '#126456', via: '#1D8A76', to: '#0C5242', accent: '#FFFFFF', motif: 'rings' },
    { from: '#0B634A', via: '#178767', to: '#C47D1D', accent: '#FEF3C7', motif: 'waves' },
  ];
  const p = palettes[Math.abs(variant) % palettes.length];

  if (coverImageUrl && !imgFailed) {
    return (
      <div className={`relative overflow-hidden bg-[#213228] ${className}`}>
        <img
          src={coverImageUrl}
          alt={`Capa do álbum ${title} — Ministério Nova Jerusalém`}
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          className="h-full w-full object-cover"
        />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#16231B]/85 via-transparent to-transparent" />
        <div className="absolute right-4 bottom-3 left-4 flex items-end justify-between gap-2 text-[#F3F1E9]">
          <span className="font-serif text-lg leading-tight font-semibold drop-shadow-sm">{title}</span>
          {year && <span className="font-mono text-[11px] text-[#B1D3AE] tabular-nums">{year}</span>}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`relative flex flex-col justify-between overflow-hidden p-5 ${className}`}
      style={{
        background: `linear-gradient(145deg, ${p.from} 0%, ${p.via} 52%, ${p.to} 100%)`,
        color: '#F3F1E9',
      }}
    >
      <svg
        viewBox="0 0 240 240"
        className="pointer-events-none absolute inset-0 h-full w-full opacity-55"
        fill="none"
        aria-hidden="true"
      >
        {p.motif === 'rays' && (
          <>
            <line x1="120" y1="0" x2="120" y2="240" stroke={p.accent} strokeOpacity="0.35" strokeWidth="1" />
            <line x1="0" y1="120" x2="240" y2="120" stroke={p.accent} strokeOpacity="0.25" strokeWidth="1" />
            <polygon points="120,16 226,220 14,220" stroke={p.accent} strokeOpacity="0.35" strokeWidth="1" />
            <circle cx="120" cy="110" r="56" stroke={p.accent} strokeOpacity="0.45" strokeWidth="1.2" />
          </>
        )}
        {p.motif === 'arch' && (
          <>
            <path d="M40 240V115C40 65 76 32 120 32C164 32 200 65 200 115V240" stroke={p.accent} strokeOpacity="0.5" strokeWidth="1.2" />
            <path d="M68 240V125C68 88 92 60 120 60C148 60 172 88 172 125V240" stroke={p.accent} strokeOpacity="0.32" strokeWidth="1" />
            <line x1="0" y1="185" x2="240" y2="185" stroke={p.accent} strokeOpacity="0.25" />
          </>
        )}
        {p.motif === 'rings' && (
          <>
            <circle cx="185" cy="58" r="96" stroke={p.accent} strokeOpacity="0.32" strokeWidth="1" />
            <circle cx="185" cy="58" r="68" stroke={p.accent} strokeOpacity="0.45" strokeWidth="1.2" />
            <circle cx="185" cy="58" r="40" stroke={p.accent} strokeOpacity="0.6" strokeWidth="1.2" />
            <line x1="0" y1="184" x2="240" y2="184" stroke={p.accent} strokeOpacity="0.4" />
          </>
        )}
        {p.motif === 'cross' && (
          <>
            <line x1="158" y1="24" x2="158" y2="162" stroke={p.accent} strokeOpacity="0.5" strokeWidth="2.5" />
            <line x1="118" y1="68" x2="198" y2="68" stroke={p.accent} strokeOpacity="0.5" strokeWidth="2.5" />
            <circle cx="158" cy="68" r="52" stroke={p.accent} strokeOpacity="0.28" strokeWidth="1" />
          </>
        )}
        {p.motif === 'waves' && (
          <>
            <path d="M0 120 Q60 80 120 120 T240 120" stroke={p.accent} strokeOpacity="0.45" strokeWidth="1.2" />
            <path d="M0 144 Q60 104 120 144 T240 144" stroke={p.accent} strokeOpacity="0.35" strokeWidth="1.2" />
            <path d="M0 168 Q60 128 120 168 T240 168" stroke={p.accent} strokeOpacity="0.25" strokeWidth="1.2" />
          </>
        )}
        {p.motif === 'horizon' && (
          <>
            <circle cx="120" cy="120" r="66" fill={p.accent} fillOpacity="0.1" stroke={p.accent} strokeOpacity="0.4" />
            <line x1="0" y1="120" x2="240" y2="120" stroke={p.accent} strokeOpacity="0.5" />
            <line x1="0" y1="142" x2="240" y2="142" stroke={p.accent} strokeOpacity="0.28" />
            <line x1="0" y1="164" x2="240" y2="164" stroke={p.accent} strokeOpacity="0.18" />
          </>
        )}
        {p.motif === 'vinyl' && (
          <>
            <circle cx="170" cy="115" r="90" stroke={p.accent} strokeOpacity="0.3" strokeWidth="1" />
            <circle cx="170" cy="115" r="70" stroke={p.accent} strokeOpacity="0.38" strokeWidth="1" />
            <circle cx="170" cy="115" r="50" stroke={p.accent} strokeOpacity="0.45" strokeWidth="1" />
            <circle cx="170" cy="115" r="24" stroke={p.accent} strokeOpacity="0.6" strokeWidth="1.5" />
          </>
        )}
      </svg>
      <div className="relative z-10 flex items-center justify-between gap-2 text-[10px] tracking-widest uppercase text-[#B1D3AE]">
        <span className="flex items-center gap-1.5">
          <img
            src={NJ_LOGO_PATH}
            alt=""
            className="h-4 w-4 rounded-sm object-cover opacity-90"
            aria-hidden="true"
          />
          Min. Nova Jerusalém
        </span>
        {year && <span className="font-mono tabular-nums">{year}</span>}
      </div>
      <div className="relative z-10">
        <span className="block font-serif text-xl leading-snug font-semibold text-[#F3F1E9] drop-shadow-sm">
          {title}
        </span>
      </div>
    </div>
  );
};

export const PixQrCodeSvg: React.FC<{ seed: string }> = ({ seed }) => {
  const size = 21;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }

  const isFinder = (r: number, c: number) => {
    const topLeft = r < 7 && c < 7;
    const topRight = r < 7 && c >= size - 7;
    const bottomLeft = r >= size - 7 && c < 7;
    if (!topLeft && !topRight && !bottomLeft) return null;
    const lr = r < 7 ? r : r - (size - 7);
    const lc = c < 7 ? c : c - (size - 7);
    if (lr === 0 || lr === 6 || lc === 0 || lc === 6) return true;
    if (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4) return true;
    return false;
  };

  const cells: React.ReactElement[] = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const finder = isFinder(r, c);
      let filled = false;
      if (finder !== null) {
        filled = finder;
      } else {
        const bit = ((hash ^ (r * 73856093) ^ (c * 19349663)) >>> ((r + c) % 13)) & 1;
        filled = bit === 1;
      }
      if (filled) {
        cells.push(
          <rect key={`${r}-${c}`} x={c * 8 + 12} y={r * 8 + 12} width="7.2" height="7.2" fill="#213228" />
        );
      }
    }
  }

  return (
    <svg
      viewBox="0 0 192 192"
      className="h-44 w-44 rounded-lg border border-[#5D705D] bg-[#F3F1E9] p-2"
      role="img"
      aria-label="QR Code Pix Oficial da Nova Jerusalém Sampaio"
    >
      <rect width="192" height="192" fill="#F3F1E9" />
      {cells}
    </svg>
  );
};
