// Escenarios ANÓNIMOS (visitante) contra el emulador RTDB con las reglas propuestas.
const BASE = "http://127.0.0.1:9000"; const NS = "demo-sec-006-default-rtdb";
const P = "demo-sec-006";
let ok = 0, fail = 0;
const chk = async (nombre, esperado, fn) => {
  const v = await fn();
  const bien = v === esperado;
  if (bien) { ok++; console.log("  PASA  " + nombre + " -> " + v); }
  else { fail++; console.log("  FALLA " + nombre + " -> " + v + " (esperado " + esperado + ")"); }
};
const req = async (m, ruta, cuerpo) => {
  const u = `${BASE}/${ruta}.json?ns=${NS}`;
  const r = await fetch(u, { method: m, headers: { "Content-Type": "application/json" }, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
  return r.status;
};
(async () => {
  // carga inicial de datos ficticios como "owner" (bypass del emulador)
  for (const [ruta, valor] of [
    ["menu/productos/p1", { nombre: "Producto ficticio A", precio: 1000 }],
    ["menu/pedidos/PED-0001", { codigoConsulta: "AF34GR", estado: "PENDIENTE" }],
    ["menu/pedidos_privados/PED-0001", { codigoConsulta: "AF34GR", telefono: "3000000000" }],
    ["menu/reseñas/r1", { texto: "Reseña ficticia" }],
    ["menu/meta/contadorPedidos", 5],
    ["menu_backup/productos/p1", { nombre: "Respaldo ficticio" }],
    ["colsabor/pedidos/PED-9999", { codigoConsulta: "ZZ99ZZ", estado: "PENDIENTE" }],
    ["dta-chanclas/productos/d1", { nombre: "Chancla ficticia" }]
  ]) {
    await fetch(`${BASE}/${ruta}.json&auth=owner`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(valor) });
  }
  console.log("=== matriz anónima (visitante sin sesión) ===");
  // DIAGNOSTICO: si un PUT anónimo a menu_backup devuelve 200, las reglas NO se cargaron.
  const sonda = await req("PUT", "menu_backup/productos/sonda", { x: 1 });
  console.log("DIAGNOSTICO reglas cargadas: " + (sonda === 401 ? "SÍ (401 en escritura prohibida)" : "NO (" + sonda + ")"));
  if (sonda !== 401) { console.log("  -> el emulador sigue con reglas abiertas; no ejecuto la matriz"); process.exit(3); }
  await chk("lee productos del menú", 200, () => req("GET", "menu/productos"));
  await chk("lee productos de colsabor", 200, () => req("GET", "colsabor/productos"));
  await chk("lee pedidos para rastreo", 200, () => req("GET", "menu/pedidos"));
  await chk("NO lee pedidos privados", 401, () => req("GET", "menu/pedidos_privados"));
  await chk("NO lee el respaldo", 401, () => req("GET", "menu_backup"));
  await chk("NO sobrescribe un pedido existente", 401, () => req("PUT", "menu/pedidos/PED-0001", { codigoConsulta: "HACK01", estado: "PAGADO" }));
  await chk("NO borra un pedido existente", 401, () => req("DELETE", "menu/pedidos/PED-0001"));
  await chk("NO sobrescribe datos privados", 401, () => req("PUT", "menu/pedidos_privados/PED-0001", { telefono: "3111111111" }));
  await chk("NO toca el contador", 401, () => req("PUT", "menu/meta/contadorPedidos", 999));
  await chk("NO toca el respaldo", 401, () => req("PUT", "menu_backup/productos/p1", { nombre: "borrado" }));
  await chk("NO escribe el árbol de otro negocio", 401, () => req("PUT", "colsabor/productos/nuevo", { nombre: "inyectado" }));
  await chk("SÍ crea un pedido nuevo (flujo legítimo)", 200, () => req("PUT", "menu/pedidos/PED-9998", { codigoConsulta: "NUEV01", estado: "PENDIENTE" }));
  await chk("SÍ crea su registro privado", 200, () => req("PUT", "menu/pedidos_privados/PED-9998", { codigoConsulta: "NUEV01", telefono: "3001234567" }));
  await chk("SÍ crea una reseña", 200, () => req("PUT", "menu/reseñas/r2", { texto: "Otra reseña ficticia" }));
  await chk("NO sobrescribe una reseña ajena", 401, () => req("PUT", "menu/reseñas/r1", { texto: "cambiada" }));
  console.log("\n  comprobaciones: " + (ok + fail) + " · PASA " + ok + " · FALLA " + fail);
  process.exit(fail ? 1 : 0);
})().catch((e) => { console.error("ERROR: " + e.message); process.exit(2); });



