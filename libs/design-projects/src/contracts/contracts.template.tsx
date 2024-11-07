import { Injectable } from '@nestjs/common';
import { DesignProjectsTemplate } from '../design-projects.template';

@Injectable()
export class ContractsTemplate {
  renderContract() {
    // TODO: Move the template skeleton into design-proyect.template.tsx,
    // and call it from there
    return (
      <DesignProjectsTemplate.skeleton>
        <div class="px-32">
          <h1 class="font-bold text-lg text-center underline uppercase my-16">
            Contrato de locación de servicios profesionales
          </h1>
          <p class="my-8 leading-8">
            Consta por el presente documento el contrato de locación de
            servicios profesionales, que celebran de una parte, en calidad de{' '}
            <b>LOCATARIO</b> el __________ con D.N.I. Nº ________ con domicilio
            legal en ________ y Provincia y Departamento de Arequipa.
          </p>
          <p class="my-8 leading-8">
            Y de la otra parte TRAZO ARQ S.A.C., Ruc 20455937974 domicilio Urb.
            Las Orquídeas LL-6 Arequipa en calidad de <b>LOCADOR</b>, cuyo
            representante legal el Sr. Arq. Joel Jesús Gonzales Flores,
            identificado don D.N.I. 42578992, en los términos y condiciones
            siguientes:
          </p>

          <p class="mt-16 mb-8 leading-8">
            <b>CLAUSULA PRIMERA:</b> DEL MOTIVO QUE ORIGINA LA CONTRATACIÓN
          </p>
          <p class="my-8 leading-8">
            El <b>LOCATARIO</b> necesita contratar los servicios del{' '}
            <b>LOCADOR</b> para la ejecución de:
          </p>
          <p class="my-8 leading-8">
            El Proyecto Integral de Vivienda Unifamiliar, Ubicada en
            ____________, Provincia y Departamento de Arequipa.
          </p>
          <p class="my-8 leading-8">
            <b>El terreno cuenta con un área de _____ m2.</b>
          </p>

          <ul class="list-disc pl-12">
            <li class="my-8 leading-8">
              <b>Objetivos del servicio</b>
            </li>

            <ul class="list-disc pl-12">
              <li class="leading-8">
                <b>
                  Cumplir por todos los requisitos expresados por nuestros
                  clientes, la normativa técnica, requisitos aplicables y otros
                  definidos por nuestro sistema de gestión.
                </b>
              </li>

              <li class="leading-8">
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

              <li class="leading-8">
                En caso se tramite la licencia de construcción, se entregará el
                expediente visado y aprobado por la municipalidad
                correspondiente.
              </li>
              <li class="leading-8">
                Se entregará 1 carpeta de planos adicional, no visados (Plano de
                ubicación, planos de arquitectura, estructura, instalaciones
                eléctricas y sanitarias).
              </li>
              <li class="leading-8">
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
              <b>ÁREA DE DISEÑO: _____ m2</b>
            </p>
            <p class="my-8">
              <b>NRO DE PISOS: _ pisos</b>
            </p>
            <p class="my-8">
              <b>TIPO DE EDIFICACIÓN: Vivienda unifamiliar</b>
            </p>
            <p class="my-8">
              <b>LISTADO DE ESPACIOS:</b>
            </p>
          </div>

          <p class="mt-16 mb-8 leading-8">
            <b>CLAUSULA SEGUNDA:</b> DE LA MODALIDAD DEL CONTRATO
          </p>

          <div class="pl-12">
            <p>
              En mérito a los señalado en la cláusula anterior el{' '}
              <b>LOCATARIO</b>
              contrata bajo la modalidad CONTRATO DE LOCACIÓN POR SERVICIOS
              PROFESIONALES al <b>LOCADOR.</b>
            </p>
          </div>

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
}
