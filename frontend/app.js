// URL base de tu backend FastAPI
const API_URL = 'http://localhost:8000';

document.addEventListener('DOMContentLoaded', () => {
    // Cargar dashboard por defecto al iniciar
    loadDashboard(); // La función loadDashboard ahora se encarga de activar su propio nav item
});

function updateActiveNav(elementIdToActivate = null) {
    document.querySelectorAll('.nav-item').forEach(el => el.classList.remove('active'));
    if (elementIdToActivate) {
        const targetElement = document.getElementById(elementIdToActivate);
        if (targetElement) {
            targetElement.classList.add('active');
        }
    }
}

// --- FUNCIONES DE UTILIDAD ---
async function fetchAndRenderContent(endpoint, title, renderFunction) {
    document.getElementById('page-title').textContent = title;
    const contentArea = document.getElementById('content-area');
    contentArea.innerHTML = '<p style="color: var(--color-text-muted);">Cargando...</p>'; // Mensaje de carga genérico

    try {
        const response = await fetch(`${API_URL}${endpoint}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        contentArea.innerHTML = renderFunction(data); // Llama a la función de renderizado específica
    } catch (error) {
        console.error(`Error fetching ${endpoint}:`, error);
        contentArea.innerHTML = `<p style="color: red;">Error al conectar con el servidor o al cargar datos: ${error.message}. ¿Está FastAPI encendido en el puerto 8000?</p>`;
    }
}

// --- VISTA DASHBOARD ---
async function loadDashboard() {
    updateActiveNav('nav-dashboard'); // Asumiendo que el elemento de navegación del dashboard tiene id="nav-dashboard"
    await fetchAndRenderContent(
        '/reports/ingresos',
        'Resumen General',
        (data) => `
            <div class="dashboard-grid">
                <div class="card">
                    <h3>Ingresos Netos</h3>
                    <p>$${data.resumen_ingresos.ingresos_netos.toLocaleString()}</p>
                </div>
                <div class="card">
                    <h3>Total Reservas</h3>
                    <p>${data.resumen_reservas.total}</p>
                </div>
                <div class="card">
                    <h3>Habitaciones Activas</h3>
                    <p>${data.estadisticas.total_habitaciones_activas}</p>
                </div>
                <div class="card">
                    <h3>Promedio Noches</h3>
                    <p>${data.estadisticas.promedio_noches_por_reserva}</p>
                </div>
            </div>
        `
    );
}

// --- VISTA HABITACIONES ---
async function loadRooms() {
    updateActiveNav('nav-rooms'); // Asumiendo que el elemento de navegación de habitaciones tiene id="nav-rooms"
    await fetchAndRenderContent(
        '/rooms/',
        'Habitaciones Disponibles',
        (rooms) => {
            let html = '<div class="rooms-grid">';
            if (rooms.length === 0) {
                html = '<p style="color: var(--color-text-muted);">No hay habitaciones registradas.</p>';
            } else {
                rooms.forEach(room => {
                    html += `
                    <div class="card">
                        <h3>Habitación ${room.numero}</h3>
                        <p style="font-size: 1.5rem; margin-bottom: 0.5rem;">$${room.precio_base} <span style="font-size:0.875rem; color:var(--color-text-muted);">/noche</span></p>
                        <div style="font-size: 0.875rem; color: var(--color-text-muted); display:flex; flex-direction:column; gap:0.25rem;">
                            <span>Tipo: <strong style="color:var(--color-text-main); text-transform:capitalize;">${room.tipo}</strong></span>
                            <span>Capacidad: <strong style="color:var(--color-text-main);">${room.capacidad} pers.</strong></span>
                            <span>Estado: <strong style="color:var(--color-text-main); text-transform:capitalize;">${room.estado}</strong></span>
                        </div>
                    </div>
                `;
                });
                html += '</div>';
            }
            return html;
        }
    );
}

// --- VISTA CLIENTES (Ejemplo de nueva vista) ---
async function loadClients() {
    updateActiveNav('nav-clients'); // Asumiendo que el elemento de navegación de clientes tiene id="nav-clients"
    await fetchAndRenderContent(
        '/clients/',
        'Gestión de Clientes',
        (clients) => {
            let html = '<div class="clients-list">';
            if (clients.length === 0) {
                html = '<p style="color: var(--color-text-muted);">No hay clientes registrados.</p>';
            } else {
                html += `
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Nombre Completo</th>
                                <th>Documento</th>
                                <th>Teléfono</th>
                                <th>Email</th>
                                <th>Activo</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                clients.forEach(client => {
                    html += `
                        <tr>
                            <td>${client.id}</td>
                            <td>${client.nombre_completo}</td>
                            <td>${client.tipo_documento.toUpperCase()}: ${client.numero_documento}</td>
                            <td>${client.telefono}</td>
                            <td>${client.email || 'N/A'}</td>
                            <td>${client.activo ? 'Sí' : 'No'}</td>
                        </tr>
                    `;
                });
                html += `
                        </tbody>
                    </table>
                `;
            }
            return html;
        }
    );
}
// --- FIN VISTA CLIENTES ---

// --- VISTA RESERVAS ---
async function loadReservations() {
    updateActiveNav('nav-reservations'); // Asumiendo que el elemento de navegación de reservas tiene id="nav-reservations"
    await fetchAndRenderContent(
        '/reservations/',
        'Gestión de Reservas',
        (reservations) => {
            let html = '<div class="reservations-list">';
            if (reservations.length === 0) {
                html = '<p style="color: var(--color-text-muted);">No hay reservas registradas.</p>';
            } else {
                html += `
                    <table>
                        <thead>
                            <tr>
                                <th>ID</th>
                                <th>Cliente (ID)</th>
                                <th>Habitación (ID)</th>
                                <th>Entrada</th>
                                <th>Salida</th>
                                <th>Noches</th>
                                <th>Costo Total</th>
                                <th>Pagado</th>
                                <th>Saldo</th>
                                <th>Estado</th>
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                `;
                reservations.forEach(reservation => {
                    const saldoPendiente = (reservation.costo_total - reservation.monto_pagado).toFixed(2);
                    const estadoClase = reservation.estado.replace(/_/g, '-'); // Para estilos CSS si los tienes
                    html += `
                        <tr>
                            <td>${reservation.id}</td>
                            <td>${reservation.cliente_id}</td>
                            <td>${reservation.habitacion_id}</td>
                            <td>${new Date(reservation.fecha_entrada).toLocaleDateString()}</td>
                            <td>${new Date(reservation.fecha_salida).toLocaleDateString()}</td>
                            <td>${reservation.numero_noches}</td>
                            <td>$${reservation.costo_total.toLocaleString()}</td>
                            <td>$${reservation.monto_pagado.toLocaleString()}</td>
                            <td style="color: ${saldoPendiente > 0 ? 'var(--color-danger)' : 'var(--color-success)'};">$${saldoPendiente}</td>
                            <td><span class="status-badge status-${estadoClase}">${reservation.estado.replace(/_/g, ' ')}</span></td>
                            <td>
                                <button class="btn-small btn-info" onclick="viewReservationDetails(${reservation.id})">Ver</button>
                                <button class="btn-small btn-warning" onclick="editReservation(${reservation.id})">Editar</button>
                            </td>
                        </tr>
                    `;
                });
                html += `
                        </tbody>
                    </table>
                `;
            }
            return html;
        }
    );
}
// --- FIN VISTA CLIENTES ---

// Para que los nuevos enlaces de navegación funcionen, asegúrate de que tu HTML tenga elementos como:
/*
<nav>
    <ul>
        <li class="nav-item" id="nav-dashboard" onclick="loadDashboard()">Dashboard</li>
        <li class="nav-item" id="nav-rooms" onclick="loadRooms()">Habitaciones</li>
        <li class="nav-item" id="nav-clients" onclick="loadClients()">Clientes</li>
        <li class="nav-item" id="nav-reservations" onclick="loadReservations()">Reservas</li>
    </ul>
</nav>
*/