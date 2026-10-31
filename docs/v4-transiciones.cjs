const fs = require("node:fs");
const NS = "demo-sec-006-default-rtdb";
const FS = "http://127.0.0.1:9000", AUTH = "http://127.0.0.1:9099", K = "clave-ficticia";
const ESTADOS = ["COTIZACION_PENDIENTE","CONFIRMADO","PREPARANDO","EN_CAMINO","ENTREGADO","CANCELADO"];
const ADMIN = (n) => `auth != null && root.child('_admin').child(auth.uid).child('activo').val() == true && root.child('_admin').child(auth.uid).child('negocio').val() == '${n}'`;
const reglas = JSON.parse(fs.readFileSync("database.rules.v3.json", "utf8"));
for (const [neg, n] of [["menu","titi"],["colsabor","colsabor"]]) {
  const p = reglas.rules[neg].pedidos;
  p["$pedido"] = {
    ".write": "!data.exists() && newData.hasChildren(['codigoConsulta','estado'])",
    "estado": {
      ".write": ADMIN(n),
      ".validate": "newData.isString() && (" + ESTADOS.map((e) => `newData.val() == '${e}'`).join(" || ") + ")"
    },
    "total": { ".write": ADMIN(n), ".validate": "newData.isNumber() && newData.val() >= 0" }
  };
}
fs.writeFileSync("database.rules.v4.json", JSON.stringify(reglas, null, 2), "utf8");
const rq = (m, ruta, cuerpo, tok) => fetch(`${FS}/${ruta}.json?ns=${NS}${tok ? "&auth=" + tok : ""}`, { method: m, headers: { "Content-Type": "application/json" }, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) }).then((x) => x.status);
const own = (ruta, v) => fetch(`${FS}/${ruta}.json?ns=${NS}&access_token=owner`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
async function tok(email) { await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${K}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "Ficticia#1", returnSecureToken: true }) }); const j = await (await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${K}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "Ficticia#1", returnSecureToken: true }) })).json(); return { uid: j.localId, token: j.idToken }; }
let pass = 0, fail = 0;
const chk = (id, crit, esp, obs) => { const den = [401,403].includes(obs), per = obs === 200; const ok = esp === "denegar" ? den : per; ok ? pass++ : fail++; console.log((ok ? "  PASS  " : "  FAIL  ") + id.padEnd(10) + "obs=" + String(obs).padEnd(5) + crit); };
(async () => {
  const carg = await fetch(`http://127.0.0.1:9000/.settings/rules.json?ns=${NS}&access_token=owner`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(reglas) });
  console.log("v4 cargada -> HTTP " + carg.status);
  const T = await tok("ficti-titi@panel.test"), C = await tok("ficti-colsabor@panel.test"), S = await tok("ficti-sinrol@panel.test");
  await own("_admin/" + T.uid, { negocio: "titi", activo: true });
  await own("_admin/" + C.uid, { negocio: "colsabor", activo: true });
  const uuid = "aaaaaaaa-bbbb-4ccc-8ddd-eeeeeeeeeeee", cod = "Z9K2PX";
  await own("menu/pedidos/" + uuid, { codigoConsulta: cod, estado: "COTIZACION_PENDIENTE", total: 0 });
  await own("menu/pedidos_privados/" + uuid, { codigoConsulta: cod, telefono: "3000000000" });
  await own("menu/pedidos_publico/" + cod, { estado: "COTIZACION_PENDIENTE", fecha: "2026-10-30", total: 0 });
  console.log("=== transiciones administrativas ===");
  chk("TRANS-01", "admin activo confirma el importe", "permitir", await rq("PUT", `menu/pedidos/${uuid}/total`, 25000, T.token));
  chk("TRANS-02", "admin activo cambia estado a PREPARANDO", "permitir", await rq("PUT", `menu/pedidos/${uuid}/estado`, "PREPARANDO", T.token));
  chk("TRANS-03", "estado inexistente/inventado denegado", "denegar", await rq("PUT", `menu/pedidos/${uuid}/estado`, "PAGADO_ALEGRE", T.token));
  chk("TRANS-04", "admin de otro negocio no cambia el estado", "denegar", await rq("PUT", `menu/pedidos/${uuid}/estado`, "ENTREGADO", C.token));
  chk("TRANS-05", "ANON no cambia estado", "denegar", await rq("PUT", `menu/pedidos/${uuid}/estado`, "ENTREGADO", null));
  chk("TRANS-06", "ANON no fija el total", "denegar", await rq("PUT", `menu/pedidos/${uuid}/total`, 1, null));
  chk("TRANS-07", "admin no reemplaza el pedido completo (solo hijos)", "denegar", await rq("PUT", "menu/pedidos/" + uuid, { codigoConsulta: "X", estado: "ENTREGADO" }, T.token));
  chk("TRANS-08", "sin rol no cambia estado", "denegar", await rq("PUT", `menu/pedidos/${uuid}/estado`, "ENTREGADO", S.token));
  await own("_admin/" + T.uid, { negocio: "titi", activo: false });
  chk("TRANS-09", "admin INACTIVO no cambia estado", "denegar", await rq("PUT", `menu/pedidos/${uuid}/estado`, "ENTREGADO", T.token));
  await own("_admin/" + T.uid, { negocio: "titi", activo: true });
  console.log("=== regresion Fase 1 + nucleo v3 ===");
  const u2 = "11112222-3333-4444-8555-666677778888";
  chk("F1-01", "alta multipath atomica anonima", "permitir", await rq("PATCH", "", { ["menu/pedidos/" + u2]: { codigoConsulta: "AB12CD", estado: "COTIZACION_PENDIENTE", total: 0 }, ["menu/pedidos_privados/" + u2]: { codigoConsulta: "AB12CD" }, ["menu/pedidos_publico/AB12CD"]: { estado: "COTIZACION_PENDIENTE" } }, null));
  chk("F1-02", "reintento mismo UUID denegado", "denegar", await rq("PATCH", "", { ["menu/pedidos/" + u2]: { codigoConsulta: "ZZZZZZ", estado: "ENTREGADO" } }, null));
  chk("F1-03", "multipath con ruta denegada falla completo", "denegar", await rq("PATCH", "", { ["menu/pedidos/33334444-5555-4666-8777-888899990000"]: { codigoConsulta: "QQ11QQ", estado: "COTIZACION_PENDIENTE" }, ["menu/meta/contadorPedidos"]: 999 }, null));
  chk("F1-04", "codigo publico no da el pedido completo", "denegar", await rq("GET", "menu/pedidos/" + uuid, undefined, null));
  chk("V3-ORD06", "ANON no lista pedidos", "denegar", await rq("GET", "menu/pedidos", undefined, null));
  chk("V3-AUTH08", "mapping inactivo no administra (contador)", "denegar", await (async () => { await own("_admin/" + T.uid, { negocio: "titi", activo: false }); const r = await rq("PUT", "menu/meta/contadorPedidos", 1, T.token); await own("_admin/" + T.uid, { negocio: "titi", activo: true }); return r; })());
  console.log("\nRESUMEN v4: PASS " + pass + " · FAIL " + fail);
})().catch((e) => { console.error("ERROR: " + e.message); process.exit(2); });
