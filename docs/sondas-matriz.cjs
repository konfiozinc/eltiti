const NS = "demo-sec-006-default-rtdb";
const FS = "http://127.0.0.1:9000", AUTH = "http://127.0.0.1:9099", K = "clave-ficticia";
const r = (m, ruta, cuerpo, tok) => fetch(`${FS}/${ruta}.json?ns=${NS}${tok ? "&auth=" + tok : ""}`, { method: m, headers: { "Content-Type": "application/json" }, body: cuerpo === undefined ? undefined : JSON.stringify(cuerpo) }).then((x) => x.status);
const own = (ruta, v) => fetch(`${FS}/${ruta}.json?ns=${NS}&access_token=owner`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(v) });
async function tok(email) {
  await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signUp?key=${K}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "Ficticia#1", returnSecureToken: true }) });
  const j = await (await fetch(`${AUTH}/identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${K}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password: "Ficticia#1", returnSecureToken: true }) })).json();
  return { uid: j.localId, token: j.idToken };
}
(async () => {
  const titi = await tok("ficti-titi@panel.test"), col = await tok("ficti-colsabor@panel.test");
  await own("_admin/" + titi.uid, { negocio: "titi", activo: true });
  await own("_admin/" + col.uid, { negocio: "colsabor", activo: true });
  const res = [];
  const add = (id, criterio, esperado, obs, estado) => { res.push({ id, criterio, esperado, obs, estado }); console.log(id.padEnd(9) + estado.padEnd(11) + "obs=" + String(obs).padEnd(5) + " esperado=" + esperado + " · " + criterio); };
  add("AUTH-02", "ANON no lee mapping de acceso", "denegar", await r("GET", "_admin", undefined, null), "?");
  add("AUTH-11", "UA no lee permisos de otro UID", "denegar", await r("GET", "_admin/" + col.uid, undefined, titi.token), "?");
  add("AUTH-11b", "UA no se autoasigna negocio", "denegar", await r("PUT", "_admin/" + titi.uid, { negocio: "agencia" }, titi.token), "?");
  add("AUTH-05", "UA escribe contador ajeno (B)", "denegar", await r("PUT", "colsabor/meta/contadorPedidos", 1, titi.token), "?");
  add("AUTH-06", "UB escribe contador ajeno (A)", "denegar", await r("PUT", "menu/meta/contadorPedidos", 1, col.token), "?");
  add("AUTH-04", "UA escribe contador propio (A)", "permitir", await r("PUT", "menu/meta/contadorPedidos", 2, titi.token), "?");
  add("ORD-02a", "ANON no sobrescribe pedido existente", "denegar", await r("PUT", "menu/pedidos/PED-0001", { codigoConsulta: "X", estado: "PAGADO" }, null), "?");
  add("ORD-02b", "ANON no borra pedido existente", "denegar", await r("DELETE", "menu/pedidos/PED-0001", undefined, null), "?");
  add("ORD-06", "ANON NO puede listar todos los pedidos", "denegar", await r("GET", "menu/pedidos", undefined, null), "?");
  // AUTH-08: mapping inactivo debe denegar
  await own("_admin/" + titi.uid, { negocio: "titi", activo: false });
  add("AUTH-08", "UA-INACTIVO (activo:false) no administra", "denegar", await r("PUT", "menu/meta/contadorPedidos", 3, titi.token), "?");
  await own("_admin/" + titi.uid, { negocio: "titi", activo: true });
  console.log("\nRESUMEN");
  let pass = 0, fail = 0, raro = 0;
  for (const x of res) {
    const denegado = [401, 403].includes(x.obs), permitido = x.obs === 200;
    const ok = x.esperado === "denegar" ? denegado : permitido;
    x.estado = ok ? "PASS" : "FAIL"; ok ? pass++ : fail++;
    console.log("  " + x.id.padEnd(9) + x.estado + (ok ? "" : "  (observado " + x.obs + ", esperado " + x.esperado + ")"));
  }
  console.log("  PASS " + pass + " · FAIL " + fail);
})().catch((e) => { console.error("ERROR: " + e.message); process.exit(2); });
