import { DesignProject, Client, Quotation, User } from '@prisma/client';

export type DesignProjectData = Omit<
  DesignProject,
  'createdAt' | 'updatedAt'
> & {
  client: Pick<Client, 'id' | 'name'>;
  quotation: Pick<Quotation, 'id' | 'code'>;
  designer: Pick<User, 'id' | 'name'>;
};
