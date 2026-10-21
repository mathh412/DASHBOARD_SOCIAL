// ============================================================
// DASHBOARD SPP
// NAVEGAÇÃO EXCLUSIVAMENTE PELA URL
// ============================================================

(function () {

    "use strict";


    const configuracao =
        window.SPPDashboardURL;


    const pagina =
        configuracao?.pagina
        ||
        "visao-geral";


    function abrirPaginaURL() {

        const paineis =
            document.querySelectorAll(
                ".tab-panel"
            );


        paineis.forEach(
            painel => {

                painel.classList.remove(
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

            alvo.classList.add(
                "ativa"
            );

        }


        document.body.dataset.pagina =
            pagina;

    }


    document.addEventListener(
        "DOMContentLoaded",
        abrirPaginaURL
    );


})();