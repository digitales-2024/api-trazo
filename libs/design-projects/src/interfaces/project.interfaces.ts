import {
  DesignProject,
  Client,
  User,
  DesignProjectStatus,
} from '@prisma/client';
import { QuotationDataNested } from './quotations.interfaces';

interface BaseDesignProject {
  id: string;
  code: string;
  name: string;
  status: DesignProjectStatus;
  ubicationProject: string;
  province: string;
  department: string;
  startProjectDate: string;
}

// Para operaciones detalladas (findOne, findById)
export type DesignProjectData = BaseDesignProject & {
  dateArchitectural: string | null;
  dateStructural: string | null;
  dateElectrical: string | null;
  dateSanitary: string | null;
  client: {
    id: string;
    name: string;
  };
  quotation: {
    id: string;
    publicCode: number;
  };
  designer: {
    id: string;
    name: string;
  };
};

// Para listados (findAll) - incluye datos adicionales de cotización
export type DesignProjectSummaryData = BaseDesignProject & {
  client: {
    id: string;
    name: string;
  };
  quotation: {
    id: string;
    publicCode: number;
  };
  designer: {
    id: string;
    name: string;
  };
};

export type DesignProjectDataNested = Omit<
  DesignProject,
  | 'createdAt'
  | 'updatedAt'
  | 'clientId'
  | 'meetings'
  | 'quotationId'
  | 'designerId'
  | 'dateArchitectural'
  | 'dateStructural'
  | 'dateElectrical'
  | 'dateSanitary'
> & {
  client: Pick<
    Client,
    'id' | 'name' | 'address' | 'province' | 'department' | 'rucDni'
  >;
  quotation: Omit<QuotationDataNested, 'client' | 'createdAt'>;
  designer: Pick<User, 'id' | 'name'>;
};
