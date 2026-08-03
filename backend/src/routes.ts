import { Express } from 'express';
import * as handlers from './handlers';
import { MetricsRepository } from './repositories/metrics';

/**
 * @openapi
 * components:
 *   parameters:
 *     municipality:
 *       name: municipality
 *       in: query
 *       required: false
 *       schema: { type: string }
 *       description: Nome do município
 *     year:
 *       name: year
 *       in: query
 *       required: false
 *       schema: { type: integer }
 *       description: Ano exato (tem prioridade sobre `startYear`/`endYear`)
 *     startYear:
 *       name: startYear
 *       in: query
 *       required: false
 *       schema: { type: integer }
 *       description: Ano inicial do intervalo
 *     endYear:
 *       name: endYear
 *       in: query
 *       required: false
 *       schema: { type: integer }
 *       description: Ano final do intervalo
 *     network:
 *       name: network
 *       in: query
 *       required: false
 *       schema:
 *         type: string
 *         enum:
 *           - Estadual
 *           - Municipal
 *           - Federal
 *           - Privada
 *           - Pública
 *           - Total
 *           - Não se aplica
 *       description: Rede de ensino
 *     level:
 *       name: level
 *       in: query
 *       required: false
 *       schema:
 *         type: string
 *         enum:
 *           - Educação Infantil
 *           - Ensino Fundamental
 *           - Ensino Médio
 *           - Educação de Jovens e Adultos (EJA)
 *           - Educação Profissional
 *           - Pessoas de 15 anos ou mais de idade
 *       description: Etapa de ensino
 *     variable:
 *       name: variable
 *       in: query
 *       required: false
 *       schema:
 *         type: string
 *         enum:
 *           - Escolas
 *           - Matrícula
 *           - Taxa de Aprovação
 *           - Taxa de Reprovação
 *           - Taxa de Abandono
 *           - Pessoas Alfabetizadas
 *           - Pessoas Total
 *           - Taxa de Alfabetização
 *           - Taxa de Analfabetismo
 *       description: Variável
 */

export function registerRoutes(app: Express, repo: MetricsRepository) {
  /**
   * @openapi
   * /api/healthcheck:
   *   get:
   *     tags: [Sistema]
   *     summary: Verifica se a API está operacional
   *     responses:
   *       '200':
   *         description: API operacional
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 data:
   *                   type: object
   *                   properties:
   *                     status:
   *                       type: string
   *                       example: ok
   */
  app.get('/api/healthcheck', handlers.healthcheck);

  /**
   * @openapi
   * /api/upload:
   *   post:
   *     tags: [Dados]
   *     summary: Importa um arquivo CSV de métricas
   *     description: O arquivo é validado em streaming. Linhas inválidas são rejeitadas
   *       e retornadas no corpo da resposta, sem interromper a importação das válidas.
   *     requestBody:
   *       required: true
   *       content:
   *         multipart/form-data:
   *           schema:
   *             type: object
   *             required: [file]
   *             properties:
   *               file:
   *                 type: string
   *                 format: binary
   *     responses:
   *       '200':
   *         description: Importação concluída (parcialmente ou não)
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 data:
   *                   type: object
   *                   properties:
   *                     read:
   *                       type: integer
   *                     imported:
   *                       type: integer
   *                     rejectedRows:
   *                       type: array
   *                       items:
   *                         type: object
   *                         properties:
   *                           line:
   *                             type: integer
   *                             description: Número da linha no arquivo
   *                           raw:
   *                             type: object
   *                             additionalProperties:
   *                               type: string
   *                             description: Valores brutos da linha
   *                           errors:
   *                             type: array
   *                             items:
   *                               type: string
   *       '400':
   *         description: Erro de validação do arquivo
   */
  app.post('/api/upload', handlers.upload(repo));

  /**
   * @openapi
   * /api/drop:
   *   post:
   *     tags: [Dados]
   *     summary: Apaga todos os registros do banco de dados
   *     responses:
   *       '200':
   *         description: Banco esvaziado
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 data:
   *                   type: object
   *                   properties:
   *                     deleted:
   *                       type: boolean
   *                       example: true
   */
  app.post('/api/drop', handlers.drop(repo));

  /**
   * @openapi
   * /api/filters:
   *   get:
   *     tags: [Dados]
   *     summary: Lista as opções disponíveis para cada filtro
   *     responses:
   *       '200':
   *         description: Opções de filtro
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 data:
   *                   type: object
   *                   properties:
   *                     municipalities:
   *                       type: array
   *                       items:
   *                         type: string
   *                     years:
   *                       type: array
   *                       items:
   *                         type: integer
   *                     networks:
   *                       type: array
   *                       items:
   *                         type: string
   *                     levels:
   *                       type: array
   *                       items:
   *                         type: string
   *                     variables:
   *                       type: array
   *                       items:
   *                         type: string
   */
  app.get('/api/filters', handlers.listFilters(repo));

  /**
   * @openapi
   * /api/data:
   *   get:
   *     tags: [Dados]
   *     summary: Lista paginada de registros
   *     parameters:
   *       - name: size
   *         in: query
   *         required: false
   *         schema: { type: integer, default: 20 }
   *       - name: page
   *         in: query
   *         required: false
   *         schema: { type: integer, default: 1 }
   *       - $ref: '#/components/parameters/municipality'
   *       - $ref: '#/components/parameters/year'
   *       - $ref: '#/components/parameters/startYear'
   *       - $ref: '#/components/parameters/endYear'
   *       - $ref: '#/components/parameters/network'
   *       - $ref: '#/components/parameters/level'
   *       - $ref: '#/components/parameters/variable'
   *     responses:
   *       '200':
   *         description: Página de registros
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 data:
   *                   type: object
   *                   properties:
   *                     size:
   *                       type: integer
   *                     offset:
   *                       type: integer
   *                     data:
   *                       type: array
   *                       items:
   *                         type: object
   *       '400':
   *         description: Parâmetros de consulta inválidos
   */
  app.get('/api/data', handlers.listData(repo));

  /**
   * @openapi
   * /api/indicators:
   *   get:
   *     tags: [Indicadores]
   *     summary: Retorna os indicadores agregados (matrículas, ofertas e aprovação média)
   *     parameters:
   *       - $ref: '#/components/parameters/municipality'
   *       - $ref: '#/components/parameters/year'
   *       - $ref: '#/components/parameters/startYear'
   *       - $ref: '#/components/parameters/endYear'
   *       - $ref: '#/components/parameters/network'
   *       - $ref: '#/components/parameters/level'
   *       - $ref: '#/components/parameters/variable'
   *     responses:
   *       '200':
   *         description: Indicadores
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 data:
   *                   type: object
   *                   properties:
   *                     enrollments:
   *                       type: integer
   *                       nullable: true
   *                     offers:
   *                       type: integer
   *                       nullable: true
   *                     averageApproval:
   *                       type: number
   *                       nullable: true
   *       '400':
   *         description: Parâmetros de consulta inválidos
   */
  app.get('/api/indicators', handlers.indicators(repo));

  /**
   * @openapi
   * /api/series:
   *   get:
   *     tags: [Indicadores]
   *     summary: Série temporal de um valor agregado por ano
   *     parameters:
   *       - $ref: '#/components/parameters/municipality'
   *       - $ref: '#/components/parameters/year'
   *       - $ref: '#/components/parameters/startYear'
   *       - $ref: '#/components/parameters/endYear'
   *       - $ref: '#/components/parameters/network'
   *       - $ref: '#/components/parameters/level'
   *       - $ref: '#/components/parameters/variable'
   *     responses:
   *       '200':
   *         description: Série temporal
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       year:
   *                         type: integer
   *                       value:
   *                         type: number
   *                         nullable: true
   *       '400':
   *         description: Parâmetros de consulta inválidos
   */
  app.get('/api/series', handlers.series(repo));

  /**
   * @openapi
   * /api/ranking:
   *   get:
   *     tags: [Indicadores]
   *     summary: Ranking dos municípios pela média de uma variável
   *     parameters:
   *       - name: limit
   *         in: query
   *         required: false
   *         schema: { type: integer, default: 10 }
   *       - $ref: '#/components/parameters/municipality'
   *       - $ref: '#/components/parameters/year'
   *       - $ref: '#/components/parameters/startYear'
   *       - $ref: '#/components/parameters/endYear'
   *       - $ref: '#/components/parameters/network'
   *       - $ref: '#/components/parameters/level'
   *       - $ref: '#/components/parameters/variable'
   *     responses:
   *       '200':
   *         description: Ranking de municípios
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       municipalityName:
   *                         type: string
   *                       value:
   *                         type: number
   *                         nullable: true
   *       '400':
   *         description: Parâmetros de consulta inválidos
   */
  app.get('/api/ranking', handlers.ranking(repo));

  /**
   * @openapi
   * /api/breakdown:
   *   get:
   *     tags: [Indicadores]
   *     summary: Quebra do valor agregado por rede de ensino
   *     parameters:
   *       - $ref: '#/components/parameters/municipality'
   *       - $ref: '#/components/parameters/year'
   *       - $ref: '#/components/parameters/startYear'
   *       - $ref: '#/components/parameters/endYear'
   *       - $ref: '#/components/parameters/network'
   *       - $ref: '#/components/parameters/level'
   *       - $ref: '#/components/parameters/variable'
   *     responses:
   *       '200':
   *         description: Valores por rede
   *         content:
   *           application/json:
   *             schema:
   *               type: object
   *               properties:
   *                 status:
   *                   type: string
   *                   example: success
   *                 data:
   *                   type: array
   *                   items:
   *                     type: object
   *                     properties:
   *                       schoolNetwork:
   *                         type: string
   *                       value:
   *                         type: number
   *       '400':
   *         description: Parâmetros de consulta inválidos
   */
  app.get('/api/breakdown', handlers.breakdown(repo));
}
