import { DesignProjectStatus, ProjectCharter } from '@prisma/client';

export type ProjectCharterData = Pick<ProjectCharter, 'id'> & {
  designProject: {
    id: string;
    code: string;
    status: DesignProjectStatus;
    client: {
      id: string;
      name: string;
    };
    designer: {
      id: string;
      name: string;
    };
  };
};

export type ProjectCharterAllData = ProjectCharterData & {
  amountOfObservations: number;
};
