import { RequirementDetailStatus } from '@prisma/client';

// Requerimiento
export interface RequirementsData {
  id: string;
  date: string;
  resident: {
    id: string;
    name: string;
  };
  executionProject: {
    id: string;
    name: string;
  };
}

export interface RequirementsWithDetailData {
  id: string;
  date: string;
  resident: {
    id: string;
    name: string;
  };
  executionProject: {
    id: string;
    name: string;
  };
  requirementDetail?: RequirementsDetail[];
}

// Detalle de requerimiento
export interface RequirementsDetail {
  id: string;
  status: RequirementDetailStatus;
  quantity: number;
  dateDetail: string;
  description: string;
  resourceId: string;
}

// Interfaz para actualizar requerimientos
export interface UpdateRequirements {
  id: string;
  date: string;
  resident: {
    id: string;
    name: string;
  };
}

// Interfaz para actualizar un detalle de requerimiento
export interface UpdateRequirementsDetail {
  quantity: number;
  dateDetail: string;
  description: string;
  resourceId: string;
}
