import React, { ReactNode } from 'react';
import '../styles/catalyst.css';

export function Avatar({ src, initials, square = false, className = '' }: { src?: string; initials?: string; square?: boolean; className?: string; slot?: string; alt?: string }) {
  const baseClass = `c-avatar ${square ? 'c-avatar-square' : 'c-avatar-round'} ${className}`;
  return (
    <div className={baseClass}>
      {src ? <img src={src} alt="Avatar" /> : <span>{initials}</span>}
    </div>
  );
}
