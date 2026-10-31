const NS = "demo-sec-006-default-rtdb";
const BASE = "http://127.0.0.1:9000";
let ok = 0, fail = 0;
const chk = async (n, esperado, fn) => { const v = await fn(); const b = v === esperado; b ? ok++ : fail++; console.log((b ? "  PASA  " : "  FALLA ") + n + " -> " + v + (b ? "" : " (esperado " + esperado + ")")); };
const req = async (m, ruta, cuerpo, uid) => {
  const auth = uid ? "&auth=" + uid : "";
  const r = await fetch(`${BASE}/${ruta}.json?ns=${NS}${auth}`, { method: m, headers: { "Content-Type": "application/json" }, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) });
  return r.status;
};
const admin = (ruta, valor) => fetch(`${BASE}/${ruta}.json?ns=${NS}&access_token=owner`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(valor) });
(async () => {
  // usuarios FICTICIOS y sus roles (solo en el emulador)
  const usuarios = { "ficti-titi-001": "titi", "ficti-colsabor-001": "colsabor", "ficti-dta-001": "dta-chanclas", "ficti-nbc-001": "nbc-company", "ficti-agencia-001": "agencia", "ficti-sinrol-001": null };
  for (const [uid, negocio] of Object.entries(usuarios)) if (negocio) await admin("_admin/" + uid, { negocio });
  console.log("usuarios ficticios dados de alta: " + Object.keys(usuarios).length + " (5 con rol + 1 sin rol)");
  console.log("=== P1 · matriz de roles ===");
  const S = Date.now().toString().slice(-5);
  await chk("admin El Titi escribe su propio contador", 200, () => req("PUT", "menu/meta/contadorPedidos", 77, "ficti-titi-001"));
  await chk("admin El Titi NO escribe el contador de Col Sabor", 401, () => req("PUT", "colsabor/meta/contadorPedidos", 77, "ficti-titi-001"));
  await chk("admin El Titi NO escribe productos de Col Sabor", 401, () => req("PUT", "colsabor/productos/x" + S, { nombre: "inyectado" }, "ficti-titi-001"));
  await chk("admin El Titi SÍ lee pedidos privados de El Titi", 200, () => req("GET", "menu/pedidos_privados", undefined, "ficti-titi-001"));
  await chk("admin El Titi NO lee pedidos privados de Col Sabor", 401, () => req("GET", "colsabor/pedidos_privados", undefined, "ficti-titi-001"));
  await chk("admin Col Sabor escribe su contador", 200, () => req("PUT", "colsabor/meta/contadorPedidos", 88, "ficti-colsabor-001"));
  await chk("admin Col Sabor NO escribe el de El Titi", 401, () => req("PUT", "menu/meta/contadorPedidos", 88, "ficti-colsabor-001"));
  await chk("admin Col Sabor NO toca menu_backup", 401, () => req("PUT", "menu_backup/productos/b", { x: 1 }, "ficti-colsabor-001"));
  await chk("admin DTA escribe su namespace publico", 401, () => req("PUT", "dta-chanclas/meta/x", { x: 1 }, "ficti-dta-001"));
  await chk("admin NBC NO escribe El Titi", 401, () => req("PUT", "menu/productos/y" + S, { x: 1 }, "ficti-nbc-001"));
  await chk("admin de agencia NO escribe ningun negocio", 401, () => req("PUT", "colsabor/meta/contadorPedidos", 5, "ficti-agencia-001"));
  await chk("usuario SIN rol NO escribe nada", 401, () => req("PUT", "menu/meta/contadorPedidos", 5, "ficti-sinrol-001"));
  await chk("usuario SIN rol NO lee pedidos privados", 401, () => req("GET", "menu/pedidos_privados", undefined, "ficti-sinrol-001"));
  await chk("visitante anonimo sigue creando pedidos", 200, () => req("PUT", "menu/pedidos/PED-" + S, { codigoConsulta: "ROLE" + S, estado: "PENDIENTE" }));
  console.log("\n  comprobaciones: " + (ok + fail) + " · PASA " + ok + " · FALLA " + fail);
})().catch((e) => { console.error("ERROR: " + e.message); process.exit(2); });
