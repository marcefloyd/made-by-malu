import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, deleteDoc, doc, onSnapshot, query, orderBy, where, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
apiKey: "AIzaSyBHtfAQOCCAGudGAJiEWrEmy8Uq9b0U4qc",
authDomain: "madebymalu.firebaseapp.com",
projectId: "madebymalu",
storageBucket: "madebymalu.firebasestorage.app",
messagingSenderId: "622803417119",
appId: "1:622803417119:web:a2dddb3b8acd771b80bd2a",
measurementId: "G-FN0QSYRJLV"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const loginSection = document.getElementById('login-section');
const dashboardSection = document.getElementById('dashboard-section');
const loginForm = document.getElementById('login-form');
const loginError = document.getElementById('login-error');
const logoutBtn = document.getElementById('logout-btn');
const turnoForm = document.getElementById('turno-form');
const turnosTabla = document.getElementById('turnos-tabla');
const tituloTablaTurnos = document.getElementById('titulo-tabla-turnos');
const servicioSelect = document.getElementById('servicio');
const talleContainer = document.getElementById('talle-container');
const buscadorCelular = document.getElementById('buscador-celular');
const btnBuscar = document.getElementById('btn-buscar');
const btnLimpiar = document.getElementById('btn-limpiar');
const historialTabla = document.getElementById('historial-tabla');

const btnToggleCalendario = document.getElementById('btn-toggle-calendario');
const calendarioContainer = document.getElementById('calendario-container');
const iconoFlecha = document.getElementById('icono-flecha');
const mesAnioTitulo = document.getElementById('mes-anio-titulo');
const calendarioGrid = document.getElementById('calendario-grid');
const btnMesAnterior = document.getElementById('mes-anterior');
const btnMesSiguiente = document.getElementById('mes-siguiente');

let fechaActualCalendario = new Date();
let listaTurnosCache = [];
let filtroActualTurnos = 'todos';

// CONFIGURACIÓN DEL MODO CLARO / OSCURO DESDE JS
const htmlElement = document.documentElement;
const themeToggleBtn = document.getElementById('theme-toggle-btn');

if (themeToggleBtn) {
    if (localStorage.getItem('theme') === 'dark' || (!('theme' in localStorage) && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        htmlElement.classList.add('dark');
        themeToggleBtn.textContent = '☀️';
    } else {
        htmlElement.classList.remove('dark');
        themeToggleBtn.textContent = '🌙';
    }

    themeToggleBtn.addEventListener('click', () => {
        if (htmlElement.classList.contains('dark')) {
            htmlElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
            themeToggleBtn.textContent = '🌙';
        } else {
            htmlElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
            themeToggleBtn.textContent = '☀️';
        }
    });
}

btnToggleCalendario.addEventListener('click', () => {
    calendarioContainer.classList.toggle('hidden');
    if (calendarioContainer.classList.contains('hidden')) {
        iconoFlecha.textContent = "▼";
    } else {
        iconoFlecha.textContent = "▲";
        renderizarCalendario();
    }
});

btnMesAnterior.addEventListener('click', () => {
    fechaActualCalendario.setMonth(fechaActualCalendario.getMonth() - 1);
    renderizarCalendario();
});

btnMesSiguiente.addEventListener('click', () => {
    fechaActualCalendario.setMonth(fechaActualCalendario.getMonth() + 1);
    renderizarCalendario();
});

servicioSelect.addEventListener('change', () => {
    if (servicioSelect.value.includes('Press On')) {
        talleContainer.classList.remove('hidden');
    } else {
        talleContainer.classList.add('hidden');
    }
});

onAuthStateChanged(auth, (user) => {
    if (user) {
        loginSection.classList.add('hidden');
        dashboardSection.classList.remove('hidden');
        cargarTurnosEnTiempoReal();
    } else {
        loginSection.classList.remove('hidden');
        dashboardSection.classList.add('hidden');
    }
});

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    loginError.textContent = '';

    try {
        await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
        loginError.textContent = "Error: Verifique su correo o contraseña.";
        console.error(error);
    }
});

logoutBtn.addEventListener('click', async () => {
    await signOut(auth);
});

turnoForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const nombre = document.getElementById('cliente-nombre').value;
    const celular = document.getElementById('cliente-celular').value;
    const notas = document.getElementById('cliente-notas').value || "Sin notas";
    let servicio = servicioSelect.value;
    const adicional = document.getElementById('adicional').value;
    const fechaHora = document.getElementById('fecha-hora').value;

    if (servicio.includes('Press On')) {
        const talle = document.getElementById('talle-presson').value;
        servicio += ` (${talle})`;
    }

    if (adicional && adicional !== 'Ninguno') {
        servicio += ` + ${adicional}`;
    }

    try {
        await addDoc(collection(db, "turnos"), {
            cliente: nombre,
            celular: celular,
            servicio: servicio,
            notas: notas,
            fechaHora: fechaHora,
            creado: new Date()
        });
        turnoForm.reset();
        talleContainer.classList.add('hidden');
    } catch (error) {
        console.error("Error al guardar turno: ", error);
        alert("Hubo un error al guardar el turno.");
    }
});

function cargarTurnosEnTiempoReal() {
    const q = query(collection(db, "turnos"), orderBy("fechaHora", "asc"));
    onSnapshot(q, (snapshot) => {
        listaTurnosCache = [];
        if (!snapshot.empty) {
            snapshot.forEach((docSnap) => {
                listaTurnosCache.push({ id: docSnap.id, ...docSnap.data() });
            });
        }
        
        pintarTablaTurnos();
        if (!calendarioContainer.classList.contains('hidden')) {
            renderizarCalendario();
        }
    });
}

window.filtrarTurnos = function(tipo) {
    filtroActualTurnos = tipo;
    
    ['todos', 'hoy', 'semana'].forEach(t => {
        const btn = document.getElementById(`btn-filtro-${t}`);
        if (t === tipo) {
            btn.className = "bg-pink-600 text-white px-3 py-1.5 rounded-md font-medium";
        } else {
            btn.className = "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 px-3 py-1.5 rounded-md hover:bg-gray-200 dark:hover:bg-gray-600 font-medium";
        }
    });

    if (tipo === 'todos') tituloTablaTurnos.textContent = "Próximos Turnos (General)";
    if (tipo === 'hoy') tituloTablaTurnos.textContent = "Turnos de Hoy";
    if (tipo === 'semana') tituloTablaTurnos.textContent = "Turnos (Próximos 7 Días)";

    pintarTablaTurnos();
}

function pintarTablaTurnos() {
    turnosTabla.innerHTML = "";
    
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    
    const finSemana = new Date();
    finSemana.setDate(hoy.getDate() + 7);
    finSemana.setHours(23, 59, 59, 999);

    const turnosFiltrados = listaTurnosCache.filter(turno => {
        const fTurno = new Date(turno.fechaHora);
        if (filtroActualTurnos === 'hoy') {
            return fTurno.getDate() === hoy.getDate() && fTurno.getMonth() === hoy.getMonth() && fTurno.getFullYear() === hoy.getFullYear();
        }
        if (filtroActualTurnos === 'semana') {
            return fTurno >= hoy && fTurno <= finSemana;
        }
        return true;
    });

    if (turnosFiltrados.length === 0) {
        const trVacio = document.createElement('tr');
        const tdVacio = document.createElement('td');
        tdVacio.colSpan = 4;
        tdVacio.className = "px-4 py-4 text-center text-gray-500 dark:text-gray-400";
        tdVacio.textContent = "No hay turnos para este filtro.";
        trVacio.appendChild(tdVacio);
        turnosTabla.appendChild(trVacio);
        return;
    }

    turnosFiltrados.forEach((turno) => {
        const fechaFormateada = new Date(turno.fechaHora).toLocaleString('es-ES', {
            dateStyle: 'medium',
            timeStyle: 'short'
        });

        const celularLimpio = turno.celular.replace(/\D/g, '');
        const mensajeWp = encodeURIComponent(`¡Hola ${turno.cliente}! Te escribo de Made by Malu para recordarte tu turno de ${turno.servicio} el ${fechaFormateada}. 💅✨`);
        const urlWhatsApp = `https://wa.me/${celularLimpio}?text=${mensajeWp}`;

        const tr = document.createElement('tr');

        // Celda Clienta / Celular
        const tdClienta = document.createElement('td');
        tdClienta.className = "px-3 py-3 font-semibold text-gray-950 dark:text-gray-100";
        const spanNombre = document.createElement('span');
        spanNombre.textContent = turno.cliente;
        tdClienta.appendChild(spanNombre);
        tdClienta.appendChild(document.createElement('br'));
        const aWp = document.createElement('a');
        aWp.href = urlWhatsApp;
        aWp.target = "_blank";
        aWp.className = "text-xs text-green-600 dark:text-green-400 hover:underline font-bold";
        aWp.textContent = `📱 ${turno.celular}`;
        tdClienta.appendChild(aWp);
        tr.appendChild(tdClienta);

        // Celda Servicio / Notas
        const tdServicio = document.createElement('td');
        tdServicio.className = "px-3 py-3 text-gray-800 dark:text-gray-200";
        const spanServ = document.createElement('span');
        spanServ.textContent = turno.servicio;
        tdServicio.appendChild(spanServ);
        tdServicio.appendChild(document.createElement('br'));
        const spanNotas = document.createElement('span');
        spanNotas.className = "text-xs text-pink-600 dark:text-pink-400 italic font-medium";
        spanNotas.textContent = `📝 ${turno.notas || 'Sin notas'}`;
        tdServicio.appendChild(spanNotas);
        tr.appendChild(tdServicio);

        // Celda Fecha
        const tdFecha = document.createElement('td');
        tdFecha.className = "px-3 py-3 text-gray-800 dark:text-gray-200 font-medium";
        tdFecha.textContent = fechaFormateada;
        tr.appendChild(tdFecha);

        // Celda Acciones
        const tdAcciones = document.createElement('td');
        tdAcciones.className = "px-3 py-3 text-right space-x-1";

        const btnHistorial = document.createElement('button');
        btnHistorial.className = "text-blue-600 dark:text-blue-400 hover:underline font-semibold text-xs bg-blue-50 dark:bg-blue-950 px-2 py-1 rounded";
        btnHistorial.textContent = "Historial";
        btnHistorial.onclick = () => window.verHistorialPorCelular(turno.celular);

        const btnCompletar = document.createElement('button');
        btnCompletar.className = "text-green-600 dark:text-green-400 hover:underline font-semibold text-xs bg-green-50 dark:bg-green-950 px-2 py-1 rounded";
        btnCompletar.textContent = "Completar";
        btnCompletar.onclick = () => window.completarTurno(turno.id, turno.cliente, turno.celular, turno.servicio, turno.notas, turno.fechaHora);

        const btnCancelar = document.createElement('button');
        btnCancelar.className = "text-red-600 dark:text-red-400 hover:underline font-semibold text-xs bg-red-50 dark:bg-red-950 px-2 py-1 rounded";
        btnCancelar.textContent = "Cancelar";
        btnCancelar.onclick = () => window.cancelarTurno(turno.id);

        tdAcciones.appendChild(btnHistorial);
        tdAcciones.appendChild(btnCompletar);
        tdAcciones.appendChild(btnCancelar);
        tr.appendChild(tdAcciones);

        turnosTabla.appendChild(tr);
    });
}

function renderizarCalendario() {
    calendarioGrid.innerHTML = "";
    const anio = fechaActualCalendario.getFullYear();
    const mes = fechaActualCalendario.getMonth();

    const nombresMeses = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    mesAnioTitulo.textContent = `${nombresMeses[mes]} ${anio}`;

    const primerDiaMes = new Date(anio, mes, 1);
    const ultimoDiaMes = new Date(anio, mes + 1, 0).getDate();

    let diaInicioSemana = primerDiaMes.getDay() - 1;
    if (diaInicioSemana === -1) diaInicioSemana = 6;

    for (let i = 0; i < diaInicioSemana; i++) {
        const celdaVacia = document.createElement('div');
        celdaVacia.className = "h-24 bg-gray-50 dark:bg-gray-800 rounded border border-gray-100 dark:border-gray-700";
        calendarioGrid.appendChild(celdaVacia);
    }

    for (let dia = 1; dia <= ultimoDiaMes; dia++) {
        const celda = document.createElement('div');
        celda.className = "h-24 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-1 overflow-y-auto text-xs flex flex-col justify-between";
        
        const numeroDia = document.createElement('div');
        numeroDia.className = "font-bold text-gray-800 dark:text-gray-200 text-right";
        numeroDia.textContent = dia;
        celda.appendChild(numeroDia);

        const contenedorTurnosDia = document.createElement('div');
        contenedorTurnosDia.className = "space-y-1 mt-1";

        listaTurnosCache.forEach(turno => {
            const fTurno = new Date(turno.fechaHora);
            if (fTurno.getDate() === dia && fTurno.getMonth() === mes && fTurno.getFullYear() === anio) {
                const horaStr = fTurno.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
                const itemTurno = document.createElement('div');
                itemTurno.className = "bg-pink-100 dark:bg-pink-950 text-pink-800 dark:text-pink-200 p-1 rounded text-[10px] truncate font-semibold";
                itemTurno.title = `${horaStr} - ${turno.cliente} (${turno.servicio})`;
                itemTurno.textContent = `${horaStr} ${turno.cliente}`;
                contenedorTurnosDia.appendChild(itemTurno);
            }
        });

        celda.appendChild(contenedorTurnosDia);
        calendarioGrid.appendChild(celda);
    }
}

window.completarTurno = async function(id, cliente, celular, servicio, notas, fechaHora) {
    if (confirm(`¿Marcar el turno de ${cliente} como atendido y pasarlo al historial?`)) {
        try {
            await addDoc(collection(db, "historial_clientes"), {
                cliente: cliente,
                celular: celular,
                servicio: servicio,
                notas: notas,
                fechaAtencion: fechaHora,
                completadoEl: new Date()
            });

            await deleteDoc(doc(db, "turnos", id));
            window.verHistorialPorCelular(celular);
        } catch (error) {
            console.error("Error al completar el turno: ", error);
        }
    }
}

window.cancelarTurno = async function(id) {
    if (confirm("¿Estás seguro de cancelar este turno?")) {
        try {
            await deleteDoc(doc(db, "turnos", id));
        } catch (error) {
            console.error("Error al cancelar: ", error);
        }
    }
}

window.verHistorialPorCelular = async function(celularParam) {
    const celularBuscado = celularParam || buscadorCelular.value.trim();
    if (!celularBuscado) {
        alert("Por favor ingrese o seleccione un número de celular.");
        return;
    }

    if (celularParam) {
        buscadorCelular.value = celularParam;
    }

    historialtablaHTML("Cargando historial...");
    
    try {
        const q = query(collection(db, "historial_clientes"), where("celular", "==", celularBuscado));
        const querySnapshot = await getDocs(q);

        historialTabla.innerHTML = "";
        if (querySnapshot.empty) {
            historialtablaHTML(`No se encontró historial para el celular: ${celularBuscado}`);
            return;
        }

        querySnapshot.forEach((docSnap) => {
            const item = docSnap.data();
            const id = docSnap.id;
            
            const fechaFormateada = new Date(item.fechaAtencion).toLocaleString('es-ES', {
                dateStyle: 'medium',
                timeStyle: 'short'
            });

            const tr = document.createElement('tr');

            const tdCliente = document.createElement('td');
            tdCliente.className = "px-3 py-3 font-semibold text-gray-950 dark:text-gray-100";
            tdCliente.textContent = item.cliente;
            tr.appendChild(tdCliente);

            const tdCelular = document.createElement('td');
            tdCelular.className = "px-3 py-3 text-gray-800 dark:text-gray-200 font-medium";
            tdCelular.textContent = item.celular;
            tr.appendChild(tdCelular);

            const tdServicio = document.createElement('td');
            tdServicio.className = "px-3 py-3 text-gray-800 dark:text-gray-200 font-medium";
            tdServicio.textContent = item.servicio;
            tr.appendChild(tdServicio);

            const tdNotas = document.createElement('td');
            tdNotas.className = "px-3 py-3 text-pink-600 dark:text-pink-400 italic text-xs font-medium";
            tdNotas.textContent = item.notas || 'Sin notas';
            tr.appendChild(tdNotas);

            const tdFecha = document.createElement('td');
            tdFecha.className = "px-3 py-3 text-gray-800 dark:text-gray-200 font-medium";
            tdFecha.textContent = fechaFormateada;
            tr.appendChild(tdFecha);

            const tdAccion = document.createElement('td');
            tdAccion.className = "px-3 py-3 text-right";
            const btnBorrar = document.createElement('button');
            btnBorrar.className = "text-red-600 dark:text-red-400 hover:underline font-semibold text-xs bg-red-50 dark:bg-red-950 px-2 py-1 rounded";
            btnBorrar.textContent = "Borrar";
            btnBorrar.onclick = () => window.eliminarHistorial(id, item.celular);
            tdAccion.appendChild(btnBorrar);
            tr.appendChild(tdAccion);

            historialTabla.appendChild(tr);
        });
    } catch (error) {
        console.error("Error buscando historial:", error);
    }
}

function historialtablaHTML(texto) {
    historialTabla.innerHTML = "";
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 6;
    td.className = "px-4 py-4 text-center text-gray-500 dark:text-gray-400";
    td.textContent = texto;
    tr.appendChild(td);
    historialTabla.appendChild(tr);
}

btnBuscar.addEventListener('click', () => {
    window.verHistorialPorCelular();
});

buscadorCelular.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        window.verHistorialPorCelular();
    }
});

btnLimpiar.addEventListener('click', () => {
    buscadorCelular.value = '';
    historialtablaHTML("Ingrese un número de celular o haga clic en \"Historial\" en un turno.");
});

window.eliminarHistorial = async function(id, celular) {
    if (confirm("¿Estás seguro de eliminar este registro del historial?")) {
        try {
            await deleteDoc(doc(db, "historial_clientes", id));
            window.verHistorialPorCelular(celular);
        } catch (error) {
            console.error("Error al eliminar del historial: ", error);
        }
    }
}