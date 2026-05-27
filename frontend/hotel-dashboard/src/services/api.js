const API_BASE_URL = 'http://localhost:8000';

export const api = {
  getIngresos: (fechaInicio, fechaFin) =>
    fetch(`${API_BASE_URL}/reports/ingresos?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`)
      .then(res => res.json()),
  
  getRooms: () =>
    fetch(`${API_BASE_URL}/rooms/?solo_activas=true`)
      .then(res => res.json()),
  
  getReservasRecientes: () =>
    fetch(`${API_BASE_URL}/reservations/`)
      .then(res => res.json()),

  getCliente: (documento) =>
    fetch(`${API_BASE_URL}/clients/buscar/${documento}`)
      .then(res => res.json())


};