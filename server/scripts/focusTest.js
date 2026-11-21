// Isolated integration checks. Never touches the configured application database.
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import { productivitySummary, settleSession, elapsedSeconds } from '../src/utils/focus.js';

process.env.JWT_SECRET = 'focus-tests-only';
process.env.NODE_ENV = 'development';
const db = await MongoMemoryServer.create();
await mongoose.connect(db.getUri('focus-tests'));
const { default: app } = await import('../src/app.js');
const { default: Session } = await import('../src/models/FocusSession.js');
await Session.init();
const server = app.listen(0, '127.0.0.1');
await new Promise(resolve => server.on('listening', resolve));
const base = `http://127.0.0.1:${server.address().port}/api`;
let cookie = '';
const request = async (path, body, authenticated = true) => {
  const response = await fetch(base + path, { method: body === undefined ? 'GET' : 'POST', headers: { 'Content-Type': 'application/json', ...(authenticated ? { cookie } : {}) }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  return { response, data: await response.json() };
};
const post = async (path, body = {}) => request(path, body);
try {
  assert.equal((await request('/focus/current', undefined, false)).response.status, 401);
  const registration = await post('/auth/register', { username: 'FocusTester', email: 'focus@example.com', password: 'FocusTestOnly123!', timezone: 'Asia/Dhaka' });
  assert.equal(registration.response.status, 201);
  cookie = registration.response.headers.get('set-cookie').split(';')[0];
  assert.equal((await post('/focus', { kind: 'focus', minutes: 0 })).response.status, 400);
  assert.equal((await post('/focus', { kind: 'focus', minutes: 1.5 })).response.status, 400);
  const started = (await post('/focus', { kind: 'focus', minutes: 1, label: 'Study algorithms' })).data.session;
  assert.ok(started?._id);
  assert.equal((await post('/focus', { kind: 'break', minutes: 5 })).response.status, 409);
  assert.equal((await post(`/focus/${started._id}/finish`)).response.status, 409);
  await Session.updateOne({ _id: started._id }, { $set: { 'segments.0.start': new Date(Date.now() - 30000) } });
  const paused = (await post(`/focus/${started._id}/pause`)).data.session;
  assert.equal(paused.status, 'paused');
  assert.ok(paused.elapsedSeconds >= 30 && paused.elapsedSeconds < 35);
  assert.equal((await post(`/focus/${started._id}/pause`)).data.session.segments.length, 1);
  assert.equal((await request('/focus/current')).data.session.status, 'paused');
  assert.equal((await post(`/focus/${started._id}/resume`)).data.session.segments.length, 2);
  assert.equal((await post(`/focus/${started._id}/resume`)).data.session.segments.length, 2);
  await Session.updateOne({ _id: started._id }, { $set: { 'segments.1.start': new Date(Date.now() - 40000) } });
  const finished = (await post(`/focus/${started._id}/finish`)).data.session;
  assert.equal(finished.status, 'completed');
  assert.equal(finished.elapsedSeconds, 60);
  assert.equal((await post(`/focus/${started._id}/finish`)).data.session.status, 'completed');
  assert.equal((await request('/focus/current')).data.session, null);
  const breakSession = (await post('/focus', { kind: 'break', minutes: 1 })).data.session;
  await Session.updateOne({ _id: breakSession._id }, { $set: { 'segments.0.start': new Date(Date.now() - 120000) } });
  assert.equal((await post(`/focus/${breakSession._id}/finish`)).data.session.status, 'completed');
  const cancelled = (await post('/focus', { kind: 'focus', minutes: 5 })).data.session;
  assert.equal((await post(`/focus/${cancelled._id}/cancel`)).data.session.status, 'cancelled');
  const stats = (await request('/focus/statistics?days=7')).data;
  assert.equal(stats.days.length, 7);
  assert.equal(stats.hours.length, 24);
  assert.equal(stats.completedSessions, 1);
  assert.equal(stats.totalSeconds, 60);
  assert.equal(stats.recent.length, 1);
  assert.equal(stats.timezone, 'Asia/Dhaka');
  assert.equal((await request('/focus/statistics?days=30')).data.days.length, 30);
  console.log('PASS: auth, validation, single active timer, pause/resume, reload, deadline, idempotent finish, break/reset exclusion and statistics');

  const fixture = { kind: 'focus', status: 'completed', segments: [{ start: '2026-09-09T17:50:00Z', end: '2026-09-09T18:10:00Z' }] };
  const midnight = productivitySummary([fixture], '2026-09-10', 7, 'Asia/Dhaka');
  assert.equal(midnight.days.at(-2).seconds, 600);
  assert.equal(midnight.days.at(-1).seconds, 600);
  assert.equal(midnight.hours[23].seconds, 600);
  assert.equal(midnight.hours[0].seconds, 600);
  assert.equal(midnight.completedSessions, 1);
  const dst = productivitySummary([{ ...fixture, segments: [{ start: '2026-11-01T05:30:00Z', end: '2026-11-01T06:30:00Z' }] }], '2026-11-01', 7, 'America/New_York');
  assert.equal(dst.totalSeconds, 3600);
  assert.equal(dst.hours[1].seconds, 3600);
  const pausedFixture = { status: 'running', minutes: 1, segments: [{ start: new Date(0), end: new Date(20000) }, { start: new Date(100000) }] };
  assert.ok(settleSession(pausedFixture, 200000));
  assert.equal(+pausedFixture.completedAt, 140000);
  assert.equal(elapsedSeconds(pausedFixture), 60);
  console.log('PASS: timezone midnight split, daylight-saving repeat hour, pauses excluded and overdue session capped');

  await post('/auth/logout');
  const second = await post('/auth/register', { username: 'OtherTester', email: 'other@example.com', password: 'FocusTestOnly123!' });
  cookie = second.response.headers.get('set-cookie').split(';')[0];
  assert.equal((await post(`/focus/${started._id}/finish`)).response.status, 404);
  assert.equal((await request('/focus/statistics')).data.totalSeconds, 0);
  console.log('PASS: session ownership and private statistics');
} finally {
  await new Promise(resolve => server.close(resolve));
  await mongoose.disconnect();
  await db.stop();
}
