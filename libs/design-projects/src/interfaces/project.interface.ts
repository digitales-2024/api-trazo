import { QuotationDataNested } from '@clients/clients/interfaces/quotation.interface';
import { DesignProject, Client, Quotation, User } from '@prisma/client';

export type DesignProjectData = Omit<
  DesignProject,
  'createdAt' | 'updatedAt'
> & {
  client: Pick<Client, 'id' | 'name'>;
  quotation: Pick<Quotation, 'id' | 'code'>;
  designer: Pick<User, 'id' | 'name'>;
};

export type DesignProjectDataNested = Omit<
  DesignProject,
  | 'createdAt'
  | 'updatedAt'
  | 'clientId'
  | 'meetings'
  | 'quotationId'
  | 'designerId'
> & {
  client: Pick<
    Client,
    'id' | 'name' | 'address' | 'province' | 'department' | 'rucDni'
  >;
  quotation: Omit<QuotationDataNested, 'client' | 'createdAt'>;
  designer: Pick<User, 'id' | 'name'>;
};
