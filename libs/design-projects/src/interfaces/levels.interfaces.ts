import { Level } from '@prisma/client';

export type LevelUpdateData = Omit<Level, 'createdAt' | 'updatedAt'>;
