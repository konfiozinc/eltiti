// ═══════════════════════════════════════════════════════════════
    //  CONFIGURACIÓN GENERAL
    // ═══════════════════════════════════════════════════════════════
    const STORAGE_KEY_PRODUCTOS = 'eltiti_productos_cache'; // SOLO caché offline
    const STORAGE_KEY_HORARIO   = 'eltiti_horario';
    const STORAGE_KEY_PROMO     = 'eltiti_promo';

    const CATEGORIAS = ['Hamburguesas', 'Salchipapas', 'Chuzos', 'Bebidas', 'Adicionales'];
    const EMOJIS_CATEGORIA = {
        'Hamburguesas': '🍔',
        'Salchipapas':  '🍟',
        'Chuzos':       '🌭',
        'Bebidas':      '🥤',
        'Adicionales':  '➕'
    };

    // Catálogo inicial — solo se usa una vez, si Firebase no tiene productos aún.
    const productosIniciales = {
        'seed-hb-simple':  { nombre: 'Hamburguesa (Simple)',  precio: 7000,  categoria: 'Hamburguesas', imagen: 'assets/productos/hamburguesa-simple.webp', agotado: false },
        'seed-hb-doble':   { nombre: 'Hamburguesa (Doble)',   precio: 10000, categoria: 'Hamburguesas', imagen: 'assets/productos/hamburguesa-doble.webp', agotado: false },
        'seed-hb-triple':  { nombre: 'Hamburguesa (Triple)',  precio: 13000, categoria: 'Hamburguesas', imagen: 'assets/productos/hamburguesa-triple.webp', agotado: false },
        'seed-hb-especial':{ nombre: 'Hamburguesa (Especial)',precio: 18000, categoria: 'Hamburguesas', imagen: 'assets/productos/hamburguesa-especial.webp', agotado: false },
        'seed-hb-x':       { nombre: 'Hamburguesa (X)',       precio: 15000, categoria: 'Hamburguesas', imagen: 'assets/productos/hamburguesa-x.webp', agotado: false },
        'seed-sp-simple':  { nombre: 'Salchipapa (Simple)',   precio: 5000,  categoria: 'Salchipapas',  imagen: 'assets/productos/salchipapa-simple.webp', agotado: false },
        'seed-sp-doble':   { nombre: 'Salchipapa (Doble)',    precio: 7000,  categoria: 'Salchipapas',  imagen: 'assets/productos/salchipapa-doble.webp', agotado: false },
        'seed-sp-triple':  { nombre: 'Salchipapa (Triple)',   precio: 10000, categoria: 'Salchipapas',  imagen: 'assets/productos/salchipapa-triple.webp', agotado: false },
        'seed-sp-especial':{ nombre: 'Salchipapa (Especial)', precio: 13000, categoria: 'Salchipapas',  imagen: 'assets/productos/salchipapa-especial.webp', agotado: false },
        'seed-sp-x':       { nombre: 'Salchipapa (X)',        precio: 15000, categoria: 'Salchipapas',  imagen: 'assets/productos/salchipapa-x.webp', agotado: false },
        'seed-choripapa':  { nombre: 'Choripapa',             precio: 12000, categoria: 'Salchipapas',  imagen: 'assets/productos/choripapa.webp', agotado: false },
        'seed-chuzo-pollo':{ nombre: 'Chuzo de Pollo',        precio: 15000, categoria: 'Chuzos',       imagen: 'assets/productos/chuzo-pollo.webp', agotado: false },
        'seed-butifarra': { nombre: 'Butifarra',              precio: 800,   categoria: 'Adicionales',  imagen: 'assets/productos/butifarra.webp', agotado: false },
        'seed-empanadas': { nombre: 'Empanadas (6x)',         precio: 2000,  categoria: 'Adicionales',  imagen: 'assets/productos/empanadas.webp', agotado: false }
    };

    // ═══════════════════════════════════════════════════════════════
    //  FIREBASE — APP / AUTH / REALTIME DATABASE / STORAGE
    // ═══════════════════════════════════════════════════════════════
    const firebaseConfig = {
        apiKey: "AIzaSyDHWE3OJMspi_z0CKPv8mjvjI7igum98rs",
        authDomain: "el-titi-menu.firebaseapp.com",
        databaseURL: "https://el-titi-menu-default-rtdb.firebaseio.com",
        projectId: "el-titi-menu",
        storageBucket: "el-titi-menu.firebasestorage.app",
        messagingSenderId: "903648110789",
        appId: "1:903648110789:web:6ac58748862dfeb5a568ac"
    };
    if (!firebase.apps.length) firebase.initializeApp(firebaseConfig);
    const fbAuth    = firebase.auth();
    const fbDB      = firebase.database();

    const refProductos     = fbDB.ref('menu/productos');
    const refPromo         = fbDB.ref('menu/promo');
    const refHorario       = fbDB.ref('menu/horario');
    const refResenas       = fbDB.ref('menu/reseñas');
    const refBackup        = fbDB.ref('menu_backup');
    const refMeta          = fbDB.ref('menu/meta');

    // ═══════════════════════════════════════════════════════════════
    //  ESTADO GLOBAL DE SINCRONIZACIÓN (Alpine Store)
    //  🟢 connected · 🟡 syncing · 🔴 error
    // ═══════════════════════════════════════════════════════════════
    document.addEventListener('alpine:init', () => {
        Alpine.store('sync', { status: 'syncing', ultimoGuardado: null });
    });

    function setSyncStatus(status) {
        const store = Alpine.store('sync');
        if (store) store.status = status;
    }
    function marcarUltimoGuardado() {
        const ts = Date.now();
        const store = Alpine.store('sync');
        if (store) store.ultimoGuardado = ts;
        try { localStorage.setItem('eltiti_ultimo_guardado', String(ts)); } catch(e) {}
        refMeta.child('ultimoGuardado').set(ts).catch(() => {});
    }

    // ═══════════════════════════════════════════════════════════════
    //  CACHÉ LOCAL — ÚNICAMENTE PARA USO OFFLINE
    // ═══════════════════════════════════════════════════════════════
    function cargarProductosCache() {
        try {
            const stored = localStorage.getItem(STORAGE_KEY_PRODUCTOS);
            return stored ? JSON.parse(stored) : [];
        } catch (e) { return []; }
    }
    function guardarProductosCache(productosArr) {
        try { localStorage.setItem(STORAGE_KEY_PRODUCTOS, JSON.stringify(productosArr)); } catch (e) {}
    }

    function productosObjToArray(obj) {
        if (!obj || typeof obj !== 'object') return [];
        return Object.keys(obj)
            .filter(id => obj[id])
            .map(id => ({
                id,
                nombre: obj[id].nombre || '',
                precio: obj[id].precio || 0,
                imagen: obj[id].imagen || '',
                categoria: obj[id].categoria || 'Adicionales',
                agotado: !!obj[id].agotado
            }));
    }

    // ═══════════════════════════════════════════════════════════════
    //  RESPALDO — menu_backup
    // ═══════════════════════════════════════════════════════════════
    async function crearBackup(productosData, motivo) {
        try {
            const ts = Date.now();
            await refBackup.child(String(ts)).set({
                productos: productosData,
                motivo: motivo || 'manual',
                fecha: new Date(ts).toISOString()
            });
            return { success: true, timestamp: ts };
        } catch (e) {
            console.warn('No se pudo crear respaldo:', e.message);
            return { success: false, error: e.message };
        }
    }

    // ═══════════════════════════════════════════════════════════════
    //  SINCRONIZACIÓN EN TIEMPO REAL — onValue()
    //  Sin escrituras destructivas: solo push() / update() / remove()
    // ═══════════════════════════════════════════════════════════════
    let migracionEnProceso = false;

    function escucharProductos(onUpdate) {
        refProductos.on('value', (snapshot) => {
            const data = snapshot.val();

            // 1) Base de datos vacía → sembrar catálogo inicial (solo la primera vez)
            if (data === null) {
                if (migracionEnProceso) return;
                migracionEnProceso = true;
                refProductos.set(productosIniciales)
                    .then(() => { migracionEnProceso = false; })
                    .catch(() => { migracionEnProceso = false; setSyncStatus('error'); });
                return;
            }

            // 2) Formato antiguo (array) → migrar a objeto indexado por id, con respaldo previo
            if (Array.isArray(data)) {
                if (migracionEnProceso) return;
                migracionEnProceso = true;
                crearBackup(data, 'migracion_formato_legacy').finally(() => {
                    const migrado = {};
                    data.forEach((p) => {
                        if (!p) return;
                        const idValido = p.id && typeof p.id === 'string' && !/^\d+$/.test(String(p.id));
                        const id = idValido ? String(p.id) : crypto.randomUUID();
                        migrado[id] = {
                            nombre: p.nombre || '',
                            precio: p.precio || 0,
                            imagen: p.imagen || '',
                            categoria: CATEGORIAS.includes(p.categoria) ? p.categoria : 'Adicionales',
                            agotado: !!p.agotado
                        };
                    });
                    refProductos.set(migrado)
                        .then(() => { migracionEnProceso = false; })
                        .catch(() => { migracionEnProceso = false; setSyncStatus('error'); });
                });
                return;
            }

            // 3) Caso normal: objeto { id: {...} }
            const arr = productosObjToArray(data);
            guardarProductosCache(arr);
            onUpdate(arr);
            setSyncStatus('connected');
        }, (error) => {
            console.error('Error de sincronización Firebase:', error);
            setSyncStatus('error');
            const cache = cargarProductosCache();
            if (cache.length) onUpdate(cache);
        });

        // Mientras se establece la primera conexión
        setSyncStatus('syncing');
    }

    // ═══════════════════════════════════════════════════════════════
    //  CRUD DE PRODUCTOS — push() / update() / remove()
    // ═══════════════════════════════════════════════════════════════
    async function crearProductoFirebase(id, datos) {
        try {
            setSyncStatus('syncing');
            await refProductos.child(id).set(datos);
            marcarUltimoGuardado();
            setSyncStatus('connected');
            return { success: true };
        } catch (e) {
            setSyncStatus('error');
            return { success: false, error: e.message };
        }
    }

    async function actualizarProductoFirebase(id, cambios) {
        try {
            setSyncStatus('syncing');
            await refProductos.child(id).update(cambios);
            marcarUltimoGuardado();
            setSyncStatus('connected');
            return { success: true };
        } catch (e) {
            setSyncStatus('error');
            return { success: false, error: e.message };
        }
    }

    async function eliminarProductoFirebase(id, productoActual) {
        try {
            setSyncStatus('syncing');
            if (productoActual) await crearBackup({ [id]: productoActual }, 'eliminacion_producto');
            await refProductos.child(id).remove();
            marcarUltimoGuardado();
            setSyncStatus('connected');
            return { success: true };
        } catch (e) {
            setSyncStatus('error');
            return { success: false, error: e.message };
        }
    }

    // ═══════════════════════════════════════════════════════════════
    //  AUTENTICACIÓN — FIREBASE AUTHENTICATION
    // ═══════════════════════════════════════════════════════════════
    async function loginFirebaseAdmin(email, password) {
        try {
            await fbAuth.signInWithEmailAndPassword(email, password);
            return { success: true };
        } catch (e) {
            return { success: false, error: e.code || e.message };
        }
    }
    function logoutFirebaseAdmin() { return fbAuth.signOut(); }

    // ═══════════════════════════════════════════════════════════════
    //  PROMO / HORARIO — sincronizados vía RTDB (set en nodo propio)
    // ═══════════════════════════════════════════════════════════════
    async function guardarPromoFirebase(promo) {
        try { setSyncStatus('syncing'); await refPromo.set(promo); marcarUltimoGuardado(); setSyncStatus('connected'); return true; }
        catch (e) { setSyncStatus('error'); return false; }
    }
    async function guardarHorarioFirebase(h) {
        try { setSyncStatus('syncing'); await refHorario.set(h); marcarUltimoGuardado(); setSyncStatus('connected'); return true; }
        catch (e) { setSyncStatus('error'); return false; }
    }

    // Inicialización cuando el DOM esté listo (efectos visuales no críticos)
    document.addEventListener('DOMContentLoaded', function() {
        const whatsappBtn = document.getElementById('whatsappFloat');
        if (whatsappBtn) {
            whatsappBtn.addEventListener('click', function(e) {
                const ripple = document.createElement('span');
                ripple.className = 'ripple';
                const rect = this.getBoundingClientRect();
                const size = Math.max(rect.width, rect.height);
                ripple.style.width = ripple.style.height = size + 'px';
                ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
                ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
                this.appendChild(ripple);
                setTimeout(() => ripple.remove(), 600);
            });
        }
    });
;
// appData() centralizado en Alpine.data

    document.addEventListener('alpine:init', () => {
        Alpine.data('appData', function() {
            return {
                // ── Estado base ──
                isOpen: false,
                productos: [],
                promoText: '🔥 PROMO DEL FIN DE SEMANA: 2x1 en Hamburguesas',

                // ── Categorías y búsqueda ──
                categorias: CATEGORIAS,
                emojisCategoria: EMOJIS_CATEGORIA,
                busqueda: '',
                adminBusqueda: '',

                // ── Administración ──
                adminMode: false,
                adminAuthenticated: false,
                adminEmail: '',
                adminPassword: '',
                loginEnProgreso: false,
                newProduct: { nombre: '', precio: '', imagen: '', categoria: CATEGORIAS[0] },
                previewNuevo: '',
                previewPorId: {},

                logoPressCount: 0,
                logoPressTimer: null,
                whatsapp: '573014387942',
                telefono: '3014387942',
                adminHorario: { dias: '5,6,0', inicio: 18, fin: 2 },
                horarioTexto: 'Viernes – Domingo · 6:00 PM a 2:00 AM',
                installModalOpen: false,
                installTab: 'android',
                deferredPrompt: null,
                qrModalOpen: false,

                // ── Reseñas ──
                reseñas: [],
                nuevaReseña: { autor: '', texto: '', estrellas: 0 },
                reseñasOpen: false,

                // ── Carrito ──
                carritoOpen: false,
                carrito: [],

                // ═══════════════ GETTERS ═══════════════
                get syncStatus() {
                    const store = Alpine.store('sync');
                    return store ? store.status : 'syncing';
                },
                get ultimaSyncHora() {
                    const store = Alpine.store('sync');
                    const ts = store ? store.ultimoGuardado : null;
                    if (!ts) return '—';
                    return new Date(ts).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });
                },
                get productosFiltrados() {
                    const q = this.busqueda.trim().toLowerCase();
                    if (!q) return this.productos;
                    return this.productos.filter(p => p.nombre.toLowerCase().includes(q));
                },
                get categoriasConProductos() {
                    return this.categorias.map(cat => {
                        const productos = this.productosFiltrados.filter(p => p.categoria === cat);
                        return { nombre: cat, emoji: this.emojisCategoria[cat] || '🍽️', productos, count: productos.length };
                    });
                },
                get productosAdminFiltrados() {
                    const q = this.adminBusqueda.trim().toLowerCase();
                    if (!q) return this.productos;
                    return this.productos.filter(p => p.nombre.toLowerCase().includes(q));
                },
                get productosAgotadosCount() {
                    return this.productos.filter(p => p.agotado).length;
                },
                get promedioEstrellas() {
                    if (!this.reseñas.length) return 0;
                    return (this.reseñas.reduce((s, r) => s + (r.estrellas || 0), 0) / this.reseñas.length).toFixed(1);
                },
                get estrellasTexto() {
                    const n = Math.round(this.promedioEstrellas);
                    return '★'.repeat(n) + '☆'.repeat(5 - n);
                },
                get totalItems() { return this.carrito.reduce((s, i) => s + i.cantidad, 0); },
                get totalPrecio() { return this.carrito.reduce((s, i) => s + i.precio * i.cantidad, 0); },

                // ═══════════════ INICIALIZACIÓN ═══════════════
                initApp() {
                    // 1. Cargar caché local (uso inmediato / modo offline)
                    const cache = cargarProductosCache();
                    if (cache.length) {
                        this.productos = cache.map(p => ({ ...p, precio_editable: p.precio }));
                    }

                    // 2. Sincronización en tiempo real con Firebase (onValue)
                    escucharProductos((arr) => {
                        this.productos = arr.map(p => ({ ...p, precio_editable: p.precio }));
                    });

                    // 3. Estado de autenticación del administrador
                    fbAuth.onAuthStateChanged((user) => {
                        this.adminAuthenticated = !!user;
                    });

                    // 4. Horario de atención
                    this.cargarHorario();
                    this.actualizarEstado();
                    setInterval(() => this.actualizarEstado(), 60000);

                    // 5. Promoción (caché + tiempo real)
                    const promoCache = localStorage.getItem(STORAGE_KEY_PROMO);
                    if (promoCache) this.promoText = promoCache;
                    refPromo.on('value', (snap) => {
                        const val = snap.val();
                        if (typeof val === 'string' && val) {
                            this.promoText = val;
                            try { localStorage.setItem(STORAGE_KEY_PROMO, val); } catch (e) {}
                        }
                    });

                    // 6. Reseñas en tiempo real (push, nunca sobrescritura total)
                    refResenas.on('value', (snap) => {
                        const data = snap.val();
                        this.reseñas = data
                            ? Object.values(data).filter(Boolean).sort((a, b) => (b.fecha || 0) - (a.fecha || 0))
                            : [];
                    });

                    // Limpiar autofill del campo nombre de reseña
                    setTimeout(() => {
                        const el = document.getElementById('campoNombreReseña');
                        if (el && el.value.includes('@')) el.value = '';
                    }, 800);

                    // 7. Último guardado (panel admin)
                    refMeta.child('ultimoGuardado').on('value', (snap) => {
                        const ts = snap.val();
                        const store = Alpine.store('sync');
                        if (ts && store) store.ultimoGuardado = ts;
                    });

                    // 8. Evento de instalación PWA
                    window.addEventListener('beforeinstallprompt', (e) => {
                        e.preventDefault();
                        this.deferredPrompt = e;
                    });
                },

                // ── Tap logo x5 activa Admin ──
                tapLogo() {
                    this.logoPressCount++;
                    clearTimeout(this.logoPressTimer);
                    this.logoPressTimer = setTimeout(() => { this.logoPressCount = 0; }, 5000);
                    if (this.logoPressCount >= 5) {
                        this.logoPressCount = 0;
                        this.adminMode = true;
                    }
                },

                // ── Instalar PWA ──
                instalarPWA() {
                    if (this.deferredPrompt) {
                        this.deferredPrompt.prompt();
                        this.deferredPrompt = null;
                        this.installModalOpen = false;
                    }
                },

                // ═══════════════ HORARIO ═══════════════
                cargarHorario() {
                    const stored = localStorage.getItem(STORAGE_KEY_HORARIO);
                    if (stored) {
                        try {
                            this.adminHorario = JSON.parse(stored);
                            this.actualizarTextoHorario();
                            return;
                        } catch (e) {}
                    }
                    this.actualizarTextoHorario();
                },
                guardarHorario() {
                    let dias = this.adminHorario.dias.split(',').map(Number).filter(d => !isNaN(d) && d >= 0 && d <= 6);
                    if (dias.length === 0) {
                        this.mostrarToast('Debe ingresar al menos un día válido');
                        return;
                    }
                    this.adminHorario.dias = dias.join(',');
                    localStorage.setItem(STORAGE_KEY_HORARIO, JSON.stringify(this.adminHorario));
                    guardarHorarioFirebase(this.adminHorario);
                    this.actualizarTextoHorario();
                    this.actualizarEstado();
                    this.mostrarToast('Horario guardado');
                },
                actualizarTextoHorario() {
                    const dias = this.adminHorario.dias.split(',').map(Number);
                    let nombresDias = dias.map(d => {
                        if (d === 0) return 'Domingo';
                        if (d === 1) return 'Lunes';
                        if (d === 2) return 'Martes';
                        if (d === 3) return 'Miércoles';
                        if (d === 4) return 'Jueves';
                        if (d === 5) return 'Viernes';
                        if (d === 6) return 'Sábado';
                        return '';
                    });
                    const inicio = this.adminHorario.inicio;
                    const fin = this.adminHorario.fin;
                    const formatoHora = (h) => {
                        if (h === 0) return '12:00 AM';
                        if (h < 12) return h + ':00 AM';
                        if (h === 12) return '12:00 PM';
                        return (h - 12) + ':00 PM';
                    };
                    this.horarioTexto = nombresDias.join(' – ') + ' · ' + formatoHora(inicio) + ' a ' + formatoHora(fin);
                },
                actualizarEstado() {
                    const ahora = new Date();
                    const dia = ahora.getDay();
                    const hora = ahora.getHours();
                    const minutos = ahora.getMinutes();
                    const horaDecimal = hora + minutos / 60;

                    const diasAbiertos = this.adminHorario.dias.split(',').map(Number);
                    const inicio = parseInt(this.adminHorario.inicio);
                    let fin = parseInt(this.adminHorario.fin);

                    let abierto = false;
                    if (diasAbiertos.includes(dia)) {
                        if (fin < inicio) {
                            if (horaDecimal >= inicio && horaDecimal < 24) abierto = true;
                            else if (horaDecimal >= 0 && horaDecimal < fin) abierto = true;
                        } else {
                            if (horaDecimal >= inicio && horaDecimal < fin) abierto = true;
                        }
                    }
                    this.isOpen = abierto;
                },

                // ═══════════════ QR / COMPARTIR / CONTACTO ═══════════════
                abrirQR() {
                    const img = document.getElementById('qrImgModal');
                    if (img) {
                        let url = window.location.href;
                        if (url.startsWith('file://')) url = 'https://wa.me/573014387942';
                        img.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&color=800000&bgcolor=ffffff&data=${encodeURIComponent(url)}`;
                        img.onerror = () => { img.src = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent('https://wa.me/573014387942')}`; };
                    }
                    this.qrModalOpen = true;
                },
                copiarEnlace() {
                    const url = window.location.href.startsWith('file://') ? 'https://wa.me/573014387942' : window.location.href;
                    navigator.clipboard.writeText(url)
                        .then(() => this.mostrarToast('✅ Enlace copiado'))
                        .catch(() => this.mostrarToast('No se pudo copiar'));
                },
                shareCard() {
                    const url = window.location.href;
                    if (navigator.share) {
                        navigator.share({ title: 'EL TITI', text: '¡Pide tu comida favorita!', url });
                    } else {
                        this.mostrarToast('Comparte este enlace: ' + url);
                    }
                },
                saveContact() {
                    const vcard = `BEGIN:VCARD\nVERSION:3.0\nFN:EL TITI Comidas Rápidas\nTEL:${this.telefono}\nADR:Barrio Nueva Jerusalén, Bello, Antioquia\nURL:${window.location.href}\nEND:VCARD`;
                    const blob = new Blob([vcard], { type: 'text/vcard;charset=utf-8' });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = 'EL_TITI.vcf';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                },

                // ═══════════════ CARRITO ═══════════════
                agregarAlCarrito(p) {
                    const idx = this.carrito.findIndex(i => i.id === p.id);
                    if (idx >= 0) { this.carrito[idx].cantidad++; }
                    else { this.carrito.push({ id: p.id, nombre: p.nombre, precio: p.precio, emoji: p.emoji || '🍔', cantidad: 1 }); }
                    this.mostrarToast('🛒 ' + p.nombre + ' agregado');
                },
                quitarUno(id) {
                    const idx = this.carrito.findIndex(i => i.id === id);
                    if (idx < 0) return;
                    if (this.carrito[idx].cantidad > 1) { this.carrito[idx].cantidad--; }
                    else { this.carrito.splice(idx, 1); }
                },
                vaciarCarrito() { if (confirm('¿Vaciar el carrito?')) this.carrito = []; },
                enviarPedido() {
                    if (!this.carrito.length) return;
                    let msg = '🍔 *PEDIDO - EL TITI Comidas Rápidas*\n━━━━━━━━━━━━━━━━━━━━\n';
                    this.carrito.forEach(i => {
                        msg += i.emoji + ' *' + i.nombre + '*\n   Cantidad: ' + i.cantidad + '\n   Precio: $' + (i.precio * i.cantidad).toLocaleString('es-CO') + '\n\n';
                    });
                    msg += '━━━━━━━━━━━━━━━━━━━━\n💰 *TOTAL: $' + this.totalPrecio.toLocaleString('es-CO') + '*\n\n📍 Por favor confirma tu dirección.';
                    window.location.href = 'whatsapp://send?phone=57' + this.telefono + '&text=' + encodeURIComponent(msg);
                    this.carritoOpen = false;
                },

                // ═══════════════ RESEÑAS (push - tiempo real) ═══════════════
                async enviarReseña() {
                    if (this.nuevaReseña.autor.includes('@')) { this.nuevaReseña.autor = ''; }
                    const inputEl = document.getElementById('campoNombreReseña');
                    if (inputEl && inputEl.value && !inputEl.value.includes('@')) {
                        this.nuevaReseña.autor = inputEl.value;
                    }
                    if (!this.nuevaReseña.autor.trim()) { this.mostrarToast('⚠️ Escribe tu nombre'); return; }
                    if (!this.nuevaReseña.estrellas) { this.mostrarToast('⚠️ Selecciona las estrellas'); return; }
                    const r = {
                        autor: this.nuevaReseña.autor.trim(),
                        texto: this.nuevaReseña.texto.trim(),
                        estrellas: this.nuevaReseña.estrellas,
                        fecha: Date.now()
                    };
                    try {
                        await refResenas.push(r);
                        this.nuevaReseña = { autor: '', texto: '', estrellas: 0 };
                        this.mostrarToast('⭐ ¡Gracias por tu reseña!');
                    } catch (e) { this.mostrarToast('⚠️ Error al guardar'); }
                },

                // ═══════════════ PRODUCTOS — push() / update() / remove() ═══════════════
                toggleAgotado(p) {
                    p.agotado = !p.agotado;
                    actualizarProductoFirebase(p.id, { agotado: p.agotado }).then(res => {
                        this.mostrarToast(res.success ? (p.agotado ? '❌ Marcado AGOTADO' : '✅ Marcado DISPONIBLE') : '⚠️ Error: ' + res.error);
                    });
                },
                deleteProduct(id) {
                    if (!confirm('¿Eliminar este producto?')) return;
                    const producto = this.productos.find(p => p.id === id);
                    const datos = producto ? {
                        nombre: producto.nombre, precio: producto.precio, imagen: producto.imagen,
                        categoria: producto.categoria, agotado: producto.agotado
                    } : null;
                    eliminarProductoFirebase(id, datos).then(res => {
                        this.mostrarToast(res.success ? '🗑️ Producto eliminado' : '⚠️ Error: ' + res.error);
                    });
                },
                async addProduct() {
                    if (!this.newProduct.nombre || !this.newProduct.precio) {
                        this.mostrarToast('Nombre y precio requeridos');
                        return;
                    }
                    const id = crypto.randomUUID();
                    const datos = {
                        nombre: this.newProduct.nombre.trim(),
                        precio: parseInt(this.newProduct.precio),
                        imagen: this.newProduct.imagen || '',
                        categoria: CATEGORIAS.includes(this.newProduct.categoria) ? this.newProduct.categoria : CATEGORIAS[0],
                        agotado: false
                    };
                    const res = await crearProductoFirebase(id, datos);
                    if (res.success) {
                        if (this.previewNuevo) { URL.revokeObjectURL(this.previewNuevo); this.previewNuevo = ''; }
                        this.newProduct = { nombre: '', precio: '', imagen: '', categoria: CATEGORIAS[0] };
                        this.mostrarToast('✅ Producto agregado');
                    } else {
                        this.mostrarToast('⚠️ Error al agregar: ' + res.error);
                    }
                },
                guardarPrecio(p) {
                    const nuevo = parseInt(p.precio_editable);
                    if (isNaN(nuevo) || nuevo <= 0) {
                        this.mostrarToast('⚠️ Precio inválido');
                        return;
                    }
                    p.precio = nuevo;
                    actualizarProductoFirebase(p.id, { precio: nuevo }).then(res => {
                        this.mostrarToast(res.success ? '✅ Guardado: ' + p.nombre : '⚠️ Error: ' + res.error);
                    });
                },
                actualizarCampoProducto(p, campo, valor) {
                    actualizarProductoFirebase(p.id, { [campo]: valor }).then(res => {
                        if (!res.success) this.mostrarToast('⚠️ Error al guardar: ' + res.error);
                    });
                },

                // ═══════════════ VISTA PREVIA DE FOTOS (sin guardado automático) ═══════════════
                // GitHub Pages es estático: no es posible crear/guardar archivos en
                // assets/productos/ desde el navegador. Esto solo genera una vista
                // previa temporal en el dispositivo; la ruta final debe escribirse
                // a mano una vez la imagen se suba al repositorio de GitHub.
                subirFoto(event, target) {
                    const file = event.target.files[0];
                    if (!file) return;
                    if (!file.type.startsWith('image/')) { this.mostrarToast('⚠️ Selecciona una imagen válida'); event.target.value = ''; return; }
                    if (file.size > 5 * 1024 * 1024) { this.mostrarToast('⚠️ Imagen muy grande (máx 5MB)'); event.target.value = ''; return; }

                    const url = URL.createObjectURL(file);
                    if (target === 'nuevo') {
                        if (this.previewNuevo) URL.revokeObjectURL(this.previewNuevo);
                        this.previewNuevo = url;
                    } else {
                        if (this.previewPorId[target.id]) URL.revokeObjectURL(this.previewPorId[target.id]);
                        this.previewPorId[target.id] = url;
                    }
                    this.mostrarToast('📁 Vista previa cargada. Para agregar esta imagen al catálogo, súbela a tu repositorio de GitHub dentro de assets/productos/ y escribe la ruta en el campo de imagen.');
                    event.target.value = '';
                },

                // ═══════════════ PROMOCIÓN ═══════════════
                savePromo() {
                    localStorage.setItem(STORAGE_KEY_PROMO, this.promoText);
                    guardarPromoFirebase(this.promoText).then(ok => {
                        this.mostrarToast(ok ? '✅ Promoción guardada y sincronizada' : '⚠️ Guardado local, sin conexión');
                    });
                },

                // ═══════════════ AUTENTICACIÓN ADMIN — FIREBASE AUTH ═══════════════
                async authenticateAdmin() {
                    if (!this.adminEmail.trim() || !this.adminPassword) {
                        this.mostrarToast('⚠️ Ingresa correo y contraseña');
                        return;
                    }
                    this.loginEnProgreso = true;
                    const res = await loginFirebaseAdmin(this.adminEmail.trim(), this.adminPassword);
                    this.loginEnProgreso = false;
                    if (res.success) {
                        this.adminPassword = '';
                        this.mostrarToast('🔐 Acceso concedido');
                    } else {
                        this.mostrarToast('⚠️ Correo o contraseña incorrectos');
                    }
                },
                cerrarSesionAdmin() {
                    logoutFirebaseAdmin();
                    this.adminMode = false;
                },

                mostrarToast(msg) {
                    const el = document.getElementById('toast');
                    if (!el) return;
                    el.textContent = msg;
                    el.classList.add('show');
                    clearTimeout(this._toastTimeout);
                    this._toastTimeout = setTimeout(() => el.classList.remove('show'), 3000);
                }
            };
        });
    });


    // ══ carouselData() — Galería de imágenes reales de EL TITI ══
    function carouselData() {
        return {
            currentSlide: 0,
            touchStartX: 0,
            autoplayTimer: null,
            isTransitioning: false,
            images: [
                'assets/galeria/foto1.webp',
                'assets/galeria/foto2.webp',
                'assets/galeria/foto3.webp',
                'assets/galeria/foto4.webp',
                'assets/galeria/foto5.webp',
            ],
            init() { this.startAutoplay(); },
            startAutoplay() {
                this.stopAutoplay();
                this.autoplayTimer = setInterval(() => { this.nextSlide(); }, 3500);
            },
            stopAutoplay()  { clearInterval(this.autoplayTimer); },
            goTo(idx)       { this.currentSlide = idx; this.startAutoplay(); },
            prevSlide() {
                this.currentSlide = this.currentSlide === 0
                    ? this.images.length - 1 : this.currentSlide - 1;
                this.startAutoplay();
            },
            nextSlide() {
                this.currentSlide = this.currentSlide === this.images.length - 1
                    ? 0 : this.currentSlide + 1;
            },
            touchStart(e) { this.stopAutoplay(); this.touchStartX = e.touches[0].clientX; },
            touchEnd(e) {
                const diff = this.touchStartX - e.changedTouches[0].clientX;
                if (Math.abs(diff) > 40) { diff > 0 ? this.nextSlide() : this.prevSlide(); }
                this.startAutoplay();
            }
        };
    }



    // PWA — registro del Service Worker real (service-worker.js)
    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('service-worker.js').catch(() => {});
        });
    }
;
// ── Posicionar WA button al borde derecho del card ──
function posicionarWA() {
    var card = document.querySelector('.card-container');
    var wa   = document.querySelector('.wa-float-wrap');
    if (!card || !wa) return;
    var rect  = card.getBoundingClientRect();
    // 16px desde el borde derecho del card
    wa.style.left = (rect.right - 72) + 'px';
    wa.style.right = 'auto';
}
window.addEventListener('resize',  posicionarWA);
window.addEventListener('scroll',  posicionarWA, { passive: true });
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(posicionarWA, 200);  // esperar Alpine
    setTimeout(posicionarWA, 800);  // segunda pasada por seguridad
});
