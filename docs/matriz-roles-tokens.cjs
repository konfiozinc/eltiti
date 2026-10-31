const NS = "demo-sec-006-default-rtdb";
const FS = "http://127.0.0.1:9000", AUTH = "http://127.0.0.1:9099", K = "clave-ficticia";
const USUARIOS = [
  ["ficti-titi@panel.test", "titi"], ["ficti-colsabor@panel.test", "colsabor"],
  ["ficti-dta@panel.test", "dta-chanclas"], ["ficti-nbc@panel.test", "nbc-company"],
  ["ficti-agencia@panel.test", "agencia"], ["ficti-sinrol@panel.test", null]
];
const adminPut = (ruta, valor) => fetch(`${FS}/${ruta}.json?ns=${NS}&access_token=owner`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(valor) });
async function alta(email) {
  await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${K}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "Ficticia#1", returnSecureToken: true }) });
  const j = await (await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${K}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "Ficticia#1", returnSecureToken: true }) })).json();
  return { uid: j.localId, token: j.idToken };
}
let ok = 0, fail = 0;
const chk = async (n, esp, fn) => { const v = await fn(); const b = v === esp; b ? ok++ : fail++; console.log((b ? "  PASA  " : "  FALLA ") + n.padEnd(52) + " -> " + v + (b ? "" : " (esperado " + esp + ")")); };
const req = (m, ruta, cuerpo, token) => fetch(`${FS}/${ruta}.json?ns=${NS}${token ? "&auth=" + token : ""}`, { method: m, headers: { "Content-Type": "application/json" }, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) }).then((r) => r.status);
(async () => {
  const u = {};
  for (const [email, negocio] of USUARIOS) { const a = await alta(email); u[email.split("@")[0]] = a; if (negocio) await adminPut("_admin/" + a.uid, { negocio }); }
  console.log("usuarios ficticios con token de Authentication: " + Object.keys(u).length);
  const S = Date.now().toString().slice(-5);
  console.log("=== P1 · roles con tokens válidos ===");
  await chk("admin El Titi escribe su contador", 200, () => req("PUT", "menu/meta/contadorPedidos", 77, u["ficti-titi"].token));
  await chk("admin El Titi NO escribe el de Col Sabor", 401, () => req("PUT", "colsabor/meta/contadorPedidos", 77, u["ficti-titi"].token));
  await chk("admin El Titi NO escribe productos de Col Sabor", 401, () => req("PUT", "colsabor/productos/x" + S, { n: 1 }, u["ficti-titi"].token));
  await chk("admin El Titi SÍ lee privados de El Titi", 200, () => req("GET", "menu/pedidos_privados", undefined, u["ficti-titi"].token));
  await chk("admin El Titi NO lee privados de Col Sabor", 401, () => req("GET", "colsabor/pedidos_privados", undefined, u["ficti-titi"].token));
  await chk("admin Col Sabor escribe su contador", 200, () => req("PUT", "colsabor/meta/contadorPedidos", 88, u["ficti-colsabor"].token));
  await chk("admin Col Sabor NO escribe el de El Titi", 401, () => req("PUT", "menu/meta/contadorPedidos", 88, u["ficti-colsabor"].token));
  await chk("admin Col Sabor NO toca menu_backup", 401, () => req("PUT", "menu_backup/productos/b", { x: 1 }, u["ficti-colsabor"].token));
  await chk("admin DTA NO escribe en su namespace (solo lectura)", 401, () => req("PUT", "dta-chanclas/meta/x", { x: 1 }, u["ficti-dta"].token));
  await chk("admin NBC NO escribe El Titi", 401, () => req("PUT", "menu/productos/y" + S, { x: 1 }, u["ficti-nbc"].token));
  await chk("admin de agencia NO escribe ningun negocio", 401, () => req("PUT", "colsabor/meta/contadorPedidos", 5, u["ficti-agencia"].token));
  await chk("usuario SIN rol NO escribe nada", 401, () => req("PUT", "menu/meta/contadorPedidos", 5, u["ficti-sinrol"].token));
  await chk("usuario SIN rol NO lee privados", 401, () => req("GET", "menu/pedidos_privados", undefined, u["ficti-sinrol"].token));
  await chk("visitante anonimo sigue creando pedidos", 200, () => req("PUT", "menu/pedidos/PED-R" + S, { codigoConsulta: "ROLE" + S, estado: "PENDIENTE" }));
  console.log("\n  P1: " + (ok + fail) + " escenarios · PASA " + ok + " · FALLA " + fail);
})().catch((e) => { console.error("ERROR: " + e.message); process.exit(2); });
