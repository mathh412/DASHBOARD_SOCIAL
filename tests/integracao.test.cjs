const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const path = require('node:path');
const os = require('node:os');
const vm = require('node:vm');
const http = require('node:http');
const { pathToFileURL } = require('node:url');
const dashboard = path.resolve(__dirname, '..');
const mapa = process.env.MAPA_REPO || path.resolve(dashboard, '../mapa');
const read = file => fs.readFile(file, 'utf8');

class Elemento {
    constructor() { this.options = []; this.selectedIndex = -1; this.disabled = false; this.style = {}; this.dataset = {}; this.classList = { add() {}, remove() {} }; }
    set innerHTML(value) {
        this.html = value; this.options = []; this.selectedIndex = -1;
        for (const [,v,label] of value.matchAll(/<option value="([^"]*)">([^<]*)<\/option>/g)) this.appendChild({value:v,textContent:label});
    }
    get innerHTML() { return this.html || ''; }
    set value(value) { this.selectedIndex = this.options.findIndex(o => o.value === value); }
    get value() { return this.options[this.selectedIndex]?.value || ''; }
    appendChild(option) { this.options.push(option); if (this.selectedIndex < 0) this.selectedIndex = 0; }
    addEventListener() {}
}

async function contexto(search = '', fetchImpl = fetch) {
    const elements = new Map();
    const document = {
        body: new Elemento(), baseURI: 'http://localhost/mapa/',
        getElementById(id) { if (!elements.has(id)) elements.set(id, new Elemento()); return elements.get(id); },
        createElement() { return { value: '', textContent: '' }; },
        addEventListener() {}, querySelectorAll() { return []; }
    };
    const window = { location: { search }, addEventListener() {} };
    const ctx = vm.createContext({ window, document, location: window.location, URL, URLSearchParams, console,
        fetch: fetchImpl, setTimeout: () => 0, clearTimeout() {}, performance });
    for (const file of ['app.js', 'parcerias.js', 'url-config.js', 'mapa-iframe.js', 'comparacao.js', 'navegacao.js']) {
        vm.runInContext(await read(path.join(dashboard, 'js', file)), ctx, { filename: file });
    }
    return { ctx, elements, run: code => vm.runInContext(code, ctx) };
}

async function servidor(t, raiz) {
    const requests = [];
    const server = http.createServer(async (req, res) => {
        const pathname = new URL(req.url, 'http://local').pathname;
        requests.push(pathname);
        try { res.end(await fs.readFile(path.join(raiz, pathname))); }
        catch { res.writeHead(404); res.end('Ausente'); }
    });
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    t.after(() => new Promise(resolve => server.close(resolve)));
    const base = `http://127.0.0.1:${server.address().port}/`;
    const localFetch = (url, options) => {
        const parsed = new URL(String(url));
        const localPath = parsed.hostname === 'raw.githubusercontent.com'
            ? parsed.pathname.replace('/mathh412/mapa/refs/heads/main/', '')
            : parsed.pathname.replace(/^\/mapa\//, '');
        return fetch(new URL(localPath.replace(/^\//, ''), base), options);
    };
    return { requests, localFetch, base };
}

test('catálogo real: determinismo, referências e GeoJSONs; todos os arquivos locais do HTML existem', async () => {
    const { gerarCatalogo } = await import(pathToFileURL(path.join(mapa, 'scripts/gerar-catalogo.mjs')));
    const catalogo = await gerarCatalogo(mapa, true);
    const pastas = (await fs.readdir(path.join(mapa,'grupos'),{withFileTypes:true})).filter(e=>e.isDirectory());
    assert.equal(catalogo.grupos.length, pastas.length);
    assert.ok(catalogo.grupos.length > 0);
    for (const raiz of [mapa, dashboard]) {
        const html = await read(path.join(raiz, 'index.html'));
        for (const [, ref] of html.matchAll(/(?:src|href)\s*=\s*"(\.\/[^"?#]+)"/g)) {
            await fs.access(path.join(raiz, ref));
        }
    }
});

test('HTTP: nova parceria somente no mapa aparece no dashboard; inativos são excluídos; uma requisição', async t => {
    const tmp = await fs.mkdtemp(path.join(os.tmpdir(), 'spp-catalogo-'));
    t.after(() => fs.rm(tmp, { recursive: true, force: true }));
    await fs.cp(path.join(mapa, 'grupos'), path.join(tmp, 'grupos'), { recursive: true });
    const nova = path.join(tmp, 'grupos', 'novateste');
    await fs.mkdir(nova);
    await fs.writeFile(path.join(nova, 'config.json'), JSON.stringify({codigo:'novateste',nome:'Nova teste',categoria:'Teste',ativo:true}));
    await fs.copyFile(path.join(mapa,'grupos/anhembi/perimetros.geojson'),path.join(nova,'perimetros.geojson'));
    const cfgPath = path.join(tmp,'grupos/ceus1/config.json');
    const cfg = JSON.parse(await read(cfgPath)); cfg.ativo = false;
    await fs.writeFile(cfgPath,JSON.stringify(cfg));
    const { gerarCatalogo } = await import(pathToFileURL(path.join(mapa,'scripts/gerar-catalogo.mjs')));
    await gerarCatalogo(tmp);
    const { requests, localFetch } = await servidor(t,tmp);
    const { run } = await contexto('',localFetch);
    await Promise.all([run('carregarCatalogoParcerias()'),run('carregarCatalogoParcerias()')]);
    assert.equal(run('PARCERIAS.novateste.nome'),'Nova teste');
    assert.equal(run('Boolean(PARCERIAS.ceus1)'),false);
    assert.equal(requests.filter(r=>r.endsWith('catalogo.json')).length,1);
    const response = await localFetch(run('PARCERIAS.novateste.arquivo'));
    assert.ok(response.ok);
    assert.ok((await response.json()).features.length);
    await fs.writeFile(cfgPath,JSON.stringify({...cfg,codigo:'divergente'}));
    await assert.rejects(gerarCatalogo(tmp),/coincidir/);
});

test('catálogo: falha HTTP, duplicidade, formato inválido e catálogo vazio não publicam dados parciais', async () => {
    const catalogo = JSON.parse(await read(path.join(mapa,'grupos/catalogo.json')));
    for (const payload of [null, {versao:2,grupos:[]}, {versao:1,grupos:[]},
        {versao:1,grupos:[catalogo.grupos[0],catalogo.grupos[0]]}]) {
        const { run } = await contexto('',async()=>({ok:payload!==null,status:503,json:async()=>payload}));
        await assert.rejects(run('carregarCatalogoParcerias()'));
        assert.equal(run('Object.keys(PARCERIAS).length'),0);
    }
});

test('mapa: carrega catálogo e somente os 23 GeoJSONs existentes, preservando tipos', async t => {
    const { localFetch, requests } = await servidor(t,mapa);
    const { ctx, run } = await contexto('',localFetch);
    // Exercita o carregador real, isolando apenas a renderização Leaflet.
    const source = await read(path.join(mapa,'js/mapa.js'));
    const loader = source.slice(source.indexOf('async function carregarMapa()'),source.indexOf('// SISTEMA DO MAPA'));
    vm.runInContext(`let regioesGeoJSON, subprefeiturasGeoJSON, distritosGeoJSON, geojsonPerimetros, geojsonItens;
        const EQUIPMENT_TYPES = {education:{},park:{},terminal:{},market:{},sport:{},cemetery:{},events:{},publicspace:{},housing:{}};
        const EQUIPMENT_GROUP_TYPES = {}; const sppCatalog = [];
        function itemAtendeFiltros() { return true; }
        function inicializarSistema() { globalThis.mapaIniciado = true; }
        function enviarAcaoParaPai(type, dados) { globalThis.mensagemMapa = {type,dados}; }
        ${loader.replace('carregarMapa();','globalThis.carregamentoMapa = carregarMapa();')}`,ctx);
    await run('carregamentoMapa');
    assert.equal(run('mapaIniciado'),true);
    const ativos = JSON.parse(await read(path.join(mapa,'grupos/catalogo.json'))).grupos.filter(g=>g.ativo);
    assert.equal(requests.length,4 + ativos.reduce((n,g)=>n+g.arquivos.length,0));
    assert.equal(requests.filter(r=>r.endsWith('blocos.geojson')).length,ativos.filter(g=>g.arquivos.includes('blocos.geojson')).length);
    assert.equal(run('EQUIPMENT_GROUP_TYPES.pacaembu'),'sport');
    assert.equal(run('mensagemMapa.type'),'map-ready');
    assert.equal(run('mensagemMapa.dados.grupos.length'),ativos.length);
});

async function prepararComparacao(t, search='') {
    const { localFetch } = await servidor(t,mapa);
    const env = await contexto(search,localFetch);
    await env.run('carregarCatalogoParcerias()');
    env.run(`carregarElementosComparacao();
        atualizarMapaBaseComparacao = () => {};
        agendarComparacao = () => {};
        preencherParceriasComparacao();`);
    return env;
}

test('comparação: parcerias de um equipamento se excluem nos dois sentidos', async t => {
    const { run } = await prepararComparacao(t);
    run("comparacaoElementos.parceriaA.value='anhembi'; comparacaoElementos.parceriaB.value='ceus1';");
    await run('alterarParceriaComparacaoA()');
    assert.equal(run("Array.from(comparacaoElementos.parceriaB.options).some(o=>o.value==='anhembi')"),false);
    run("comparacaoElementos.parceriaB.value='pacaembu';");
    await run('alterarParceriaComparacaoB()');
    assert.equal(run("Array.from(comparacaoElementos.parceriaA.options).some(o=>o.value==='pacaembu')"),false);
});

test('comparação: grupo fixo com um equipamento bloqueia B e execução inválida', async t => {
    const { run } = await prepararComparacao(t,'?pagina=comparacao&grupo=anhembi');
    assert.equal(await run('aplicarGrupoFixoComparacao()'),true);
    assert.equal(run('comparacaoElementos.parceriaB.options.length'),0);
    assert.equal(run('featureComparacaoB'),null);
    assert.equal(run('comparacaoElementos.botao.disabled'),true);
    assert.match(run('comparacaoElementos.status.textContent'),/apenas um/);
});

test('comparação: dois equipamentos, seleção manual em A/B e guarda contra igualdade', async t => {
    const { run } = await prepararComparacao(t,'?pagina=comparacao&grupo=ceus1');
    await run('aplicarGrupoFixoComparacao()');
    assert.equal(run('equipamentosIguaisComparacao()'),false);
    assert.equal(run('comparacaoElementos.parceriaA.value === comparacaoElementos.parceriaB.value'),true);
    assert.ok(run('comparacaoElementos.localA.value'));
    assert.ok(run('comparacaoElementos.localB.value'));
    assert.equal(run("comparacaoElementos.localA.options.some(o=>o.textContent==='Selecione')"),false);
    // Reconstituir as opções originais isola a guarda para mudanças programáticas.
    run(`for (const lado of ['A','B']) {
        const select = comparacaoElementos['local'+lado];
        const valor = select.value;
        select.innerHTML = '';
        parceriaComparacaoA.features.forEach((f,i)=>select.appendChild({value:String(i),textContent:String(i)}));
        select.value = valor;
    }`);
    run('comparacaoElementos.localA.value = comparacaoElementos.localB.value; alterarLocalComparacaoA();');
    assert.equal(run('equipamentosIguaisComparacao()'),false);
    run('comparacaoElementos.localB.value = comparacaoElementos.localA.value; alterarLocalComparacaoB();');
    assert.equal(run('equipamentosIguaisComparacao()'),false);
    run('comparacaoElementos.localB.value = comparacaoElementos.localA.value; featureComparacaoB = featureComparacaoA; verificarBotaoComparar(); executarComparacao();');
    assert.equal(run('comparacaoElementos.botao.disabled'),true);
    assert.equal(run('resultadoComparacaoB'),null);
});

test('quatro páginas: filtros válidos, sem Selecione, iframe travado e grupo desconhecido', async t => {
    const { localFetch } = await servidor(t,mapa);
    for (const pagina of ['visao-geral','sociodemografico','vulnerabilidade','comparacao']) {
        const { run, elements } = await contexto(`?pagina=${pagina}&grupo=ceus1&nivel=interno`,localFetch);
        await run('carregarCatalogoParcerias()');
        run('carregarElementos(); prepararFiltroParcerias();');
        assert.equal(run('elementos.parceria.value'),'ceus1');
        assert.equal(run('elementos.parceria.options.length'),1);
        const id = pagina==='comparacao' ? 'mapa-comparacao-iframe' : 'mapa-spp-iframe';
        if (['visao-geral','comparacao'].includes(pagina)) {
            const url = new URL(elements.get(id).src);
            assert.equal(url.searchParams.get('nivel'),'perimetro');
            assert.equal(url.searchParams.get('nivel_travado'),'1');
            assert.equal(url.searchParams.get('embed'),'1');
        }
    }
    const { run } = await contexto('?grupo=inexistente',localFetch);
    await run('carregarCatalogoParcerias()');
    assert.equal(run('window.SPPDashboardURL.obterCodigosPermitidos().length'),0);
});

test('inicialização espera catálogo atrasado e comparação espera dados territoriais', async t => {
    const { localFetch } = await servidor(t,mapa);
    let liberar;
    const gate = new Promise(resolve=>{liberar=resolve;});
    const { run } = await contexto('?pagina=comparacao',async(...args)=>{await gate;return localFetch(...args);});
    run(`globalThis.etapas = [];
        inicializarMapa = () => etapas.push('mapa'); registrarEventos = () => {};
        carregarDados = async () => etapas.push('dados'); limparGraficoDistancia = () => {};
        preencherParceriasComparacao = () => etapas.push('comparacao');
        registrarEventosComparacao = registrarEventosMapaComparacao = atualizarRaioComparacao = () => {};
        aplicarGrupoFixoComparacao = async () => true;
        window.SPPDashboardPronto = iniciar(); globalThis.compPronta = iniciarComparacao();`);
    assert.equal(run('etapas.length'),0);
    liberar();
    await run('Promise.all([window.SPPDashboardPronto,compPronta])');
    assert.deepEqual(Array.from(run('etapas')),['mapa','dados','comparacao']);
});
