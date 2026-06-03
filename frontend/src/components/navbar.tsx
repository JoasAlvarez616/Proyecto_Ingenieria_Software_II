import React, { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

export function Navbar({ children }: { children: ReactNode }) {
  return <nav className="c-navbar">{children}</nav>;
}

export function NavbarSpacer() {
  return <div className="c-navbar-spacer" />;
}

export function NavbarSection({ children }: { children: ReactNode }) {
  return <div className="c-navbar-section">{children}</div>;
}

export function NavbarItem({ href, children, ...props }: any) {
  if (href) {
    return (
      <NavLink to={href} className="c-navbar-item" {...props}>
        {children}
      </NavLink>
    );
  }
  return (
    <button className="c-navbar-item" {...props}>
      {children}
    </button>
  );
}
