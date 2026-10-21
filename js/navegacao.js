// ============================================================
// DASHBOARD SPP
// NAVEGAÇÃO EXCLUSIVAMENTE PELA URL
// + SINCRONIZAÇÃO DOS EQUIPAMENTOS DA COMPARAÇÃO
// ============================================================

(function () {

    "use strict";


    // ========================================================
    // CONFIGURAÇÃO
    // ========================================================

    const configuracao =
        window.SPPDashboardURL;


    const pagina =
        configuracao?.pagina
        ||
        "visao-geral";


    // ========================================================
    // ABRIR SOMENTE A PÁGINA DEFINIDA NA URL
    // ========================================================

    function abrirPaginaURL() {

        const paineis =
            document.querySelectorAll(
                ".tab-panel"
            );


        paineis.forEach(
            painel => {

                painel
                    .classList
                    .remove(
                        "ativa"
                    );

            }
        );


        const alvo =
            document.getElementById(
                `tab-${pagina}`
            );


        if (
            alvo
        ) {

            alvo
                .classList
                .add(
                    "ativa"
                );

        }


        document
            .body
            .dataset
            .pagina =
                pagina;

    }


    // ========================================================
    // COMPARAÇÃO
    // ========================================================

    let sincronizandoComparacao =
        false;


    // ========================================================
    // ELEMENTOS
    // ========================================================

    function obterElementosComparacao() {

        return {

            parceriaA:
                document.getElementById(
                    "comparacao-parceria-a"
                ),


            parceriaB:
                document.getElementById(
                    "comparacao-parceria-b"
                ),


            localA:
                document.getElementById(
                    "comparacao-local-a"
                ),


            localB:
                document.getElementById(
                    "comparacao-local-b"
                )

        };

    }


    // ========================================================
    // PARCERIAS SÃO AS MESMAS?
    // ========================================================

    function mesmaParceriaComparacao() {

        const elementos =
            obterElementosComparacao();


        if (
            !elementos.parceriaA
            ||
            !elementos.parceriaB
        ) {

            return false;

        }


        const grupoA =
            elementos
                .parceriaA
                .value;


        const grupoB =
            elementos
                .parceriaB
                .value;


        return Boolean(
            grupoA
            &&
            grupoB
            &&
            grupoA ===
                grupoB
        );

    }


    // ========================================================
    // ÍNDICE A EXCLUIR
    // ========================================================

    function obterIndiceExcluido(
        select
    ) {

        const elementos =
            obterElementosComparacao();


        if (
            !mesmaParceriaComparacao()
        ) {

            return null;

        }


        if (
            select ===
            elementos.localA
        ) {

            return (
                elementos
                    .localB
                    ?.value
                ||
                null
            );

        }


        if (
            select ===
            elementos.localB
        ) {

            return (
                elementos
                    .localA
                    ?.value
                ||
                null
            );

        }


        return null;

    }


    // ========================================================
    // PREENCHER SELECT SEM O EQUIPAMENTO DO OUTRO LADO
    // ========================================================

    function preencherLocaisExclusivos(
        select,
        geojson
    ) {

        if (
            !select
            ||
            !geojson
            ||
            !Array.isArray(
                geojson.features
            )
        ) {

            return;

        }


        const valorAnterior =
            select.value;


        const indiceExcluido =
            obterIndiceExcluido(
                select
            );


        const locais =
            geojson
                .features
                .map(
                    (
                        feature,
                        indice
                    ) => ({

                        indice,

                        nome:
                            typeof nomeDoLocal ===
                                "function"
                                ?
                                nomeDoLocal(
                                    feature
                                )
                                :
                                (
                                    feature
                                        ?.properties
                                        ?.Equipamento
                                    ||
                                    feature
                                        ?.properties
                                        ?.nome
                                    ||
                                    `Equipamento ${indice + 1}`
                                )

                    })
                )
                .filter(
                    local => {

                        if (
                            indiceExcluido ===
                            null
                        ) {

                            return true;

                        }


                        return (
                            String(
                                local.indice
                            )
                            !==
                            String(
                                indiceExcluido
                            )
                        );

                    }
                )
                .sort(
                    (
                        a,
                        b
                    ) =>
                        a.nome
                            .localeCompare(
                                b.nome,
                                "pt-BR"
                            )
                );


        select.innerHTML =
            '';


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
            locais.length === 0;


        // ====================================================
        // TENTAR MANTER O VALOR ANTERIOR
        // ====================================================

        if (
            valorAnterior !==
            ""
            &&
            Array
                .from(
                    select.options
                )
                .some(
                    option =>
                        option.value ===
                        valorAnterior
                )
        ) {

            select.value =
                valorAnterior;

        }
        else {

            select.selectedIndex =
                select.options.length ? 0 : -1;

        }

    }


    // ========================================================
    // SUBSTITUIR PREENCHIMENTO ORIGINAL DA COMPARAÇÃO
    // ========================================================
    //
    // comparacao.js chama:
    //
    // preencherLocaisComparacao(select, geojson)
    //
    // Substituímos essa função antes do DOMContentLoaded.
    //
    // Dessa forma funciona inclusive quando:
    //
    // - muda a parceria;
    // - o carregamento é assíncrono;
    // - a parceria é fixa pela URL.
    // ========================================================

    if (
        typeof preencherLocaisComparacao ===
        "function"
    ) {

        preencherLocaisComparacao =
            function (
                select,
                geojson
            ) {

                preencherLocaisExclusivos(
                    select,
                    geojson
                );

            };

    }


    // ========================================================
    // ATUALIZAR OS DOIS FILTROS
    // ========================================================

    function sincronizarEquipamentosComparacao() {

        if (
            sincronizandoComparacao
        ) {

            return;

        }


        if (
            pagina !==
            "comparacao"
        ) {

            return;

        }


        const elementos =
            obterElementosComparacao();


        if (
            !elementos.localA
            ||
            !elementos.localB
        ) {

            return;

        }


        sincronizandoComparacao =
            true;


        const valorAnteriorA =
            elementos
                .localA
                .value;


        const valorAnteriorB =
            elementos
                .localB
                .value;


        // ====================================================
        // RECONSTRUIR A
        // ====================================================

        if (
            typeof parceriaComparacaoA !==
                "undefined"
            &&
            parceriaComparacaoA
        ) {

            preencherLocaisExclusivos(
                elementos.localA,
                parceriaComparacaoA
            );

        }


        // ====================================================
        // RECONSTRUIR B
        // ====================================================

        if (
            typeof parceriaComparacaoB !==
                "undefined"
            &&
            parceriaComparacaoB
        ) {

            preencherLocaisExclusivos(
                elementos.localB,
                parceriaComparacaoB
            );

        }


        const valorAtualA =
            elementos
                .localA
                .value;


        const valorAtualB =
            elementos
                .localB
                .value;


        sincronizandoComparacao =
            false;


        // ====================================================
        // SEGURANÇA
        // ====================================================
        //
        // Se a reconstrução escolher uma alternativa válida ou
        // esvaziar um lado sem alternativas, atualizamos também
        // a feature usada na análise através do change.
        // ====================================================

        if (
            valorAnteriorA !== valorAtualA
        ) {

            elementos
                .localA
                .dispatchEvent(
                    new Event(
                        "change",
                        {
                            bubbles:
                                true
                        }
                    )
                );

        }


        if (
            valorAnteriorB !== valorAtualB
        ) {

            elementos
                .localB
                .dispatchEvent(
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
    // REGISTRAR EVENTOS DA COMPARAÇÃO
    // ========================================================

    function registrarExclusaoEquipamentos() {

        if (
            pagina !==
            "comparacao"
        ) {

            return;

        }


        const elementos =
            obterElementosComparacao();


        if (
            !elementos.localA
            ||
            !elementos.localB
        ) {

            return;

        }


        // ====================================================
        // EQUIPAMENTO A
        // ====================================================

        elementos
            .localA
            .addEventListener(
                "change",
                () => {

                    if (
                        sincronizandoComparacao
                    ) {
                        return;
                    }


                    /*
                     * O handler do comparacao.js executa
                     * primeiro.
                     *
                     * Depois atualizamos as opções.
                     */

                    setTimeout(
                        sincronizarEquipamentosComparacao,
                        0
                    );

                }
            );


        // ====================================================
        // EQUIPAMENTO B
        // ====================================================

        elementos
            .localB
            .addEventListener(
                "change",
                () => {

                    if (
                        sincronizandoComparacao
                    ) {
                        return;
                    }


                    setTimeout(
                        sincronizarEquipamentosComparacao,
                        0
                    );

                }
            );


        // ====================================================
        // PARCERIA A
        // ====================================================

        elementos
            .parceriaA
            ?.addEventListener(
                "change",
                () => {

                    /*
                     * O próprio comparacao.js recarrega o
                     * GeoJSON da parceria.
                     *
                     * Aqui restauramos imediatamente opções
                     * anteriormente ocultadas no outro lado.
                     */

                    setTimeout(
                        sincronizarEquipamentosComparacao,
                        0
                    );

                }
            );


        // ====================================================
        // PARCERIA B
        // ====================================================

        elementos
            .parceriaB
            ?.addEventListener(
                "change",
                () => {

                    setTimeout(
                        sincronizarEquipamentosComparacao,
                        0
                    );

                }
            );

    }


    // ========================================================
    // START
    // ========================================================

    document.addEventListener(
        "DOMContentLoaded",
        () => {

            abrirPaginaURL();

            registrarExclusaoEquipamentos();

        }
    );


})();
