import { Injectable } from '@nestjs/common';
import { BudgetData } from '../interfaces';
import { DesignProjectsTemplate } from '@design-projects/design-projects/design-projects.template';
import { spellPricingBudget } from '@design-projects/design-projects/utils';
import { BusinessGet } from '@business/business/business.service';

@Injectable()
export class BudgetTemplate {
  /**
   * Renderiza una cotizacion como una página html
   *
   * @param budget El presupuesto a renderizar
   * @param quotationVersion El número de veces que el presupuesto ha sido editado. Se obtiene de la tabla audit
   */
  renderPdf(
    budget: BudgetData,
    quotationVersion: number,
    business: BusinessGet,
  ) {
    return (
      <DesignProjectsTemplate.skeleton>
        <div class="px-16">
          <BudgetTemplate.header
            budgetCode={budget.code}
            budgetPublicCode={budget.codeBudget}
            budgetVersion={quotationVersion}
            budgetCreatedAt={budget.dateProject}
            label="PRESUPUESTO DE OBRA"
          />
          <BudgetTemplate.projectData budget={budget} business={business} />
          <BudgetTemplate.categoryTable budget={budget} />
          <BudgetTemplate.summaryTable budget={budget} />
          {BudgetTemplate.renderNotes(business)}
        </div>
      </DesignProjectsTemplate.skeleton>
    );
  }

  /**
   * Renderiza una cabecera para documentos de presupuesto.
   */
  static header({
    budgetCode,
    budgetPublicCode,
    budgetVersion,
    budgetCreatedAt,
    label,
  }: {
    budgetCode: string;
    budgetPublicCode?: string | undefined;
    budgetVersion: number;
    budgetCreatedAt: string;
    label: string;
  }) {
    return (
      <header class="border-2 border-black grid grid-cols-[4fr_6fr_4fr]">
        <div class="bg-zinc-100 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            width="120px"
            height="22px"
            class="scale-125"
          >
            <path
              fill="#000000"
              d="M66.228 21.744h.013l-.013-.002v.002Zm-26.169-2.511-1.872-3.816-1.067-2.181c-.263-.537-.464-.961-.477-.96.066-.006.133-.018.197-.025 3.877-.411 5.628-3.221 5.628-6.007 0-2.893-2.663-5.987-6.628-5.987H.19v2.505h10.455v18.977h2.704V2.762h11.754v18.977h2.705V2.762h8.032c2.64 0 4.05 2.026 4.05 3.482 0 .832-.294 3.551-4.05 3.551h-3.266l5.86 11.944h7.837l1.23-2.506H40.06Zm66.552-15.851c-1.825-1.779-3.999-2.79-6.524-3.051v.01l-.005-.01A13.085 13.085 0 0 0 98.75.257c-.43 0-.846.025-1.256.066-2.522.253-4.704 1.273-6.532 3.071-2.13 2.092-3.195 4.638-3.195 7.641 0 3.03 1.067 5.58 3.202 7.656.197.19.397.37.601.542H76.42L85.733.257h-28.92L55.389 3.16l9.122 18.58 2.853.002-9.318-18.981h23.618l-9.322 18.977H99.89l.003-.004.185.004a10.812 10.812 0 0 0 4.296-1.367 10.501 10.501 0 0 0 3.977-3.955 10.75 10.75 0 0 0 1.459-5.48c0-2.954-1.063-5.473-3.199-7.555Zm-16.333 7.616c0-4.137 3.132-7.556 7.216-8.162v16.322l.018.006-.013-.002c-4.086-.604-7.22-4.025-7.22-8.164Zm9.525 10.736Zm.284-2.573v.012l-.005-.012-.016.002c.005 0 .011-.004.016-.005V2.835l.005-.01v.01c4.081.61 7.21 4.028 7.21 8.163 0 4.136-3.129 7.554-7.21 8.163Z"
            ></path>
            <path
              fill="#BE2126"
              d="m55.388 3.16 9.123 18.582H46.27L55.388 3.16Z"
            ></path>
          </svg>
        </div>
        <div class="text-center border-l-2 border-r-2 border-black uppercase flex items-center justify-center font-bold text-xl">
          {label}
        </div>
        <div class="grid grid-cols-2 text-center text-sm font-bold">
          <div class="border-b border-r border-black">Código de doc.</div>
          <div class="border-b border-black">{budgetPublicCode}</div>
          <div class="border-b border-r border-black">
            Código de presupuesto
          </div>
          <div class="border-b border-black">{budgetCode}</div>
          <div class="border-b border-r border-black">Versión</div>
          <div class="border-b border-black">{budgetVersion}</div>
          <div class="border-b border-r border-black">Fecha</div>
          <div class="border-b border-black">{budgetCreatedAt}</div>
        </div>
      </header>
    );
  }

  private static projectData({
    budget,
    business,
  }: {
    budget: BudgetData;
    business: BusinessGet;
  }) {
    return (
      <div class="py-4">
        <div class="flex justify-between">
          <div>
            <span class="font-bold uppercase">Proyecto:&nbsp;</span>
            <span>{budget.name}</span>
          </div>
          <div class="mr-8">
            <span class="capitalize font-bold">
              Arq. {business.legalRepName}
            </span>
          </div>
        </div>
        <div>
          <span class="uppercase font-bold">Propietario:&nbsp;</span>
          <span class="capitalize">{budget.clientBudget.name}</span>
        </div>

        <div class="flex ml-4 mt-3">
          <div class="mr-4">
            <span class="uppercase text-sm font-semibold">Proyecto:&nbsp;</span>
            <span class="text-sm">{budget.name}</span>
          </div>
          <div class="mr-4">
            <span class="uppercase text-sm font-semibold">
              Ubicación:&nbsp;
            </span>
            <span class="text-sm">{budget.ubication}</span>
          </div>

          <div>
            <span class="uppercase text-sm font-semibold">
              Fecha Proyecto:&nbsp;
            </span>
            <span class="text-sm">{budget.dateProject}</span>
          </div>
        </div>
      </div>
    );
  }

  private static categoryTable({ budget }: { budget: BudgetData }) {
    const categories = budget.category;

    return (
      <div class="pb-12">
        <table class="table-auto w-full border-collapse border border-black text-sm">
          {/* Table Header */}
          <thead class="font-bold text-center">
            <tr>
              <th
                class="border border-black py-2 "
                style={{ backgroundColor: '#eceef2' }}
              >
                Item
              </th>
              <th
                class="border border-black py-2"
                style={{ backgroundColor: '#eceef2' }}
              >
                Descripción
              </th>
              <th
                class="border border-black py-2"
                style={{ backgroundColor: '#eceef2' }}
              >
                Unid.
              </th>
              <th
                class="border border-black py-2"
                style={{ backgroundColor: '#eceef2' }}
              >
                Cant.
              </th>
              <th
                class="border border-black py-2"
                style={{ backgroundColor: '#eceef2' }}
              >
                Precio
              </th>
              <th
                class="border border-black py-2"
                style={{ backgroundColor: '#eceef2' }}
              >
                Parcial
              </th>
              <th
                class="border border-black py-2"
                style={{ backgroundColor: '#eceef2' }}
              >
                Sub Total
              </th>
            </tr>
          </thead>

          {/* Table Body */}
          <tbody>
            {categories.flatMap((category, catIndex) => {
              const categoryLevel = `${catIndex + 1}`;
              return [
                // Category row
                <tr>
                  <td class="border border-black text-left py-1">
                    {categoryLevel}
                  </td>
                  <td class="border border-black py-1 font-bold uppercase text-[#007f00]">
                    {category.name}
                  </td>
                  <td class="border border-black py-1"></td>
                  <td class="border border-black py-1"></td>
                  <td class="border border-black py-1"></td>
                  <td class="border border-black py-1"></td>
                  <td class="border border-black text-right py-1 font-bold text-[#007f00]">
                    {category.subtotal.toFixed(2)}
                  </td>
                </tr>,
                // Subcategories
                ...(category.subcategory || []).flatMap(
                  (subcategory, subIndex) => {
                    const subCategoryLevel = `${categoryLevel}.${subIndex + 1}`;
                    return [
                      <tr>
                        <td class="border border-black text-left py-1">
                          {subCategoryLevel}
                        </td>
                        <td class="border border-black py-1 font-bold uppercase text-[#ff0000]">
                          {subcategory.name}
                        </td>
                        <td class="border border-black py-1"></td>
                        <td class="border border-black py-1"></td>
                        <td class="border border-black py-1"></td>
                        <td class="border border-black py-1"></td>
                        <td class="border border-black text-right py-1 font-bold text-[#ff0000]">
                          {subcategory.subtotal.toFixed(2)}
                        </td>
                      </tr>,
                      // Work Items
                      ...(subcategory.workItem || []).flatMap(
                        (workItem, workIndex) => {
                          const workItemLevel = `${subCategoryLevel}.${workIndex + 1}`;
                          return [
                            <tr>
                              {workItem.subWorkItems &&
                              workItem.subWorkItems.length > 0 ? (
                                <>
                                  <td class="border border-black text-left py-1">
                                    {workItemLevel}
                                  </td>
                                  <td class="border border-black py-1 uppercase text-[#4068e1]">
                                    {workItem.name}
                                  </td>
                                  <td class="border border-black py-1 text-center"></td>
                                  <td class="border border-black py-1 text-center"></td>
                                  <td class="border border-black py-1 text-right"></td>
                                  <td class="border border-black py-1 text-right"></td>
                                  <td class="border border-black py-1 text-right text-[#4068e1]">
                                    {workItem.subtotal.toFixed(2)}
                                  </td>
                                </>
                              ) : (
                                <>
                                  <td class="border border-black text-left py-1">
                                    {workItemLevel}
                                  </td>
                                  <td class="border border-black py-1 uppercase">
                                    {workItem.name}
                                  </td>
                                  <td class="border border-black py-1 text-center">
                                    {workItem.unit}
                                  </td>
                                  <td class="border border-black py-1 text-center">
                                    {workItem.quantity}
                                  </td>
                                  <td class="border border-black py-1 text-right">
                                    {workItem.unitCost.toFixed(2)}
                                  </td>
                                  <td class="border border-black py-1 text-right">
                                    {(
                                      workItem.quantity * workItem.unitCost
                                    ).toFixed(2)}
                                  </td>
                                  <td class="border border-black py-1 text-right"></td>
                                </>
                              )}
                            </tr>,
                            // SubWork Items
                            ...(workItem.subWorkItems || []).map(
                              (subWorkItem, subWorkIndex) => {
                                const subWorkItemLevel = `${workItemLevel}.${subWorkIndex + 1}`;
                                return (
                                  <tr>
                                    <td class="border border-black text-left py-1">
                                      {subWorkItemLevel}
                                    </td>
                                    <td class="border border-black py-1 uppercase">
                                      {subWorkItem.name}
                                    </td>
                                    <td class="border border-black py-1 text-center">
                                      {subWorkItem.unit}
                                    </td>
                                    <td class="border border-black py-1 text-center">
                                      {subWorkItem.quantity}
                                    </td>
                                    <td class="border border-black py-1 text-right">
                                      {subWorkItem.unitCost.toFixed(2)}
                                    </td>
                                    <td class="border border-black py-1 text-right">
                                      {(
                                        subWorkItem.quantity *
                                        subWorkItem.unitCost
                                      ).toFixed(2)}
                                    </td>
                                    <td class="border border-black py-1 text-right"></td>
                                  </tr>
                                );
                              },
                            ),
                          ];
                        },
                      ),
                    ];
                  },
                ),
              ];
            })}
          </tbody>
        </table>
      </div>
    );
  }

  private static summaryTable({ budget }: { budget: BudgetData }) {
    const budgetDetail = budget.budgetDetail[0];

    return (
      <div>
        <table class="table-auto w-full border-none text-sm">
          {/* Table Body */}
          <tbody>
            <tr>
              <td class="border-none w-16"></td>
              <td
                class="border border-[#adb5c0] px-2 text-left font-bold"
                colspan="4"
              >
                Costo Directo
              </td>
              <td class="border-none w-16"></td>
              <td class="border border-[#adb5c0] px-1 text-right w-36">
                S/ {budgetDetail.directCost.toFixed(2)}
              </td>
            </tr>
            <tr>
              <td class="border-none"></td>
              <td
                class="border border-[#adb5c0] px-2 text-left font-bold"
                colspan="2"
              >
                Gastos Generales
              </td>
              <td class="border border-[#adb5c0] px-4 text-center">
                {budgetDetail.percentageOverhead}%
              </td>
              <td class="w-16 border border-[#adb5c0] px-4"></td>
              <td class="border-none "></td>
              <td class="border border-[#adb5c0] px-1 text-right">
                S/ {budgetDetail.overhead.toFixed(2)}
              </td>
            </tr>

            <tr>
              <td class="border-none"></td>
              <td
                class="border border-[#adb5c0] px-2 text-left font-bold"
                colspan="2"
              >
                Utilidad
              </td>
              <td class="border border-[#adb5c0] px-4 text-center w-16">
                {budgetDetail.percentageUtility}%
              </td>
              <td class="w-16 border border-[#adb5c0] px-4"></td>
              <td class="border-none "></td>
              <td class="border border-[#adb5c0] px-1 text-right">
                S/ {budgetDetail.utility.toFixed(2)}
              </td>
            </tr>

            {budgetDetail.igv !== 0 && (
              <tr>
                <td class="border-none"></td>
                <td
                  class="border border-[#adb5c0] px-2 text-left font-bold"
                  colspan="2"
                >
                  IGV
                </td>
                <td class="border border-[#adb5c0] px-4 text-center w-16">
                  {budgetDetail.igv}%
                </td>
                <td class="w-16 border border-[#adb5c0] px-4"></td>
                <td class="border-none "></td>
                <td class="border border-[#adb5c0] px-1 text-right">
                  S/{' '}
                  {((budgetDetail.directCost * budgetDetail.igv) / 100).toFixed(
                    2,
                  )}
                </td>
              </tr>
            )}

            <tr>
              <td class="border-none w-16"></td>
              <td
                class="border border-[#adb5c0] px-2 text-left font-bold"
                colspan="4"
              >
                TOTAL:
              </td>
              <td class="border-none w-16"></td>
              <td class="border border-[#adb5c0] px-1 text-right font-bold">
                S/ {(budgetDetail.totalCost - budgetDetail.discount).toFixed(2)}
              </td>
            </tr>

            <tr>
              <td class="border-none"></td>
              <td class="border-none"></td>
              <td
                class="border-none font-medium text-base text-right w-36"
                colspan="3"
              >
                DESCUENTO COMERCIAL
              </td>
              <td class="border-none"></td>
              <td class="border-none px-1 text-right text-red-600 font-bold">
                -S/ {budgetDetail.discount.toFixed(2)}
              </td>
            </tr>

            <tr>
              <td class="border-none"></td>
              <td class="border-none"></td>
              <td class="border-none"></td>
              <td
                class="border-none font-medium text-base text-right"
                colspan="2"
              >
                TOTAL
              </td>

              <td class="border-none"></td>
              <td class="border-none px-1 text-right font-bold">
                S/ {budgetDetail.totalCost.toFixed(2)}
              </td>
            </tr>
          </tbody>
        </table>

        <div class="mt-4">
          <span class="font-normal ml-32">
            [Son: {spellPricingBudget(budgetDetail.totalCost)}]
          </span>
        </div>
      </div>
    );
  }

  private static renderNotes(business: BusinessGet) {
    return (
      <div class="text-sm p-2">
        <div class="font-bold  mb-2">Nota:</div>
        <div class="space-y-2 pl-14">
          <div class="py-3">
            <p>
              El presupuesto no incluye trabajos de acabados, no incluye
              pérgola, mueble de parrilla ni lavandería, no incluye trabajos de
              carpintería metálica.
            </p>
          </div>
          <p>
            a) La construcción de la obra que específicamente deberá ser
            ejecutada según las Partidas Anexadas en el Presupuesto de Obra a
            favor de EL PROPIETARIO, de acuerdo con los documentos del contrato
            y del expediente técnico.
          </p>
          <p>
            c) Tener permanentemente en obra a un profesional residente,
            profesional de Seguridad, Profesional de Logística y asistentes,
            quienes deben reunir los conocimientos y experiencia necesarios para
            la ejecución de la obra materia de este presupuesto. Dicho residente
            tiene la calidad de representante autorizado de EL CONTRATISTA y es
            quien recibirá las instrucciones que imparta EL PROPIETARIO.
          </p>
          <p>
            d) En los casos de discrepancias entre los planos y las condiciones
            físicas del terreno o de los planos entre sí, deberá comunicarlos a
            EL PROPIETARIO para su verificación y para obtener de ellos las
            soluciones técnicas, administrativas y de costos que se generen.
          </p>
          <p>
            e) Proporcionará la adecuada dirección técnica y de control de las
            obras, proporcionando la totalidad del equipo de construcción, mano
            de obra especializada y herramientas necesarias para la normal
            ejecución de la obra.
          </p>
          <p>
            f) Cumplir con las normas de seguridad propias del riesgo y
            condiciones peligrosas de trabajo, con las leyes, reglamentos y
            ordenanzas vigentes, especialmente en cuanto se refiere a las
            medidas de seguridad y precaución en resguardo de la vida y salud de
            los colaboradores.
          </p>
          <p>
            g) Subsanar, sin costo para EL PROPIETARIO, cualquier deficiencia en
            la ejecución de los trabajos que sean de su responsabilidad u
            ocurran por causas imputables al contratista.
          </p>
          <p>
            i) Cumplir con las normas de seguridad propias del riesgo y
            condiciones peligrosas de trabajo.
          </p>
          <p>
            j) Asumir la responsabilidad por las deficiencias en la prestación
            del servicio, siempre que las mismas le sean directamente
            imputables.
          </p>
          <p>
            k) Destinar o dedicar sus mejores recursos humanos (profesional,
            técnico y obrero) y de infraestructura (materiales, equipos,
            maquinarias, herramientas, etc) eficientemente.
          </p>
          <p>l) Capacitar al personal que labora a su cargo.</p>
          <p>m) Guiar, organizar y orientar al personal bajo su cargo.</p>
          <p>
            n) EL CONTRATISTA es responsable ante EL PROPIETARIO por la
            imposición de sanciones municipales (multas y/o paralizaciones de la
            obra) en caso de incumplir solo lo estipulado en las ordenanzas
            municipales, principalmente por incumplir las siguientes
            disposiciones:
          </p>
          <ul class="list-disc ml-8">
            <li>
              No respetar el horario de ejecución de obras de construcción.
            </li>
            <li>
              Depositar materiales de construcción y/o desmonte en áreas no
              permitidas.
            </li>
            <li>
              No respetar las reglas básicas de seguridad e higiene y/o por
              falta de previsión en obras de demolición y construcción.
            </li>
          </ul>
          <p>
            o) EL PROPIETARIO es responsable del trámite de licencias de obra y
            autorizaciones municipales, entregando AL CONTRATISTA una copia de
            la misma para su presentación en caso de revisión por parte de la
            municipalidad.
          </p>
          <p>
            p) La garantía que otorga EL CONTRATISTA se regirá por el Reglamento
            Nacional de Edificaciones.
          </p>
        </div>
        <div class="flex justify-end mt-20 mr-12">
          <div class="text-center">
            <div class="uppercase">ARQ. {business.legalRepName}</div>
            <div class="font-bold">CAP 10596</div>
            <div class="uppercase">{business.name}</div>
          </div>
        </div>
      </div>
    );
  }
}
