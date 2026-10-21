// ============================================================
// CATÁLOGO CENTRAL DE PARCERIAS
// ============================================================

const URL_BASE_MAPA =
    "https://raw.githubusercontent.com/mathh412/mapa/refs/heads/main/grupos";

Object.assign(PARCERIAS, {

    ceus1: {
        nome: "CEUs 1",
        arquivo: `${URL_BASE_MAPA}/ceus1/perimetros.geojson`,
        categoria: "Educação"
    },

    ceus2: {
        nome: "CEUs 2",
        arquivo: `${URL_BASE_MAPA}/ceus2/perimetros.geojson`,
        categoria: "Educação"
    },

    parques1: {
        nome: "Parques 1",
        arquivo: `${URL_BASE_MAPA}/parques1/perimetros.geojson`,
        categoria: "Parques"
    },

    parques3: {
        nome: "Parques 3",
        arquivo: `${URL_BASE_MAPA}/parques3/perimetros.geojson`,
        categoria: "Parques"
    },

    termleste: {
        nome: "Terminais Leste",
        arquivo: `${URL_BASE_MAPA}/termleste/perimetros.geojson`,
        categoria: "Terminais"
    },

    termnoroeste: {
        nome: "Terminais Noroeste",
        arquivo: `${URL_BASE_MAPA}/termnoroeste/perimetros.geojson`,
        categoria: "Terminais"
    },

    termsul: {
        nome: "Terminais Sul",
        arquivo: `${URL_BASE_MAPA}/termsul/perimetros.geojson`,
        categoria: "Terminais"
    },

    dompedro: {
        nome: "Dom Pedro",
        arquivo: `${URL_BASE_MAPA}/dompedro/perimetros.geojson`,
        categoria: "Terminais"
    },

    anhembi: {
        nome: "Complexo do Anhembi",
        arquivo: `${URL_BASE_MAPA}/anhembi/perimetros.geojson`,
        categoria: "Equipamentos"
    },

    pacaembu: {
        nome: "Pacaembu",
        arquivo: `${URL_BASE_MAPA}/pacaembu/perimetros.geojson`,
        categoria: "Equipamentos"
    },

    anhangabau: {
        nome: "Vale do Anhangabaú",
        arquivo: `${URL_BASE_MAPA}/anhangabau/perimetros.geojson`,
        categoria: "Espaços Urbanos"
    },

    baixoantartica: {
        nome: "Baixo do Viaduto Antártica",
        arquivo: `${URL_BASE_MAPA}/baixoantartica/perimetros.geojson`,
        categoria: "Baixos de Viaduto"
    },

    baixolapa: {
        nome: "Baixo do Viaduto Lapa",
        arquivo: `${URL_BASE_MAPA}/baixolapa/perimetros.geojson`,
        categoria: "Baixos de Viaduto"
    },

    baixopompeia: {
        nome: "Baixo do Viaduto Pompéia",
        arquivo: `${URL_BASE_MAPA}/baixopompeia/perimetros.geojson`,
        categoria: "Baixos de Viaduto"
    },

    cemb1consolare: {
        nome: "Cemitérios - Bloco 1 / Consolare",
        arquivo: `${URL_BASE_MAPA}/cemb1consolare/perimetros.geojson`,
        categoria: "Cemitérios"
    },

    cemb2cortel: {
        nome: "Cemitérios - Bloco 2 / Cortel",
        arquivo: `${URL_BASE_MAPA}/cemb2cortel/perimetros.geojson`,
        categoria: "Cemitérios"
    },

    cemb3maya: {
        nome: "Cemitérios - Bloco 3 / Maya",
        arquivo: `${URL_BASE_MAPA}/cemb3maya/perimetros.geojson`,
        categoria: "Cemitérios"
    },

    cemb4velar: {
        nome: "Cemitérios - Bloco 4 / Velar",
        arquivo: `${URL_BASE_MAPA}/cemb4velar/perimetros.geojson`,
        categoria: "Cemitérios"
    },

    mercadosantoamaro: {
        nome: "Mercado de Santo Amaro",
        arquivo: `${URL_BASE_MAPA}/mercadosantoamaro/perimetros.geojson`,
        categoria: "Mercados"
    },

    mercadopaulistanokinjo: {
        nome: "Mercado Paulistano / Kinjo",
        arquivo: `${URL_BASE_MAPA}/mercadopaulistanokinjo/perimetros.geojson`,
        categoria: "Mercados"
    }

});

console.log(
    "Catálogo de parcerias carregado:",
    Object.keys(PARCERIAS).length,
    "parcerias"
);