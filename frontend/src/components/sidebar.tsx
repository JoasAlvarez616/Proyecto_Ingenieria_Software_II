import React, { ReactNode } from 'react';
import { NavLink } from 'react-router-dom';

export function Sidebar({ children, className = '', ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return <nav className={`c-sidebar ${className}`} {...props}>{children}</nav>;
}

export function SidebarHeader({ children, className = '', ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return <div className={`c-sidebar-header ${className}`} {...props}>{children}</div>;
}

export function SidebarBody({ children, className = '', ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return <div className={`c-sidebar-body ${className}`} {...props}>{children}</div>;
}

export function SidebarFooter({ children, className = '', ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return <div className={`c-sidebar-footer ${className}`} {...props}>{children}</div>;
}

export function SidebarSection({ children, className = '', ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return <div className={`c-sidebar-section ${className}`} {...props}>{children}</div>;
}

export function SidebarHeading({ children, className = '', ...props }: React.ComponentPropsWithoutRef<'h3'>) {
  return <h3 className={`c-sidebar-heading ${className}`} {...props}>{children}</h3>;
}

export function SidebarItem({ href, children, className = '', ...props }: any) {
  if (href) {
    return (
      <NavLink to={href} className={({ isActive }) => `c-sidebar-item ${isActive ? 'active' : ''} ${className}`} {...props}>
        {children}
      </NavLink>
    );
  }
  return (
    <button className={`c-sidebar-item ${className}`} {...props}>
      {children}
    </button>
  );
}

export function SidebarLabel({ children, className = '', ...props }: React.ComponentPropsWithoutRef<'span'>) {
  return <span className={`c-sidebar-label ${className}`} {...props}>{children}</span>;
}

export function SidebarSpacer({ className = '', ...props }: React.ComponentPropsWithoutRef<'div'>) {
  return <div className={`c-sidebar-spacer ${className}`} {...props} />;
}
