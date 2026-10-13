import { createHmac } from 'node:crypto';

export type SheetAction = 'sync' | 'ranking' | 'state-load' | 'state-save';

export class SheetsConnection {
  private endpoint: string;
  private secret: string;
  private request: typeof fetch;
  private deadline: number;
  constructor(
    endpoint: string,
    secret: string,
    request: typeof fetch = fetch,
    deadline = Infinity,
  ) {
    this.endpoint = endpoint;
    this.secret = secret;
    this.request = request;
    this.deadline = deadline;
    const url = new URL(endpoint);
    if (url.protocol !== 'https:' || url.hostname !== 'script.google.com' ||
      !url.pathname.endsWith('/exec') || secret.length < 32)
      throw new Error('SHEETS_CONFIG_INVALID');
  }
  async call<T extends { ok?: boolean }>(action: SheetAction, body: unknown): Promise<T> {
    const issuedAt = Date.now();
    const serialized = JSON.stringify(body);
    const signature = createHmac('sha256', this.secret)
      .update(`${action}\n${issuedAt}\n${serialized}`).digest('hex');
    try {
      const remaining = Math.min(20000, this.deadline - Date.now());
      if (remaining <= 0) throw new Error('deadline');
      const response = await this.request(this.endpoint, {
        method: 'POST', redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ source: 'lif-client-tests', action, issuedAt, body: serialized, signature }),
        signal: AbortSignal.timeout(Math.ceil(remaining)),
      });
      const data = await response.json() as T;
      if (!response.ok || !data || data.ok !== true) throw new Error('response');
      return data;
    } catch { throw new Error('SHEETS_UNAVAILABLE'); }
  }
}
