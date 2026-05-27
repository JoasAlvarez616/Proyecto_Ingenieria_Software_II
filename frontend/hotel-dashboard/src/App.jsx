import { useState } from 'react';
import { Dashboard } from './pages/Dashboard';
import { Calendar } from './pages/Calendar';
import { NewReservation } from './pages/NewReservation';

function App() {
  const [activePage, setActivePage] = useState('dashboard');

  const renderPage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'calendar':
        return <Calendar />;
      case 'new-reservation':
        return <NewReservation onBack={() => setActivePage('dashboard')} />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <nav className="bg-[#1E4A4A] text-white p-4">
        <div className="container mx-auto flex justify-center gap-6 flex-wrap">
          <button 
            onClick={() => setActivePage('dashboard')}
            className={`px-4 py-2 rounded-lg transition ${activePage === 'dashboard' ? 'bg-[#C49A6C]' : 'hover:bg-[#C49A6C]/50'}`}
          >
            📊 Dashboard
          </button>
          <button 
            onClick={() => setActivePage('calendar')}
            className={`px-4 py-2 rounded-lg transition ${activePage === 'calendar' ? 'bg-[#C49A6C]' : 'hover:bg-[#C49A6C]/50'}`}
          >
            📅 Calendario
          </button>
          <button 
            onClick={() => setActivePage('new-reservation')}
            className={`px-4 py-2 rounded-lg transition ${activePage === 'new-reservation' ? 'bg-[#C49A6C]' : 'hover:bg-[#C49A6C]/50'}`}
          >
            ➕ Nueva Reserva
          </button>
        </div>
      </nav>

      {renderPage()}
    </div>
  );
}

export default App;