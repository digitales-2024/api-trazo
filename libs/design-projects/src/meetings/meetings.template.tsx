import { Injectable } from '@nestjs/common';
import { DesignProjectsTemplate } from '../design-projects.template';
import { QuotationTemplate } from '../quotations/quotations.template';

@Injectable()
export class MeetingsTemplate {
  render() {
    return (
      <DesignProjectsTemplate.skeleton>
        <div class="px-16">
          <QuotationTemplate.header
            quotationCode="SGC-D06"
            quotationVersion={2}
            quotationCreatedAt={new Date()}
            label="Acta de Proyecto"
          />
          <this.meetingDetails />
        </div>
      </DesignProjectsTemplate.skeleton>
    );
  }

  private meetingDetails() {
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
          <div class="py-2 px-2 border-x border-b border-black ">
            Nombre del poryecto
          </div>
          <div class="py-2 px-2 border-b border-r border-black ">
            Propietario del proyecto
          </div>
        </div>
        <div class="grid grid-cols-[2fr_5fr_2fr_5fr]">
          <div class="font-bold border-x border-b bg-zinc-100 border-black flex items-center justify-center">
            Lider de Reunión:
          </div>
          <div class="border-b border-r border-black p-2">---</div>
          <div class="font-bold text-center bg-zinc-100 border-b border-r border-black flex items-center justify-center">
            Fecha de inicio de proyecto
          </div>
          <div class="border-b border-r border-black p-2">---</div>
        </div>
      </div>
    );
  }
}
