// ============================================================
// DASHBOARD SPP
// COMPARAÇÃO TERRITORIAL VIA IFRAME
// ============================================================

const COR_COMPARACAO_A =
    "#00506e";

const COR_COMPARACAO_B =
    "#F08200";

const COR_PERIMETRO_SPP =
    "#F08200";

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
        "*"
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
            ?
            [
                ...new Set(
                    gruposSelecionados
                )
            ]
            :
            gruposBaseComparacao();


    const locaisFinais =
        locaisSelecionados.length
            ?
            [
                ...new Set(
                    locaisSelecionados
                )
            ]
            :
            [];


    enviarParaMapaComparacao(
        "set-filters",
        {

            grupo:
                gruposFinais,

            local:
                locaisFinais,

            nivel:
                "perimetro"

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
                    COR_PERIMETRO_SPP,

                weight:
                    4,

                opacity:
                    1,

                fillColor:
                    COR_PERIMETRO_SPP,

                fillOpacity:
                    0.22

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
                    COR_PERIMETRO_SPP,

                weight:
                    4,

                opacity:
                    1,

                fillColor:
                    COR_PERIMETRO_SPP,

                fillOpacity:
                    0.22

            }

        }
    );


    // ========================================================
    // ENQUADRAMENTO
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
// CONTROLE DE RESTRIÇÕES
// ============================================================

let sincronizandoRestricoesParceriasComparacao =
    false;


// ============================================================
// ENTRADAS DE PARCERIAS
// ============================================================

function obterEntradasParceriasComparacao(
    codigoExcluido = ""
) {

    return codigosParceriasComparacao()
        .filter(
            codigo =>
                codigo !==
                codigoExcluido
        )
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
                    item[
                        1
                    ]
                )
        )
        .sort(
            (
                a,
                b
            ) =>
                a[
                    1
                ]
                .nome
                .localeCompare(
                    b[
                        1
                    ].nome,
                    "pt-BR"
                )
        );
}


// ============================================================
// PREENCHER SELECT DE PARCERIAS
// ============================================================

function preencherSelectParceriasComparacao(
    select,
    codigoExcluido = "",
    valorPreferido = ""
) {

    if (
        !select
    ) {

        return "";

    }


    const entradas =
        obterEntradasParceriasComparacao(
            codigoExcluido
        );


    select.innerHTML =
        "";


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


    select.disabled =
        entradas.length ===
        0;


    if (
        !select.options.length
    ) {

        return "";

    }


    const valorPreferidoExiste =
        Array
            .from(
                select.options
            )
            .some(
                option =>
                    option.value ===
                    valorPreferido
            );


    if (
        valorPreferidoExiste
    ) {

        select.value =
            valorPreferido;

    }
    else {

        select.selectedIndex =
            0;

    }


    return select.value;
}


// ============================================================
// POPULAR PARCERIAS
// ============================================================

function preencherParceriasComparacao() {

    preencherSelectParceriasComparacao(
        comparacaoElementos.parceriaA
    );


    preencherSelectParceriasComparacao(
        comparacaoElementos.parceriaB
    );
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
// QUANTIDADE DE EQUIPAMENTOS
// ============================================================

function quantidadeEquipamentosParceriaComparacao(
    geojson
) {

    return Array.isArray(
        geojson?.features
    )
        ?
        geojson.features.length
        :
        0;
}


function parceriaComparacaoTemUmEquipamento(
    geojson
) {

    return quantidadeEquipamentosParceriaComparacao(
        geojson
    ) ===
        1;
}


// ============================================================
// PREENCHER EQUIPAMENTOS
// ============================================================

function preencherLocaisComparacao(
    select,
    geojson
) {

    select.innerHTML =
        "";


    const locais =
        (
            geojson?.features
            ||
            []
        )
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
        locais.length ===
        0;


    if (
        select.options.length
    ) {

        select.selectedIndex =
            0;

    }
}


// ============================================================
// EQUIPAMENTOS DIFERENTES
// ============================================================

function equipamentosIguaisComparacao() {
    return Boolean(featureComparacaoA && featureComparacaoB
        && comparacaoElementos.parceriaA.value === comparacaoElementos.parceriaB.value
        && comparacaoElementos.localA.value === comparacaoElementos.localB.value);
}

function garantirEquipamentosDiferentesComparacao(ladoAlterado = 'A') {
    if (!equipamentosIguaisComparacao()) return;
    const destino = ladoAlterado === 'B' ? 'A' : 'B';
    const select = comparacaoElementos['local' + destino];
    const valor = comparacaoElementos['local' + ladoAlterado].value;
    const alternativa = Array.from(select.options).find(option => option.value !== valor);
    if (alternativa) {
        select.value = alternativa.value;
        if (destino === 'A') alterarLocalComparacaoA();
        else alterarLocalComparacaoB();
    }
}

// ============================================================
// SINCRONIZAR RESTRIÇÕES ENTRE A E B
// ============================================================
//
// REGRA:
//
// Se a parceria de A possuir somente 1 equipamento:
//
//      parceria A não aparece no select de B
//
// Se a parceria de B possuir somente 1 equipamento:
//
//      parceria B não aparece no select de A
//
// Se possuir 2 ou mais equipamentos:
//
//      a parceria pode aparecer dos dois lados.
//
// ============================================================

async function sincronizarRestricoesParceriasComparacao() {

    if (
        sincronizandoRestricoesParceriasComparacao
    ) {

        return;

    }


    sincronizandoRestricoesParceriasComparacao =
        true;


    try {

        /*
         * Uma troca automática pode causar uma nova
         * restrição no lado oposto.
         *
         * Repetimos até estabilizar.
         */

        for (
            let tentativa = 0;
            tentativa < 6;
            tentativa++
        ) {

            let houveMudanca =
                false;


            // =================================================
            // A RESTRINGE B
            // =================================================

            const codigoA =
                comparacaoElementos
                    .parceriaA
                    .value;


            const bloquearEmB =
                codigoA
                &&
                parceriaComparacaoTemUmEquipamento(
                    parceriaComparacaoA
                )
                    ?
                    codigoA
                    :
                    "";


            const valorAnteriorB =
                comparacaoElementos
                    .parceriaB
                    .value;


            const novoValorB =
                preencherSelectParceriasComparacao(
                    comparacaoElementos.parceriaB,
                    bloquearEmB,
                    valorAnteriorB
                );


            if (
                novoValorB !==
                    valorAnteriorB
            ) {

                houveMudanca =
                    true;


                await alterarParceriaComparacaoB(
                    {

                        sincronizarRestricoes:
                            false

                    }
                );

            }


            // =================================================
            // B RESTRINGE A
            // =================================================

            const codigoB =
                comparacaoElementos
                    .parceriaB
                    .value;


            const bloquearEmA =
                codigoB
                &&
                parceriaComparacaoTemUmEquipamento(
                    parceriaComparacaoB
                )
                    ?
                    codigoB
                    :
                    "";


            const valorAnteriorA =
                comparacaoElementos
                    .parceriaA
                    .value;


            const novoValorA =
                preencherSelectParceriasComparacao(
                    comparacaoElementos.parceriaA,
                    bloquearEmA,
                    valorAnteriorA
                );


            if (
                novoValorA !==
                    valorAnteriorA
            ) {

                houveMudanca =
                    true;


                await alterarParceriaComparacaoA(
                    {

                        sincronizarRestricoes:
                            false

                    }
                );

            }


            if (
                !houveMudanca
            ) {

                break;

            }

        }


        garantirEquipamentosDiferentesComparacao();

    }
    finally {

        sincronizandoRestricoesParceriasComparacao =
            false;

    }
}


// ============================================================
// PARCERIA A
// ============================================================

async function alterarParceriaComparacaoA(
    opcoes = {}
) {

    const deveSincronizarRestricoes =
        opcoes?.sincronizarRestricoes !==
        false;


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
        "";


    if (
        !codigo
    ) {

        verificarBotaoComparar();

        atualizarMapaBaseComparacao();


        if (
            deveSincronizarRestricoes
        ) {

            await sincronizarRestricoesParceriasComparacao();

        }


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


        if (
            comparacaoElementos
                .localA
                .options
                .length
        ) {

            comparacaoElementos
                .localA
                .selectedIndex =
                    0;


            alterarLocalComparacaoA();

        }

    }
    catch (
        erro
    ) {

        console.error(
            erro
        );

    }


    if (
        deveSincronizarRestricoes
    ) {

        await sincronizarRestricoesParceriasComparacao();

    }


    verificarBotaoComparar();

    atualizarMapaBaseComparacao();
}


// ============================================================
// PARCERIA B
// ============================================================

async function alterarParceriaComparacaoB(
    opcoes = {}
) {

    const deveSincronizarRestricoes =
        opcoes?.sincronizarRestricoes !==
        false;


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
        "";


    if (
        !codigo
    ) {

        verificarBotaoComparar();

        atualizarMapaBaseComparacao();


        if (
            deveSincronizarRestricoes
        ) {

            await sincronizarRestricoesParceriasComparacao();

        }


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


        if (
            comparacaoElementos
                .localB
                .options
                .length
        ) {

            comparacaoElementos
                .localB
                .selectedIndex =
                    0;


            alterarLocalComparacaoB();

        }

    }
    catch (
        erro
    ) {

        console.error(
            erro
        );

    }


    if (
        deveSincronizarRestricoes
    ) {

        await sincronizarRestricoesParceriasComparacao();

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
        valor ===
            ""
            ?
            null
            :
            parceriaComparacaoA
                ?.features[
                    Number(
                        valor
                    )
                ]
            ||
            null;


    resultadoComparacaoA =
        null;


    garantirEquipamentosDiferentesComparacao('A');
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
        valor ===
            ""
            ?
            null
            :
            parceriaComparacaoB
                ?.features[
                    Number(
                        valor
                    )
                ]
            ||
            null;


    resultadoComparacaoB =
        null;


    garantirEquipamentosDiferentesComparacao('B');
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
    const valido = Boolean(featureComparacaoA && featureComparacaoB && !equipamentosIguaisComparacao());
    comparacaoElementos.botao.disabled = !valido;
    const grupoUnico = window.SPPDashboardURL?.obterGrupoUnico();
    const unicoEquipamento = grupoUnico && parceriaComparacaoTemUmEquipamento(parceriaComparacaoA);
    comparacaoElementos.status.textContent = valido
        ? 'Pronto para comparar'
        : unicoEquipamento
            ? 'Comparação indisponível: esta parceria possui apenas um equipamento.'
            : 'Aguardando dois equipamentos diferentes';
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
                ?
                item.fator
                :
                1;


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

function quantidadeIPVSAltoComparacao(contagem) {
    return Object.entries(contagem).reduce((soma, [nome, quantidade]) => {
        const chave = nome.trim().toLowerCase();
        return soma + (chave.includes("vulnerabilidade alta") || chave.includes("vulnerabilidade muito alta") ? quantidade : 0);
    }, 0);
}

function calcularIPVSAlto(
    contagem,
    total
) {

    if (!total) return null;


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

    const totalGenero =
        resultado.feminina
        +
        resultado.masculina;


    const feminina =
        totalGenero >
            0
            ?
            resultado.feminina
            /
            totalGenero
            *
            100
            :
            0;


    const coberturaIPVS =
        resultado.setores >
            0
            ?
            resultado.setoresComIPVS
            /
            resultado.setores
            *
            100
            :
            0;


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
        temDado(resultado.populacao) && area >
            0
            ?
            resultado.populacao
            /
            area
            :
            null;


    return {

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
        raio,
        criterio,
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
    if (!temDado(a) || !temDado(b)) return null;

    return (
        numero(
            b
        )
        -
        numero(
            a
        )
    );
}


function classeDiferenca(
    valor
) {

    if (
        valor >
        0
    ) {

        return "positiva";

    }


    if (
        valor <
        0
    ) {

        return "negativa";

    }


    return "";
}


function formatarSinal(
    valor,
    formatador
) {
    if (!temDado(valor)) return "Sem dados";

    const n =
        numero(
            valor
        );


    if (
        n >
        0
    ) {

        return `+${formatador(n)}`;

    }


    if (
        n <
        0
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
            ?
            formatarSinal(
                diferenca,

                valor =>
                    `${formatarNumero(valor, 1)} p.p.`
            )
            :
            formatarSinal(
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

            <div
                class="
                    comparacao-diferenca
                    ${classeDiferenca(diferenca)}
                "
            >

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
    valorB,
    quantidadeA = null,
    quantidadeB = null,
    unidade = "pessoas",
    baseA = null,
    baseB = null
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

            <div class="mini-comparacao-linha" title="A: ${quantidadePercentual(quantidadeA, valorA, unidade)}. Total usado no cálculo: ${formatarInteiro(baseA)} ${unidade}. B − A: ${formatarSinal(diferencaAbsoluta(valorA, valorB), v => formatarNumero(v, 1) + ' p.p.')}">

                <div class="mini-comparacao-letra a">
                    A
                </div>

                <div class="mini-comparacao-trilho">

                    <div
                        class="mini-comparacao-barra a"
                        style="
                            width:
                            ${larguraA}%;
                        "
                    ></div>

                </div>

                <div class="mini-comparacao-valor">
                    ${quantidadeA == null ? (valorA == null ? "Sem dados" : formatarPercentual(valorA)) : quantidadePercentual(quantidadeA, valorA, unidade)}
                </div>

            </div>


            <div class="mini-comparacao-linha" title="B: ${quantidadePercentual(quantidadeB, valorB, unidade)}. Total usado no cálculo: ${formatarInteiro(baseB)} ${unidade}. B − A: ${formatarSinal(diferencaAbsoluta(valorA, valorB), v => formatarNumero(v, 1) + ' p.p.')}">

                <div class="mini-comparacao-letra b">
                    B
                </div>

                <div class="mini-comparacao-trilho">

                    <div
                        class="mini-comparacao-barra b"
                        style="
                            width:
                            ${larguraB}%;
                        "
                    ></div>

                </div>

                <div class="mini-comparacao-valor">
                    ${quantidadeB == null ? (valorB == null ? "Sem dados" : formatarPercentual(valorB)) : quantidadePercentual(quantidadeB, valorB, unidade)}
                </div>

            </div>

        </div>
    `;
}


// ============================================================
// TABELA
// ============================================================

function composicaoGeneroComparacao(indicadoresA, indicadoresB) {
    const linha = (lado, dados) => {
        const feminina = dados.feminina;
        const masculina = dados.masculina;
        const total = totalGenero(dados);
        const pf = total > 0 ? feminina / total * 100 : null;
        const pm = total > 0 ? masculina / total * 100 : null;
        const descricao = `${lado}: Feminino ${quantidadePercentual(feminina, pf)}; Masculino ${quantidadePercentual(masculina, pm)}`;
        return `
            <div class="genero-comparacao-linha">
                <span class="mini-comparacao-letra ${lado.toLowerCase()}">${lado}</span>
                <div class="genero-comparacao-dados">
                    <div class="genero-comparacao-barra" role="img" aria-label="${descricao}">
                        <span class="genero-segmento feminino" style="width:${pf ?? 0}%" title="Feminino: ${quantidadePercentual(feminina, pf)}. Total: ${formatarInteiro(total)} pessoas."></span>
                        <span class="genero-segmento masculino" style="width:${pm ?? 0}%" title="Masculino: ${quantidadePercentual(masculina, pm)}. Total: ${formatarInteiro(total)} pessoas."></span>
                    </div>
                    <div class="genero-comparacao-valores">
                        <span aria-label="Feminino: ${quantidadePercentual(feminina, pf)}">${quantidadePercentual(feminina, pf)}</span>
                        <span aria-label="Masculino: ${quantidadePercentual(masculina, pm)}">${quantidadePercentual(masculina, pm)}</span>
                    </div>
                </div>
            </div>`;
    };
    return `<section class="genero-comparacao">
        <div class="mini-comparacao-titulo">Composição por gênero</div>
        <div class="genero-comparacao-legenda">
            <span><i class="feminino"></i>Feminino</span>
            <span><i class="masculino"></i>Masculino</span>
        </div>
        ${linha("A", indicadoresA)}
        ${linha("B", indicadoresB)}
    </section>`;
}

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


    const controleRaca = document.getElementById("filtro-raca-comparacao");
    const focoRaca = controleRaca?.contains(document.activeElement)
        ? document.activeElement : null;

    comparacaoElementos.tabela.innerHTML = `
        <div class="comparacao-tabela-cabecalho">

            <div></div>

            <div class="comparacao-cabecalho-local">

                <span>
                    A
                </span>

                <strong title="${nomeA}">
                    ${nomeA}
                </strong>

            </div>


            <div
                class="
                    comparacao-cabecalho-local
                    local-b
                "
            >

                <span>
                    B
                </span>

                <strong title="${nomeB}">
                    ${nomeB}
                </strong>

            </div>


            <div class="comparacao-col-diferenca" tabindex="0" title="Valor de B menos o valor de A. Positivo: B é maior. Negativo: A é maior. Diferenças de percentuais são expressas em pontos percentuais (p.p.).">
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


        <div class="comparacao-bloco-percentuais">

            <h3>
                Composição territorial
            </h3>


            <div class="comparacao-raca-cabecalho">
                <span>População:</span>
                <div id="posicao-raca-comparacao"></div>
            </div>
            <div class="comparacao-raca-resultado">
            ${racasSelecionadas.comparacao.size
                ? miniComparacao(
                    tituloRacas("comparacao"),
                    percentualRacas(ia, racasSelecionadas.comparacao),
                    percentualRacas(ib, racasSelecionadas.comparacao),
                    quantidadeRacas(ia, racasSelecionadas.comparacao),
                    quantidadeRacas(ib, racasSelecionadas.comparacao),
                    "pessoas",
                    quantidadeRacas(ia, new Set(Object.keys(OPCOES_RACA))),
                    quantidadeRacas(ib, new Set(Object.keys(OPCOES_RACA)))
                )
                : miniComparacao("População", 0, 0, 0, 0, "pessoas", quantidadeRacas(ia, new Set(Object.keys(OPCOES_RACA))), quantidadeRacas(ib, new Set(Object.keys(OPCOES_RACA))))}
            </div>


            ${composicaoGeneroComparacao(ia, ib)}


            ${miniComparacao(
                "Vulnerabilidade alta / muito alta",
                da.ipvsAlto,
                db.ipvsAlto,
                quantidadeIPVSAltoComparacao(ia.ipvsContagem),
                quantidadeIPVSAltoComparacao(ib.ipvsContagem),
                "setores",
                ia.setoresComIPVS,
                ib.setoresComIPVS
            )}

        </div>
    `;

    if (controleRaca) {
        document.getElementById("posicao-raca-comparacao").replaceWith(controleRaca);
        focoRaca?.focus({ preventScroll: true });
    }
}


// ============================================================
// EXECUTAR
// ============================================================

function executarComparacao() {
    if (equipamentosIguaisComparacao()) {
        verificarBotaoComparar();
        return;
    }

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

        return false;

    }


    const grupo =
        config.obterGrupoUnico();


    if (
        !grupo
    ) {

        return false;

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


    comparacaoElementos
        .parceriaA
        .value =
            grupo;


    comparacaoElementos
        .parceriaB
        .value =
            grupo;


    /*
     * Carrega A e B sem aplicar as restrições durante
     * o carregamento para evitar corrida entre as duas
     * funções.
     */

    await Promise.all([

        alterarParceriaComparacaoA(
            {

                sincronizarRestricoes:
                    false

            }
        ),

        alterarParceriaComparacaoB(
            {

                sincronizarRestricoes:
                    false

            }
        )

    ]);


    /*
     * Agora aplicamos a regra de quantidade.
     *
     * Se o grupo fixo tiver somente um equipamento,
     * A continuará com o grupo e B ficará sem essa
     * parceria, impedindo comparação do equipamento
     * com ele mesmo.
     */

    await sincronizarRestricoesParceriasComparacao();


    garantirEquipamentosDiferentesComparacao();


    return true;
}


// ============================================================
// EVENTOS
// ============================================================

function registrarEventosComparacao() {

    comparacaoElementos
        .parceriaA
        .addEventListener(
            "change",
            alterarParceriaComparacaoA
        );


    comparacaoElementos
        .parceriaB
        .addEventListener(
            "change",
            alterarParceriaComparacaoB
        );


    comparacaoElementos
        .localA
        .addEventListener(
            "change",
            alterarLocalComparacaoA
        );


    comparacaoElementos
        .localB
        .addEventListener(
            "change",
            alterarLocalComparacaoB
        );


    comparacaoElementos
        .raio
        .addEventListener(
            "input",
            atualizarRaioComparacao
        );


    comparacaoElementos
        .criterio
        .addEventListener(
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


    comparacaoElementos
        .botao
        .addEventListener(
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
                &&
                event.origin !== "null"
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


    try {
        await carregarCatalogoParcerias();
        await window.SPPDashboardPronto;
    } catch (erro) {
        console.error(erro);
        comparacaoElementos.botao.disabled = true;
        comparacaoElementos.status.textContent = 'Erro ao carregar catálogo de parcerias. Recarregue a página.';
        return;
    }
    preencherParceriasComparacao();


    registrarEventosComparacao();


    registrarEventosMapaComparacao();


    atualizarRaioComparacao();


    const grupoFixoAplicado =
        await aplicarGrupoFixoComparacao();


    if (
        !grupoFixoAplicado
    ) {

        /*
         * Primeiro carrega os dois lados normalmente.
         */

        await Promise.all([

            alterarParceriaComparacaoA(
                {

                    sincronizarRestricoes:
                        false

                }
            ),

            alterarParceriaComparacaoB(
                {

                    sincronizarRestricoes:
                        false

                }
            )

        ]);


        /*
         * Depois aplica:
         *
         * parceria de 1 equipamento escolhida em A
         * não aparece em B e vice-versa.
         */

        await sincronizarRestricoesParceriasComparacao();


        garantirEquipamentosDiferentesComparacao();

    }


    if (
        featureComparacaoA
        &&
        featureComparacaoB
    ) {

        agendarComparacao();

    }
}


// ============================================================
// START
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    iniciarComparacao
);
