import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';

describe('GET /health', () => {
  it('returns 200 with { status: "ok" }', async () => {
    const app = createApp({ port: 0 });
    const res = await request(app).get('/api/healthcheck');

    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });
});
