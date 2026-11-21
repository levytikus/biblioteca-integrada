#!/usr/bin/env node
/*
 * Avaliação do SIBI Analisador contra gabaritos conferidos à mão.
 *
 * Uso:  node analisador/testes/avaliar.js <pasta-com-os-PDFs> [A1 B2 ...]
 * Precisa de: npm i pdfjs-dist@3.11.174 jszip @xmldom/xmldom (em qualquer pasta acima, ou via NODE_PATH)
 *
 * Cada gabarito (gabaritos/<nome>.json) diz, item por item, o que o Analisador DEVERIA responder
 * para aquele trabalho, segundo a conferência feita no PDF original:
 *   "itens":      { "<id do item>": "erro" | "alerta" | "ok" }      (ok inclui o item não aparecer)
 *   "evidencias": { "<id>": { "contem": [...], "nao_contem": [...] } }  (trechos na lista de evidências ou no detalhe)
 * Os PDFs não ficam no repositório (são trabalhos de terceiros): passe a pasta onde estão.
 */
const fs = require('fs'), path = require('path');
const dir = process.argv[2];
if (!dir) { console.error('Uso: node avaliar.js <pasta-com-os-PDFs> [nomes...]'); process.exit(2); }
const only = process.argv.slice(3);
const html = fs.readFileSync(process.env.ANALISADOR_HTML || path.join(__dirname, '..', 'index.html'), 'utf8'); // ANALISADOR_HTML: avaliar outra versão
for (const s of [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(x => x[1]).filter(s => s.includes('G.SibiParsers') || s.includes('G.SibiAnalyzer'))) (0, eval)(s);
const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js');
const FLAG = (s) => s === 'erro' || s === 'alerta';
(async () => {
  const files = fs.readdirSync(path.join(__dirname, 'gabaritos')).filter(f => f.endsWith('.json')).map(f => f.replace(/\.json$/, '')).filter(n => !only.length || only.includes(n)).sort();
  const tot = { vp: 0, fp: 0, fn: 0, sev: 0, ev: 0, evFail: 0, ms: 0 }; let falhas = [];
  for (const nome of files) {
    const gab = JSON.parse(fs.readFileSync(path.join(__dirname, 'gabaritos', nome + '.json'), 'utf8'));
    const pdf = path.join(dir, gab.arquivo || nome + '.pdf');
    if (!fs.existsSync(pdf)) { console.log(`${nome}: PDF não encontrado (${pdf}), pulado`); continue; }
    const t0 = Date.now();
    const model = await globalThis.SibiParsers.parsePdf(fs.readFileSync(pdf), { pdfjsLib });
    const res = globalThis.SibiAnalyzer.analyze(model, { fileName: path.basename(pdf) });
    const ms = Date.now() - t0;
    const got = {}; for (const c of res.checks) got[c.id] = c;
    const r = { vp: 0, fp: 0, fn: 0, sev: 0, ev: 0, evFail: 0 };
    const ids = new Set([...Object.keys(gab.itens), ...res.checks.filter(c => FLAG(c.status)).map(c => c.id)]);
    for (const id of ids) {
      const want = gab.itens[id] || 'ok', have = got[id] ? got[id].status : 'ok';
      if (FLAG(want) && FLAG(have)) { r.vp++; if (want !== have) { r.sev++; falhas.push(`${nome} ${id}: gravidade ${have}, esperado ${want}`); } }
      else if (!FLAG(want) && FLAG(have)) { r.fp++; falhas.push(`${nome} ${id}: alarme falso (${have})`); }
      else if (FLAG(want) && !FLAG(have)) { r.fn++; falhas.push(`${nome} ${id}: não apontado (esperado ${want})`); }
    }
    for (const [id, e] of Object.entries(gab.evidencias || {})) {
      const c = got[id]; const hay = c ? [c.detail || '', ...(c.evidence || []).map(x => `${x.text || ''} | ${x.note || ''}`)].join('\n') : '';
      for (const s of e.contem || []) { r.ev++; if (!hay.includes(s)) { r.evFail++; falhas.push(`${nome} ${id}: deveria citar "${s}"`); } }
      for (const s of e.nao_contem || []) { r.ev++; if (hay.includes(s)) { r.evFail++; falhas.push(`${nome} ${id}: não deveria citar "${s}"`); } }
    }
    console.log(`${nome.padEnd(4)} ${String(Array.isArray(model.pages) ? model.pages.length : (model.pages || model.pageCount || '')).padStart(4)} pág  ${(ms / 1000).toFixed(1).padStart(5)} s  acertos ${r.vp}  alarmes falsos ${r.fp}  não apontados ${r.fn}  gravidade trocada ${r.sev}  evidências ${r.ev - r.evFail}/${r.ev}`);
    for (const k of Object.keys(r)) tot[k] += r[k]; tot.ms += ms;
  }
  const prec = tot.vp / Math.max(1, tot.vp + tot.fp), rec = tot.vp / Math.max(1, tot.vp + tot.fn);
  console.log(`\nTOTAL  precisão ${(prec * 100).toFixed(1)}%  cobertura ${(rec * 100).toFixed(1)}%  gravidade trocada ${tot.sev}  evidências ${tot.ev - tot.evFail}/${tot.ev}  tempo ${(tot.ms / 1000).toFixed(1)} s`);
  if (falhas.length) { console.log('\nDivergências:'); falhas.forEach(f => console.log('  - ' + f)); }
  process.exit(falhas.length ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
