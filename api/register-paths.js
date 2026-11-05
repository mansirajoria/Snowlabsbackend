const path = require('path');
const { register } = require('tsconfig-paths');

register({
  baseUrl: path.resolve(__dirname, '../dist'),
  paths: {
    '@*': ['*'],
    '@access/*': ['access-management/*'],
    '@role_permissions/*': ['role-permissions/*'],
    '@students_lms/*': ['students-lms/*'],
    '@trainer_lms/*': ['trainer-lms/*'],
    'src/*': ['*'],
    '*': ['*'],
  },
});
