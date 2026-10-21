// Fonte única: catálogo gerado e publicado pelo repositório mapa.
const URL_BASE_MAPA =
    'https://raw.githubusercontent.com/mathh412/mapa/refs/heads/main/grupos';
const URL_CATALOGO_PARCERIAS = `${URL_BASE_MAPA}/catalogo.json`;
let promessaCatalogoParcerias = null;

function carregarCatalogoParcerias() {
    // Uma única requisição compartilhada entre visão geral e comparação.
    if (!promessaCatalogoParcerias) {
        promessaCatalogoParcerias = (async () => {
            const resposta = await fetch(URL_CATALOGO_PARCERIAS, { cache: 'no-cache' });
            if (!resposta.ok) throw new Error(`Erro ao carregar catálogo: HTTP ${resposta.status}`);
            const catalogo = await resposta.json();
            if (catalogo.versao !== 1 || !Array.isArray(catalogo.grupos)) {
                throw new Error('Formato de catálogo inválido.');
            }
            const entradas = [];
            const codigos = new Set();
            for (const grupo of catalogo.grupos) {
                if (!grupo || !/^[a-z0-9][a-z0-9_-]*$/.test(grupo.codigo)
                    || codigos.has(grupo.codigo) || typeof grupo.ativo !== 'boolean'
                    || typeof grupo.nome !== 'string' || !grupo.nome.trim()
                    || typeof grupo.categoria !== 'string' || !grupo.categoria.trim()
                    || !Array.isArray(grupo.arquivos) || !grupo.arquivos.includes('perimetros.geojson')) {
                    throw new Error('Parceria inválida no catálogo.');
                }
                codigos.add(grupo.codigo);
                if (grupo.ativo) entradas.push([grupo.codigo, {
                    nome: grupo.nome,
                    categoria: grupo.categoria,
                    arquivo: `${URL_BASE_MAPA}/${grupo.codigo}/perimetros.geojson`
                }]);
            }
            if (!entradas.length) throw new Error('O catálogo não possui parcerias ativas.');
            // Publicação atômica: não deixa um catálogo parcial em caso de erro.
            Object.defineProperties(PARCERIAS, Object.fromEntries(entradas.map(([codigo, valor]) =>
                [codigo, { value: valor, enumerable: true, configurable: true, writable: true }])));
            return PARCERIAS;
        })();
    }
    return promessaCatalogoParcerias;
}
