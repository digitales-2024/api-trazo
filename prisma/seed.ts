import {
  PrismaClient,
  QuotationStatusType,
  DesignProjectStatus,
  ResourceType,
} from '@prisma/client';
import { faker } from '@faker-js/faker/locale/es';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  await cleanDatabase();

  // Crear datos base
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

  // Crear proyectos y cotizaciones
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
  const users = [];

  // Crear superadmin
  const superAdmin = await prisma.user.create({
    data: {
      name: 'Super Admin',
      email: 'admin@example.com',
      password: await bcrypt.hash('admin123', 10),
      phone: '999888777',
      isSuperAdmin: true,
      isActive: true,
      mustChangePassword: false,
    },
  });
  users.push(superAdmin);

  // Crear usuarios regulares
  for (let i = 0; i < count - 1; i++) {
    const user = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: faker.internet.email(),
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
  const roleNames = ['Administrador', 'Diseñador', 'Supervisor', 'Vendedor'];
  const roles = [];

  for (const name of roleNames) {
    const role = await prisma.rol.create({
      data: {
        name,
        description: `Rol de ${name}`,
        isActive: true,
      },
    });
    roles.push(role);
  }

  return roles;
}

async function createPermissions() {
  const permissionList = [
    { cod: 'CREATE', name: 'Crear', description: 'Permiso para crear' },
    { cod: 'READ', name: 'Leer', description: 'Permiso para leer' },
    {
      cod: 'UPDATE',
      name: 'Actualizar',
      description: 'Permiso para actualizar',
    },
    { cod: 'DELETE', name: 'Eliminar', description: 'Permiso para eliminar' },
  ];

  const permissions = [];
  for (const perm of permissionList) {
    const permission = await prisma.permission.create({ data: perm });
    permissions.push(permission);
  }

  return permissions;
}

async function createModules() {
  const moduleList = [
    { cod: 'USERS', name: 'Usuarios', description: 'Gestión de usuarios' },
    { cod: 'PROJECTS', name: 'Proyectos', description: 'Gestión de proyectos' },
    {
      cod: 'QUOTES',
      name: 'Cotizaciones',
      description: 'Gestión de cotizaciones',
    },
    { cod: 'CLIENTS', name: 'Clientes', description: 'Gestión de clientes' },
  ];

  const modules = [];
  for (const mod of moduleList) {
    const module = await prisma.module.create({ data: mod });
    modules.push(module);
  }

  return modules;
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
  for (const role of roles) {
    for (const mp of modulePermissions) {
      await prisma.rolModulePermissions.create({
        data: {
          rolId: role.id,
          modulePermissionsId: mp.id,
        },
      });
    }
  }
}

async function createUserRoles(users, roles) {
  for (const user of users) {
    // Asignar rol aleatorio a cada usuario
    const randomRole = roles[Math.floor(Math.random() * roles.length)];
    await prisma.userRol.create({
      data: {
        userId: user.id,
        rolId: randomRole.id,
      },
    });
  }
}

async function createClients(count: number) {
  const clients = [];

  for (let i = 0; i < count; i++) {
    const client = await prisma.client.create({
      data: {
        name: faker.company.name(),
        rucDni: faker.number
          .int({ min: 10000000000, max: 99999999999 })
          .toString(),
        address: faker.location.streetAddress(),
        province: faker.location.state(),
        department: faker.location.state(),
        phone: faker.phone.number(),
        isActive: true,
      },
    });
    clients.push(client);
  }

  return clients;
}

async function createSpaces() {
  const spacesList = [
    'Sala',
    'Comedor',
    'Cocina',
    'Dormitorio principal',
    'Dormitorio secundario',
    'Baño principal',
    'Baño visitas',
    'Terraza',
    'Jardín',
    'Garage',
  ];

  const spaces = [];
  for (const name of spacesList) {
    const space = await prisma.spaces.create({
      data: {
        name,
        description: `Espacio tipo ${name}`,
        isActive: true,
      },
    });
    spaces.push(space);
  }

  return spaces;
}

async function createZonings(count: number) {
  const zonings = [];

  for (let i = 0; i < count; i++) {
    const zoning = await prisma.zoning.create({
      data: {
        zoneCode: `ZONE-${i + 1}`,
        description: `Zona residencial tipo ${i + 1}`,
        buildableArea: faker.number.float({
          min: 100,
          max: 500,
        }),
        openArea: faker.number.float({ min: 20, max: 100 }),
        isActive: true,
      },
    });
    zonings.push(zoning);
  }

  return zonings;
}

async function createResources(count: number) {
  const resourceTypes = Object.values(ResourceType);
  const resources = [];

  for (let i = 0; i < count; i++) {
    const resource = await prisma.resource.create({
      data: {
        type: resourceTypes[Math.floor(Math.random() * resourceTypes.length)],
        name: faker.commerce.productName(),
        unit: faker.helpers.arrayElement(['kg', 'un', 'm2', 'm3', 'hr']),
        unitCost: parseFloat(faker.commerce.price({ min: 10, max: 1000 })),
        isActive: true,
      },
    });
    resources.push(resource);
  }

  return resources;
}

async function createQuotationsAndProjects(clients, users, zonings, spaces) {
  for (const client of clients) {
    // Crear cotización
    const quotation = await prisma.quotation.create({
      data: {
        name: `Proyecto ${faker.company.name()}`,
        description: faker.lorem.paragraph(),
        code: `QUOT-${faker.number.int({ min: 1000, max: 9999 })}`,
        status: faker.helpers.arrayElement(Object.values(QuotationStatusType)),
        discount: faker.number.float({ min: 0, max: 0.2 }),
        totalAmount: faker.number.float({
          min: 50000,
          max: 500000,
        }),
        deliveryTime: faker.number.int({ min: 3, max: 12 }),
        exchangeRate: 3.75,
        landArea: faker.number.float({ min: 100, max: 1000 }),
        paymentSchedule: {
          initial: 30,
          middle: 50,
          final: 20,
        },
        integratedProjectDetails: {
          description: 'Proyecto integral',
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

    // Crear niveles para la cotización
    const levelCount = faker.number.int({ min: 1, max: 3 });
    for (let i = 0; i < levelCount; i++) {
      const level = await prisma.level.create({
        data: {
          name: `Nivel ${i + 1}`,
          quotationId: quotation.id,
        },
      });

      // Asignar espacios a cada nivel
      const spaceCount = faker.number.int({ min: 3, max: spaces.length });
      const shuffledSpaces = spaces
        .sort(() => 0.5 - Math.random())
        .slice(0, spaceCount);

      for (const space of shuffledSpaces) {
        await prisma.levelsOnSpaces.create({
          data: {
            levelId: level.id,
            spaceId: space.id,
            amount: faker.number.int({ min: 1, max: 3 }),
            area: faker.number.float({ min: 20, max: 100 }),
          },
        });
      }
    }

    // Crear proyecto de diseño
    const designProject = await prisma.designProject.create({
      data: {
        code: `PROJ-${faker.number.int({ min: 1000, max: 9999 })}`,
        name: `Diseño ${faker.company.name()}`,
        status: faker.helpers.arrayElement(Object.values(DesignProjectStatus)),
        ubicationProject: faker.location.streetAddress(),
        province: faker.location.state(),
        department: faker.location.state(),
        dateArchitectural: faker.date.future().toISOString(),
        dateStructural: faker.date.future().toISOString(),
        dateElectrical: faker.date.future().toISOString(),
        dateSanitary: faker.date.future().toISOString(),
        startProjectDate: faker.date.recent().toISOString(),
        clientId: client.id,
        quotationId: quotation.id,
        designerId: users[Math.floor(Math.random() * users.length)].id,
      },
    });

    // Crear Project Charter
    const projectCharter = await prisma.projectCharter.create({
      data: {
        designProjectId: designProject.id,
      },
    });

    // Crear observaciones
    const observationCount = faker.number.int({ min: 2, max: 5 });
    for (let i = 0; i < observationCount; i++) {
      await prisma.observation.create({
        data: {
          observation: faker.lorem.paragraph(),
          meetingDate: faker.date.recent().toISOString(),
          projectCharterId: projectCharter.id,
        },
      });
    }
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
