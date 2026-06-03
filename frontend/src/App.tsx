import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Rooms } from './pages/Rooms';
import { Clients } from './pages/Clients';
import { Reservations } from './pages/Reservations';
import { Payments } from './pages/Payments';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { Profile } from './pages/Profile';
import { PrivateRoute } from './components/PrivateRoute';

import { Toaster } from 'react-hot-toast';

function App() {
  return (
    <Router>
      <Toaster position="bottom-right" toastOptions={{ style: { background: '#333', color: '#fff' } }} />
      <Routes>
        {/* Ruta pública del Login */}
        <Route path="/login" element={<Login />} />

        {/* Rutas protegidas bajo el Layout */}
        <Route
          element={
            <PrivateRoute>
              <Layout>
                <Outlet />
              </Layout>
            </PrivateRoute>
          }
        >
          <Route path="/" element={<Dashboard />} />
          <Route path="/rooms" element={<Rooms />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/reservations" element={<Reservations />} />
          <Route path="/payments" element={<Payments />} />
          <Route
            path="/settings"
            element={
              <PrivateRoute roles={['admin']}>
                <Settings />
              </PrivateRoute>
            }
          />
          <Route path="/profile" element={<Profile />} />
          <Route
            path="/reports"
            element={
              <PrivateRoute roles={['admin']}>
                <Reports />
              </PrivateRoute>
            }
          />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
