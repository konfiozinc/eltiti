const fs = require("node:fs");
const { tokenAcceso } = require("C:/Users/usuario29/Documents/KONFIO_ZINC/6-LANDING-PAGES/UneFibra-SAS/tools/lib/google-auth");
const BASE = "https://el-titi-menu-default-rtdb.firebaseio.com";
const NUEVAS = [
  { email: "admin@dta.com", uid: "DvFfZb6oysQ2ybmpnCC6dJ5ZGSS2", negocio: "dta-chanclas" },
  { email: "admin@nbc.com", uid: "zJOMKZIhssVE9QHMUbSBSFhwWq42", negocio: "nbc-company" }
];
(async () => {
  const t = await tokenAcceso(); const q = "?access_token=" + encodeURIComponent(t); const h = { "content-type": "application/json" };
  console.log("=== crear los dos registros autorizados (DTA y NBC)");
  for (const c of NUEVAS) {
    const r = await fetch(`${BASE}/_admin/${c.uid}.json${q}`, { method: "PUT", headers: h, body: JSON.stringify({ negocio: c.negocio, activo: true }) });
    const leido = await (await fetch(`${BASE}/_admin/${c.uid}.json${q}`)).json();
    console.log(`  ${c.email} -> HTTP ${r.status} · ${JSON.stringify(leido)}`);
  }
  const todo = await (await fetch(BASE + "/_admin.json" + q)).json();
  console.log("=== _admin final: " + Object.keys(todo).length + " registros");
  Object.entries(todo).forEach(([u, v]) => console.log("    " + u.slice(0, 10) + "… · " + JSON.stringify(v)));
  const reglas = JSON.parse(fs.readFileSync("C:/KZ-EVIDENCIA/kz-release-011/reglas-ACTUALES-respaldo.json", "utf8"));
  console.log("=== productos/pedidos intactos: dta=" + (await (await fetch(BASE + "/dta-chanclas.json" + q)).text()).length + " chars · nbc=" + (await (await fetch(BASE + "/nbc-company.json" + q)).text()).length + " chars");
})().catch((e) => console.error("ERROR: " + e.message));
