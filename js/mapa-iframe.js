// ============================================================
// DASHBOARD SPP
// MAPA OFICIAL VIA IFRAME
// ============================================================

(function () {

    "use strict";


    const iframe =
        document.getElementById(
            "mapa-spp-iframe"
        );


    const loading =
        document.getElementById(
            "mapa-iframe-loading"
        );


    if (
        !iframe
    ) {

        console.error(
            "mapa-spp-iframe não encontrado."
        );


        return;

    }


    const CONFIG =
        window.SPPDashboardURL;


    const MAPA_ORIGIN =
        new URL(
            "https://mathh412.github.io/mapa/"
        ).origin;


    let mapaPronto =
        false;


    let grupoAtual =
        "";


    let localAtual =
        "";


    let bufferAtual =
        null;


    let setoresAtuais =
        [];


    // ========================================================
    // MAPA ESTÁ ATIVO NESTA PÁGINA?
    // ========================================================

    function mapaEstaAtivo() {

        return (
            !CONFIG
            ||
            CONFIG.pagina ===
                "visao-geral"
        );

    }


    // ========================================================
    // GRUPOS DA URL
    // ========================================================

    function gruposBase() {

        if (
            CONFIG
            &&
            typeof CONFIG.obterGruposParaMapa ===
                "function"
        ) {

            return CONFIG
                .obterGruposParaMapa();

        }


        return [
            "todos"
        ];

    }


    // ========================================================
    // COMUNICAÇÃO
    // ========================================================

    function enviarParaMapa(
        type,
        dados = {}
    ) {

        if (
            !mapaEstaAtivo()
        ) {

            return;

        }


        if (
            !iframe.contentWindow
        ) {

            return;

        }


        iframe
            .contentWindow
            .postMessage(
                {
                    source:
                        "spp-dashboard",

                    type,

                    ...dados
                },
                MAPA_ORIGIN
            );

    }


    // ========================================================
    // FILTRAR PARCERIA
    // ========================================================

    function mostrarParceria(
        grupo
    ) {

        grupoAtual =
            grupo ||
            "";


        localAtual =
            "";


        const grupos =
            grupo
                ? [
                    grupo
                ]
                : gruposBase();


        enviarParaMapa(
            "set-filters",
            {
                grupo:
                    grupos,

                local:
                    []
            }
        );

    }


    // ========================================================
    // FOCAR EQUIPAMENTO
    // ========================================================

    function mostrarLocal(
        grupo,
        local
    ) {

        if (
            !grupo
            ||
            !local
        ) {

            return;

        }


        grupoAtual =
            grupo;


        localAtual =
            local;


        enviarParaMapa(
            "focus-local",
            {
                grupo: [
                    grupo
                ],

                local: [
                    local
                ]
            }
        );

    }


    // ========================================================
    // GEOJSON DOS SETORES
    // ========================================================

    function gerarGeoJSONSetores(
        selecionados
    ) {

        prepararEscalaTematica();


        return {

            type:
                "FeatureCollection",


            features:
                selecionados.map(
                    item => {

                        const feature =
                            item.feature;


                        const dados =
                            dadosDaFeature(
                                feature
                            );


                        const estilo =
                            estiloSetorSelecionado(
                                feature
                            );


                        return {

                            type:
                                "Feature",


                            geometry:
                                feature.geometry,


                            properties: {

                                ...feature.properties,


                                __analysisColor:
                                    estilo.fillColor,


                                __analysisPopulacao:
                                    dados.populacao
                                    ??
                                    null,


                                __analysisRenda:
                                    dados.renda
                                    ??
                                    null,


                                __analysisIPVS:
                                    dados.ipvs
                                    ||
                                    ""

                            }

                        };

                    }
                )

        };

    }


    // ========================================================
    // BUFFER
    // ========================================================

    function enviarBuffer(
        buffer,
        ajustarZoom = true
    ) {

        if (
            !buffer
        ) {

            return;

        }


        bufferAtual =
            buffer;


        enviarParaMapa(
            "set-analysis-layer",
            {

                layer:
                    "buffer-territorial",


                tipo:
                    "buffer",


                geojson:
                    buffer,


                fit:
                    ajustarZoom,


                style: {

                    color:
                        "#00506e",


                    weight:
                        2,


                    opacity:
                        0.95,


                    dashArray:
                        "7 5",


                    fillColor:
                        "#3b7d95",


                    fillOpacity:
                        0.07

                }

            }
        );

    }


    // ========================================================
    // SETORES
    // ========================================================

    function enviarSetores(
        selecionados
    ) {

        setoresAtuais =
            selecionados;


        enviarParaMapa(
            "set-analysis-layer",
            {

                layer:
                    "setores-territoriais",


                tipo:
                    "setores",


                geojson:
                    gerarGeoJSONSetores(
                        selecionados
                    )

            }
        );

    }


    // ========================================================
    // LIMPEZA
    // ========================================================

    function limparAnaliseMapa() {

        bufferAtual =
            null;


        setoresAtuais =
            [];


        enviarParaMapa(
            "clear-analysis-layers"
        );

    }


    // ========================================================
    // REENVIAR ESTADO APÓS RELOAD DO MAPA
    // ========================================================

    function reenviarEstado() {

        if (
            grupoAtual
            &&
            localAtual
        ) {

            mostrarLocal(
                grupoAtual,
                localAtual
            );

        }
        else if (
            grupoAtual
        ) {

            mostrarParceria(
                grupoAtual
            );

        }
        else {

            mostrarParceria(
                ""
            );

        }


        setTimeout(
            () => {

                if (
                    bufferAtual
                ) {

                    enviarBuffer(
                        bufferAtual,
                        true
                    );

                }


                if (
                    setoresAtuais.length
                ) {

                    enviarSetores(
                        setoresAtuais
                    );

                }

            },
            140
        );

    }


    // ========================================================
    // ADAPTADOR DO app.js
    // ========================================================

    inicializarMapa =
        function () {

            mapa = {

                fitBounds() {},

                removeLayer() {},

                invalidateSize() {}

            };

        };


    desenharEmpreendimento =
        function (
            feature
        ) {

            camadaEmpreendimento = {

                bringToFront() {}

            };


            const grupo =
                elementos
                    .parceria
                    .value;


            const local =
                nomeDoLocal(
                    feature
                );


            mostrarLocal(
                grupo,
                local
            );

        };


    desenharBuffer =
        function (
            buffer
        ) {

            const bbox =
                turf.bbox(
                    buffer
                );


            camadaBuffer = {

                getBounds() {

                    return L.latLngBounds(
                        [
                            bbox[1],
                            bbox[0]
                        ],
                        [
                            bbox[3],
                            bbox[2]
                        ]
                    );

                }

            };


            enviarBuffer(
                buffer,
                true
            );

        };


    desenharSetoresSelecionados =
        function (
            selecionados
        ) {

            prepararEscalaTematica();


            camadaSetoresSelecionados = {

                setStyle() {},

                resetStyle() {}

            };


            enviarSetores(
                selecionados
            );


            atualizarLegendaMapa();

        };


    atualizarTemaMapa =
        function () {

            if (
                !ultimosSelecionados.length
            ) {

                atualizarLegendaMapa();

                return;

            }


            prepararEscalaTematica();


            enviarSetores(
                ultimosSelecionados
            );


            atualizarLegendaMapa();

        };


    limparAnaliseGeografica =
        function () {

            numeroAnalise++;


            ultimosSelecionados =
                [];


            dadosFaixasDistancia =
                [];


            escalaTemaAtual =
                null;


            camadaBuffer =
                null;


            camadaSetoresSelecionados =
                null;


            camadaEmpreendimento =
                null;


            limparAnaliseMapa();


            atualizarLegendaMapa();

        };


    // ========================================================
    // SELECT PARCERIA -> MAPA
    // ========================================================

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            const select =
                document.getElementById(
                    "filtro-parceria"
                );


            if (
                !select
            ) {

                return;

            }


            select.addEventListener(
                "change",
                () => {

                    mostrarParceria(
                        select.value
                    );

                }
            );

        }
    );


    // ========================================================
    // NORMALIZAÇÃO
    // ========================================================

    function normalizar(
        texto
    ) {

        return String(
            texto ??
            ""
        )
        .normalize(
            "NFD"
        )
        .replace(
            /[\u0300-\u036f]/g,
            ""
        )
        .replace(
            /\s+/g,
            " "
        )
        .trim()
        .toLowerCase();

    }


    // ========================================================
    // LOCALIZAR OPTION
    // ========================================================

    async function localizarOption(
        select,
        nome
    ) {

        const alvo =
            normalizar(
                nome
            );


        for (
            let tentativa = 0;
            tentativa < 40;
            tentativa++
        ) {

            const option =
                Array
                    .from(
                        select.options
                    )
                    .find(
                        item =>
                            normalizar(
                                item.textContent
                            )
                            ===
                            alvo
                    );


            if (
                option
            ) {

                return option;

            }


            await new Promise(
                resolve =>
                    setTimeout(
                        resolve,
                        100
                    )
            );

        }


        return null;

    }


    // ========================================================
    // CLIQUE NO MAPA -> DASHBOARD
    // ========================================================

    async function selecionarLocalDoMapa(
        grupo,
        local
    ) {

        if (
            !grupo
            ||
            !local
            ||
            !PARCERIAS[
                grupo
            ]
        ) {

            return;

        }


        if (
            CONFIG
            &&
            CONFIG.possuiFiltroDeGrupo()
        ) {

            const permitidos =
                CONFIG
                    .obterCodigosPermitidos();


            if (
                !permitidos.includes(
                    grupo
                )
            ) {

                return;

            }

        }


        const selectParceria =
            document.getElementById(
                "filtro-parceria"
            );


        const selectLocal =
            document.getElementById(
                "filtro-local"
            );


        if (
            !selectParceria
            ||
            !selectLocal
        ) {

            return;

        }


        if (
            selectParceria.value !==
            grupo
        ) {

            selectParceria.value =
                grupo;


            selectParceria.dispatchEvent(
                new Event(
                    "change",
                    {
                        bubbles:
                            true
                    }
                )
            );

        }


        const option =
            await localizarOption(
                selectLocal,
                local
            );


        if (
            !option
        ) {

            console.warn(
                "Equipamento selecionado no mapa não encontrado:",
                grupo,
                local
            );


            return;

        }


        if (
            selectLocal.value !==
            option.value
        ) {

            selectLocal.value =
                option.value;


            selectLocal.dispatchEvent(
                new Event(
                    "change",
                    {
                        bubbles:
                            true
                    }
                )
            );

        }

    }


    // ========================================================
    // MENSAGENS DO MAPA
    // ========================================================

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
                MAPA_ORIGIN
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

                mapaPronto =
                    true;


                loading
                    ?.classList
                    .add(
                        "oculto"
                    );


                reenviarEstado();


                return;

            }


            if (
                mensagem.type ===
                "local-selected"
            ) {

                selecionarLocalDoMapa(
                    mensagem.grupo,
                    mensagem.local
                );

            }

        }
    );


    // ========================================================
    // LOAD
    // ========================================================

    iframe.addEventListener(
        "load",
        () => {

            if (
                !mapaEstaAtivo()
            ) {

                return;

            }


            mapaPronto =
                false;


            loading
                ?.classList
                .remove(
                    "oculto"
                );


            setTimeout(
                () => {

                    enviarParaMapa(
                        "ping"
                    );

                },
                150
            );

        }
    );


    // ========================================================
    // PING DE SEGURANÇA
    // ========================================================

    if (
        mapaEstaAtivo()
    ) {

        setTimeout(
            () => {

                enviarParaMapa(
                    "ping"
                );

            },
            500
        );

    }


    // ========================================================
    // API
    // ========================================================

    window.SPPDashboardMap = {

        iframe,

        enviar:
            enviarParaMapa,

        mostrarParceria,

        mostrarLocal,

        enviarBuffer,

        enviarSetores,

        limpar:
            limparAnaliseMapa,

        reenviar:
            reenviarEstado,


        get pronto() {

            return mapaPronto;

        }

    };


})();