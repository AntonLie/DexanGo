import { config } from 'dotenv';
import { join } from 'path';

// repo root is two levels up from services/api-gateway
config({ path: join(process.cwd(), '..', '..', '.env') });
// local override, if present
config();
