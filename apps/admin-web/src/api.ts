import { createApiClient } from '@dexago/api-client';

export const api = createApiClient(
  import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api',
);
