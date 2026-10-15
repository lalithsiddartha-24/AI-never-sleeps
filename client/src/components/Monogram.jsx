import { useState } from 'react';
import { initials } from '../utils';

export function Monogram({ name, logoUrl, size = 'sm', className = '' }) {
  const [failed, setFailed] = useState(false);
  const dim = size === 'lg' ? 'h-12 w-12 text-sm' : size === 'md' ? 'h-8 w-8 text-[11px]' : 'h-6 w-6 text-[9px]';
  if (logoUrl && !failed) {
    return (
      <img
        src={logoUrl}
        alt={name || ''}
        loading="lazy"
        onError={() => setFailed(true)}
        className={`${dim} shrink-0 rounded-full border border-line bg-surface2 object-cover ${className}`}
      />
    );
  }
  return (
    <span
      className={`inline-flex ${dim} shrink-0 items-center justify-center rounded-full border border-line bg-surface2 font-mono font-semibold text-zinc-400 ${className}`}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}

export function Thumbnail({ src, alt, className = '', ratio = 'aspect-video' }) {
  const [state, setState] = useState(src ? 'loading' : 'none');
  if (!src || state === 'error') {
    return (
      <div className={`${ratio} w-full ${className} flex items-center justify-center bg-surface2`}>
        <span className="font-mono text-[10px] uppercase tracking-widest text-zinc-600">AI Never Sleeps</span>
      </div>
    );
  }
  return (
    <div className={`${ratio} w-full ${className} relative overflow-hidden bg-surface2`}>
      {state === 'loading' && <div className="absolute inset-0 animate-pulse bg-white/5" />}
      <img
        src={src}
        alt={alt || ''}
        loading="lazy"
        onLoad={() => setState('loaded')}
        onError={() => setState('error')}
        className={`h-full w-full object-cover transition-opacity duration-300 ${
          state === 'loaded' ? 'opacity-100' : 'opacity-0'
        }`}
      />
    </div>
  );
}
