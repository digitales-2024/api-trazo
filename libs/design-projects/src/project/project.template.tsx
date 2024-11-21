import { Injectable } from '@nestjs/common';
import { DesignProjectsTemplate } from '../design-projects.template';
import { spellPricing, twoDecimals } from '../utils';
import { BusinessGet } from '@business/business/business.service';
import {
  CostItem,
  IntegralProjectItem,
  QuotationTemplate,
} from '../quotations/quotations.template';
import { DesignProjectDataNested } from '../interfaces/project.interfaces';
import { LevelData } from '../interfaces';

@Injectable()
export class ProjectTemplate {
  renderContract(
    data: DesignProjectDataNested,
    business: BusinessGet,
    signingDate: Date,
  ) {
    const project = data;
    const quotation = data.quotation;
    const client = data.client;

    // compute all the neccesary areas
    const totalArea = quotation.levels
      .map(
        (level) =>
          level.spaces.map((space) => space.area).reduce((a, b) => a + b),
        0,
      )
      .reduce((a, b) => a + b, 0);
    const levelsCount = quotation.levels.length;

    const integralProjectDetails =
      quotation.integratedProjectDetails as unknown as Array<IntegralProjectItem>;
    // Cost of each m2 of construction, as a sum of all parts (architectural, structural, etc)
    const pricePerSquareMeter = integralProjectDetails
      .map((item) => item.cost)
      .reduce((acc, next) => acc + next, 0);
    const priceBeforeDiscount = totalArea * pricePerSquareMeter;
    // Final price in USD after discount
    const priceAfterDiscount = priceBeforeDiscount - quotation.discount;
    const finalPriceSoles = priceAfterDiscount * quotation.exchangeRate;

    return (
      <DesignProjectsTemplate.skeleton>
        <div class="px-44">
          <h1 class="font-bold text-lg text-center underline uppercase my-16">
            Contrato de locación de servicios profesionales
          </h1>
          <p class="my-8 leading-8 text-justify">
            Consta por el presente documento el contrato de locación de
            servicios profesionales, que celebran de una parte, en calidad de{' '}
            <b>LOCATARIO</b>
            <span safe> {client.name} </span>
            con D.N.I. Nº
            <span safe> {client.rucDni} </span>
            con domicilio legal en
            <span safe> {client.address}</span>, Provincia de
            <span class="capitalize" safe>
              &nbsp;{client.province}
            </span>
            , y Departamento de
            <span class="capitalize" safe>
              &nbsp;{client.department}.
            </span>
          </p>
          <p class="my-8 leading-8 text-justify">
            Y de la otra parte TRAZO ARQ S.A.C., Ruc 20455937974 domicilio Urb.
            Las Orquídeas LL-6 Arequipa en calidad de <b>LOCADOR</b>, cuyo
            representante legal el Sr. Arq.
            <span safe> {business.legalRepName}</span>, identificado con D.N.I.
            <span safe> {business.legalRepDni}</span>, en los términos y
            condiciones siguientes:
          </p>

          <p class="mt-16 mb-8 leading-8">
            <b>CLAUSULA PRIMERA:</b> DEL MOTIVO QUE ORIGINA LA CONTRATACIÓN
          </p>
          <p class="my-8 leading-8">
            El <b>LOCATARIO</b> necesita contratar los servicios del{' '}
            <b>LOCADOR</b> para la ejecución de:
          </p>
          <p class="my-8 leading-8">
            El Proyecto
            <span safe> {quotation.name}</span>, Ubicada en
            <span safe> {project.ubicationProject}</span>, Provincia de
            <span class="capitalize" safe>
              &nbsp;{project.province}&nbsp;
            </span>
            , y Departamento de
            <span class="capitalize" safe>
              &nbsp;{project.department}&nbsp;
            </span>
            .
          </p>
          <p class="my-8 leading-8">
            <b>
              El terreno cuenta con un área de{' '}
              <span safe>{twoDecimals(quotation.metering)}</span> m2.
            </b>
          </p>

          <ul class="list-disc pl-12">
            <li class="my-8 leading-8">
              <b>Objetivos del servicio</b>
            </li>

            <ul class="list-disc pl-12">
              <li class="leading-8 text-justify">
                <b>
                  Cumplir por todos los requisitos expresados por nuestros
                  clientes, la normativa técnica, requisitos aplicables y otros
                  definidos por nuestro sistema de gestión.
                </b>
              </li>

              <li class="leading-8 text-justify">
                <b>
                  Asegurar el éxito de nuestros proyectos, brindando un servicio
                  con altos estándares de calidad, para lograr la satisfacción
                  de nuestros clientes.
                </b>
              </li>
            </ul>

            <li class="mt-8">
              <b>El proyecto integral comprende el siguiente detalle:</b>
            </li>

            <ul class="list-disc pl-12">
              <li class="leading-8">
                Entrega de información en digital en formato .pdf y .dwg en CD.
              </li>

              <li class="leading-8 text-justify">
                En caso se tramite la licencia de construcción, se entregará el
                expediente visado y aprobado por la municipalidad
                correspondiente.
              </li>
              <li class="leading-8 text-justify">
                Se entregará 1 carpeta de planos adicional, no visados (Plano de
                ubicación, planos de arquitectura, estructura, instalaciones
                eléctricas y sanitarias).
              </li>
              <li class="leading-8 text-justify">
                Se entregarán 3 renders del proyecto en formato PNG, la
                selección y el diseño de las vistas son a critetio del
                proyectista. En caso se soliciten renders adicionales, tendrán
                un costo de 30$ (dólares americanos) por render.
              </li>
            </ul>
          </ul>

          <p class="my-8">
            SE PLANIFICA DISEÑO DE UNA VIVIENDA UNIFAMILIAR CON LAS SIGUIENTES
            CONDICIONES PROGRAMÁTICAS, ENTREGADAS POR EL LOCATARIO.
          </p>

          <div class="pl-12">
            <p class="my-8">
              <b>
                ÁREA DE DISEÑO:
                <span safe> {twoDecimals(totalArea)} </span>
                m2
              </b>
            </p>
            <p class="my-8">
              <b>NRO DE PISOS: {levelsCount} pisos</b>
            </p>
            <p class="my-8">
              <b>TIPO DE EDIFICACIÓN: Vivienda unifamiliar</b>
            </p>
            <p class="my-8">
              <b>LISTADO DE ESPACIOS:</b>
            </p>
          </div>

          <ProjectTemplate.levels levels={quotation.levels} />

          <p class="mt-16 mb-8 leading-8">
            <b>CLAUSULA SEGUNDA:</b> DE LA MODALIDAD DEL CONTRATO
          </p>
          <div class="pl-12">
            <p class="text-justify">
              En mérito a los señalado en la cláusula anterior el{' '}
              <b>LOCATARIO</b> contrata bajo la modalidad CONTRATO DE LOCACIÓN
              POR SERVICIOS PROFESIONALES al <b>LOCADOR.</b>
            </p>
          </div>

          <p class="mt-16 mb-8 leading-8">
            <b>CLAUSULA TERCERA:</b> CONDICIONES DEL CONTRATO
          </p>
          <p class="my-8 leading-8">
            El <b>LOCADOR</b> se compromete al cumplimiento de la cláusula
            primera a lo siguiente:
          </p>

          <ul class="list-disc pl-12">
            <li>El proyecto se desarrolla en 3 etapas:</li>

            <ul class="list-disc pl-12">
              <li class="leading-8">Diseño arquitectónico</li>
              <li class="leading-8 text-justify">
                Desarrollo de ingenierías (estructuras, instalaciones
                eléctricas, de data y sanitarias)
              </li>
              <li class="leading-8">Elaboración de expediente técnico</li>
            </ul>

            <li>Diseño Arquitectónico</li>

            <ul class="list-disc pl-12">
              <li class="leading-8 text-justify">
                Presentar la primera idea de Diseño Arquitectónico en un plazo
                máximo de 10 días hábiles, de acuerdo a la programación inicial
                y dentro de la normativa vigente para la obtención de la
                licencia de construcción, respetando el Reglamento Nacional de
                Edificaciones y los parámetros urbanos establecidos por la
                municipalidad correspondiente (actualizados a la fecha de firma
                del contrato).
              </li>
              <li class="leading-8 text-justify">
                Se trabajará con un acta de proyecto, en la cual se indicarán
                todos los cambios solicitados por el <b>LOCATARIO</b> y serán
                firmados al término de cada reunión.
              </li>
              <li class="leading-8 text-justify">
                Las modificaciones de la primera idea de diseño arquitectónico
                deben ser secuenciales y progresivas en base al programa
                arquitectónico establecido.
              </li>
              <li class="leading-8 text-justify">
                El <b>LOCADOR</b> tendrá un plazo no menor a 5 días hábiles para
                realizar las modificaciones solicitadas por el <b>LOCATARIO</b>.
              </li>
              <li class="leading-8 text-justify">
                Cuando se cambien las condiciones de diseño, programación
                arquitectónica u otros parámetro de diseño no establecidos en la
                primera idea de diseño arquitectónico, se tendrá que considerar
                un reajuste en el presupuesto inicial.
              </li>
            </ul>

            <li>Desarrollo de ingenierías</li>

            <ul class="list-disc pl-12">
              <li class="leading-8 text-justify">
                Una vez se inicia la etapa de desarrollo de ingenierías, no se
                podrán realizar cambios en el diseño arquitectónico previamente
                aprobado.
              </li>
              <li class="leading-8 text-justify">
                Revisión junto con el <b>LOCATARIO</b> de las especialidades de
                Ingenierías, hasta su aprobación.
              </li>
              <li class="leading-8 text-justify">
                Participar en las reuniones para la toma de decisiones sobre el
                proyecto.
              </li>
            </ul>

            <li>Expediente técnico</li>
            <ul class="list-disc pl-12">
              <li class="leading-8 text-justify">
                Una vez aprobado el desarrollo de ingenierías, se imprimirán los
                documentos correspondientes para el armado de expediente.
              </li>
              <li class="leading-8 text-justify">
                En caso el <b>LOCATARIO</b> no solicite la licencia de
                edificación al finalizar el proyecto, tendrá hasta 6 meses para
                presentar dicha documentación a la municipalidad correspondiente
                y que el <b>LOCADOR</b> subsane las observaciones que sean
                emitidas. Una vez pasado este plazo, se presentará una
                cotización para la regularización de licencia.
              </li>
              <li class="leading-8 text-justify">
                El <b>LOCADOR</b> se compromete a armar los expedientes para que
                el <b>LOCATARIO</b> pueda tramitar: Certificado de parámetros
                urbanos y certificados de factibilidad.
              </li>
              <li class="leading-8 text-justify">
                No está dentro de las responsabilidades del <b>LOCADOR</b>,
                trámites adicionales como pueden ser: Licencias de demolición,
                certificados de alineamiento, trámite de medidores, licencias de
                funcionamiento, inspecciones INDECI, declaratoria de fábrica,
                conformidad de obra, trámites para inicio de obra.
              </li>
              <li class="leading-8 text-justify">
                Levantamiento de observaciones realizadas por entidad municipal
                a planos y documentos elaborados por el <b>LOCADOR</b>.
              </li>
            </ul>

            <li class="leading-8 text-justify">
              Los profesionales involucrados en el proyecto asumen las
              responsabilidades establecidas en el{' '}
              <b>Reglamento Nacional de Edificaciones Norma G 0.30</b>.
            </li>
            <li class="leading-8 text-justify">
              Ejecutar el proyecto especificado en la cláusula primera en un
              plazo estimado de 60 días hábiles, que se contabilizarán desde el
              siguiente día hábil después de la firma del presente contrato.
            </li>
            <li class="leading-8 text-justify">
              Los profesionales responsables de proyecto tienen derecho a
              supervisar la obra a fin de verificar que se cumpla con lo
              especificado en el proyecto, exista un contrato sobre el
              particular o no.
            </li>
          </ul>

          <p class="my-8 leading-8">
            El <b>LOCATARIO</b> se compromete al cumplimiento de la cláusula
            primera a lo siguiente:
          </p>

          <ul class="list-disc pl-12">
            <li class="leading-8 text-justify">
              Proporcionar al <b>LOCADOR</b>, la información pertinente y
              necesaria para poder desarrollar y entregar el expediente técnico,
              en un plazo no mayor a 5 días hábiles desde la solicitud del{' '}
              <b>LOCADOR</b>. En caso de no enviar la documentación, el{' '}
              <b>LOCATARIO </b>
              asumirá la responsabilidad de presentar la misma a la entidad
              correspondiente.
            </li>
            <li class="leading-8 text-justify">
              Sufragar los pagos a terceros, como son: Certificados de
              parámetros urbanos, certificados de factibilidades, estudios de
              suelos, partida registral actualizada, licencia de edificación,
              entre otros que se requieran para completar el expediente técnico.
            </li>
            <li class="leading-8 text-justify">
              Sufragar el costo del proyecto en los plazos establecidos y de
              acuerdo a las etapas y entregas.
            </li>
            <li class="leading-8 text-justify">
              El <b>LOCATARIO</b> se compromete a participar en las reuniones
              para la toma de decisiones sobre el proyecto, teniendo como plazo
              máximo de respuesta 5 días hábiles. En caso el
              <b> LOCATARIO</b> no responda hasta en tres oportunidades al{' '}
              <b>LOCADOR</b>, o no asista hasta en 3 oportuniddes a reuniones
              coordinadas, se procederá a aplicar la cláusula quinta del
              presente contrato.
            </li>
          </ul>

          <p class="mt-16 mb-8 leading-8">
            <b>CLAUSULA CUARTA:</b> RETRIBUCIÓN POR LOS SERVICIOS PRESTADOS
          </p>
          <div class="pl-12">
            <p class="my-8 leading-8">
              Para los efectos de la ejecución del proyecto detallado en la
              Cláusula primera
              <b> El LOCATARIO</b> contrata los servicios del <b>LOCADOR</b>,
              para que asuma la responsabilidad del desarrollo y cumplimiento de
              cada una de las etapas de diseño en el plazo establecido por el
              monto total de{' '}
              <b safe>
                S/. {twoDecimals(finalPriceSoles)}&nbsp; (
                {spellPricing(finalPriceSoles)})
              </b>
              . El pago se hará efecto mediante el cronograma de pagos
              establecidos en la cláusula siguiente.
            </p>
            <p class="my-8 leading-8">
              El pago de los honorarios se efectuará de la siguiente manera:
            </p>

            <QuotationTemplate.paymentSchedule
              finalPriceSoles={finalPriceSoles}
              costItems={
                quotation.paymentSchedule as unknown as Array<CostItem>
              }
            />
          </div>

          <p class="mt-16 mb-8 leading-8">
            <b>CLAUSULA QUINTA: RESOLUCIÓN DE CONTRATO</b>
          </p>

          <div class="pl-12">
            <p class="my-8 leading-8 text-justify">
              El LOCATARIO podrá solicitar la resolución del contrato cuando el
              LOCADOR no asistiera a las reuniones del proyecto, o no realizara
              las modificaciones coordinadas en Acta de Proyecto o sus
              Obligaciones establecidas en la Clausula tercera; EL LOCATARIO
              podrá dar a EL LOCADOR quince días calendarios de preavisopor
              escrito para retomar el proyecto. Si esto último no ocurriese, EL
              LOCATARIO podrá ordenar la suspensión del proyecto y declarar
              automáticamente resuelto el contrato, sin necesidad de declaración
              judicial alguna.
              <br />
              Si EL LOCATARIO no asistera a las reuniones del proyecto, o no
              respondiera a las citaciones para las coordinaciones según sus
              obligaciones establecidas en la Clausula tercera; EL LOCADOR podrá
              dar a EL LOCATARIO quince días calendarios de preaviso por escrito
              para retomar el proyecto. Si esto último no ocurriese, EL LOCADOR
              podrá ordenar la suspensión del proyecto y declara automáticamente
              resuelto el contrato, sin necesidad de declaración judicial
              alguna.
              <br />
              Si se produjese la resolución del contrato por alguna de las
              partes, se procederá a valorizar los trabajos realizados para
              determinar si la cantidad de trabajo compensa los pagos realizados
              hasta la presentación de la carta y se cancelará la diferencia a
              quien corresponda.
            </p>
          </div>

          <p class="mt-16 mb-8 leading-8">
            <b>CLAUSULA SEXTA:</b>
          </p>
          <div class="pl-12">
            <p class="my-8 leading-8 text-justify">
              Para efectos de este contrato y todo lo que de él se derive ambas
              partes precisan con carácter de domicilio real referido en la
              introducción de este documento y expresamente se someten a la
              jurisdicción de los jueces de Arequipa.
            </p>
            <p class="my-8 leading-8 text-justify">
              En la celebración del presente contrato no ha mediado simulación
              ni vicio de voluntad que lo invalide y en señal de conformidad
              ambas partes lo firmamos en la ciudad de Arequipa el día&nbsp;
              <span safe>
                {signingDate.toLocaleDateString('es-PE', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  timeZone: 'America/Lima',
                })}
              </span>
              .
            </p>
          </div>

          <ProjectTemplate.signatures business={business} />

          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
          <br />
        </div>
      </DesignProjectsTemplate.skeleton>
    );
  }

  private static levels(props: { levels: Array<LevelData> }) {
    return (
      <div>
        {props.levels.map((l) => (
          <ProjectTemplate.level level={l} />
        ))}
      </div>
    );
  }

  private static level(props: { level: LevelData }) {
    return (
      <>
        <p class="uppercase my-6">
          <b safe>{props.level.name}</b>
        </p>

        <ul class="list-disc pl-12 my-4">
          {props.level.spaces.map((space) => (
            <li class="uppercase font-bold">
              {space.amount > 1 ? space.amount.toString() : ''}{' '}
              <span safe>{space.name}</span>
            </li>
          ))}
        </ul>
      </>
    );
  }

  private static signatures(props: { business: BusinessGet }) {
    return (
      <div class="grid grid-cols-2 gap-4 pt-32">
        <div class="text-center border-t-2 border-black mx-12">
          <p class="uppercase font-bold">Locador</p>
          <p class="uppercase font-bold" safe>
            ARQ. {props.business.legalRepName}
          </p>
          <p class="uppercase font-bold" safe>
            D.N.I. {props.business.legalRepDni}
          </p>
        </div>
        <div class="text-center border-t-2 border-black mx-12">
          <p class="uppercase font-bold">Locatario</p>
        </div>
      </div>
    );
  }
}
