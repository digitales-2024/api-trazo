import { Module } from '@login/login/interfaces';

export const modulesSeed: Module[] = [
  {
    name: 'Products',
    cod: 'PRD',
    description: 'This is the products module'
  },
  {
    name: 'Customers',
    cod: 'CST',
    description: 'This is the customers module'
  },
  {
    cod: 'ORD',
    name: 'Orders',
    description: 'This is the orders module'
  },
  {
    cod: 'USR',
    name: 'Users',
    description: 'This is the users module'
  },
  {
    cod: 'ROL',
    name: 'Roles',
    description: 'This is the roles module'
  },
  {
    cod: 'RPT',
    name: 'Reports',
    description: 'This is the reports module'
  },
  {
    cod: 'BNSS',
    name: 'Business',
    description: 'This is the business module'
  }
];
