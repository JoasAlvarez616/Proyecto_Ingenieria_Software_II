import { useState, useEffect } from 'react';
import { Search, ArrowLeft } from 'lucide-react';

const API_BASE_URL = 'http://localhost:8000';

export const NewReservation = ({ onBack }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  
  // Cliente
  const [documentoBusqueda, setDocumentoBusqueda] = useState('');
  const [clienteEncontrado, setClienteEncontrado] = useState(null);
  const [clienteNoEncontrado, setClienteNoEncontrado] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({
    nombre_completo: '',
    tipo_documento: 'cedula',
    numero_documento: '',
    telefono: '',
    email: '',
    direccion: ''
  });
  
  // Reserva
  const [rooms, setRooms] = useState([]);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [fechas, setFechas] = useState({ fecha_entrada: '', fecha_salida: '' });
  const [numeroHuespedes, setNumeroHuespedes] = useState(1);
  const [costoTotal, setCostoTotal] = useState(0);
  
  // Pago
  const [pago, setPago] = useState({
    monto: 0,
    metodo_pago: 'efectivo',
    tipo_pago: 'adelanto'
  });

  // Cargar habitaciones
  useEffect(() => {
    const loadRooms = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/rooms/?solo_activas=true`);
        if (res.ok) {
          const data = await res.json();
          setRooms(data);
        }
      } catch (error) {
        console.error('Error cargando habitaciones:', error);
      }
    };
    loadRooms();
  }, []);

  // Calcular costo total
  useEffect(() => {
    if (selectedRoom && fechas.fecha_entrada && fechas.fecha_salida) {
      const entrada = new Date(fechas.fecha_entrada);
      const salida = new Date(fechas.fecha_salida);
      const diffDays = Math.ceil((salida - entrada) / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        setCostoTotal(diffDays * selectedRoom.precio_base);
      } else {
        setCostoTotal(0);
      }
    }
  }, [fechas, selectedRoom]);

  const numeroNoches = fechas.fecha_entrada && fechas.fecha_salida
    ? Math.ceil((new Date(fechas.fecha_salida) - new Date(fechas.fecha_entrada)) / (1000 * 60 * 60 * 24))
    : 0;

  // Buscar cliente - CORREGIDO
const buscarCliente = async () => {
  if (!documentoBusqueda.trim()) {
    alert('Ingrese un número de documento');
    return;
  }
  
  setLoading(true);
  try {
    const res = await fetch(`${API_BASE_URL}/clients/buscar/${documentoBusqueda.trim()}`);
    
    if (res.status === 404) {
      setClienteEncontrado(null);
      setClienteNoEncontrado(true);
      return;
    }
    
    if (!res.ok) {
      throw new Error(`Error ${res.status}`);
    }
    
    const cliente = await res.json();
    
    // Si el cliente está inactivo, preguntar si reactivar
    if (cliente && cliente.id && cliente.activo === false) {
      const reactivar = confirm(
        `⚠️ El cliente "${cliente.nombre_completo}" está desactivado.\n\n¿Desea reactivarlo para poder hacer una nueva reserva?`
      );
      
      if (reactivar) {
        const reactRes = await fetch(`${API_BASE_URL}/clients/${cliente.id}/reactivar`, {
          method: 'PATCH'
        });
        if (reactRes.ok) {
          const clienteReactivado = await reactRes.json();
          setClienteEncontrado(clienteReactivado);
          setClienteNoEncontrado(false);
          alert(`✅ Cliente reactivado: ${clienteReactivado.nombre_completo}`);
        } else {
          alert('❌ Error al reactivar el cliente');
          setClienteEncontrado(null);
          setClienteNoEncontrado(true);
        }
      } else {
        setClienteEncontrado(null);
        setClienteNoEncontrado(true);
      }
      return;
    }
    
    // Cliente activo normal
    if (cliente && cliente.id) {
      setClienteEncontrado(cliente);
      setClienteNoEncontrado(false);
      alert(`✅ Cliente encontrado: ${cliente.nombre_completo}`);
    } else {
      setClienteEncontrado(null);
      setClienteNoEncontrado(true);
    }
  } catch (error) {
    console.error('Error al buscar cliente:', error);
    setClienteEncontrado(null);
    setClienteNoEncontrado(true);
  } finally {
    setLoading(false);
  }
};

  //Verificar Disponibilidad
  const verificarDisponibilidad = async () => {
  if (!selectedRoom) {
    alert('Seleccione una habitación');
    return;
  }
  
  if (!fechas.fecha_entrada || !fechas.fecha_salida) {
    alert('Complete las fechas');
    return;
  }
  
  // Validar que sea fecha válida
  const entradaDate = new Date(fechas.fecha_entrada);
  const salidaDate = new Date(fechas.fecha_salida);
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);
  
  if (isNaN(entradaDate.getTime()) || isNaN(salidaDate.getTime())) {
    alert('❌ Fechas inválidas');
    return;
  }
  
  if (salidaDate <= entradaDate) {
    alert('❌ La fecha de salida debe ser posterior a la fecha de entrada');
    return;
  }
  
  if (entradaDate < hoy) {
    alert('❌ No se pueden hacer reservas en fechas pasadas');
    return;
  }
  
  setLoading(true);
  try {
    // Formatear fechas manualmente YYYY-MM-DD
    const entradaAnio = entradaDate.getFullYear();
    const entradaMes = String(entradaDate.getMonth() + 1).padStart(2, '0');
    const entradaDia = String(entradaDate.getDate()).padStart(2, '0');
    const entradaFormateada = `${entradaAnio}-${entradaMes}-${entradaDia}`;
    
    const salidaAnio = salidaDate.getFullYear();
    const salidaMes = String(salidaDate.getMonth() + 1).padStart(2, '0');
    const salidaDia = String(salidaDate.getDate()).padStart(2, '0');
    const salidaFormateada = `${salidaAnio}-${salidaMes}-${salidaDia}`;
    
    console.log('Fechas formateadas:', { entrada: entradaFormateada, salida: salidaFormateada });
    
    const url = `${API_BASE_URL}/reservations/disponibilidad/${selectedRoom.id}?fecha_entrada=${entradaFormateada}&fecha_salida=${salidaFormateada}`;
    console.log('URL:', url);
    
    const res = await fetch(url);
    
    if (!res.ok) {
      const errorText = await res.text();
      console.error('Error respuesta:', errorText);
      alert(`Error del servidor: ${res.status}\n${errorText.substring(0, 100)}`);
      return;
    }
    
    const data = await res.json();
    console.log('Respuesta:', data);
    
    if (data.disponible === true) {
      setStep(3);
    } else {
      alert('❌ La habitación no está disponible en esas fechas');
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Error de conexión con el servidor: ' + error.message);
  } finally {
    setLoading(false);
  }
};

  // Crear reserva
  const crearReserva = async () => {
    setLoading(true);
    try {
      let clienteId = clienteEncontrado?.id;
      
      if (clienteNoEncontrado && !clienteEncontrado) {
        const res = await fetch(`${API_BASE_URL}/clients/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nombre_completo: nuevoCliente.nombre_completo,
            tipo_documento: nuevoCliente.tipo_documento,
            numero_documento: nuevoCliente.numero_documento,
            telefono: nuevoCliente.telefono,
            email: nuevoCliente.email || null,
            direccion: nuevoCliente.direccion || null
          })
        });
        
        if (!res.ok) {
          throw new Error('Error al crear cliente');
        }
        
        const clientData = await res.json();
        clienteId = clientData.id;
      }

      const reservaRes = await fetch(`${API_BASE_URL}/reservations/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          habitacion_id: selectedRoom.id,
          cliente_id: clienteId,
          fecha_entrada: fechas.fecha_entrada.split('T')[0],
          fecha_salida: fechas.fecha_salida.split('T')[0],
          numero_huespedes: numeroHuespedes,
          estado: pago.tipo_pago === 'adelanto' && pago.monto > 0 ? 'confirmada' : 'pendiente'
        })
      });
      
      if (!reservaRes.ok) {
        throw new Error('Error al crear reserva');
      }
      
      const reserva = await reservaRes.json();

      if (pago.monto > 0) {
        await fetch(`${API_BASE_URL}/payments/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            reserva_id: reserva.id,
            monto: pago.monto,
            metodo_pago: pago.metodo_pago,
            tipo_pago: pago.tipo_pago
          })
        });
      }

      alert('✅ Reserva creada exitosamente');
      onBack();
    } catch (error) {
      console.error('Error al crear reserva:', error);
      alert('❌ Error al crear la reserva');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 md:p-8 max-w-4xl mx-auto">
      <button onClick={onBack} className="mb-6 flex items-center gap-2 text-[#1E4A4A] hover:text-[#C49A6C]">
        <ArrowLeft className="w-5 h-5" /> Volver al inicio
      </button>

      <h1 className="font-serif text-3xl text-[#1E4A4A] mb-6">➕ Nueva Reserva</h1>

      {/* Pasos */}
      <div className="flex justify-between mb-8">
        {[1, 2, 3].map(s => (
          <div key={s} className="flex-1 text-center">
            <div className={`w-10 h-10 rounded-full mx-auto flex items-center justify-center font-bold ${step >= s ? 'bg-[#1E4A4A] text-white' : 'bg-gray-200 text-gray-500'}`}>
              {s}
            </div>
            <p className="text-sm mt-2">{s === 1 ? 'Cliente' : s === 2 ? 'Habitación' : 'Pago'}</p>
          </div>
        ))}
      </div>

      {/* Paso 1: Cliente */}
      {step === 1 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">👤 Buscar o registrar cliente</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Buscar por documento</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={documentoBusqueda}
                onChange={e => setDocumentoBusqueda(e.target.value)}
                placeholder="Número de cédula o pasaporte"
                className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C49A6C]"
              />
              <button
                onClick={buscarCliente}
                disabled={loading}
                className="px-6 py-2 bg-[#1E4A4A] text-white rounded-lg hover:bg-[#C49A6C] transition disabled:opacity-50"
              >
                <Search className="w-5 h-5" />
              </button>
            </div>
          </div>

          {clienteEncontrado && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <p className="font-semibold">✅ Cliente encontrado</p>
              <p>{clienteEncontrado.nombre_completo}</p>
              <p className="text-sm text-gray-600">📞 {clienteEncontrado.telefono}</p>
              {clienteEncontrado.email && <p className="text-sm text-gray-600">✉️ {clienteEncontrado.email}</p>}
            </div>
          )}

          {clienteNoEncontrado && !clienteEncontrado && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <p className="font-semibold text-yellow-800 mb-3">⚠️ Cliente no encontrado - Complete sus datos:</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <input
                  type="text"
                  placeholder="Nombre completo*"
                  value={nuevoCliente.nombre_completo}
                  onChange={e => setNuevoCliente({...nuevoCliente, nombre_completo: e.target.value})}
                  className="px-3 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Número de documento*"
                  value={nuevoCliente.numero_documento}
                  onChange={e => setNuevoCliente({...nuevoCliente, numero_documento: e.target.value})}
                  className="px-3 py-2 border rounded-lg"
                />
                <input
                  type="tel"
                  placeholder="Teléfono*"
                  value={nuevoCliente.telefono}
                  onChange={e => setNuevoCliente({...nuevoCliente, telefono: e.target.value})}
                  className="px-3 py-2 border rounded-lg"
                />
                <select
                  value={nuevoCliente.tipo_documento}
                  onChange={e => setNuevoCliente({...nuevoCliente, tipo_documento: e.target.value})}
                  className="px-3 py-2 border rounded-lg"
                >
                  <option value="cedula">Cédula</option>
                  <option value="pasaporte">Pasaporte</option>
                </select>
                <input
                  type="email"
                  placeholder="Correo electrónico"
                  value={nuevoCliente.email}
                  onChange={e => setNuevoCliente({...nuevoCliente, email: e.target.value})}
                  className="px-3 py-2 border rounded-lg"
                />
                <input
                  type="text"
                  placeholder="Dirección"
                  value={nuevoCliente.direccion}
                  onChange={e => setNuevoCliente({...nuevoCliente, direccion: e.target.value})}
                  className="px-3 py-2 border rounded-lg"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2">* Campos obligatorios</p>
            </div>
          )}

          <button
            onClick={() => setStep(2)}
            disabled={!clienteEncontrado && !nuevoCliente.nombre_completo}
            className="w-full mt-4 px-6 py-3 bg-[#C49A6C] text-white rounded-lg hover:bg-[#1E4A4A] transition disabled:opacity-50"
          >
            Continuar →
          </button>
        </div>
      )}

      {/* Paso 2: Habitación y fechas */}
      {step === 2 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">🛏️ Seleccionar habitación y fechas</h2>
          
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Habitación</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {rooms.map(room => (
                <button
                  key={room.id}
                  onClick={() => setSelectedRoom(room)}
                  className={`p-3 border rounded-lg text-left transition ${
                    selectedRoom?.id === room.id 
                      ? 'border-[#C49A6C] bg-[#C49A6C]/10 ring-2 ring-[#C49A6C]' 
                      : 'hover:border-gray-300'
                  }`}
                >
                  <div className="font-semibold">#{room.numero}</div>
                  <div className="text-sm text-gray-500">{room.tipo}</div>
                  <div className="text-sm font-bold text-[#1E4A4A]">${room.precio_base}/noche</div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-2">Fecha de entrada</label>
              <input
                type="date"
                value={fechas.fecha_entrada}
                min={new Date().toISOString().split('T')[0]}
                onChange={e => setFechas({...fechas, fecha_entrada: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C49A6C]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Fecha de salida</label>
              <input
                type="date"
                value={fechas.fecha_salida}
                min={fechas.fecha_entrada}
                onChange={e => setFechas({...fechas, fecha_salida: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C49A6C]"
              />
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Número de huéspedes</label>
            <input
              type="number"
              min="1"
              max="10"
              value={numeroHuespedes}
              onChange={e => setNumeroHuespedes(parseInt(e.target.value))}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C49A6C]"
            />
          </div>

          {selectedRoom && fechas.fecha_entrada && fechas.fecha_salida && numeroNoches > 0 && (
            <div className="bg-[#1E4A4A]/5 p-4 rounded-lg mb-4">
              <p className="font-semibold text-[#1E4A4A]">📊 Resumen</p>
              <p className="text-sm">{numeroNoches} noche(s) × ${selectedRoom.precio_base} = <span className="font-bold">${costoTotal}</span></p>
            </div>
          )}

          {selectedRoom && fechas.fecha_entrada && fechas.fecha_salida && numeroNoches <= 0 && (
            <div className="bg-red-50 p-4 rounded-lg mb-4 text-red-600">
              ⚠️ Las fechas no son válidas. La salida debe ser después de la entrada.
            </div>
          )}

          <button
            onClick={verificarDisponibilidad}
            disabled={!selectedRoom || !fechas.fecha_entrada || !fechas.fecha_salida || numeroNoches <= 0 || loading}
            className="w-full px-6 py-3 bg-[#C49A6C] text-white rounded-lg hover:bg-[#1E4A4A] transition disabled:opacity-50"
          >
            {loading ? 'Verificando disponibilidad...' : 'Continuar →'}
          </button>
        </div>
      )}

      {/* Paso 3: Pago */}
      {step === 3 && (
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-4">💵 Registrar pago</h2>

          <div className="bg-gray-50 p-4 rounded-lg mb-4">
            <p className="font-semibold text-[#1E4A4A]">Resumen de reserva</p>
            <p className="text-sm">Habitación #{selectedRoom?.numero} ({selectedRoom?.tipo})</p>
            <p className="text-sm">{fechas.fecha_entrada} → {fechas.fecha_salida} ({numeroNoches} noches)</p>
            <p className="text-xl font-bold mt-2">Total: ${costoTotal}</p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Monto a pagar</label>
            <input
              type="number"
              value={pago.monto}
              onChange={e => setPago({...pago, monto: parseInt(e.target.value) || 0})}
              placeholder="0"
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C49A6C]"
            />
            <p className="text-xs text-gray-500 mt-1">Monto máximo: ${costoTotal}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Método de pago</label>
              <select
                value={pago.metodo_pago}
                onChange={e => setPago({...pago, metodo_pago: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C49A6C]"
              >
                <option value="efectivo">Efectivo</option>
                <option value="tarjeta">Tarjeta</option>
                <option value="transferencia">Transferencia</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Tipo de pago</label>
              <select
                value={pago.tipo_pago}
                onChange={e => setPago({...pago, tipo_pago: e.target.value})}
                className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-[#C49A6C]"
              >
                <option value="adelanto">Adelanto (confirma reserva)</option>
                <option value="pago_parcial">Pago parcial</option>
                <option value="pago_total">Pago total</option>
              </select>
            </div>
          </div>

          <button
            onClick={crearReserva}
            disabled={loading}
            className="w-full px-6 py-3 bg-[#1E4A4A] text-white rounded-lg hover:bg-[#C49A6C] transition disabled:opacity-50"
          >
            {loading ? 'Creando reserva...' : '✅ Confirmar reserva'}
          </button>
        </div>
      )}
    </div>
  );
};