import { Observation } from '@prisma/client';

export type ObservationData = Pick<
  Observation,
  'id' | 'observation' | 'meetingDate' | 'projectCharterId'
>;

export interface ObservationProject {
  id: string;

  observation: string;

  meetingDate: string;

  projectCharter: {
    designProject: {
      code: string;

      name: string;
    };
  };
}
