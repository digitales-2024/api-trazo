import { Injectable } from '@nestjs/common';
import { DesignProjectsTemplate } from '../design-projects.template';
import { QuotationTemplate } from '../quotations/quotations.template';
import { DesignProjectDataNested } from '../interfaces/project.interfaces';
import { Observation } from '@prisma/client';

@Injectable()
export class ObservationsTemplate {
  render(project: DesignProjectDataNested, observations: Array<Observation>) {
    return (
      <DesignProjectsTemplate.skeleton>
        <div class="px-16">
          <QuotationTemplate.header
            quotationCode="SGC-D06"
            quotationVersion={observations.length}
            // fecha de la creacion de este documento
            quotationCreatedAt={new Date()}
            label="Acta de Proyecto"
          />
          <ObservationsTemplate.meetingDetails project={project} />
          <ObservationsTemplate.meetingNotes observations={observations} />
          <ObservationsTemplate.meetingsFooter />
        </div>
      </DesignProjectsTemplate.skeleton>
    );
  }

  private static meetingDetails(props: { project: DesignProjectDataNested }) {
    const projectStartDate = new Date(props.project.startProjectDate);

    return (
      <div class="text-sm mb-4">
        <div class="text-center font-bold bg-zinc-100 py-1 border border-black mt-1">
          1. Datos de la reunion
        </div>
        <div class="grid grid-cols-[3fr_5fr]">
          <div class="text-center border-x border-b border-black bg-zinc-100 font-bold">
            Nombre de Proyecto
          </div>
          <div class="text-center border-b border-r border-black bg-zinc-100 font-bold">
            Propietario(a)
          </div>
          <div class="py-2 px-2 border-x border-b border-black" safe>
            {props.project.name}
          </div>
          <div class="py-2 px-2 border-b border-r border-black" safe>
            {props.project.client.name}
          </div>
        </div>
        <div class="grid grid-cols-[2fr_5fr_2fr_5fr]">
          <div class="font-bold border-x border-b bg-zinc-100 border-black flex items-center justify-center">
            Lider de Reunión:
          </div>
          <div class="border-b border-r border-black p-2" safe>
            {props.project.designer.name}
          </div>
          <div class="font-bold text-center bg-zinc-100 border-b border-r border-black flex items-center justify-center">
            Fecha de inicio de proyecto
          </div>
          <div class="border-b border-r border-black p-2" safe>
            {projectStartDate.toLocaleDateString('es-PE', {
              year: '2-digit',
              month: '2-digit',
              day: 'numeric',
              timeZone: 'America/Lima',
            })}
          </div>
        </div>
      </div>
    );
  }

  private static meetingNotes(props: { observations: Array<Observation> }) {
    return (
      <div class="grid grid-cols-[1fr_20fr_4fr_6fr] text-sm">
        <div class="uppercase bg-zinc-100 font-bold text-center py-1 border border-black flex items-center justify-center">
          Nº
        </div>
        <div class="uppercase bg-zinc-100 font-bold text-center py-1 border-y border-r border-black flex items-center justify-center">
          Observaciones
        </div>
        <div class="uppercase bg-zinc-100 font-bold text-center py-1 border-y border-r border-black flex items-center justify-center">
          Fecha de reunion
        </div>
        <div class="uppercase bg-zinc-100 font-bold text-center py-1 border-y border-r border-black flex items-center justify-center">
          Firma
        </div>

        {props.observations.map((observation, arrIdx) => (
          <ObservationsTemplate.meetingNoteEntry
            n={arrIdx + 1}
            observation={observation}
          />
        ))}
      </div>
    );
  }

  private static meetingNoteEntry(props: {
    n: number;
    observation: Observation;
  }) {
    return (
      <>
        <div class="text-center py-1 border-x border-b border-black flex items-center justify-center">
          {props.n}
        </div>
        <div
          class="text-center py-1 border-b border-r border-black flex items-center justify-center"
          safe
        >
          {props.observation.observation}
        </div>
        <div
          class="text-center py-1 border-b border-r border-black flex items-center justify-center"
          safe
        >
          {props.observation.createdAt.toLocaleDateString('es-PE', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            timeZone: 'America/Lima',
          })}
        </div>
        <div class="text-center py-1 border-b border-r border-black flex items-center justify-center h-16"></div>
      </>
    );
  }

  private static meetingsFooter() {
    return (
      <footer class="text-sm">
        <div class="text-center font-bold bg-zinc-100 py-1 border border-black mt-1">
          3.- Aprobación proyecto integral
        </div>
        <div class="grid grid-cols-[1fr_5fr_7fr]">
          <div class="bg-zinc-100 text-center py-1 border-x border-b border-black flex items-center justify-center"></div>
          <div class="border-b border-r border-black">
            <p class="font-bold text-center">Fecha:</p>
            <div class="text-center py-1 flex items-center justify-center h-12"></div>
          </div>
          <div class="border-b border-r border-black">
            <p class="font-bold text-center">Firma propietarios</p>
            <div class="text-center py-1 flex items-center justify-center h-12"></div>
          </div>
        </div>
      </footer>
    );
  }
}
