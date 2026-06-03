import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  totalItems?: number;
  limit?: number;
}

export function Pagination({ currentPage, totalPages, onPageChange, totalItems, limit }: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '12px 16px',
      borderTop: '1px solid var(--border-color)',
      backgroundColor: 'var(--bg-secondary)',
      flexWrap: 'wrap',
      gap: '12px'
    }}>
      <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
        {totalItems !== undefined && limit !== undefined ? (
          <span>
            Mostrando {Math.min((currentPage - 1) * limit + 1, totalItems)} - {Math.min(currentPage * limit, totalItems)} de {totalItems}
          </span>
        ) : (
          <span>Página {currentPage} de {Math.max(totalPages, 1)}</span>
        )}
      </div>

      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          className="btn-secondary"
          style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
        >
          <ChevronLeft size={16} />
          Anterior
        </button>
        
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 8px', fontSize: '0.875rem', fontWeight: 500 }}>
          {currentPage} / {Math.max(totalPages, 1)}
        </div>

        <button
          className="btn-secondary"
          style={{ padding: '6px 12px', display: 'flex', alignItems: 'center', gap: '4px' }}
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
        >
          Siguiente
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}
