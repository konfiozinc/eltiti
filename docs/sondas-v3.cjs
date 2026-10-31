const NS = "demo-sec-006-default-rtdb";
const FS = "http://127.0.0.1:9000", AUTH = "http://127.0.0.1:9099", K = "clave-ficticia";
const rq = (m, ruta, cuerpo, tok) => fetch(`${FS}/${ruta}.json?ns=${NS}${tok ? "&auth=" + tok : ""}`, { method: m, headers: { "Content-Type": "application/json" }, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) }).then((x) => x.status);
const own = (ruta, v) => fetch(`${FS}/${ruta}.json?ns=${NS}&access_token=owner`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
const del = (ruta) => fetch(`${FS}/${ruta}.json?ns=${NS}&access_token=owner`, { method: "DELETE" });
async function tok(email) {
  await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${K}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "Ficticia#1", returnSecureToken: true }) });
  const j = await (await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${K}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "Ficticia#1", returnSecureToken: true }) })).json();
  return j.idToken;
}
let pass = 0, fail = 0;
const chk = (id, crit, esp, obs) => { const den = [401, 403].includes(obs), per = obs === 200; const ok = esp === "denegar" ? den : per; ok ? pass++ : fail++; console.log((ok ? "  PASS  " : "  FAIL  ") + id.padEnd(12) + "obs=" + String(obs).padEnd(5) + " " + crit); };
(async () => {
  const T = await tok("ficti-titi@panel.test"), C = await tok("ficti-colsabor@panel.test"), S = await tok("ficti-sinrol@panel.test");
  const me = await (await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:lookup?key=${K}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: T }) })).json();
  const uidT = me.users[0].localId;
  const meC = await (await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:lookup?key=${K}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ idToken: C }) })).json();
  const uidC = meC.users[0].localId;
  await own("_admin/" + uidT, { negocio: "titi", activo: true });
  await own("_admin/" + uidC, { negocio: "colsabor", activo: true });
  // fixtures
  await own("menu/pedidos/PED-0001", { codigoConsulta: "AF34GR", estado: "PENDIENTE" });
  await own("menu/pedidos_privados/PED-0001", { codigoConsulta: "AF34GR", telefono: "3000000000" });
  await own("colsabor/pedidos/PED-9001", { codigoConsulta: "ZZ99ZZ", estado: "PENDIENTE" });
  await own("menu_backup/productos/b1", { n: "ficticio" });
  await own("menu/meta/contadorPedidos", 5);
  console.log("=== las 10 sondas originales (v3) ===");
  chk("AUTH-02", "ANON no lee mapping", "denegar", await rq("GET", "_admin", undefined, null));
  chk("AUTH-11", "UA no lee permisos ajenos", "denegar", await rq("GET", "_admin/" + uidC, undefined, T));
  chk("AUTH-11b", "no autoasignación", "denegar", await rq("PUT", "_admin/" + uidT, { negocio: "agencia", activo: true }, T));
  chk("AUTH-04", "dueño escribe su negocio", "permitir", await rq("PUT", "menu/meta/contadorPedidos", 6, T));
  chk("AUTH-05", "UA no administra B", "denegar", await rq("PUT", "colsabor/meta/contadorPedidos", 1, T));
  chk("AUTH-06", "UB no administra A", "denegar", await rq("PUT", "menu/meta/contadorPedidos", 1, C));
  chk("ORD-02a", "ANON no sobrescribe pedido", "denegar", await rq("PUT", "menu/pedidos/PED-0001", { codigoConsulta: "X", estado: "PAGADO" }, null));
  chk("ORD-02b", "ANON no borra pedido", "denegar", await rq("DELETE", "menu/pedidos/PED-0001", undefined, null));
  chk("ORD-06", "ANON NO lista pedidos", "denegar", await rq("GET", "menu/pedidos", undefined, null));
  // AUTH-08 inactivo: desactivar y probar con el mismo token
  await own("_admin/" + uidT, { negocio: "titi", activo: false });
  chk("AUTH-08", "inactivo no administra", "denegar", await rq("PUT", "menu/meta/contadorPedidos", 9, T));
  await own("_admin/" + uidT, { negocio: "titi", activo: true });
  console.log("=== sondas añadidas (lectura global vs individual y permisos) ===");
  chk("ORD-06b", "ANON lee seguimiento individual por código", "permitir", await rq("PUT", "menu/pedidos_publico/AF34GR", { estado: "PENDIENTE", fecha: "2026-10-30" }, null));
  chk("ORD-06c", "seguimiento existente no se sobrescribe", "denegar", await rq("PUT", "menu/pedidos_publico/AF34GR", { estado: "ENTREGADO" }, null));
  chk("ORD-06d", "ANON sigue sin leer pedidos (individual incluido)", "denegar", await rq("GET", "menu/pedidos/PED-0001", undefined, null));
  chk("ORD-06e", "ANON no lee privados", "denegar", await rq("GET", "menu/pedidos_privados/PED-0001", undefined, null));
  chk("AUTH-08b", "admin ACTIVO sí administra", "permitir", await rq("PUT", "menu/productos/p" + Date.now().toString().slice(-4), { nombre: "ficticio" }, T));
  await del("_admin/" + uidT); // RETIRADO durante la sesión, token sigue válido
  chk("AUTH-09", "RETIRADO (mapping borrado, token válido) no administra", "denegar", await rq("PUT", "menu/productos/retirado", { nombre: "x" }, T));
  chk("AUTH-09b", "RETIRADO no lee pedidos", "denegar", await rq("GET", "menu/pedidos", undefined, T));
  chk("SINROL", "usuario sin rol no administra", "denegar", await rq("PUT", "menu/meta/contadorPedidos", 1, S));
  await own("_admin/" + uidT, { negocio: "titi", activo: true });
  console.log("\nRESUMEN: PASS " + pass + " · FAIL " + fail);
})().catch((e) => { console.error("ERROR: " + e.message); process.exit(2); });
