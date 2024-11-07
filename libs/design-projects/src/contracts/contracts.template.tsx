import { Injectable } from '@nestjs/common';

@Injectable()
export class ContractsTemplate {
  renderContract() {
    // TODO: Move the template skeleton into design-proyect.template.tsx,
    // and call it from there
    return <div>Contract :D</div>;
  }
}
