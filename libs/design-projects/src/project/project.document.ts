import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
  Header,
  ImageRun,
  HorizontalPositionRelativeFrom,
  VerticalPositionRelativeFrom,
} from 'docx';
import { bold, cm, cmToEmu, p, p2, t } from './utils';
import * as Fs from 'node:fs';
import * as Path from 'path';

export async function genContractDocx(): Promise<Buffer> {
  const membretado = Fs.readFileSync(
    Path.join(process.cwd(), 'static', 'MEMBRETADA_t.png'),
  );
  const membretado_b = Fs.readFileSync(
    Path.join(process.cwd(), 'static', 'MEMBRETADA_b.png'),
  );

  const doc = new Document({
    sections: [
      {
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new ImageRun({
                    data: membretado,
                    type: 'png',
                    transformation: {
                      width: cm(4),
                      height: cm(2.7),
                    },
                    floating: {
                      zIndex: 0,
                      horizontalPosition: {
                        relative: HorizontalPositionRelativeFrom.LEFT_MARGIN,
                        offset: cmToEmu(16.5),
                      },
                      verticalPosition: {
                        relative: VerticalPositionRelativeFrom.TOP_MARGIN,
                        offset: cmToEmu(0.5),
                      },
                      behindDocument: true,
                    },
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [
                  new ImageRun({
                    data: membretado_b,
                    type: 'png',
                    transformation: {
                      width: cm(20),
                      height: cm(14),
                    },
                    floating: {
                      zIndex: 0,
                      horizontalPosition: {
                        relative: HorizontalPositionRelativeFrom.LEFT_MARGIN,
                        offset: cmToEmu(0.5),
                      },
                      verticalPosition: {
                        relative: VerticalPositionRelativeFrom.TOP_MARGIN,
                        offset: cmToEmu(15),
                      },
                      behindDocument: true,
                    },
                  }),
                ],
              }),
            ],
          }),
        },
        children: [
          new Paragraph({
            heading: HeadingLevel.HEADING_1,
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: 'CONTRATO DE LOCACIÓN DE SERVICIOS PROFESIONALES',
                bold: true,
                underline: {},
                color: '#000000',
                size: 22,
              }),
            ],
          }),
          p({}, [
            t(
              `Consta por el presente documento el contrato de locación de servicios profesionales, que celebran de una parte, en calidad de `,
            ),
            bold(`LOCATARIO `),
            t(
              `el _____ con D.N.I. ______ con domicilio legal en ______, Provincia de ____, y Departamento de _____.`,
            ),
          ]),
          p({}, [
            t(
              `Y de la otra parte TRAZO ARQ S.A.C., Ruc 20455937974 domicilio Urb. Las Orquídeas LL-6 Arequipa en calidad de `,
            ),
            bold(`LOCADOR`),
            t(
              `, cuyo representante legal el Sr. Arq. ____, identificado con D.N.I. ________, en los términos y condiciones siguientes:`,
            ),
          ]),
          p({}, [
            bold('CLAUSULA PRIMERA:'),
            t('DEL MOTIVO QUE ORIGINA LA CONTRATACIÓN'),
          ]),
          p({}, [
            t('EL '),
            bold('LOCATARIO '),
            t('necesita contratar los servicios del '),
            bold('LOCADOR '),
            t('para la ejecución de:'),
          ]),
          p({}, [
            t(
              `El proyecto _________, Ubicado en _______, Provincia de _______, Departamento de _____.`,
            ),
          ]),
          p({}, [bold(`El terreno cuenta con un área de ____ m2.`)]),
          p({ bullet: { level: 0 } }, [bold('Objetivos del servicio')]),
          p({ bullet: { level: 1 } }, [
            bold(
              'Cumplir por todos los requisitos expresados por nuestros clientes, la normativa técnica, requisitos aplicables y otros definidos por nuestro sistema de gestión.',
            ),
          ]),
          p({ bullet: { level: 1 } }, [
            bold(
              'Asegurar el éxito de nuestros proyectos, brindando un servicio con altos estándares de calidad, para lograr la satisfacción de nuestros clientes.',
            ),
          ]),
          p({ bullet: { level: 0 } }, [
            bold('El proyecto integral comprende el siguiente detalle:'),
          ]),
          p({ bullet: { level: 1 } }, [
            t(
              'Entrega de información en digital en formato .pdf y .dwg en CD.',
            ),
          ]),
          p({ bullet: { level: 1 } }, [
            t(
              'En caso se tramite la licencia de construcción, se entregará el expediente visado y aprobado por la municipalidad correspondiente.',
            ),
          ]),
          p({ bullet: { level: 1 } }, [
            t(
              'Se entregará 1 carpeta de planos adicional, no visados (Plano de ubicación, planos de arquitectura, estructura, instalaciones eléctricas y sanitarias).',
            ),
          ]),
          p({ bullet: { level: 1 } }, [
            t(
              'Se entregarán 3 renders del proyecto en formato PNG, la selección y el diseño de las vistas son a critetio del proyectista. En caso se soliciten renders adicionales, tendrán un costo de 30$ (dólares americanos) por render.',
            ),
          ]),
          p({}, [
            t(
              'SE PLANIFICA DISEÑO DE UNA VIVIENDA UNIFAMILIAR CON LAS SIGUIENTES CONDICIONES PROGRAMÁTICAS, ENTREGADAS POR EL LOCATARIO.',
            ),
          ]),
          p2({}, [bold(`\tÁREA DE DISEÑO: _____ m2`)]),
          p2({}, [bold(`\tNRO DE PISOS: _ pisos`)]),
          p2({}, [bold(`\tTIPO DE EDIFICACIÓN: _____`)]),
          p2({}, [bold(`\tLISTADO DE ESPACIOS:`)]),
          p({}, [bold('PRIMER PISO ____')]),

          //
          // Clausula segunda
          //
          p({}, [
            bold('CLAUSULA SEGUNDA: '),
            t('DE LA MODALIDAD DEL CONTRATO'),
          ]),
          p({ indent: { left: 400 } }, [
            t('En mérito a los señalado en la cláusula anterior el '),
            bold('LOCATARIO '),
            t(
              'contrata bajo la modalidad CONTRATO DE LOCACIÓN POR SERVICIOS PROFESIONALES al ',
            ),
            bold('LOCADOR.'),
          ]),

          //
          // Clausula tercera
          //
          p({}, [bold('CLAUSULA TERCERA: '), t('CONDICIONES DEL CONTRATO')]),
          p({}, [
            t('El '),
            bold('LOCADOR '),
            t(
              'se compromete al cumplimiento de la cláusula primera a lo siguiente:',
            ),
          ]),

          p({ bullet: { level: 0 } }, [
            t('El proyecto se desarrolla en 3 etapas:'),
          ]),
          p2({ bullet: { level: 1 } }, [t('Diseño arquitectónico')]),
          p2({ bullet: { level: 1 } }, [
            t(
              'Desarrollo de ingenierías (estructuras, instalaciones eléctricas, de data y sanitarias)',
            ),
          ]),
          p2({ bullet: { level: 1 } }, [
            t('Elaboración de expediente técnico'),
          ]),

          p({ bullet: { level: 0 } }, [t('Diseño Arquitectónico')]),
          p2({ bullet: { level: 1 } }, [
            t(
              'Presentar la primera idea de Diseño Arquitectónico en un plazo máximo de 10 días hábiles, de acuerdo a la programación inicial y dentro de la normativa vigente para la obtención de la licencia de construcción, respetando el Reglamento Nacional de Edificaciones y los parámetros urbanos establecidos por la municipalidad correspondiente (actualizados a la fecha de firma del contrato).',
            ),
          ]),
          p2({ bullet: { level: 1 } }, [
            t(
              'Se trabajará con un acta de proyecto, en la cual se indicarán todos los cambios solicitados por el ',
            ),
            bold('LOCATARIO '),
            t('y serán firmados al término de cada reunión.'),
          ]),
          p2({ bullet: { level: 1 } }, [
            t(
              'Las modificaciones de la primera idea de diseño arquitectónico deben ser secuenciales y progresivas en base al programa arquitectónico establecido.',
            ),
          ]),
          p2({ bullet: { level: 1 } }, [
            t('El '),
            bold('LOCADOR '),
            t(
              'tendrá un plazo no menor a 5 días hábiles para realizar las modificaciones solicitadas por el ',
            ),
            bold('LOCATARIO.'),
          ]),
          p2({ bullet: { level: 1 } }, [
            t(
              'Cuando se cambien las condiciones de diseño, programación arquitectónica u otros parámetro de diseño no establecidos en la primera idea de diseño arquitectónico, se tendrá que considerar un reajuste en el presupuesto inicial.',
            ),
          ]),

          p({ bullet: { level: 0 } }, [t('Desarrollo de ingenierías')]),
          p2({ bullet: { level: 1 } }, [
            t(
              'Una vez se inicia la etapa de desarrollo de ingenierías, no se podrán realizar cambios en el diseño arquitectónico previamente aprobado.',
            ),
          ]),
          p2({ bullet: { level: 1 } }, [
            t('Revisión junto con el '),
            bold('LOCATARIO '),
            t('de las especialidades de Ingenierías, hasta su aprobación.'),
          ]),
          p2({ bullet: { level: 1 } }, [
            t(
              'Participar en las reuniones para la toma de decisiones sobre el proyecto.',
            ),
          ]),

          p({ bullet: { level: 0 } }, [t('Expediente técnico')]),
          p2({ bullet: { level: 1 } }, [
            t(
              'Una vez aprobado el desarrollo de ingenierías, se imprimirán los documentos correspondientes para el armado de expediente.',
            ),
          ]),
          p2({ bullet: { level: 1 } }, [
            t('En caso el '),
            bold('LOCATARIO '),
            t(
              'no solicite la licencia de edificación al finalizar el proyecto, tendrá hasta 6 meses para presentar dicha documentación a la municipalidad correspondiente y que el ',
            ),
            bold('LOCADOR '),
            t(
              'subsane las observaciones que sean emitidas. Una vez pasado este plazo, se presentará una cotización para la regularización de licencia.',
            ),
          ]),
          p2({ bullet: { level: 1 } }, [
            t('El '),
            bold('LOCATARIO '),
            t('se compromete a armar los expedientes para que el '),
            bold('LOCADOR '),
            t(
              'pueda tramitar: Certificado de parámetros urbanos y certificados de factibilidad.',
            ),
          ]),
          p2({ bullet: { level: 1 } }, [
            t('No está dentro de las responsabilidades del '),
            bold('LOCADOR '),
            t(
              'trámites adicionales como pueden ser: Licencias de demolición, certificados de alineamiento, trámite de medidores, licencias de funcionamiento, inspecciones INDECI, declaratoria de fábrica, conformidad de obra, trámites para inicio de obra.',
            ),
          ]),
          p2({ bullet: { level: 1 } }, [
            t(
              'Levantamiento de observaciones realizadas por entidad municipal a planos y documentos elaborados por el ',
            ),
            bold('LOCADOR.'),
          ]),

          p({ bullet: { level: 0 } }, [
            t(
              'Los profesionales involucrados en el proyecto asumen las responsabilidades establecidas en el ',
            ),
            bold('Reglamento Nacional de Edificaciones Norma G 0.30.'),
          ]),
          p({ bullet: { level: 0 } }, [
            t(
              'Ejecutar el proyecto especificado en la cláusula primera en un plazo estimado de 60 días hábiles, que se contabilizarán desde el siguiente día hábil después de la firma del presente contrato.',
            ),
          ]),
          p({ bullet: { level: 0 } }, [
            t(
              'Los profesionales responsables de proyecto tienen derecho a supervisar la obra a fin de verificar que se cumpla con lo especificado en el proyecto, exista un contrato sobre el particular o no.',
            ),
          ]),

          p({}, [
            t('El '),
            bold('LOCATARIO '),
            t(
              'se compromete al cumplimiento de la cláusula primera a lo siguiente:',
            ),
          ]),
          p2({ bullet: { level: 0 } }, [
            t('Proporcionar al '),
            bold('LOCADOR '),
            t(
              'la información pertinente y necesaria para poder desarrollar y entregar el expediente técnico, en un plazo no mayor a 5 días hábiles desde la solicitud del ',
            ),
            bold('LOCADOR. '),
            t('En caso de no enviar la documentación, el '),
            bold('LOCATARIO '),
            t(
              'asumirá la responsabilidad de presentar la misma a la entidad correspondiente.',
            ),
          ]),
          p2({ bullet: { level: 0 } }, [
            t(
              'Sufragar los pagos a terceros, como son: Certificados de parámetros urbanos, certificados de factibilidades, estudios de suelos, partida registral actualizada, licencia de edificación, entre otros que se requieran para completar el expediente técnico.',
            ),
          ]),
          p2({ bullet: { level: 0 } }, [
            t(
              'Sufragar el costo del proyecto en los plazos establecidos y de acuerdo a las etapas y entregas.',
            ),
          ]),
          p2({ bullet: { level: 0 } }, [
            t('El '),
            bold('LOCATARIO '),
            t(
              'se compromete a participar en las reuniones para la toma de decisiones sobre el proyecto, teniendo como plazo máximo de respuesta 5 días hábiles. En caso el ',
            ),
            bold('LOCATARIO '),
            t('no responda hasta en tres oportunidades al '),
            bold('LOCADOR '),
            t(
              ', o no asista hasta en 3 oportuniddes a reuniones coordinadas, se procederá a aplicar la cláusula quinta del presente contrato.',
            ),
          ]),

          //
          // Clausula cuarta
          //
          p({}, [
            bold('CLAUSULA CUARTA: '),
            t('RETRIBUCIÓN POR LOS SERVICIOS PRESTADOS'),
          ]),
          p({}, [
            t(
              'Para los efectos de la ejecución del proyecto detallado en la Cláusula primera ',
            ),
            bold('EL LOCATARIO '),
            t('contrata los servicios del '),
            bold('LOCATADOR '),
            t(
              ', para que asuma la responsabilidad del desarrollo y cumplimiento de cada una de las etapas de diseño en el plazo establecido por el monto total de ',
            ),
            bold('______ NUEVOS SOLES. '),
            t(
              'El pago se hará efecto mediante el cronograma de pagos establecidos en la cláusula siguiente.',
            ),
          ]),
          p({}, [
            t('El pago de los honorarios se efectuará de la siguiente manera:'),
          ]),
          p({}, [t('______')]),

          //
          // Clausula quinta
          //
          p({}, [bold('CLAUSULA QUINTA: RESOLUCIÓN DE CONTRATO')]),
          p({ indent: { left: 400 }, spacing: { before: 200, line: 400 } }, [
            t(
              'El LOCATARIO podrá solicitar la resolución del contrato cuando el LOCADOR no asistiera a las reuniones del proyecto, o no realizara las modificaciones coordinadas en Acta de Proyecto o sus Obligaciones establecidas en la Clausula tercera; EL LOCATARIO podrá dar a EL LOCADOR quince días calendarios de preavisopor escrito para retomar el proyecto. Si esto último no ocurriese, EL LOCATARIO podrá ordenar la suspensión del proyecto y declarar automáticamente resuelto el contrato, sin necesidad de declaración judicial alguna.',
            ),
          ]),
          p({ indent: { left: 400 }, spacing: { line: 400 } }, [
            t(
              'Si EL LOCATARIO no asistera a las reuniones del proyecto, o no respondiera a las citaciones para las coordinaciones según sus obligaciones establecidas en la Clausula tercera; EL LOCADOR podrá dar a EL LOCATARIO quince días calendarios de preaviso por escrito para retomar el proyecto. Si esto último no ocurriese, EL LOCADOR podrá ordenar la suspensión del proyecto y declara automáticamente resuelto el contrato, sin necesidad de declaración judicial alguna.',
            ),
          ]),
          p({ indent: { left: 400 }, spacing: { after: 200, line: 400 } }, [
            t(
              'Si se produjese la resolución del contrato por alguna de las partes, se procederá a valorizar los trabajos realizados para determinar si la cantidad de trabajo compensa los pagos realizados hasta la presentación de la carta y se cancelará la diferencia a quien corresponda.',
            ),
          ]),

          //
          // Clausula sexta
          //
          p({}, [bold('CLAUSULA SEXTA:')]),
          p({ indent: { left: 400 } }, [
            t(
              'Para efectos de este contrato y todo lo que de él se derive ambas partes precisan con carácter de domicilio real referido en la introducción de este documento y expresamente se someten a la jurisdicción de los jueces de Arequipa.',
            ),
          ]),
          p({ indent: { left: 400 } }, [
            t(
              'En la celebración del presente contrato no ha mediado simulación ni vicio de voluntad que lo invalide y en señal de conformidad ambas partes lo firmamos en la ciudad de Arequipa el día _________ .',
            ),
          ]),
        ],
      },
    ],
  });

  return await Packer.toBuffer(doc);
}
