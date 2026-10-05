// Configuración del panel de administración — EL TITI
// NOTA: usa el proyecto Firebase compartido `el-titi-menu`.
window.ADMIN_CONFIG = {
  nombre: 'EL TITI',
  ruta: 'menu',            // namespace en RTDB/Storage (El Titi ya vive en /menu/)
  color: '#B22222',
  categorias: ['Hamburguesas', 'Salchipapas', 'Chuzos', 'Picadas', 'Bebidas', 'Adicionales'],
  cloudinary: {
    cloudName: 'f07x0wga',
    uploadPreset: 'menu-digital'
  },
  firebase: {
    apiKey: "AIzaSyDHWE3OJMspi_z0CKPv8mjvjI7igum98rs",
    authDomain: "el-titi-menu.firebaseapp.com",
    databaseURL: "https://el-titi-menu-default-rtdb.firebaseio.com",
    projectId: "el-titi-menu",
    storageBucket: "el-titi-menu.firebasestorage.app",
    messagingSenderId: "903648110789",
    appId: "1:903648110789:web:6ac58748862dfeb5a568ac"
  }
};
