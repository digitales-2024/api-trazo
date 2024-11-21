import {
  PrismaClient,
  QuotationStatusType,
  DesignProjectStatus,
  ResourceType,
} from '@prisma/client';
import { faker } from '@faker-js/faker/locale/es';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Helper function to convert text to lowercase
const toLower = (text: string) => text.toLowerCase();

async function main() {
  await cleanDatabase();
  const users = await createUsers(5);
  const roles = await createRoles();
  const permissions = await createPermissions();
  const modules = await createModules();
  const modulePermissions = await createModulePermissions(modules, permissions);
  await createRolModulePermissions(roles, modulePermissions);
  await createUserRoles(users, roles);
  const clients = await createClients(10);
  const spaces = await createSpaces();
  const zonings = await createZonings(5);
  await createResources(20);
  await createQuotationsAndProjects(clients, users, zonings, spaces);
}

async function cleanDatabase() {
  const tableNames = [
    'Observation',
    'ProjectCharter',
    'Resource',
    'LevelsOnSpaces',
    'Level',
    'DesignProject',
    'Quotation',
    'Spaces',
    'Client',
    'Zoning',
    'Audit',
    'RolModulePermissions',
    'ModulePermissions',
    'UserRol',
    'Permission',
    'Module',
    'Rol',
    'User',
  ];
  for (const table of tableNames) {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "${table}" CASCADE;`);
  }
}

async function createUsers(count: number) {
  const superAdmin = await prisma.user.create({
    data: {
      name: toLower('super admin'),
      email: 'admin@admin.com',
      password: await bcrypt.hash('admin', 10),
      phone: '999888777',
      isSuperAdmin: true,
      isActive: true,
      mustChangePassword: false,
    },
  });

  const users = [superAdmin];
  for (let i = 0; i < count - 1; i++) {
    const user = await prisma.user.create({
      data: {
        name: toLower(faker.person.fullName()),
        email: toLower(faker.internet.email()),
        password: await bcrypt.hash('password123', 10),
        phone: faker.phone.number(),
        isSuperAdmin: false,
        isActive: true,
        mustChangePassword: true,
      },
    });
    users.push(user);
  }
  return users;
}

async function createRoles() {
  const roleNames = ['administrador', 'diseñador', 'supervisor', 'vendedor'];
  return Promise.all(
    roleNames.map((name) =>
      prisma.rol.create({
        data: {
          name,
          description: toLower(`rol de ${name}`),
          isActive: true,
        },
      }),
    ),
  );
}

async function createPermissions() {
  const permissionList = [
    { cod: 'create', name: 'crear', description: 'permiso para crear' },
    { cod: 'read', name: 'leer', description: 'permiso para leer' },
    {
      cod: 'update',
      name: 'actualizar',
      description: 'permiso para actualizar',
    },
    { cod: 'delete', name: 'eliminar', description: 'permiso para eliminar' },
  ];
  return Promise.all(
    permissionList.map((perm) => prisma.permission.create({ data: perm })),
  );
}

async function createModules() {
  const moduleList = [
    { cod: 'users', name: 'usuarios', description: 'gestión de usuarios' },
    { cod: 'projects', name: 'proyectos', description: 'gestión de proyectos' },
    {
      cod: 'quotes',
      name: 'cotizaciones',
      description: 'gestión de cotizaciones',
    },
    { cod: 'clients', name: 'clientes', description: 'gestión de clientes' },
  ];
  return Promise.all(
    moduleList.map((mod) => prisma.module.create({ data: mod })),
  );
}

async function createModulePermissions(modules, permissions) {
  const modulePermissions = [];
  for (const module of modules) {
    for (const permission of permissions) {
      const mp = await prisma.modulePermissions.create({
        data: {
          moduleId: module.id,
          permissionId: permission.id,
        },
      });
      modulePermissions.push(mp);
    }
  }
  return modulePermissions;
}

async function createRolModulePermissions(roles, modulePermissions) {
  const promises = roles.flatMap((role) =>
    modulePermissions.map((mp) =>
      prisma.rolModulePermissions.create({
        data: {
          rolId: role.id,
          modulePermissionsId: mp.id,
        },
      }),
    ),
  );
  await Promise.all(promises);
}

async function createUserRoles(users, roles) {
  const promises = users.map((user) => {
    const randomRole = roles[Math.floor(Math.random() * roles.length)];
    return prisma.userRol.create({
      data: {
        userId: user.id,
        rolId: randomRole.id,
      },
    });
  });
  await Promise.all(promises);
}

async function createClients(count: number) {
  const promises = Array(count)
    .fill(null)
    .map(() =>
      prisma.client.create({
        data: {
          name: toLower(faker.company.name()),
          rucDni: faker.number
            .int({ min: 10000000000, max: 99999999999 })
            .toString(),
          address: toLower(faker.location.streetAddress()),
          province: toLower(faker.location.state()),
          department: toLower(faker.location.state()),
          phone: faker.phone.number(),
          isActive: true,
        },
      }),
    );
  return Promise.all(promises);
}

async function createSpaces() {
  const spacesList = [
    'sala',
    'comedor',
    'cocina',
    'dormitorio principal',
    'dormitorio secundario',
    'baño principal',
    'baño visitas',
    'terraza',
    'jardín',
    'garage',
  ];

  return Promise.all(
    spacesList.map((name) =>
      prisma.spaces.create({
        data: {
          name,
          description: toLower(`espacio tipo ${name}`),
          isActive: true,
        },
      }),
    ),
  );
}

async function createZonings(count: number) {
  const promises = Array(count)
    .fill(null)
    .map((_, i) =>
      prisma.zoning.create({
        data: {
          zoneCode: toLower(`zone-${i + 1}`),
          description: toLower(`zona residencial tipo ${i + 1}`),
          buildableArea: faker.number.float({ min: 100, max: 500 }),
          openArea: faker.number.float({ min: 20, max: 100 }),
          isActive: true,
        },
      }),
    );
  return Promise.all(promises);
}

async function createResources(count: number) {
  const resourceTypes = Object.values(ResourceType);
  const promises = Array(count)
    .fill(null)
    .map(() =>
      prisma.resource.create({
        data: {
          type: resourceTypes[Math.floor(Math.random() * resourceTypes.length)],
          name: toLower(faker.commerce.productName()),
          unit: faker.helpers.arrayElement(['kg', 'un', 'm2', 'm3', 'hr']),
          unitCost: parseFloat(faker.commerce.price({ min: 10, max: 1000 })),
          isActive: true,
        },
      }),
    );
  return Promise.all(promises);
}

async function createQuotationsAndProjects(clients, users, zonings, spaces) {
  for (const client of clients) {
    const quotation = await createQuotation(client, zonings);
    await createLevelsAndSpaces(quotation.id, spaces);
    await createDesignProject(quotation.id, client.id, users);
  }
}

async function createQuotation(client, zonings) {
  return prisma.quotation.create({
    data: {
      name: toLower(`proyecto ${faker.company.name()}`),
      description: toLower(faker.lorem.paragraph()),
      code: toLower(`quot-${faker.number.int({ min: 1000, max: 9999 })}`),
      status: QuotationStatusType.PENDING,
      discount: faker.number.float({ min: 0, max: 0.2 }),
      totalAmount: faker.number.float({ min: 50000, max: 500000 }),
      deliveryTime: faker.number.int({ min: 3, max: 12 }),
      exchangeRate: 3.75,
      landArea: faker.number.float({ min: 100, max: 1000 }),
      paymentSchedule: {
        initial: 30,
        middle: 50,
        final: 20,
      },
      integratedProjectDetails: {
        description: toLower('proyecto integral'),
        unit: 'm2',
        metering: faker.number.float({ min: 100, max: 500 }),
        costPerMeter: faker.number.float({ min: 100, max: 300 }),
      },
      architecturalCost: faker.number.float({ min: 10000, max: 50000 }),
      structuralCost: faker.number.float({ min: 10000, max: 50000 }),
      electricCost: faker.number.float({ min: 5000, max: 20000 }),
      sanitaryCost: faker.number.float({ min: 5000, max: 20000 }),
      metering: faker.number.float({ min: 100, max: 500 }),
      clientId: client.id,
      zoningId: zonings[Math.floor(Math.random() * zonings.length)].id,
    },
  });
}

async function createLevelsAndSpaces(quotationId: string, spaces: any[]) {
  const levelCount = faker.number.int({ min: 1, max: 3 });
  for (let i = 0; i < levelCount; i++) {
    const level = await prisma.level.create({
      data: {
        name: toLower(`nivel ${i + 1}`),
        quotationId,
      },
    });

    const spaceCount = faker.number.int({ min: 3, max: spaces.length });
    const shuffledSpaces = spaces
      .sort(() => 0.5 - Math.random())
      .slice(0, spaceCount);

    await Promise.all(
      shuffledSpaces.map((space) =>
        prisma.levelsOnSpaces.create({
          data: {
            levelId: level.id,
            spaceId: space.id,
            amount: faker.number.int({ min: 1, max: 3 }),
            area: faker.number.float({ min: 20, max: 100 }),
          },
        }),
      ),
    );
  }
}

async function createDesignProject(
  quotationId: string,
  clientId: string,
  users: any[],
) {
  const designProject = await prisma.designProject.create({
    data: {
      code: toLower(`proj-${faker.number.int({ min: 1000, max: 9999 })}`),
      name: toLower(`diseño ${faker.company.name()}`),
      status: DesignProjectStatus.APPROVED,
      ubicationProject: toLower(faker.location.streetAddress()),
      province: toLower(faker.location.state()),
      department: toLower(faker.location.state()),
      dateArchitectural: faker.date.future().toISOString(),
      dateStructural: faker.date.future().toISOString(),
      dateElectrical: faker.date.future().toISOString(),
      dateSanitary: faker.date.future().toISOString(),
      startProjectDate: faker.date.recent().toISOString(),
      clientId,
      quotationId,
      designerId: users[Math.floor(Math.random() * users.length)].id,
    },
  });

  const projectCharter = await prisma.projectCharter.create({
    data: { designProjectId: designProject.id },
  });

  await createObservations(projectCharter.id);
}

async function createObservations(projectCharterId: string) {
  const observationCount = faker.number.int({ min: 2, max: 5 });
  const promises = Array(observationCount)
    .fill(null)
    .map(() =>
      prisma.observation.create({
        data: {
          observation: toLower(faker.lorem.paragraph()),
          meetingDate: faker.date.recent().toISOString(),
          projectCharterId,
        },
      }),
    );
  await Promise.all(promises);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
