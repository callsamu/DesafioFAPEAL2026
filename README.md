# Desafio FAPEAL 

O repositório implementa uma aplicação web para visualização de dados públicos de educação dos municípios de Alagoas, 
realizando agregação  e filtragem no backend, que provê uma API REST consumida pelo frontend em uma dashboard com cards de 
indicadores, gráficos, e uma tabela paginada.

O upload é de dados é feito por um arquivo CSV, o qual é parseado e validado em streaming no servidor, e toda a agregação — somas, médias ponderadas, rankings, séries temporais — é feita no PostgreSQL. A aplicação foi desenvolvida para carregar a base completa (145 mil linhas, 102 municípios, 2007–2025) em lotes, não só a amostra inicial.

## Rodando

O repositório tem dois projetos npm independentes — `backend/` (Express + Drizzle) e `frontend/` (Vite + React) — e um `docker-compose` que sobe a stack inteira.

### Pré-requisitos
- Docker e Docker Compose (forma recomendada — sobe banco, backend e frontend)
- Node.js 20+ (apenas para desenvolvimento sem Docker ou para rodar os testes)

### 1. Variáveis de ambiente

A stack via Docker lê o `.env` da raiz do repositório:

```bash
cp .env.example .env
```

| Variável | Descrição |
|---|---|
| `DB_USER` | Usuário do PostgreSQL |
| `DB_PASSWORD` | Senha do PostgreSQL |
| `DB_NAME` | Nome do banco |

### 2. Subindo a stack completa (recomendado)

```bash
docker compose up -d --build
```

Isso inicia três serviços:

| Serviço | Descrição | Endereço |
|---|---|---|
| `db` | PostgreSQL 16 (dados em tmpfs em dev) | `localhost:5433` |
| `backend` | API Express com live reload (`tsx watch`) | `http://localhost:3000` |
| `frontend` | Vite dev server com HMR | `http://localhost:5173` |

As migrations do Drizzle são aplicadas automaticamente no boot do backend, e os diretórios `backend/src` e `frontend/src` são montados com bind mount para recarregar a cada alteração.

### 3. Desenvolvimento sem Docker

É necessário um PostgreSQL acessível localmente e configurar as variáveis de cada projeto:

```bash
# Backend (terminal 1)
cd backend
cp .env.example .env
npm install
npm run dev        # http://localhost:3000

# Frontend (terminal 2)
cd frontend
cp .env.example .env
npm install
npm run dev        # http://localhost:5173
```

Variáveis do backend (`backend/.env`):

| Variável | Descrição | Exemplo |
|---|---|---|
| `DB_HOST` | Host do PostgreSQL | `localhost` |
| `DB_PORT` | Porta do PostgreSQL | `5432` |
| `DB_USER` | Usuário do banco | `postgres` |
| `DB_PASSWORD` | Senha do banco | `postgres` |
| `DB_NAME` | Nome do banco | `educacao_al` |
| `PORT` | Porta da API Express | `3000` |
| `CORS_ORIGIN` | Origem permitida no CORS | `*` |

Variável do frontend (`frontend/.env`):

| Variável | Descrição | Exemplo |
|---|---|---|
| `VITE_API_URL` | URL da API consumida pelo front | `http://localhost:3000/api` |

### 4. Migrations

As migrations são aplicadas automaticamente ao iniciar o backend (`migrate()` no boot). Para gerar uma nova migration a partir do schema:

```bash
cd backend
npx drizzle-kit generate
```

### 5. Testes

```bash
cd backend
npm test
```

### 6. Build e produção

O Dockerfile do backend tem os stages `development`, `build` e `production`; o do frontend usa nginx no stage `production`:

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --build
```

| Serviço | Endereço |
|---|---|
| `backend` | `http://localhost:3000` |
| `frontend` (nginx) | `http://localhost:5173` |


## Decisões sobre o tratamento de dados

1. **Hierarquia de Redes:** Na API, quando o filtro de rede não é especificado pelo usuário, o backend aplica `ensino_rede = 'Total`` por padrão em vez de somar todas as sub-redes. Quaisquer outras opções são tratadas como um filtro exclusivo, e o dropdown de seleção sempre
seleciona uma única opção 

2. **`ensino_tipo` na variável Escolas:** O card e os gráficos que envolvem a variável "Escolas" fixam uma etapa por vez (padrão: Ensino Fundamental), assim, o nível de ensino deve ser sempre fixado. Assim como no dropdown de redes de ensino, uma única opção é sempre selecionada

3. **Médias de Taxas:** A taxa agregada no indicador do card **média ponderada por matrículas**. Nos demais dados, é feita uma média simples, caso contrário, um tratamento de dados mais complexo seria necessário (VER ITEM 8).

4. **Reimportação de arquivo:** Cada upload gera um registro em uma tabela `batches`, que associa cada conjunto de dados a um upload
específico. Dessa forma, os dados se acumulam, porém, podem ser facilmente deletados pelo usuário no dashboard. Essa estratégia
de implementação foi escolhida por sua flexibilidade: é simples modificar o código para apenas substituir os dados, assim como
também se torna viável uma acumulação de dados sem duplicação (o se mostra o principal problema de permitir vários uploads) em
versões posteriores. Uploads individuais também poderiam ser trivialmente removidos.

5. **Ausência de Dado:** ausência de linha é representada como `null` em toda a cadeia — banco, API, front —, nunca convertida para `0`. A interface exibe "sem dado para este período" nesses casos. A lista de anos disponíveis é obtida dinamicamente via `GET /api/filtros`, nunca fixada no código.

6. **Combinações de dimensões inexistentes:** uma combinação de dimensões inexistentes é invalidada pelo backend, e no caso
de taxas demográficas, impossibilitada pelo formulário de filtros (ex: ao selecionar uma variável demográfica, a rede é automaticamente
configurada para 'Não se aplica' e o nível de ensino para 'Pessoas de 15 anos ou mais')

7. **Valores Nulos Nas Séries Temporais:*** séries temporais são construídas com `generate_series` cobrindo todo o intervalo de anos existente no banco, com `LEFT JOIN` contra os dados — anos sem linha voltam como `null`, e o gráfico desenha uma quebra na linha (`connectNulls={false}`) em vez de um vale artificial.

8. **Agregações nos Gráficos:** Todos os gráficos precisam realizar alguma forma de agregação para seus dados correspondentes.
Isso porque eles não fixam um parâmetro como município (série temporal) ou ano (ranking). Assim decidiu-se que o gráfico de série
realiza uma soma (ou média simples se foi selecionada uma taxa) de todos valores absolutos entre municípios para cada ano,
o ranking faz uma média dos anos para cada município, e a quebra repete o processo da série temporal. A média simples foi escolhida
porque não só uma lógica complexa de média ponderada teria que ser acrescentada a cada query, como também algum critério para
decidir por qual parâmetro pesaria na média, pois afinal, matrículas, como utilizado no indicador e no exemplo, não faria
sentido para taxa de analfabetismo, por exemplo. 


## O Que Faltou

- Mapa coroplético, não implementado por falta de tempo.
- Escolas individuais como pontos no mapa (seção 8.2) — não implementado; exigiria base externa do INEP não coberta pelo CSV fornecido.
- Documentação da API
- Pipeline de CI/CD
- Deploy

## Diferenciais implementados

- Validação pela biblioteca Zod
- Teste unitários
- Processamento de arquivos em streaming
- Uso do drizzle como query builder 

## Tempo Gasto e Dificuldades Enfrentadas

O projeto demorou a semana inteira para ser desenvolvido até este ponto, levando em torno de 20 horas. 
As maior dificuldade foi justamente o prazo: o projeto foi iniciado com o parser seguindo TDD e sem
uso de ferramentas de IA, contudo, à medida que o prazo encurtou-se, foi necessário retirar
a prioridade dos testes e empregar o Opencode para acelerar o processo. Com mais tempo, antes de novos
recursos como o mapa coroplético, a interface de usuário seria mais refinada, o sistema contaria com mais 
testes a fim de encontrar e corrigir apropiadamente quaisquer edge cases que possam existir ainda.

