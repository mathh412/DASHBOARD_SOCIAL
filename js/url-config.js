// ============================================================
// DASHBOARD SPP
// CONFIGURAÇÃO GLOBAL VIA URL
// ============================================================

(function () {

    "use strict";


    const parametros =
        new URLSearchParams(
            window.location.search
        );


    // ========================================================
    // PÁGINAS
    // ========================================================

    const PAGINAS_VALIDAS =
        new Set([
            "visao-geral",
            "sociodemografico",
            "vulnerabilidade",
            "comparacao"
        ]);


    const ALIASES_PAGINA = {

        geral:
            "visao-geral",

        visaogeral:
            "visao-geral",

        "visao-geral":
            "visao-geral",

        social:
            "sociodemografico",

        sociodemografico:
            "sociodemografico",

        vulnerabilidade:
            "vulnerabilidade",

        renda:
            "vulnerabilidade",

        comparacao:
            "comparacao"

    };


    function normalizarPagina(
        valor
    ) {

        const chave =
            String(
                valor ||
                ""
            )
            .trim()
            .toLowerCase();


        const pagina =
            ALIASES_PAGINA[
                chave
            ]
            ||
            chave;


        return PAGINAS_VALIDAS.has(
            pagina
        )
            ?
            pagina
            :
            "visao-geral";

    }


    const pagina =
        normalizarPagina(
            parametros.get(
                "pagina"
            )
        );


    // ========================================================
    // GRUPOS
    // ========================================================

    function lerGruposURL() {

        const valores =
            parametros
                .getAll(
                    "grupo"
                )
                .flatMap(
                    valor =>
                        String(
                            valor
                        )
                        .split(",")
                )
                .map(
                    valor =>
                        valor
                            .trim()
                            .toLowerCase()
                )
                .filter(
                    Boolean
                );


        if (
            !valores.length
        ) {

            return {

                todos:
                    true,

                valores:
                    []

            };

        }


        if (
            valores.some(
                valor =>
                    valor ===
                        "todos"
                    ||
                    valor ===
                        "all"
                    ||
                    valor ===
                        "*"
            )
        ) {

            return {

                todos:
                    true,

                valores:
                    []

            };

        }


        return {

            todos:
                false,

            valores:
                [
                    ...new Set(
                        valores
                    )
                ]

        };

    }


    const gruposURL =
        lerGruposURL();


    function obterCodigosPermitidos() {

        if (
            gruposURL.todos
        ) {

            return Object.keys(
                PARCERIAS
            );

        }


        return gruposURL
            .valores
            .filter(
                codigo =>
                    Boolean(
                        PARCERIAS[
                            codigo
                        ]
                    )
            );

    }


    function obterGrupoUnico() {

        if (
            gruposURL.todos
        ) {
            return "";
        }


        const grupos =
            obterCodigosPermitidos();


        return grupos.length ===
            1
            ?
            grupos[
                0
            ]
            :
            "";

    }


    function possuiFiltroDeGrupo() {

        return (
            !gruposURL.todos
        );

    }


    function obterGruposParaMapa() {

        if (
            gruposURL.todos
        ) {

            return [
                "todos"
            ];

        }


        const validos =
            obterCodigosPermitidos();


        if (
            validos.length
        ) {

            return validos;

        }


        return gruposURL
            .valores
            .slice();

    }


    // ========================================================
    // NÍVEL DO MAPA
    // ========================================================

    function normalizarNivelMapa(
        valor
    ) {

        const chave =
            String(
                valor ||
                ""
            )
            .trim()
            .toLowerCase()
            .normalize(
                "NFD"
            )
            .replace(
                /[\u0300-\u036f]/g,
                ""
            )
            .replace(
                /_/g,
                "-"
            )
            .replace(
                /\s+/g,
                "-"
            );


        const aliases = {

            regiao:
                "regiao",

            regioes:
                "regiao",

            subprefeitura:
                "subprefeitura",

            subprefeituras:
                "subprefeitura",

            distrito:
                "distrito",

            distritos:
                "distrito",

            local:
                "local",

            locais:
                "local",

            equipamento:
                "local",

            equipamentos:
                "local",

            perimetro:
                "perimetro",

            perimetros:
                "perimetro",

            interno:
                "interno",

            interna:
                "interno",

            "divisao-interna":
                "interno",

            "divisoes-internas":
                "interno",

            "areas-internas":
                "interno"

        };


        return aliases[
            chave
        ]
        ||
        "";

    }


    /*
     * No dashboard social o padrão é perímetro.
     *
     * Se quiser outro nível:
     *
     * ?nivel=local
     * ?nivel=distrito
     * ?nivel=subprefeitura
     * etc.
     */

    const nivelMapa =
        normalizarNivelMapa(
            parametros.get(
                "nivel"
            )
        )
        ||
        "perimetro";


    // ========================================================
    // URL DO MAPA
    // ========================================================

    function montarURLMapa(
        opcoes = {}
    ) {

        const url =
            new URL(
                "https://mathh412.github.io/mapa/"
            );


        url.searchParams.set(
            "embed",
            "1"
        );


        url.searchParams.set(
            "grupo",
            obterGruposParaMapa()
                .join(",")
        );


        const nivel =
            normalizarNivelMapa(
                opcoes.nivel
            )
            ||
            nivelMapa;


        if (
            nivel
        ) {

            url.searchParams.set(
                "nivel",
                nivel
            );

        }


        return url.toString();

    }


    // ========================================================
    // API GLOBAL
    // ========================================================

    window.SPPDashboardURL = {

        pagina,

        gruposURL,

        nivelMapa,

        normalizarPagina,

        normalizarNivelMapa,

        obterCodigosPermitidos,

        obterGrupoUnico,

        obterGruposParaMapa,

        possuiFiltroDeGrupo,

        montarURLMapa

    };


    // ========================================================
    // DATASET DA PÁGINA
    // ========================================================

    if (
        document.body
    ) {

        document
            .body
            .dataset
            .pagina =
                pagina;

    }


    // ========================================================
    // IFRAME — VISÃO GERAL
    // ========================================================

    const iframeGeral =
        document.getElementById(
            "mapa-spp-iframe"
        );


    if (
        iframeGeral
    ) {

        if (
            pagina ===
            "visao-geral"
        ) {

            iframeGeral.src =
                montarURLMapa(
                    {
                        nivel:
                            nivelMapa
                    }
                );

        }
        else {

            iframeGeral.src =
                "about:blank";

        }

    }


    // ========================================================
    // IFRAME — COMPARAÇÃO
    // ========================================================

    const iframeComparacao =
        document.getElementById(
            "mapa-comparacao-iframe"
        );


    if (
        iframeComparacao
    ) {

        if (
            pagina ===
            "comparacao"
        ) {

            /*
             * A comparação sempre começa diretamente
             * nos perímetros.
             */

            iframeComparacao.src =
                montarURLMapa(
                    {
                        nivel:
                            "perimetro"
                    }
                );

        }
        else {

            iframeComparacao.src =
                "about:blank";

        }

    }


    // ========================================================
    // FILTRO DE PARCERIAS
    // ========================================================

    prepararFiltroParcerias =
        function () {

            elementos
                .parceria
                .innerHTML =
                    '<option value="">Selecione</option>';


            const codigosPermitidos =
                obterCodigosPermitidos();


            const entradas =
                codigosPermitidos
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


                elementos
                    .parceria
                    .appendChild(
                        option
                    );

            }


            elementos.parceria.disabled =
                false;


            elementos.local.disabled =
                true;


            elementos.raio.disabled =
                true;


            elementos.criterio.disabled =
                true;


            elementos.tema.disabled =
                true;


            elementos.indicadorDistancia.disabled =
                true;


            elementos.passoFaixa.disabled =
                true;


            // =================================================
            // GRUPO ÚNICO
            // =================================================

            const grupoUnico =
                obterGrupoUnico();


            const campoParceria =
                document.getElementById(
                    "campo-filtro-parceria"
                );


            const filtros =
                document.getElementById(
                    "filtros-principais"
                );


            if (
                grupoUnico
            ) {

                campoParceria
                    ?.classList
                    .add(
                        "url-oculto"
                    );


                filtros
                    ?.classList
                    .add(
                        "grupo-fixo"
                    );


                elementos
                    .parceria
                    .value =
                        grupoUnico;

            }
            else {

                campoParceria
                    ?.classList
                    .remove(
                        "url-oculto"
                    );


                filtros
                    ?.classList
                    .remove(
                        "grupo-fixo"
                    );

            }

        };


    // ========================================================
    // AUTOLOAD DE GRUPO ÚNICO
    // ========================================================

    const carregarDadosOriginal =
        carregarDados;


    carregarDados =
        async function () {

            await carregarDadosOriginal();


            if (
                possuiFiltroDeGrupo()
                &&
                obterCodigosPermitidos()
                    .length ===
                    0
            ) {

                atualizarStatus(
                    "Grupo informado na URL não encontrado",
                    "erro"
                );


                return;

            }


            const grupoUnico =
                obterGrupoUnico();


            if (
                !grupoUnico
            ) {
                return;
            }


            elementos
                .parceria
                .value =
                    grupoUnico;


            await alterarParceria();

        };


})();