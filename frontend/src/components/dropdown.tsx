import React, { useState, useRef, useEffect, ReactNode } from 'react';

export function Dropdown({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="c-dropdown-wrapper" ref={dropdownRef}>
      {React.Children.map(children, child => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { isOpen, setIsOpen } as any);
        }
        return child;
      })}
    </div>
  );
}

export function DropdownButton({ as: Component = 'button', children, className = '', isOpen, setIsOpen, ...props }: any) {
  return (
    <Component className={`c-dropdown-btn ${className}`} onClick={() => setIsOpen(!isOpen)} {...props}>
      {children}
    </Component>
  );
}

export function DropdownMenu({ children, className = '', anchor = 'bottom start', isOpen }: any) {
  if (!isOpen) return null;
  return (
    <div className={`c-dropdown-menu anchor-${anchor.replace(' ', '-')} ${className}`}>
      {children}
    </div>
  );
}

export function DropdownItem({ href, children }: { href?: string; children: ReactNode }) {
  return (
    <a href={href || '#'} className="c-dropdown-item">
      {children}
    </a>
  );
}

export function DropdownLabel({ children }: { children: ReactNode }) {
  return <span className="c-dropdown-label">{children}</span>;
}

export function DropdownDivider() {
  return <hr className="c-dropdown-divider" />;
}
