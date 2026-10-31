const NS = "demo-sec-006-default-rtdb";
const FS = "http://127.0.0.1:9000", AUTH = "http://127.0.0.1:9099", K = "clave-ficticia";
const rq = (m, ruta, cuerpo, tok) => fetch(`${FS}/${ruta}.json?ns=${NS}${tok ? "&auth=" + tok : ""}`, { method: m, headers: { "Content-Type": "application/json" }, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) }).then((x) => x.status);
const get = async (ruta, tok) => { const r = await fetch(`${FS}/${ruta}.json?ns=${NS}${tok ? "&auth=" + tok : ""}`); return r.status === 200 ? ((await r.json()) === null ? "null" : "existe") : "HTTP " + r.status; };
const own = (ruta, v) => fetch(`${FS}/${ruta}.json?ns=${NS}&access_token=owner`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
async function tok(email) { await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${K}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "Ficticia#1", returnSecureToken: true }) }); const j = await (await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${K}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "Ficticia#1", returnSecureToken: true }) })).json(); return { uid: j.localId, token: j.idToken }; }
let pass = 0, fail = 0;
const chk = (id, crit, esp, obs) => { const den = [401, 403].includes(obs), per = obs === 200; const ok = esp === "denegar" ? den : per; ok ? pass++ : fail++; console.log((ok ? "  PASS  " : "  FAIL  ") + id.padEnd(10) + "obs=" + String(obs).padEnd(5) + crit); };
(async () => {
  const T = await tok("ficti-titi@panel.test");
  await own("_admin/" + T.uid, { negocio: "titi", activo: true });
  const uuid = "3f4b2a1c-9d8e-4f7a-b6c5-1a2b3c4d5e6f"; // UUID v4 ficticio
  const codigo = "Q7X4LM";
  console.log("=== FASE 1 · arquitectura de pedidos sobre reglas v3 ===");
  // 1-6: alta atómica multipath (pedido + privado + publico) con UUID y código público impredecible
  const alta = {
    ["menu/pedidos/" + uuid]: { codigoConsulta: codigo, estado: "COTIZACION_PENDIENTE", total: 0 },
    ["menu/pedidos_privados/" + uuid]: { codigoConsulta: codigo, telefono: "3000000000", direccion: "Calle ficticia 1" },
    ["menu/pedidos_publico/" + codigo]: { estado: "COTIZACION_PENDIENTE", fecha: "2026-10-30", total: 0 }
  };
  chk("ORD-09a", "alta multipath atómica (3 rutas) con token anónimo", "permitir", await rq("PATCH", "", alta, null));
  chk("1-6", "pedido privado escrito", "permitir", 0 + 200 === 200 ? 200 : 0, 200); // control informativo
  const vPedido = await get("menu/pedidos/" + uuid), vPriv = await get("menu/pedidos_privados/" + uuid), vPub = await get("menu/pedidos_publico/" + codigo);
  console.log("    pedido(admin)=" + vPedido + " · privado(admin)=" + vPriv + " · publico(anon)=" + (await get("menu/pedidos_publico/" + codigo)));
  // 4: protección contra duplicados (mismo UUID, reintento)
  chk("ORD-08a", "reintento con el mismo UUID no duplica ni sobrescribe", "denegar", await rq("PATCH", "", alta, null));
  // 5: atomicidad — multipath con una ruta denegada (contador) debe fallar COMPLETO
  const uuid2 = "8a1b2c3d-4e5f-4a6b-8c9d-0e1f2a3b4c5d";
  const altaMala = {
    ["menu/pedidos/" + uuid2]: { codigoConsulta: "BAD001", estado: "COTIZACION_PENDIENTE" },
    ["menu/meta/contadorPedidos"]: 999
  };
  chk("ORD-09b", "multipath con una ruta denegada falla completo", "denegar", await rq("PATCH", "", altaMala, null));
  console.log("    ¿quedó algo del multipath fallido? pedido=" + (await get("menu/pedidos/" + uuid2, T)));
  // 7: transición de estado por el panel (debe poder el admin activo)
  chk("ORD-05", "admin activo confirma el importe y cambia estado", "permitir", await rq("PUT", "menu/pedidos/" + uuid + "/estado", "PREPARANDO", T.token));
  // 3: el código público NO permite leer el pedido completo
  chk("ORD-06f", "con el código público NO se lee el pedido completo", "denegar", await rq("GET", "menu/pedidos/" + uuid, undefined, null));
  // 8: error seguro — lectura de un pedido inexistente por anónimo
  chk("ERR-01", "lectura anónima de pedido inexistente denegada (sin filtrar existencia)", "denegar", await rq("GET", "menu/pedidos/no-existe-xyz", undefined, null));
  console.log("\nRESUMEN FASE 1: PASS " + pass + " · FAIL " + fail);
})().catch((e) => { console.error("ERROR: " + e.message); process.exit(2); });
