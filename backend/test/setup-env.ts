// Las pruebas e2e usan una base aparte que se reinicia en cada ejecución.
process.env.NODE_ENV = 'test';
process.env.DB_HOST = process.env.DB_HOST ?? 'localhost';
process.env.DB_PORT = process.env.DB_PORT ?? '3306';
process.env.DB_USER = process.env.DB_USER ?? 'ica';
process.env.DB_PASSWORD = process.env.DB_PASSWORD ?? 'ica_dev';
process.env.DB_NAME = process.env.DB_TEST_NAME ?? 'ica_bienestar_test';
process.env.JWT_SECRET = 'secreto-de-pruebas-e2e-con-longitud-suficiente';
process.env.SMTP_HOST = '';
process.env.FRONTEND_URL = 'http://localhost:4200';
