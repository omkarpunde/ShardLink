import request from 'supertest';
import { createApp } from '../src/app';

describe('App', () => {
  const app = createApp();

  it('serves health endpoint', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status', 'ok');
    expect(res.body).toHaveProperty('uptime_seconds');
  });

  it('returns 404 for unknown API routes', async () => {
    const res = await request(app).get('/api/nonexistent');
    expect(res.status).toBe(404);
  });

  it('has JSON content type for API responses', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['content-type']).toMatch(/json/);
  });
});
