import { TrendingUp, TrendingDown } from 'lucide-react';

export const StatCard = ({ titulo, valor, icono: Icono, cambio, color }) => {
  return (
    <div className="stat-card group cursor-pointer hover:scale-105 transition-transform">
      <div className="flex justify-between items-start">
        <div>
          <p className="text-gray-500 text-sm font-medium mb-1">{titulo}</p>
          <p className="text-3xl font-bold text-gray-800">{valor}</p>
          {cambio && (
            <div className="flex items-center gap-1 mt-2">
              {cambio > 0 ? (
                <TrendingUp className="w-4 h-4 text-green-600" />
              ) : (
                <TrendingDown className="w-4 h-4 text-red-600" />
              )}
              <span className={`text-sm ${cambio > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {Math.abs(cambio)}% desde ayer
              </span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color}`}>
          <Icono className="w-6 h-6 text-white" />
        </div>
      </div>
    </div>
  );
};