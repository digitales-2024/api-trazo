import { BusinessGet } from '@business/business/business.service';
import {
  bold,
  br,
  cabeceraMembretada,
  FONT,
  p,
  p_n,
  pieDePaginaMembretada,
  spellPricingWithTaxes,
  t,
  twoDecimals,
  ub,
} from '@design-projects/design-projects/utils';
import {
  BudgetDetail,
  Client,
  ExecutionProject,
  Resource,
} from '@prisma/client';
import {
  Packer,
  Document,
  Paragraph,
  HeadingLevel,
  AlignmentType,
  TextRun,
  LevelFormat,
  convertInchesToTwip,
  Table,
  TableRow,
  TableCell,
} from 'docx';
import { roundToTwoDecimals } from '../utils';

const PROPIETARIO = bold('EL PROPIETARIO');
const CONTRATISTA = bold('EL CONTRATISTA');

export async function genExecutionProjectContractDocx({
  project,
  client,
  budgetDetail,
  business,
  signingDate,
  resources,
  firstPaymentPercentage,
}: {
  project: ExecutionProject;
  client: Client;
  budgetDetail: BudgetDetail;
  business: BusinessGet;
  signingDate: Date;
  resources: Array<Resource>;
  firstPaymentPercentage: number;
}): Promise<Buffer> {
  const totalPayment = budgetDetail.totalCost;
  const firstPayment = roundToTwoDecimals(
    totalPayment * firstPaymentPercentage,
  );

  const doc = new Document({
    numbering: {
      config: [
        {
          reference: 'my-numbering',
          levels: [
            {
              level: 0,
              format: LevelFormat.LOWER_LETTER,
              text: '%1)',
              alignment: AlignmentType.START,
              style: {
                paragraph: {
                  indent: {
                    left: convertInchesToTwip(0.2),
                    hanging: convertInchesToTwip(0.19),
                  },
                },
              },
            },
          ],
        },
        {
          reference: 'minuscula-2',
          levels: [
            {
              level: 0,
              format: LevelFormat.LOWER_LETTER,
              text: '%1)',
              alignment: AlignmentType.START,
              style: {
                paragraph: {
                  indent: {
                    left: convertInchesToTwip(0.2),
                    hanging: convertInchesToTwip(0.19),
                  },
                },
              },
            },
          ],
        },
        {
          reference: 'minuscula-3',
          levels: [
            {
              level: 0,
              format: LevelFormat.LOWER_LETTER,
              text: '%1)',
              alignment: AlignmentType.START,
              style: {
                paragraph: {
                  indent: {
                    left: convertInchesToTwip(0.2),
                    hanging: convertInchesToTwip(0.19),
                  },
                },
              },
            },
          ],
        },
        {
          reference: 'enumerado',
          levels: [
            {
              level: 0,
              format: LevelFormat.DECIMAL,
              text: '%1)',
              alignment: AlignmentType.START,
              style: {
                paragraph: {
                  indent: {
                    left: convertInchesToTwip(0.5),
                    hanging: convertInchesToTwip(0.18),
                  },
                },
              },
            },
          ],
        },
      ],
    },
    sections: [
      {
        headers: {
          default: cabeceraMembretada(),
        },
        footers: {
          default: pieDePaginaMembretada(),
        },
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'CONTRATO DE OBRA',
                bold: true,
                font: FONT,
                underline: {},
                color: '#000000',
                size: 22,
              }),
            ],
          }),
          p({}, []),
          p({}, []),
          p({}, []),
          p_n({}, [
            t(
              `Conste por el presente documento el Contrato de Obra que celebran de una parte, ${client.name}, con D.N.I. Nº ${client.rucDni}, con domicilio legal en ${client.address}, Provincia de ${client.province} y Departamento de ${client.department} a quien en adelante se denominará "EL PROPIETARIO”; y la otra parte la empresa Trazo Arq S.A.C. con Ruc 20455937974 y cuyo representante legal es el Sr. ${business.legalRepName}, identificado con DNI N° ${business.legalRepDni}, con domicilio legal en ${business.address}, provincia y departamento de Arequipa, a quien en adelante se denominará "EL CONTRATISTA"; en los términos y condiciones siguientes:`,
            ),
          ]),

          //
          // Clausula primera
          //
          p_n({}, [ub('PRIMERO:'), bold(' ANTECEDENTES')]),
          p_n({}, [
            PROPIETARIO,
            t(
              ` tiene un inmueble ubicado en la tiene un inmueble ubicado en ${project.ubicationProject}, Provincia de ${project.province} y Departamento de ${project.department}.`,
            ),
          ]),
          p_n({}, [
            CONTRATISTA,
            t(
              ` es una persona natural con experiencia y conocimientos en actividades de Construcción Civil y edificaciones, apta para realizar los trabajos requeridos por `,
            ),
            PROPIETARIO,
            t('.'),
            br(),
            CONTRATISTA,
            t(
              ' declara que conoce el inmueble antes descrito, así como el expediente técnico a que se hace referencia en la cláusula siguiente, no encontrando fallas o defectos en el mismo que imposibiliten su ejecución.',
            ),
          ]),

          //
          // Clausula segunda
          //
          p({}, [ub('SEGUNDO:'), bold(' OBLIGACIONES DEL CONTRATISTA')]),
          p_n({}, [
            PROPIETARIO,
            t(
              ` dispone de un terreno ubicado en ${project.ubicationProject}, Provincia de ${project.province} y Departamento de ${project.department}`,
            ),
            br(),
            t('En el terreno descrito '),
            PROPIETARIO,
            t(' tiene proyectado '),
            bold(
              `LA CONSTRUCCION DEL PROYECTO ${project.name}, `.toUpperCase(),
            ),
            t('de acuerdo con el proyecto elaborado para tal fin.'),
          ]),
          p_n({}, [
            CONTRATISTA,
            t(
              ' en virtud del siguiente contrato asume las siguientes obligaciones:',
            ),
          ]),

          p(
            {
              numbering: {
                reference: 'my-numbering',
                level: 0,
              },
              spacing: {
                before: 200,
                line: 300,
              },
            },
            [
              t(
                'La construcción de la obra que específicamente deberá ser ejecutada a favor de ',
              ),
              PROPIETARIO,
              t(
                ', de acuerdo con los documentos del contrato y del expediente técnico.',
              ),
            ],
          ),
          p(
            {
              numbering: {
                reference: 'my-numbering',
                level: 0,
              },
              spacing: {
                line: 300,
              },
            },
            [
              t(
                'Observar los planos y memorias descriptivas de la obra, no pudiendo introducir modificaciones en ellas sin la autorización expresa y por escrito de ',
              ),
              PROPIETARIO,
              t('.'),
            ],
          ),
          p(
            {
              numbering: {
                reference: 'my-numbering',
                level: 0,
              },
              spacing: {
                line: 300,
              },
            },
            [
              t(
                'En los casos de discrepancias entre los planos y las condiciones físicas del terreno o de los planos entre sí, deberá comunicarlos a ',
              ),
              PROPIETARIO,
              t(
                ' la obra para su verificación y para obtener de ellos las soluciones técnicas, administrativas y de costos que se generen.',
              ),
            ],
          ),
          p(
            {
              numbering: {
                reference: 'my-numbering',
                level: 0,
              },
              spacing: {
                line: 300,
              },
            },
            [
              t(
                'Proporcionará la adecuada dirección técnica y de control de las obras, proporcionando la totalidad del equipo de construcción, mano de obra especializada y herramientas necesarias para la normal ejecución de la obra.',
              ),
            ],
          ),
          p(
            {
              numbering: {
                reference: 'my-numbering',
                level: 0,
              },
              spacing: {
                line: 300,
              },
            },
            [
              t(
                'Cumplir con las normas de seguridad propias del riesgo y condiciones peligrosas de trabajo, con las leyes, reglamentos y ordenanzas vigentes, especialmente en cuanto se refiere a las medidas de seguridad y precaución en resguardo de la vida y salud de los obreros.',
              ),
            ],
          ),
          p(
            {
              numbering: {
                reference: 'my-numbering',
                level: 0,
              },
              spacing: {
                line: 300,
              },
            },
            [
              t('Subsanar, sin costo para '),
              PROPIETARIO,
              t(
                ', cualquier deficiencia en la ejecución de los trabajos que sean de su responsabilidad u ocurran por causas imputables al contratista.',
              ),
            ],
          ),
          p(
            {
              numbering: {
                reference: 'my-numbering',
                level: 0,
              },
              spacing: {
                line: 300,
              },
            },
            [
              t(
                'Cumplir con las normas de seguridad propias del riesgo y condiciones peligrosas de trabajo.',
              ),
            ],
          ),
          p(
            {
              numbering: {
                reference: 'my-numbering',
                level: 0,
              },
              spacing: {
                line: 300,
              },
            },
            [
              t(
                'Asumir la responsabilidad prevista en los art. 1783 y 1784 del Código Civil que se pudieran derivar como consecuencia del contrato de obra.',
              ),
            ],
          ),
          p(
            {
              numbering: {
                reference: 'my-numbering',
                level: 0,
              },
              spacing: {
                line: 300,
              },
            },
            [
              t(
                'Destinar o dedicar sus mejores recursos humanos (profesional, técnico y obrero) y de infraestructura (materiales, equipos, maquinarias, herramientas, etc.) eficientemente.',
              ),
            ],
          ),
          p(
            {
              numbering: {
                reference: 'my-numbering',
                level: 0,
              },
              spacing: {
                line: 300,
              },
            },
            [t('Capacitar al personal que labora a su cargo.')],
          ),
          p(
            {
              numbering: {
                reference: 'my-numbering',
                level: 0,
              },
              spacing: {
                line: 300,
              },
            },
            [t('Guiar, organizar y orientar al personal bajo su cargo.')],
          ),
          p(
            {
              numbering: {
                reference: 'my-numbering',
                level: 0,
              },
              spacing: {
                line: 300,
              },
            },
            [
              CONTRATISTA,
              t(' se hace responsable ante '),
              PROPIETARIO,
              t(
                ' por la imposición de sanciones municipales (multas y/o paralizaciones de la obra) en caso de incumplir solo lo estipulado en las ordenanzas municipales.',
              ),
            ],
          ),
          p(
            {
              numbering: {
                reference: 'my-numbering',
                level: 0,
              },
              spacing: {
                line: 300,
              },
            },
            [
              PROPIETARIO,
              t(
                ' es responsable del trámite de licencias de obra y autorizaciones municipales.',
              ),
            ],
          ),
          p(
            {
              numbering: {
                reference: 'my-numbering',
                level: 0,
              },
              spacing: {
                line: 300,
              },
            },
            [
              t('La garantía que otorga '),
              CONTRATISTA,
              t(
                ' se regirá por el Reglamento Nacional de Edificaciones vigente.',
              ),
            ],
          ),

          p_n({}, [
            t('Queda perfectamente entendido que '),
            CONTRATISTA,
            t(
              ' pondrá a disposición de la obra su organización, su experiencia técnica y su capacidad para proporcionar todo el equipo de construcción adecuado, así como los materiales y la mano de obra; necesarios para que la obra encomendada se ejecute hasta el ',
            ),
            bold('CASCO GRIS'),
            t(
              ' de acuerdo con los documentos del contrato y a las normas de ingeniería usualmente empleadas para la correcta ejecución de edificaciones, haciéndose responsable de cualquier eventualidad o circunstancia que derive del incumplimiento de las cualidades antes descritas.',
            ),
          ]),

          //
          // Clausula tercera
          //
          p({}, [ub('TERCERO:'), bold(' OBLIGACIONES DEL PROPIETARIO')]),
          p_n({}, [
            PROPIETARIO,
            t(
              ' es responsable del trámite de licencias de obra y autorizaciones municipales. Facilitar suministro de Agua y otro de Energía para ejecutar la obra.',
            ),
          ]),

          //
          // Clausula cuarta
          //
          p({}, [ub('CUARTA:'), bold(' NATURALEZA DEL CONTRATO DE OBRA')]),
          p_n({}, [
            CONTRATISTA,
            t(
              ' se compromete a prestar servicios bajo la modalidad de Contrato de Obra a suma alzada, de acuerdo con lo dispuesto en los artículos 1771 y siguientes del Código Civil.',
            ),
          ]),
          p_n({}, [
            t(
              'En consecuencia, las partes dejan claramente establecido que la realización de la ',
            ),
            bold('OBRA'),
            t(
              ' materia del presente contrato, es de naturaleza Civil y no implica, en los hechos ni en derecho, ninguna relación laboral entre ',
            ),
            PROPIETARIO,
            t(' y el personal que '),
            CONTRATISTA,
            t(' emplee para la ejecución de la '),
            bold('OBRA'),
            t(
              ' y el personal que éste a su vez utilice o en general cualquier otro personal que labore para ',
            ),
            CONTRATISTA,
            t('.'),
          ]),
          p_n({}, [
            CONTRATISTA,
            t(
              ' será el único responsable por los reclamos y/o acciones legales que pudiese promover el personal dependiente, por cualquier evento o suceso derivado de la ejecución de la Obra materia del presente Contrato.',
            ),
          ]),
          p_n({}, [
            t('Por eso la Contratista libera expresa y definitivamente a '),
            PROPIETARIO,
            t(
              ', de cualquier responsabilidad u obligación que tuviera frente a su personal, poderes estatales, entidades públicas, personas privadas y terceros en general, cualquiera que fuere la naturaleza de la obligación o responsabilidad.',
            ),
          ]),

          //
          // Clausula quinta
          //
          p({}, [ub('QUINTA:'), bold(' ALCANCES')]),
          p_n({}, [
            CONTRATISTA,
            t(
              ' durante el proceso de ejecución de la Obra, deberá considerar el siguiente orden de prioridad para los documentos técnicos antes mencionados:',
            ),
          ]),

          p(
            {
              numbering: {
                reference: 'enumerado',
                level: 0,
              },
              spacing: {
                before: 200,
                line: 300,
              },
            },
            [t('Planos -Listado y sus copias- (Anexo Nª1)')],
          ),
          p(
            {
              numbering: {
                reference: 'enumerado',
                level: 0,
              },
              spacing: {
                line: 300,
              },
            },
            [t('Presupuesto de obra - (Anexo N° 2),')],
          ),
          p(
            {
              numbering: {
                reference: 'enumerado',
                level: 0,
              },
              spacing: {
                line: 300,
              },
            },
            [
              t(
                'Normas Técnicas de construcción, Reglamento Nacional de Construcción y/o Reglamentos correspondientes y',
              ),
            ],
          ),
          p(
            {
              numbering: {
                reference: 'enumerado',
                level: 0,
              },
              spacing: {
                after: 200,
                line: 300,
              },
            },
            [t('Las Normas de la buena práctica de la construcción.')],
          ),

          p_n({}, [
            t(
              'Cualquier modificación a los Alcances y/o Especificaciones Técnicas durante la ejecución de la Obra, tendrá que ser aprobada por ',
            ),
            PROPIETARIO,
            t(', Y comunicado por escrito a '),
            CONTRATISTA,
            t(', antes de su ejecución.'),
            br(),
            t(
              'Cabe precisar la definición de los alcances de los procesos constructivos para Casco Gris, como una etapa donde se concluye con el revoque de las superficies, nivelación y vaciados de contrapisos según especificaciones del proyecto, precisando que no incluye adquisición e instalación de carpintería metálica de nivel acabados y que no esté considerada y detallada en presupuesto de obra; adquisición de accesorios sanitarios (en el caso de las mezcladoras para duchas no corresponde al Contratista la Adquisición de dichos accesorios); accesorios y cableado eléctrico.',
            ),
          ]),
          p_n({}, [t('Se debe precisar el uso de los siguientes materiales:')]),

          ...resources.map((r) =>
            p({ bullet: { level: 0 }, spacing: {} }, [t(r.name)]),
          ),

          //
          // Clausula sexta
          //
          p({}, [ub('SEXTA:'), bold(' DE LA RETRIBUCIÓN, VALORIZACIONES')]),
          p_n({}, [
            t('La retribución fijada por mutuo acuerdo que le corresponde a '),
            CONTRATISTA,
            t(` asciende a la suma de `),
            bold(
              `S/. ${twoDecimals(totalPayment)} (${spellPricingWithTaxes(totalPayment)})`,
            ),
            t(` incluido el 18 % del impuesto general a las ventas.`),
          ]),
          p_n({}, [
            t(
              'Queda expresamente convenido entre las partes que la suma estipulada cubre la total y satisfactoria ejecución de la obra. La referida suma incluye los materiales, mano de obra, el uso y/o alquiler de los equipos y herramientas de construcción, maquinarias, dirección técnica, gastos de administración, leyes sociales, seguros inherentes, indemnizaciones, gastos generales y utilidad del contratista y todos aquellos otros costos a que hubiese lugar hasta la total conclusión del ',
            ),
            bold('CASCO GRIS.'),
          ]),
          p_n({}, [
            t('Los pagos a '),
            CONTRATISTA,
            t(' serán efectuados de la manera siguiente:'),
            br(),
            PROPIETARIO,
            t(' a solicitud de '),
            CONTRATISTA,
            t(' realizara el pago de una inicial correspondiente al monto de '),
            bold(
              `S/. ${twoDecimals(firstPayment)} (${spellPricingWithTaxes(firstPayment)}) y los demás pagos se realizarán quincenalmente según presentación de valorización al avance de obra y se entregara un recibo de recepción.`,
            ),
          ]),
          p_n({}, [
            PROPIETARIO,
            t(
              ' podrá adicionalmente adelantar hasta un 50% del valor del pago calendarizado para la compra especifica de materiales, previa verificación del avance de obra de ',
            ),
            PROPIETARIO,
            t(
              ', con la finalidad de optimizar los tiempos de ejecución de las partidas involucradas.',
            ),
          ]),

          //
          // Clausula setima
          //
          p({}, [ub('SETIMA:'), bold(' PLAZO DE EJECUCION DE LA OBRA')]),
          p_n({}, [
            t(
              `El plazo de ejecución de la obra será de ${project.executionTime} DÍAS HÁBILES, contados a partir de los 7 días de completada la entrega de la información por parte de `,
            ),
            PROPIETARIO,
            t(':'),
          ]),

          p(
            {
              numbering: {
                reference: 'minuscula-2',
                level: 0,
              },
              spacing: {
                line: 300,
              },
            },
            [
              t(
                'Que haya hecho entrega del Terreno o zona que se trabajará mediante un acta de entrega.',
              ),
            ],
          ),

          p_n({}, [
            t('La OBRA será entregada a '),
            PROPIETARIO,
            t(
              ' mediante Acta de Conformidad y se tendrá como plazo 1/10 del plazo de ejecución por levantamiento de observaciones coordinado junto con ',
            ),
            PROPIETARIO,
            t(
              ' para el levantamiento de observaciones sin incurrir en penalidades de tiempo. El periodo de Garantía de ',
            ),
            CONTRATISTA,
            t(
              ' sobre defectos o fallas que se presente en las obras luego de recibida sin observaciones será de cinco (5) años.',
            ),
          ]),

          //
          // Clausula octava
          //
          p({}, [
            ub('OCTAVA:'),
            bold(' PLANOS, ESPECIFICACIONES E INFORMACION TECNICA.'),
          ]),
          p_n({}, [
            CONTRATISTA,
            t(
              ' mantendrá en correcto estado de conservación en el lugar de la obra y a disposición de ',
            ),
            PROPIETARIO,
            t(
              ' y/o Supervisor los documentos en el momento en que éstos sean requeridos.',
            ),
          ]),
          p_n({}, [
            PROPIETARIO,
            t(' hará entrega a '),
            CONTRATISTA,
            t(
              ' de un juego de planos con la última revisión, debidamente suscritos por el Representante como ',
            ),
            bold('"Aprobado para Construcción"'),
            t(
              '. Si durante el desarrollo de la Obra y el Proyecto algunos de estos planos fueran revisados, se volverá a hacer una nueva emisión formal y oportuna de dichos planos, para que ',
            ),
            CONTRATISTA,
            t(' ejecute la obra de acuerdo con la última revisión efectuada.'),
          ]),
          p_n({}, [
            t('Si '),
            CONTRATISTA,
            t(
              ' advirtiese errores, omisiones o discrepancias en los documentos del Contrato y/o en las mediciones de la Obra y/o vicios ocultos, los hará conocer a la brevedad posible por escrito a ',
            ),
            PROPIETARIO,
            t(
              ', quien resolverá dentro de los 3 días de recepcionada la observación, lo solicitado por ',
            ),
            CONTRATISTA,
            t('.'),
          ]),

          //
          // Clausula novena
          //
          p({}, [ub('NOVENA:'), bold(' MODIFICACIONES DE OBRA')]),
          p_n({}, [
            PROPIETARIO,
            t(
              ' sin invalidar el contrato, podrá mediante adiciones y reducciones cambiar el trabajo y otras alteraciones de dicho trabajo siempre y cuando estos no atenten contra la normativa vigente y deberán hacerse previa coordinación con el profesional proyectista. Todo trabajo adicional será ejecutado bajo las condiciones y términos originales de los documentos del contrato, excepto los ajustes del monto y los plazos de ejecución, los mismos que serán definidos de mutuo acuerdo entre ',
            ),
            PROPIETARIO,
            t(' y '),
            CONTRATISTA,
            t('.'),
          ]),
          p_n({}, [
            t(
              'Sin embargo, lo anterior no afectara el derecho de la residencia de obra de ordenar cambios menores durante el curso del trabajo que no impliquen costos adicionales.',
            ),
          ]),
          p_n({}, [
            t(
              'Cualquier presupuesto adicional por concepto de modificaciones u obra nueva, que signifiquen un mayor gasto sobre la suma total materia del presente será presentada por ',
            ),
            CONTRATISTA,
            t(' a '),
            PROPIETARIO,
            t(
              ' para su aprobación y provisión de fondos necesarios antes de su ejecución de ser el caso. Si en el plazo de cinco días calendarios después de la presentación ',
            ),
            CONTRATISTA,
            t(
              ' no es avisado de la aprobación de su presupuesto adicional, deberá proseguir los trabajos con arreglo al presupuesto originalmente aprobado.',
            ),
          ]),

          //
          // Clausula decima
          //
          p({}, [ub('DECIMO:'), bold(' RESOLUCION DEL CONTRATO')]),
          p_n({}, [
            t('Si '),
            CONTRATISTA,
            t(
              ' incumpliese injustificadamente los plazos de iniciación o ejecución de la obra, si paralizase total o parcialmente los trabajos o redujese injustificadamente el ritmo de este, o si disminuyese su capacidad económica o técnica para la normal continuación de los trabajos, o fuese declarada su insolvencia, quiebra o concurso de sus acreedores; ',
            ),
            PROPIETARIO,
            t(' podra dar a '),
            CONTRATISTA,
            t(
              ' quince días calendarios de preaviso por escrito para regularizar la situación. Si esto último no ocurriese, ',
            ),
            PROPIETARIO,
            t(
              ' podrá ordenar la inmediata suspensión de los trabajos y declarar automáticamente resuelto el contrato, sin necesidad de declaración judicial alguna, para lo cual bastara una carta notarial de ',
            ),
            PROPIETARIO,
            t(' a '),
            CONTRATISTA,
            t('.'),
          ]),
          p_n({}, [
            t(
              'Si se produjese la resolución del contrato se procederá a valorizar los trabajos realizados para determinar si la cantidad de trabajo compensa los pagos realizados hasta la presentación de la carta y se cancelara la diferencia a quien corresponda.',
            ),
            br(),
            t('Lo expuesto en la presente clausula no impide el derecho de '),
            PROPIETARIO,
            t(
              ' a interponer las acciones judiciales correspondientes, para ordenar el pago de la indemnización por los daños y perjuicios que ',
            ),
            CONTRATISTA,
            t(' hubiera causado con el incumplimiento.'),
            br(),
            CONTRATISTA,
            t(' podrá solicitar la resolución del contrato cuando:'),
          ]),

          p(
            {
              numbering: {
                reference: 'minuscula-3',
                level: 0,
              },
              spacing: {
                before: 200,
                line: 300,
              },
            },
            [
              t(
                'Resulte imposible la ejecución de la obra conforme al expediente técnico.',
              ),
            ],
          ),
          p(
            {
              numbering: {
                reference: 'minuscula-3',
                level: 0,
              },
              spacing: {
                line: 300,
              },
            },
            [
              t(
                'Cuando se le adeuden más de 02 pagos de acuerdo con el cronograma de desembolsos.',
              ),
            ],
          ),

          //
          // Clausula undecima
          //
          p({}, [ub('DECIMO PRIMERA:'), bold(' JURISDICCION')]),
          p_n({}, [
            t(
              'Las partes convienen en establecer que toda controversia que surja a partir de la celebración del presente contrato de construcción, incluso las relativas a su eficacia (nulidad, anulabilidad, resolución y rescisión) serán resueltas en vía arbitral, por árbitro único, conforme a las reglas que se detallan a continuación y supletoriamente por lo dispuesto en el D. Legislativo que regula el Arbitraje.',
            ),
          ]),
          p_n({}, [
            t(
              'Las partes convienen en establecer que el arbitraje pactado será de derecho y de instancia única, por lo que el Laudo será inapelable',
            ),
          ]),
          p_n({}, [
            t(
              'Las partes convienen en designar un árbitro en su oportunidad, quien estará facultado a designar secretario arbitral, sede y otros.',
            ),
          ]),
          p_n({}, [
            t(
              'En caso de controversia, cualquiera de las partes solicitará Arbitraje a la otra poniendo en conocimiento de dicha solicitud de mutuo acuerdo o por el Colegio de Ingenieros un Árbitro designado quien convocará a la Instalación en un plazo de cinco días hábiles.',
            ),
          ]),
          p_n({}, [
            t(
              'Instalado el Tribunal unipersonal se otorgará a la parte solicitante un plazo de cinco días para que presente su demanda y pague los honorarios y gastos arbitrales en la proporción que corresponda. El Árbitro calificará la demanda y correrá traslado de esta a la parte demandada por el plazo de cinco días y en la misma resolución citará a audiencia única. La parte demandada al presentar su contestación deberá acreditar el pago de los honorarios y gastos arbitrales.',
            ),
          ]),
          p_n({}, [
            t(
              'Las excepciones, defensas previas y cuestiones probatorias serán propuestas y absueltas en la audiencia y sólo se admitirá prueba documental para estos medios de defensa',
            ),
          ]),
          p_n({}, [
            t(
              'En la audiencia única se resolverá el saneamiento del proceso, se invitará a las partes a que concilien la controversia, de no llegarse a ningún acuerdo se fijarán los puntos controvertidos, se admitirán los medios probatorios y se actuarán los mismos. Concluida la actuación de los medios probatorios se concederá a las partes su derecho a informar oralmente y se fijará plazo para Laudar, el mismo que no podrá exceder de 05 días.',
            ),
          ]),
          p_n({}, [
            t(
              'Las partes convienen en establecer que entre la fecha de instalación y la notificación del Laudo no deberán mediar más de 30 días hábiles.',
            ),
          ]),
          p_n({}, [
            t(
              'Las partes dejan establecido que en caso una de las partes no cumpla con el pago de los honorarios y gastos arbitrales, éstos podrán ser asumidos por la otra parte. En este caso, la parte rebelde al pago será condenada al pago de costas y costos más el 50% de dichos conceptos como penalidad.',
            ),
          ]),
          p_n({}, [
            t(
              'Las partes dejan establecido que el plazo para Laudar y concluir el Arbitraje se encuentra automáticamente suspendido mientras no se cancele los honorarios y gastos arbitrales',
            ),
          ]),
          p_n({}, [
            t(
              'Contra el laudo arbitral sólo podrán interponerse pedidos de aclaración, interpretación, integración y exclusión en un plazo de tres días de notificado el Laudo. Este recurso deberá ser puesto en conocimiento de la otra parte por el plazo de tres días y Resuelto en el plazo de cinco días después de absuelto el traslado o de vencido el plazo.',
            ),
          ]),
          p_n({}, [
            t(
              'Las partes convienen en establecer que el Árbitro designado tendrá facultades de ejecución de Laudo salvo que se requiera del auxilio de la fuerza pública, en cuyo caso se solicitará la intervención del poder judicial conforme a Ley. Las partes dejan establecido que el Árbitro se encuentra facultado a dictar medidas cautelares las que se resolverán en un plazo de cinco días de solicitadas y se pondrán en conocimiento de la contraparte después de su ejecución.',
            ),
          ]),

          //
          // Clausula duodecima
          //
          p({}, [ub('DECIMO SEGUNDA:'), bold(' RECEPCIÓN DE LA OBRA')]),
          p_n({}, [
            CONTRATISTA,
            t(' solicitará por escrito a '),
            PROPIETARIO,
            t(
              ', la aprobación y recepción de la obra cuando esta se encuentre concluida de acuerdo con las partidas detalladas en el presupuesto y a las 48 horas se dará inicio a la recepción de los trabajos.',
            ),
          ]),

          //
          // Clausula decimotercera
          //
          p({}, [ub('DECIMO TERCERA:'), bold(' DOMICILIO')]),
          p_n({}, [
            t(
              'Los intervinientes en este contrato señalan como sus domicilios los indicados en el primer párrafo de este instrumento, donde se tendrán por válidas y bien hechas todas las comunicaciones a que hubiese lugar.',
            ),
          ]),
          p_n({}, [
            t(
              'Cualquier cambio domiciliario, para que surta efecto, deberá ser comunicado a la otra parte dentro de los diez días calendarios de ocurrido, debiendo el nuevo domicilio estar ubicado dentro de la jurisdicción de Arequipa.',
            ),
          ]),
          p_n({}, [
            t(
              `Suscrito en Arequipa, el ${signingDate.toLocaleDateString(
                'es-PE',
                {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  timeZone: 'America/Lima',
                },
              )}, en dos (2) ejemplares de idéntico tenor, en señal de conformidad con todos los términos que anteceden.`,
            ),
          ]),
          p({}, [t('')]),
          p({}, [t('')]),
          p({}, [t('')]),
          p({}, [t('')]),
          signatures(),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}

function signatures(): Table {
  return new Table({
    width: {
      size: 9638,
      type: 'dxa', // total page width is 9638 DXA for A4 portrait
    },
    borders: {
      left: {
        size: 0,
        color: '#000000',
        style: 'none',
      },
      right: {
        size: 0,
        color: '#000000',
        style: 'none',
      },
      top: {
        size: 0,
        color: '#000000',
        style: 'none',
      },
      bottom: {
        size: 0,
        color: '#000000',
        style: 'none',
      },
    },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            borders: {
              left: {
                size: 0,
                color: '#000000',
                style: 'none',
              },
              right: {
                size: 0,
                color: '#000000',
                style: 'none',
              },
              top: {
                size: 0,
                color: '#000000',
                style: 'none',
              },
              bottom: {
                size: 0,
                color: '#000000',
                style: 'none',
              },
            },
            width: {
              size: 4819,
              type: 'dxa', // total page width is 9638 DXA for A4 portrait
            },
            children: [
              p(
                {
                  alignment: AlignmentType.CENTER,
                },
                [
                  bold('_________________________________'),
                  new TextRun({
                    text: 'EL PROPIETARIO',
                    bold: true,
                    font: FONT,
                    break: 1,
                  }),
                ],
              ),
            ],
          }),
          new TableCell({
            borders: {
              left: {
                size: 0,
                color: '#000000',
                style: 'none',
              },
              right: {
                size: 0,
                color: '#000000',
                style: 'none',
              },
              top: {
                size: 0,
                color: '#000000',
                style: 'none',
              },
              bottom: {
                size: 0,
                color: '#000000',
                style: 'none',
              },
            },
            width: {
              size: 4819,
              type: 'dxa', // total page width is 9638 DXA for A4 portrait
            },
            children: [
              p(
                {
                  alignment: AlignmentType.CENTER,
                },
                [
                  bold('_________________________________'),
                  new TextRun({
                    text: 'EL CONTRATISTA',
                    bold: true,
                    font: FONT,
                    break: 1,
                  }),
                ],
              ),
            ],
          }),
        ],
      }),
    ],
  });
}
