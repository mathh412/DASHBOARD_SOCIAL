# Dashboard Social SPP

Dashboard territorial e sociodemográfico para análise das áreas de influência de equipamentos e parcerias do Município de São Paulo.

A aplicação combina dados geográficos de equipamentos com informações de setores censitários, permitindo analisar população, raça/cor, gênero, renda, vulnerabilidade social, densidade e outros indicadores territoriais.

O dashboard utiliza o projeto [`mathh412/mapa`](https://github.com/mathh412/mapa) como mapa geográfico integrado por `iframe` e comunicação via `postMessage`.

---

## Funcionalidades

O dashboard está organizado em quatro telas principais:

### Visão Geral

Apresenta o mapa do equipamento selecionado e sua área de influência.

Permite:

- selecionar a parceria;
- selecionar o equipamento;
- definir o raio de análise;
- definir o critério territorial;
- visualizar setores censitários associados;
- colorir os setores por diferentes indicadores;
- visualizar indicadores consolidados;
- analisar a área de influência diretamente sobre o mapa.

O mapa da Visão Geral trabalha no nível:

```text
perimetro
```

e é carregado com:

```text
nivel_travado=1
```

Dessa forma, o usuário pode movimentar e ampliar o mapa, mas não navega para níveis administrativos superiores nem para divisões internas do equipamento.

---

### Caracterização Sociodemográfica

Apresenta informações sobre a população pertencente à área de influência selecionada.

Entre os indicadores exibidos estão:

- população total;
- raça/cor;
- população branca;
- população preta;
- população parda;
- população amarela;
- população indígena;
- distribuição por gênero;
- população feminina;
- população masculina.

A análise utiliza os mesmos filtros de parceria, equipamento, raio e critério territorial definidos no dashboard.

---

### Vulnerabilidade e Renda

Tela voltada à análise socioeconômica dos setores associados ao equipamento.

Inclui:

- distribuição dos setores por IPVS;
- renda;
- perfil dos indicadores por distância;
- comparação das condições territoriais conforme o afastamento do equipamento;
- análise por faixas de distância.

---

### Comparação Territorial

Permite comparar dois equipamentos utilizando os mesmos parâmetros territoriais.

A comparação apresenta:

- Equipamento A;
- Equipamento B;
- setores censitários de cada área;
- população;
- área analisada;
- densidade populacional;
- renda mediana;
- cobertura IPVS;
- população preta + parda;
- população feminina;
- vulnerabilidade alta / muito alta;
- diferença entre os indicadores de A e B.

O mapa da comparação também trabalha travado em:

```text
nivel=perimetro
nivel_travado=1
```

Os buffers de A e B utilizam cores distintas, enquanto os perímetros físicos dos equipamentos utilizam o laranja SPP:

```text
#F08200
```

---

## Seleção inicial automática

Os filtros de parceria e equipamento não utilizam uma opção vazia do tipo:

```text
Selecione
```

Ao carregar o dashboard:

1. uma parceria válida é selecionada automaticamente;
2. os equipamentos dessa parceria são carregados;
3. o primeiro equipamento disponível é selecionado;
4. a análise é executada.

Ao trocar de parceria, o primeiro equipamento da nova parceria também passa a ser selecionado automaticamente.

Na tela de comparação, os equipamentos A e B são carregados automaticamente e, quando pertencem à mesma parceria, o sistema procura iniciar com equipamentos diferentes.

---

## Tecnologias utilizadas

- HTML5
- CSS3
- JavaScript
- Leaflet 1.9.4
- Turf.js
- GeoJSON
- Python
- Pandas
- GeoPandas
- Shapely
- Pyogrio
- OpenPyXL
- GitHub Pages

---

## Estrutura do projeto

```text
DASHBOARD_SOCIAL/
├── index.html
├── requirements.txt
│
├── css/
│   ├── dashboard.css
│   ├── mapa-iframe.css
│   ├── comparacao.css
│   └── url-layout.css
│
├── js/
│   ├── app.js
│   ├── comparacao.js
│   ├── mapa-iframe.js
│   ├── navegacao.js
│   ├── parcerias.js
│   └── url-config.js
│
├── dados/
│   └── setores/
│       ├── setores_sp.geojson
│       ├── setores_sp_web.geojson
│       ├── indicadores_sp.json
│       └── setores_sp_conferencia.csv
│
├── dados_brutos/
│
└── scripts/
    ├── preparar_setores.py
    └── otimizar_setores.py
```

---

## Arquivos JavaScript

### `app.js`

Motor principal das análises do dashboard.

Responsável por:

- carregamento dos setores censitários;
- carregamento dos indicadores;
- índice espacial;
- seleção territorial;
- buffers;
- cálculos dos indicadores;
- filtros;
- gráficos;
- análise por distância.

---

### `parcerias.js`

Catálogo central das parcerias disponíveis.

Cada parceria aponta para o arquivo:

```text
perimetros.geojson
```

existente no repositório do mapa.

Exemplo:

```javascript
ceus1: {
    nome: "CEUs 1",
    arquivo: `${URL_BASE_MAPA}/ceus1/perimetros.geojson`,
    categoria: "Educação"
}
```

Atualmente o catálogo inclui grupos como:

- CEUs 1;
- CEUs 2;
- Parques 1;
- Parques 3;
- Terminais Leste;
- Terminais Noroeste;
- Terminais Sul;
- Dom Pedro;
- Complexo do Anhembi;
- Pacaembu;
- Vale do Anhangabaú;
- Baixos de Viaduto;
- Cemitérios;
- Mercados.

---

### `mapa-iframe.js`

Faz a integração entre o dashboard e o mapa.

O mapa é carregado como `iframe` e recebe comandos do dashboard através de:

```javascript
window.postMessage()
```

Entre as operações estão:

```text
set-filters
focus-local
set-analysis-layer
clear-analysis-layers
ping
```

---

### `comparacao.js`

Responsável pela tela de comparação territorial.

Controla:

- Equipamento A;
- Equipamento B;
- buffers;
- setores analisados;
- indicadores comparativos;
- diferenças entre os equipamentos;
- camadas adicionais enviadas ao mapa.

---

### `url-config.js`

Centraliza a configuração do dashboard através da URL.

Responsável por:

- identificar a página;
- limitar grupos disponíveis;
- configurar os iframes;
- gerar a URL do mapa;
- definir o nível do mapa;
- definir `nivel_travado`;
- aplicar grupo fixo;
- controlar o carregamento inicial.

---

### `navegacao.js`

Controla qual painel do dashboard será apresentado conforme o parâmetro:

```text
pagina
```

---

## Parâmetros da URL

### Página

```text
?pagina=visao-geral
```

Valores suportados:

```text
visao-geral
sociodemografico
vulnerabilidade
comparacao
```

Exemplo:

```text
?pagina=comparacao
```

---

### Parceria / grupo

É possível limitar o dashboard a uma parceria:

```text
?grupo=ceus1
```

Exemplo:

```text
?pagina=visao-geral&grupo=ceus1
```

Quando apenas um grupo é informado, o filtro de parceria pode ser tratado como fixo.

Também é possível informar múltiplos grupos separados por vírgula:

```text
?grupo=ceus1,ceus2,parques1
```

---

## Integração com o mapa

O dashboard utiliza:

```text
https://mathh412.github.io/mapa/
```

como aplicação geográfica.

Uma URL gerada internamente pode assumir a forma:

```text
https://mathh412.github.io/mapa/?embed=1&grupo=ceus1&nivel=perimetro&nivel_travado=1
```

### `embed=1`

Indica que o mapa está sendo utilizado dentro de outro sistema.

### `grupo`

Define quais parcerias serão carregadas.

### `nivel=perimetro`

Faz o mapa iniciar diretamente nos perímetros.

### `nivel_travado=1`

Impede que o usuário avance ou volte entre níveis do mapa.

O usuário ainda pode:

- arrastar o mapa;
- usar zoom;
- visualizar tooltips;
- visualizar os dados enviados pelo dashboard.

---

## Fluxo de integração

```text
DASHBOARD_SOCIAL
       │
       │ iframe
       ▼
mathh412/mapa
       │
       │
       ├── perímetros
       ├── equipamentos
       └── mapa Leaflet
       ▲
       │
       │ postMessage
       │
DASHBOARD_SOCIAL
       │
       ├── buffers
       ├── setores
       └── filtros
```

---

## Dados censitários

Os arquivos utilizados pela aplicação estão em:

```text
dados/setores/
```

### `setores_sp.geojson`

Malha completa utilizada durante a preparação e validação dos dados.

### `setores_sp_web.geojson`

Versão otimizada para utilização no navegador.

### `indicadores_sp.json`

Indicadores associados aos códigos dos setores censitários.

### `setores_sp_conferencia.csv`

Arquivo auxiliar utilizado para conferência e validação do processamento.

---

## Preparação dos dados

O projeto possui dois scripts Python.

### `preparar_setores.py`

Combina e prepara os dados brutos.

Espera arquivos na pasta:

```text
dados_brutos/
```

Entre as fontes previstas pelo script estão:

```text
malha_2022.xlsx
renda_responsavel.xlsx
ipvs.xlsx
POP_RACA_COR_GENERO_SP.xlsx
```

O processamento considera o município de São Paulo:

```text
Código IBGE: 3550308
```

---

### `otimizar_setores.py`

Cria uma versão otimizada da malha para uso na web.

O script:

- remove geometrias vazias;
- corrige geometrias inválidas;
- reprojeta temporariamente para CRS métrico;
- simplifica os polígonos;
- reduz a precisão das coordenadas;
- gera `setores_sp_web.geojson`.

O CRS métrico utilizado durante o processamento é:

```text
EPSG:31983
```

---

## Dependências Python

Instale com:

```bash
pip install -r requirements.txt
```

Dependências atuais:

```text
pandas
geopandas
shapely
openpyxl
pyogrio
```

---

## Executando localmente

Por utilizar `fetch`, GeoJSON e arquivos JSON externos, execute o projeto através de um servidor HTTP.

Exemplo:

```bash
python -m http.server 8000
```

Depois acesse:

```text
http://localhost:8000
```

Exemplo com filtros:

```text
http://localhost:8000/?pagina=visao-geral&grupo=ceus1
```

---

## Dependência do repositório do mapa

Este projeto depende diretamente de:

```text
mathh412/mapa
```

Os perímetros utilizados pelo dashboard são carregados de:

```text
https://raw.githubusercontent.com/mathh412/mapa/refs/heads/main/grupos/
```

Por isso, nomes de grupos e propriedades dos equipamentos devem permanecer compatíveis entre os dois projetos.

---

## Padrão visual SPP

Cores principais utilizadas no projeto:

```text
Azul SPP:        #00506E
Azul secundário: #3B7D95
Cinza de fundo:  #F2F2F2
Laranja SPP:     #F08200
```

O laranja é utilizado principalmente para destacar os perímetros físicos dos equipamentos.

---

## Deploy

O projeto é compatível com hospedagem estática e pode ser publicado pelo GitHub Pages.

Não há backend obrigatório para a execução do dashboard: os dados são carregados através de arquivos estáticos e dos GeoJSONs publicados no GitHub.

---

## Repositórios relacionados

Mapa:

```text
https://github.com/mathh412/mapa
```

Dashboard:

```text
https://github.com/mathh412/DASHBOARD_SOCIAL
```

---

Projeto desenvolvido para apoiar análises territoriais, sociodemográficas e socioeconômicas de equipamentos e parcerias no Município de São Paulo.