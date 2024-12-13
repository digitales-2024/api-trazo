import {
  ExecutionProject,
  Client,
  User,
  ExecutionProjectStatus,
} from '@prisma/client';

interface BaseExecutionProject {
  id: string;
  code: string;
  name: string;
  status: ExecutionProjectStatus;
  ubicationProject: string;
  province: string;
  department: string;
  startProjectDate: string;
}

// Para operaciones (findOne, findById)
export type ExecutionProjectData = BaseExecutionProject & {
  client: {
    id: string;
    name: string;
  };
  resident: {
    id: string;
    name: string;
  };
  budget: {
    id: string;
    name: string;
  };
};

// Listados (findAll)
export type ExecutionProjectSummaryData = BaseExecutionProject & {
  client: {
    id: string;
    name: string;
  };
  resident: {
    id: string;
    name: string;
  };
  budget: {
    id: string;
    name: string;
  };
};

export type ExecutionProjectStatusUpdateData = {
  id: string;
  previousStatus: ExecutionProjectStatus;
  currentStatus: ExecutionProjectStatus;
  updatedAt: Date;
};

export type ExecutionProjectDataNested = Omit<
  ExecutionProject,
  'createdAt' | 'updatedAt' | 'clientId' | 'residentId' | 'budgetId'
> & {
  client: Pick<
    Client,
    'id' | 'name' | 'address' | 'province' | 'department' | 'rucDni'
  >;
  resident: Pick<User, 'id' | 'name'>;
  budget: {
    id: string;
    name: string;
  };
};
