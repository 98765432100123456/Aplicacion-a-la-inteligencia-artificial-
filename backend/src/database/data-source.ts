import 'dotenv/config';
import { DataSource } from 'typeorm';
import { databaseOptions } from '../config/configuration';

/** DataSource usado por la CLI de TypeORM (migraciones) y el seed. */
export default new DataSource(databaseOptions());
