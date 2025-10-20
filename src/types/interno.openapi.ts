/**
 * @openapi
 * components:
 *   schemas:
 *     Interno:
 *       type: object
 *       properties:
 *         _id:
 *           type: string
 *         nome:
 *           type: string
 *         funcao:
 *           type: string
 *         status:
 *           type: string
 *           enum: [remunerado, remicao]
 *         dataAdmissao:
 *           type: string
 *           format: date-time
 *         unidade:
 *           type: string
 *         dataDesligamento:
 *           type: string
 *           format: date-time
 *         motivoDesligamento:
 *           type: string
 *     InternoCreate:
 *       type: object
 *       required: [nome, funcao, status, dataAdmissao, unidade]
 *       properties:
 *         nome:
 *           type: string
 *         funcao:
 *           type: string
 *         status:
 *           type: string
 *           enum: [remunerado, remicao]
 *         dataAdmissao:
 *           type: string
 *           format: date-time
 *         unidade:
 *           type: string
 *     InternoUpdate:
 *       type: object
 *       properties:
 *         nome:
 *           type: string
 *         funcao:
 *           type: string
 *         status:
 *           type: string
 *           enum: [remunerado, remicao]
 *         dataAdmissao:
 *           type: string
 *           format: date-time
 *         unidade:
 *           type: string
 *         dataDesligamento:
 *           type: string
 *           format: date-time
 *         motivoDesligamento:
 *           type: string
 */
