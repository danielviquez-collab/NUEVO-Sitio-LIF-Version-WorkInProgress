import { syncNetlifyRecords } from '../../lib/gaming/netlify-api.ts';
import { dependencies } from './connection.ts';

export default async function lifSync() {
  await syncNetlifyRecords(dependencies(27000));
}
export const config = { schedule: '*/5 * * * *' };
