// ============================================================
// DASHBOARD SPP
// COMPARAÇÃO TERRITORIAL VIA IFRAME
// ============================================================

const COR_COMPARACAO_A =
    "#00506e";

const COR_COMPARACAO_B =
    "#3b7d95";

const DEBOUNCE_COMPARACAO =
    220;

const MAPA_COMPARACAO_ORIGIN =
    new URL(
        "https://mathh412.github.io/mapa/"
    ).origin;

let parceriaComparacaoA =
    null;

let parceriaComparacaoB =
    null;

let featureComparacaoA =
    null;

let featureComparacaoB =
    null;

let resultadoComparacaoA =
    null;

let resultadoComparacaoB =
    null;

let temporizadorComparacao =
    null;

let mapaComparacaoPronto =
    false;

const cacheParceriasComparacao =
    new Map();

const comparacaoElementos =
    {};


// ============================================================
// ELEMENTOS
// ============================================================

function carregarElementosComparacao() {

    comparacaoElementos.parceriaA =
        document.getElementById(
            "comparacao-parceria-a"
        );

    comparacaoElementos.localA =
        document.getElementById(
            "comparacao-local-a"
        );

    comparacaoElementos.parceriaB =
        document.getElementById(
            "comparacao-parceria-b"
        );

    comparacaoElementos.localB =
        document.getElementById(
            "comparacao-local-b"
        );

    comparacaoElementos.campoParceriaA =
        document.getElementById(
            "comparacao-campo-parceria-a"
        );

    comparacaoElementos.campoParceriaB =
        document.getElementById(
            "comparacao-campo-parceria-b"
        );

    comparacaoElementos.camposA =
        document.getElementById(
            "comparacao-campos-a"
        );

    comparacaoElementos.camposB =
        document.getElementById(
            "comparacao-campos-b"
        );

    comparacaoElementos.raio =
        document.getElementById(
            "comparacao-raio"
        );

    comparacaoElementos.raioValor =
        document.getElementById(
            "comparacao-raio-valor"
        );

    comparacaoElementos.criterio =
        document.getElementById(
            "comparacao-criterio"
        );

    comparacaoElementos.botao =
        document.getElementById(
            "botao-comparar"
        );

    comparacaoElementos.status =
        document.getElementById(
            "comparacao-status"
        );

    comparacaoElementos.tabela =
        document.getElementById(
            "tabela-comparacao"
        );

    comparacaoElementos.nomeA =
        document.getElementById(
            "legenda-nome-a"
        );

    comparacaoElementos.nomeB =
        document.getElementById(
            "legenda-nome-b"
        );

    comparacaoElementos.iframe =
        document.getElementById(
            "mapa-comparacao-iframe"
        );

    comparacaoElementos.loading =
        document.getElementById(
            "mapa-comparacao-loading"
        );
}


// ============================================================
// COMUNICAÇÃO COM O MAPA
// ============================================================

function enviarParaMapaComparacao(
    type,
    dados = {}
) {

    const iframe =
        comparacaoElementos.iframe;

    if (
        !iframe
        ||
        !iframe.contentWindow
    ) {
        return;
    }

    iframe.contentWindow.postMessage(
        {
            source:
                "spp-dashboard",
            type,
            ...dados
        },
        MAPA_COMPARACAO_ORIGIN
    );
}


// ============================================================
// FILTRO BASE DO MAPA DA COMPARAÇÃO
// ============================================================

function gruposPermitidosComparacao() {

    const config =
        window.SPPDashboardURL;

    if (
        config
        &&
        typeof config.obterCodigosPermitidos ===
            "function"
    ) {
        return config
            .obterCodigosPermitidos();
    }

    return Object.keys(
        PARCERIAS
    );
}

function gruposBaseComparacao() {

    const config =
        window.SPPDashboardURL;

    if (
        config
        &&
        typeof config.obterGruposParaMapa ===
            "function"
    ) {
        return config
            .obterGruposParaMapa();
    }

    return [
        "todos"
    ];
}

function atualizarMapaBaseComparacao() {

    if (
        !mapaComparacaoPronto
    ) {
        return;
    }

    const gruposSelecionados =
        [];

    const locaisSelecionados =
        [];

    const grupoA =
        comparacaoElementos
            .parceriaA
            ?.value
            ?.trim();

    const grupoB =
        comparacaoElementos
            .parceriaB
            ?.value
            ?.trim();

    if (
        featureComparacaoA
        &&
        grupoA
    ) {
        gruposSelecionados.push(
            grupoA
        );

        locaisSelecionados.push(
            nomeDoLocal(
                featureComparacaoA
            )
        );
    }

    if (
        featureComparacaoB
        &&
        grupoB
    ) {
        gruposSelecionados.push(
            grupoB
        );

        locaisSelecionados.push(
            nomeDoLocal(
                featureComparacaoB
            )
        );
    }

    const gruposFinais =
        gruposSelecionados.length
            ? [
                ...new Set(
                    gruposSelecionados
                )
            ]
            : gruposBaseComparacao();

    const locaisFinais =
        locaisSelecionados.length
            ? [
                ...new Set(
                    locaisSelecionados
                )
            ]
            : [];

    enviarParaMapaComparacao(
        "set-filters",
        {
            grupo:
                gruposFinais,
            local:
                locaisFinais
        }
    );
}


// ============================================================
// LIMPAR MAPA
// ============================================================

function limparMapaComparacao() {

    enviarParaMapaComparacao(
        "clear-analysis-layers"
    );
}


// ============================================================
// SETORES COMPARAÇÃO
// ============================================================

function criarGeoJSONSetoresComparacao(
    resultado
) {

    return {
        type:
            "FeatureCollection",
        features:
            resultado
                .selecionados
                .map(
                    item => ({
                        type:
                            "Feature",
                        geometry:
                            item.feature.geometry,
                        properties: {
                            ...item.feature.properties
                        }
                    })
                )
    };
}


// ============================================================
// DESENHAR RESULTADOS
// ============================================================

function desenharResultadoComparacao() {

    if (
        !resultadoComparacaoA
        ||
        !resultadoComparacaoB
    ) {
        return;
    }

    limparMapaComparacao();

    // Antes de desenhar, faz o mapa base mostrar
    // apenas os equipamentos A e B.
    atualizarMapaBaseComparacao();

    // ========================================================
    // SETORES A
    // ========================================================

    enviarParaMapaComparacao(
        "set-analysis-layer",
        {
            layer:
                "comparacao-setores-a",
            tipo:
                "geojson",
            pane:
                "sppAnaliseSetores",
            interactive:
                false,
            geojson:
                criarGeoJSONSetoresComparacao(
                    resultadoComparacaoA
                ),
            style: {
                color:
                    "#ffffff",
                weight:
                    0.45,
                opacity:
                    0.8,
                fillColor:
                    COR_COMPARACAO_A,
                fillOpacity:
                    0.18
            }
        }
    );

    // ========================================================
    // SETORES B
    // ========================================================

    enviarParaMapaComparacao(
        "set-analysis-layer",
        {
            layer:
                "comparacao-setores-b",
            tipo:
                "geojson",
            pane:
                "sppAnaliseSetores",
            interactive:
                false,
            geojson:
                criarGeoJSONSetoresComparacao(
                    resultadoComparacaoB
                ),
            style: {
                color:
                    "#ffffff",
                weight:
                    0.45,
                opacity:
                    0.8,
                fillColor:
                    COR_COMPARACAO_B,
                fillOpacity:
                    0.18
            }
        }
    );

    // ========================================================
    // BUFFER A
    // ========================================================

    enviarParaMapaComparacao(
        "set-analysis-layer",
        {
            layer:
                "comparacao-buffer-a",
            tipo:
                "buffer",
            geojson:
                resultadoComparacaoA.buffer,
            fit:
                false,
            style: {
                color:
                    COR_COMPARACAO_A,
                weight:
                    2,
                opacity:
                    0.95,
                dashArray:
                    "7 5",
                fillColor:
                    COR_COMPARACAO_A,
                fillOpacity:
                    0.035
            }
        }
    );

    // ========================================================
    // BUFFER B
    // ========================================================

    enviarParaMapaComparacao(
        "set-analysis-layer",
        {
            layer:
                "comparacao-buffer-b",
            tipo:
                "buffer",
            geojson:
                resultadoComparacaoB.buffer,
            fit:
                false,
            style: {
                color:
                    COR_COMPARACAO_B,
                weight:
                    2,
                opacity:
                    0.95,
                dashArray:
                    "7 5",
                fillColor:
                    COR_COMPARACAO_B,
                fillOpacity:
                    0.035
            }
        }
    );

    // ========================================================
    // PERÍMETRO A
    // ========================================================

    enviarParaMapaComparacao(
        "set-analysis-layer",
        {
            layer:
                "comparacao-perimetro-a",
            tipo:
                "geojson",
            pane:
                "sppAnaliseFrente",
            interactive:
                false,
            geojson:
                resultadoComparacaoA.feature,
            style: {
                color:
                    COR_COMPARACAO_A,
                weight:
                    3,
                opacity:
                    1,
                fillColor:
                    COR_COMPARACAO_A,
                fillOpacity:
                    0.28
            }
        }
    );

    // ========================================================
    // PERÍMETRO B
    // ========================================================

    enviarParaMapaComparacao(
        "set-analysis-layer",
        {
            layer:
                "comparacao-perimetro-b",
            tipo:
                "geojson",
            pane:
                "sppAnaliseFrente",
            interactive:
                false,
            geojson:
                resultadoComparacaoB.feature,
            style: {
                color:
                    COR_COMPARACAO_B,
                weight:
                    3,
                opacity:
                    1,
                fillColor:
                    COR_COMPARACAO_B,
                fillOpacity:
                    0.28
            }
        }
    );

    // ========================================================
    // ENQUADRAMENTO SOMENTE DE A + B
    // ========================================================

    enviarParaMapaComparacao(
        "set-analysis-layer",
        {
            layer:
                "comparacao-enquadramento",
            tipo:
                "geojson",
            interactive:
                false,
            fit:
                true,
            geojson: {
                type:
                    "FeatureCollection",
                features: [
                    resultadoComparacaoA.feature,
                    resultadoComparacaoB.feature
                ]
            },
            style: {
                color:
                    "transparent",
                weight:
                    0,
                opacity:
                    0,
                fillColor:
                    "transparent",
                fillOpacity:
                    0
            }
        }
    );
}


// ============================================================
// PARCERIAS PERMITIDAS
// ============================================================

function codigosParceriasComparacao() {

    const config =
        window.SPPDashboardURL;

    if (
        config
        &&
        typeof config.obterCodigosPermitidos ===
            "function"
    ) {
        return config
            .obterCodigosPermitidos();
    }

    return Object.keys(
        PARCERIAS
    );
}


// ============================================================
// POPULAR PARCERIAS
// ============================================================

function preencherParceriasComparacao() {

    const entradas =
        codigosParceriasComparacao()
            .map(
                codigo => [
                    codigo,
                    PARCERIAS[
                        codigo
                    ]
                ]
            )
            .filter(
                item =>
                    Boolean(
                        item[1]
                    )
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    a[1]
                        .nome
                        .localeCompare(
                            b[1].nome,
                            "pt-BR"
                        )
            );

    for (
        const select
        of [
            comparacaoElementos.parceriaA,
            comparacaoElementos.parceriaB
        ]
    ) {
        select.innerHTML =
            '<option value="">Selecione</option>';

        for (
            const [
                codigo,
                configuracao
            ]
            of entradas
        ) {
            const option =
                document.createElement(
                    "option"
                );

            option.value =
                codigo;

            option.textContent =
                configuracao.nome;

            select.appendChild(
                option
            );
        }
    }
}


// ============================================================
// CARREGAR PARCERIA
// ============================================================

async function obterParceriaComparacao(
    codigo
) {

    if (
        cacheParceriasComparacao.has(
            codigo
        )
    ) {
        return cacheParceriasComparacao.get(
            codigo
        );
    }

    const configuracao =
        PARCERIAS[
            codigo
        ];

    if (
        !configuracao
    ) {
        throw new Error(
            "Parceria não encontrada."
        );
    }

    const resposta =
        await fetch(
            configuracao.arquivo
        );

    if (
        !resposta.ok
    ) {
        throw new Error(
            "Não foi possível carregar a parceria."
        );
    }

    const dados =
        await resposta.json();

    cacheParceriasComparacao.set(
        codigo,
        dados
    );

    return dados;
}


// ============================================================
// PREENCHER EQUIPAMENTOS
// ============================================================

function preencherLocaisComparacao(
    select,
    geojson
) {

    select.innerHTML =
        '<option value="">Selecione</option>';

    const locais =
        geojson.features
            .map(
                (
                    feature,
                    indice
                ) => ({
                    indice,
                    nome:
                        nomeDoLocal(
                            feature
                        )
                })
            )
            .sort(
                (
                    a,
                    b
                ) =>
                    a.nome.localeCompare(
                        b.nome,
                        "pt-BR"
                    )
            );

    for (
        const local
        of locais
    ) {
        const option =
            document.createElement(
                "option"
            );

        option.value =
            String(
                local.indice
            );

        option.textContent =
            local.nome;

        select.appendChild(
            option
        );
    }

    select.disabled =
        false;
}


// ============================================================
// PARCERIA A
// ============================================================

async function alterarParceriaComparacaoA() {

    const codigo =
        comparacaoElementos
            .parceriaA
            .value;

    featureComparacaoA =
        null;

    parceriaComparacaoA =
        null;

    resultadoComparacaoA =
        null;

    comparacaoElementos.localA.disabled =
        true;

    comparacaoElementos.localA.innerHTML =
        '<option value="">Selecione</option>';

    if (
        !codigo
    ) {
        verificarBotaoComparar();
        atualizarMapaBaseComparacao();
        return;
    }

    try {
        parceriaComparacaoA =
            await obterParceriaComparacao(
                codigo
            );

        preencherLocaisComparacao(
            comparacaoElementos.localA,
            parceriaComparacaoA
        );
    }
    catch (
        erro
    ) {
        console.error(
            erro
        );
    }

    verificarBotaoComparar();
    atualizarMapaBaseComparacao();
}


// ============================================================
// PARCERIA B
// ============================================================

async function alterarParceriaComparacaoB() {

    const codigo =
        comparacaoElementos
            .parceriaB
            .value;

    featureComparacaoB =
        null;

    parceriaComparacaoB =
        null;

    resultadoComparacaoB =
        null;

    comparacaoElementos.localB.disabled =
        true;

    comparacaoElementos.localB.innerHTML =
        '<option value="">Selecione</option>';

    if (
        !codigo
    ) {
        verificarBotaoComparar();
        atualizarMapaBaseComparacao();
        return;
    }

    try {
        parceriaComparacaoB =
            await obterParceriaComparacao(
                codigo
            );

        preencherLocaisComparacao(
            comparacaoElementos.localB,
            parceriaComparacaoB
        );
    }
    catch (
        erro
    ) {
        console.error(
            erro
        );
    }

    verificarBotaoComparar();
    atualizarMapaBaseComparacao();
}


// ============================================================
// EQUIPAMENTO A
// ============================================================

function alterarLocalComparacaoA() {

    const valor =
        comparacaoElementos
            .localA
            .value;

    featureComparacaoA =
        valor === ""
            ? null
            : parceriaComparacaoA
                .features[
                    Number(valor)
                ];

    resultadoComparacaoA =
        null;

    verificarBotaoComparar();
    atualizarMapaBaseComparacao();

    if (
        featureComparacaoA
        &&
        featureComparacaoB
    ) {
        agendarComparacao();
    }
}


// ============================================================
// EQUIPAMENTO B
// ============================================================

function alterarLocalComparacaoB() {

    const valor =
        comparacaoElementos
            .localB
            .value;

    featureComparacaoB =
        valor === ""
            ? null
            : parceriaComparacaoB
                .features[
                    Number(valor)
                ];

    resultadoComparacaoB =
        null;

    verificarBotaoComparar();
    atualizarMapaBaseComparacao();

    if (
        featureComparacaoA
        &&
        featureComparacaoB
    ) {
        agendarComparacao();
    }
}


// ============================================================
// BOTÃO
// ============================================================

function verificarBotaoComparar() {

    const valido =
        Boolean(
            featureComparacaoA
            &&
            featureComparacaoB
        );

    comparacaoElementos.botao.disabled =
        !valido;

    comparacaoElementos.status.textContent =
        valido
            ? "Pronto para comparar"
            : "Selecione dois equipamentos";
}


// ============================================================
// RAIO
// ============================================================

function atualizarRaioComparacao() {

    const valor =
        Number(
            comparacaoElementos
                .raio
                .value
        );

    comparacaoElementos.raioValor.textContent =
        formatarRaio(
            valor
        );

    if (
        featureComparacaoA
        &&
        featureComparacaoB
    ) {
        agendarComparacao();
    }
}


// ============================================================
// DEBOUNCE
// ============================================================

function agendarComparacao() {

    clearTimeout(
        temporizadorComparacao
    );

    temporizadorComparacao =
        setTimeout(
            executarComparacao,
            DEBOUNCE_COMPARACAO
        );
}


// ============================================================
// ÁREA
// ============================================================

function calcularAreaSelecionada(
    selecionados,
    criterio
) {

    let area =
        0;

    for (
        const item
        of selecionados
    ) {
        const dados =
            dadosDaFeature(
                item.feature
            );

        const areaSetor =
            numero(
                dados.area_km2
            );

        const fator =
            criterio ===
            "proporcional"
                ? item.fator
                : 1;

        area +=
            areaSetor
            *
            fator;
    }

    return area;
}


// ============================================================
// IPVS ALTO
// ============================================================

function calcularIPVSAlto(
    contagem,
    total
) {

    if (
        !total
    ) {
        return 0;
    }

    let alto =
        0;

    for (
        const [
            nome,
            quantidade
        ]
        of Object.entries(
            contagem
        )
    ) {
        const chave =
            nome
                .trim()
                .toLowerCase();

        if (
            chave.includes(
                "vulnerabilidade alta"
            )
            ||
            chave.includes(
                "vulnerabilidade muito alta"
            )
        ) {
            alto +=
                quantidade;
        }
    }

    return (
        alto
        /
        total
        *
        100
    );
}


// ============================================================
// INDICADORES DERIVADOS
// ============================================================

function calcularDerivadosComparacao(
    selecionados,
    resultado,
    criterio
) {

    const totalRaca =
        resultado.branca
        +
        resultado.preta
        +
        resultado.parda
        +
        resultado.amarela
        +
        resultado.indigena;

    const pretaParda =
        totalRaca > 0
            ? (
                resultado.preta
                +
                resultado.parda
            )
            /
            totalRaca
            *
            100
            : 0;

    const totalGenero =
        resultado.feminina
        +
        resultado.masculina;

    const feminina =
        totalGenero > 0
            ? resultado.feminina
                /
                totalGenero
                *
                100
            : 0;

    const coberturaIPVS =
        resultado.setores > 0
            ? resultado.setoresComIPVS
                /
                resultado.setores
                *
                100
            : 0;

    const ipvsAlto =
        calcularIPVSAlto(
            resultado.ipvsContagem,
            resultado.setoresComIPVS
        );

    const area =
        calcularAreaSelecionada(
            selecionados,
            criterio
        );

    const densidade =
        area > 0
            ? resultado.populacao
                /
                area
            : 0;

    return {
        pretaParda,
        feminina,
        coberturaIPVS,
        ipvsAlto,
        area,
        densidade
    };
}


// ============================================================
// CALCULAR EQUIPAMENTO
// ============================================================

function calcularEmpreendimentoComparacao(
    feature,
    raio,
    criterio
) {

    const buffer =
        criarBuffer(
            feature,
            raio
        );

    const selecionados =
        selecionarSetores(
            buffer,
            criterio
        );

    const resultadoIndicadores =
        calcularIndicadoresSelecionados(
            selecionados,
            criterio
        );

    const derivados =
        calcularDerivadosComparacao(
            selecionados,
            resultadoIndicadores,
            criterio
        );

    return {
        feature,
        buffer,
        selecionados,
        indicadores:
            resultadoIndicadores,
        derivados
    };
}


// ============================================================
// DIFERENÇAS
// ============================================================

function diferencaAbsoluta(
    a,
    b
) {
    return (
        numero(b)
        -
        numero(a)
    );
}

function classeDiferenca(
    valor
) {

    if (
        valor > 0
    ) {
        return "positiva";
    }

    if (
        valor < 0
    ) {
        return "negativa";
    }

    return "";
}

function formatarSinal(
    valor,
    formatador
) {

    const n =
        numero(
            valor
        );

    if (
        n > 0
    ) {
        return `+${formatador(n)}`;
    }

    if (
        n < 0
    ) {
        return `−${formatador(Math.abs(n))}`;
    }

    return formatador(
        0
    );
}


// ============================================================
// LINHA DA TABELA
// ============================================================

function linhaComparacao(
    titulo,
    valorA,
    valorB,
    formatador,
    tipo = "normal"
) {

    const diferenca =
        diferencaAbsoluta(
            valorA,
            valorB
        );

    const textoDiferenca =
        tipo ===
        "percentual"
            ? formatarSinal(
                diferenca,
                valor =>
                    `${formatarNumero(valor, 1)} p.p.`
            )
            : formatarSinal(
                diferenca,
                formatador
            );

    return `
        <div class="comparacao-linha">
            <div class="comparacao-metrica">
                ${titulo}
            </div>

            <div class="comparacao-valor-a">
                ${formatador(valorA)}
            </div>

            <div class="comparacao-valor-b">
                ${formatador(valorB)}
            </div>

            <div class="comparacao-diferenca ${classeDiferenca(diferenca)}">
                ${textoDiferenca}
            </div>
        </div>
    `;
}


// ============================================================
// MINI COMPARAÇÃO
// ============================================================

function miniComparacao(
    titulo,
    valorA,
    valorB
) {

    const maximo =
        Math.max(
            valorA,
            valorB,
            1
        );

    const larguraA =
        valorA
        /
        maximo
        *
        100;

    const larguraB =
        valorB
        /
        maximo
        *
        100;

    return `
        <div class="mini-comparacao">
            <div class="mini-comparacao-titulo">
                ${titulo}
            </div>

            <div class="mini-comparacao-linha">
                <div class="mini-comparacao-letra a">
                    A
                </div>

                <div class="mini-comparacao-trilho">
                    <div
                        class="mini-comparacao-barra a"
                        style="width:${larguraA}%;"
                    ></div>
                </div>

                <div class="mini-comparacao-valor">
                    ${formatarPercentual(valorA)}
                </div>
            </div>

            <div class="mini-comparacao-linha">
                <div class="mini-comparacao-letra b">
                    B
                </div>

                <div class="mini-comparacao-trilho">
                    <div
                        class="mini-comparacao-barra b"
                        style="width:${larguraB}%;"
                    ></div>
                </div>

                <div class="mini-comparacao-valor">
                    ${formatarPercentual(valorB)}
                </div>
            </div>
        </div>
    `;
}


// ============================================================
// TABELA
// ============================================================

function renderizarTabelaComparacao() {

    const a =
        resultadoComparacaoA;

    const b =
        resultadoComparacaoB;

    if (
        !a
        ||
        !b
    ) {
        return;
    }

    const nomeA =
        nomeDoLocal(
            a.feature
        );

    const nomeB =
        nomeDoLocal(
            b.feature
        );

    comparacaoElementos.nomeA.textContent =
        nomeA;

    comparacaoElementos.nomeB.textContent =
        nomeB;

    const ia =
        a.indicadores;

    const ib =
        b.indicadores;

    const da =
        a.derivados;

    const db =
        b.derivados;

    comparacaoElementos.tabela.innerHTML = `
        <div class="comparacao-tabela-cabecalho">
            <div></div>

            <div class="comparacao-cabecalho-local">
                <span>A</span>
                <strong title="${nomeA}">
                    ${nomeA}
                </strong>
            </div>

            <div class="comparacao-cabecalho-local local-b">
                <span>B</span>
                <strong title="${nomeB}">
                    ${nomeB}
                </strong>
            </div>

            <div class="comparacao-col-diferenca">
                B − A
            </div>
        </div>

        ${linhaComparacao(
            "Setores censitários",
            ia.setores,
            ib.setores,
            formatarInteiro
        )}

        ${linhaComparacao(
            "População",
            ia.populacao,
            ib.populacao,
            formatarInteiro
        )}

        ${linhaComparacao(
            "Área analisada",
            da.area,
            db.area,
            valor =>
                `${formatarNumero(valor, 2)} km²`
        )}

        ${linhaComparacao(
            "Densidade",
            da.densidade,
            db.densidade,
            valor =>
                `${formatarInteiro(valor)} hab./km²`
        )}

        ${linhaComparacao(
            "Renda mediana",
            ia.rendaMediana,
            ib.rendaMediana,
            formatarMoeda
        )}

        ${linhaComparacao(
            "Cobertura IPVS",
            da.coberturaIPVS,
            db.coberturaIPVS,
            formatarPercentual,
            "percentual"
        )}

        <div class="comparacao-bloco-percentuais">
            <h3>
                Composição territorial
            </h3>

            ${miniComparacao(
                "População preta + parda",
                da.pretaParda,
                db.pretaParda
            )}

            ${miniComparacao(
                "População feminina",
                da.feminina,
                db.feminina
            )}

            ${miniComparacao(
                "Vulnerabilidade alta / muito alta",
                da.ipvsAlto,
                db.ipvsAlto
            )}
        </div>
    `;
}


// ============================================================
// EXECUTAR
// ============================================================

function executarComparacao() {

    if (
        !featureComparacaoA
        ||
        !featureComparacaoB
    ) {
        return;
    }

    if (
        !indiceSetores?.length
        ||
        !indicadores
    ) {
        comparacaoElementos.status.textContent =
            "Aguardando dados territoriais...";
        return;
    }

    const raio =
        Number(
            comparacaoElementos
                .raio
                .value
        );

    const criterio =
        comparacaoElementos
            .criterio
            .value;

    comparacaoElementos.status.textContent =
        "Calculando comparação...";

    const inicio =
        performance.now();

    try {
        resultadoComparacaoA =
            calcularEmpreendimentoComparacao(
                featureComparacaoA,
                raio,
                criterio
            );

        resultadoComparacaoB =
            calcularEmpreendimentoComparacao(
                featureComparacaoB,
                raio,
                criterio
            );

        desenharResultadoComparacao();

        renderizarTabelaComparacao();

        const tempo =
            performance.now()
            -
            inicio;

        comparacaoElementos.status.textContent =
            `Comparação concluída • ${Math.round(tempo)} ms`;
    }
    catch (
        erro
    ) {
        console.error(
            erro
        );

        comparacaoElementos.status.textContent =
            "Erro ao calcular comparação";
    }
}


// ============================================================
// GRUPO FIXO DA URL
// ============================================================

async function aplicarGrupoFixoComparacao() {

    const config =
        window.SPPDashboardURL;

    if (
        !config
    ) {
        return;
    }

    const grupo =
        config.obterGrupoUnico();

    if (
        !grupo
    ) {
        return;
    }

    comparacaoElementos
        .campoParceriaA
        ?.classList
        .add(
            "url-oculto"
        );

    comparacaoElementos
        .campoParceriaB
        ?.classList
        .add(
            "url-oculto"
        );

    comparacaoElementos
        .camposA
        ?.classList
        .add(
            "grupo-fixo"
        );

    comparacaoElementos
        .camposB
        ?.classList
        .add(
            "grupo-fixo"
        );

    comparacaoElementos.parceriaA.value =
        grupo;

    comparacaoElementos.parceriaB.value =
        grupo;

    await Promise.all([
        alterarParceriaComparacaoA(),
        alterarParceriaComparacaoB()
    ]);
}


// ============================================================
// EVENTOS
// ============================================================

function registrarEventosComparacao() {

    comparacaoElementos.parceriaA.addEventListener(
        "change",
        alterarParceriaComparacaoA
    );

    comparacaoElementos.parceriaB.addEventListener(
        "change",
        alterarParceriaComparacaoB
    );

    comparacaoElementos.localA.addEventListener(
        "change",
        alterarLocalComparacaoA
    );

    comparacaoElementos.localB.addEventListener(
        "change",
        alterarLocalComparacaoB
    );

    comparacaoElementos.raio.addEventListener(
        "input",
        atualizarRaioComparacao
    );

    comparacaoElementos.criterio.addEventListener(
        "change",
        () => {
            if (
                featureComparacaoA
                &&
                featureComparacaoB
            ) {
                agendarComparacao();
            }
        }
    );

    comparacaoElementos.botao.addEventListener(
        "click",
        executarComparacao
    );
}


// ============================================================
// MENSAGENS DO IFRAME
// ============================================================

function registrarEventosMapaComparacao() {

    const iframe =
        comparacaoElementos.iframe;

    if (
        !iframe
    ) {
        return;
    }

    window.addEventListener(
        "message",
        event => {

            if (
                event.source !==
                iframe.contentWindow
            ) {
                return;
            }

            if (
                event.origin !==
                MAPA_COMPARACAO_ORIGIN
            ) {
                return;
            }

            const mensagem =
                event.data;

            if (
                !mensagem
                ||
                mensagem.source !==
                    "spp-mapa"
            ) {
                return;
            }

            if (
                mensagem.type ===
                "map-ready"
            ) {
                mapaComparacaoPronto =
                    true;

                comparacaoElementos
                    .loading
                    ?.classList
                    .add(
                        "oculto"
                    );

                // Assim que o mapa ficar pronto,
                // já aplica o filtro base correto.
                atualizarMapaBaseComparacao();

                if (
                    resultadoComparacaoA
                    &&
                    resultadoComparacaoB
                ) {
                    setTimeout(
                        desenharResultadoComparacao,
                        100
                    );
                }
            }
        }
    );

    iframe.addEventListener(
        "load",
        () => {

            mapaComparacaoPronto =
                false;

            comparacaoElementos
                .loading
                ?.classList
                .remove(
                    "oculto"
                );

            setTimeout(
                () => {
                    enviarParaMapaComparacao(
                        "ping"
                    );
                },
                150
            );
        }
    );

    setTimeout(
        () => {
            enviarParaMapaComparacao(
                "ping"
            );
        },
        500
    );
}


// ============================================================
// INICIAR
// ============================================================

async function iniciarComparacao() {

    const config =
        window.SPPDashboardURL;

    if (
        config
        &&
        config.pagina !==
            "comparacao"
    ) {
        return;
    }

    carregarElementosComparacao();

    preencherParceriasComparacao();

    registrarEventosComparacao();

    registrarEventosMapaComparacao();

    atualizarRaioComparacao();

    await aplicarGrupoFixoComparacao();
}


// ============================================================
// START
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    iniciarComparacao
);