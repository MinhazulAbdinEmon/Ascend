// Smoke test: boots the API against a throwaway in-memory MongoDB and
// exercises auth, skill/task CRUD, and the full gamification engine.
// Run with: npm run smoke
// No real database is touched - everything vanishes when the script exits.
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'smoke-test-secret';
process.env.NODE_ENV = 'development';

const mongod = await MongoMemoryServer.create();
process.env.MONGO_URI = mongod.getUri('ascend-smoke');

const { default: app } = await import('../src/app.js');
await mongoose.connect(process.env.MONGO_URI);

const PORT = 5099;
const BASE = `http://localhost:${PORT}/api`;
const server = app.listen(PORT);

let failures = 0;
const check = (label, ok, detail = '') => {
  console.log(`${ok ? '✓' : '✗'} ${label}${detail ? ` — ${detail}` : ''}`);
  if (!ok) failures++;
};

let cookie = ''; // set after registration

const post = (path, body, withCookie = true) =>
  fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(withCookie && cookie ? { cookie } : {}) },
    body: JSON.stringify(body ?? {}),
  });
const get = (path, withCookie = true) =>
  fetch(`${BASE}${path}`, { headers: withCookie && cookie ? { cookie } : {} });
const patch = (path, body) =>
  fetch(`${BASE}${path}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', cookie },
    body: JSON.stringify(body),
  });
const del = (path) => fetch(`${BASE}${path}`, { method: 'DELETE', headers: { cookie } });
const jsonOf = (r) => r.json();

try {
  // ---------- Auth ----------
  const health = await get('/health', false);
  check('GET /health returns ok', health.status === 200);

  const reg = await post('/auth/register', {
    username: 'smoketester',
    email: 'smoke@test.com',
    password: 'password123',
  }, false);
  const regBody = await reg.json();
  check('POST /auth/register returns 201', reg.status === 201, `got ${reg.status}`);
  check('new user starts at rating 1000 = Grinder', regBody.user?.rankRating === 1000 && regBody.user?.rank === 'Grinder');
  check('new user starts at level 1', regBody.user?.level === 1);
  cookie = reg.headers.get('set-cookie');
  check('register sets HTTP-only cookie', cookie?.includes('token=') && cookie?.includes('HttpOnly'));

  const me = await get('/auth/me');
  const meBody = await me.json();
  check('GET /auth/me with cookie returns the user', me.status === 200 && meBody.user?.username === 'smoketester');

  const noAuth = await get('/auth/me', false);
  check('GET /auth/me without cookie returns 401', noAuth.status === 401);

  const dup = await post('/auth/register', { username: 'smoketester', email: 'smoke@test.com', password: 'password123' }, false);
  check('duplicate register returns 409', dup.status === 409);

  const weak = await post('/auth/register', { username: 'weakuser', email: 'weak@test.com', password: 'short' }, false);
  check('weak password returns 400', weak.status === 400);

  const badLogin = await post('/auth/login', { email: 'smoke@test.com', password: 'wrongpass1' }, false);
  check('wrong password returns 401', badLogin.status === 401);

  const login = await post('/auth/login', { email: 'smoke@test.com', password: 'password123' }, false);
  check('correct login returns 200', login.status === 200);

  // ---------- Skills & tasks CRUD ----------
  const noAuthSkills = await get('/skills', false);
  check('GET /skills without cookie returns 401', noAuthSkills.status === 401);

  const skillRes = await post('/skills', { name: 'Coding', color: '#22d3ee', icon: '💻' });
  const skillBody = await skillRes.json();
  check('POST /skills creates a skill', skillRes.status === 201 && skillBody.skill?.name === 'Coding');
  const codingSkill = skillBody.skill?._id;

  const dupSkill = await post('/skills', { name: 'Coding' });
  check('duplicate skill name returns 409', dupSkill.status === 409);

  const taskRes = await post('/tasks', { title: 'Solve 2 LeetCode problems', skill: codingSkill, difficulty: 'hard', frequency: 'daily' });
  const taskBody = await taskRes.json();
  check('POST /tasks creates a task with server-set XP (hard = 50)', taskRes.status === 201 && taskBody.task?.xpReward === 50);
  const codingTask = taskBody.task?._id;

  const spam = await post('/tasks', { title: 'aaaaaaaa', skill: codingSkill });
  check('spam task title returns 400', spam.status === 400);

  const badSkill = await post('/tasks', { title: 'Sneaky task', skill: '64b000000000000000000000' });
  check('task with unknown skill returns 404', badSkill.status === 404);

  const upd = await patch(`/tasks/${codingTask}`, { difficulty: 'deepwork' });
  const updBody = await upd.json();
  check('PATCH difficulty recomputes xpReward (deepwork = 75)', updBody.task?.xpReward === 75);

  const delSkill = await del(`/skills/${codingSkill}`);
  check('DELETE /skills/:id returns 200', delSkill.status === 200);
  const afterDel = await jsonOf(await get('/tasks'));
  check('deleting a skill also deletes its tasks', afterDel.tasks?.length === 0);

  // ---------- Gamification engine ----------
  const makeTask = async (body) => (await jsonOf(await post('/tasks', body))).task._id;
  const complete = async (id, body = {}) => {
    const r = await post(`/tasks/${id}/complete`, body);
    return { status: r.status, body: await r.json() };
  };

  const skill = (await jsonOf(await post('/skills', { name: 'Discipline', icon: '🧠' }))).skill._id;

  // Basic award + streak
  const t1 = await makeTask({ title: 'Wake up before 7am', skill, difficulty: 'easy', frequency: 'daily' });
  const c1 = await complete(t1);
  check('easy task awards 10 XP (no multipliers on day 1)', c1.status === 200 && c1.body.xpAwarded === 10);
  check('first completion starts a 1-day streak', c1.body.user?.currentStreak === 1);
  check('rating does NOT move mid-week', c1.body.user?.rankRating === 1000);

  const c1again = await complete(t1);
  check('re-completing a daily task returns 409', c1again.status === 409);

  // Proof multiplier: link = 1.2x
  const t2 = await makeTask({ title: 'Ship a real commit', skill, difficulty: 'medium', frequency: 'daily' });
  const c2 = await complete(t2, { proofUrl: 'https://github.com/user/repo/commit/abc123', proofType: 'link' });
  check('link proof multiplies XP (25 -> 30)', c2.body.xpAwarded === 30, `got ${c2.body.xpAwarded}`);

  // requiresProof enforcement
  const t3 = await makeTask({ title: 'Deep work: study session', skill, difficulty: 'deepwork', frequency: 'daily', requiresProof: true });
  const noProof = await complete(t3);
  check('requiresProof task rejects empty completion (400)', noProof.status === 400);
  const withFocus = await complete(t3, { focusMinutes: 30 });
  check('requiresProof satisfied by 25+ focus minutes (awards 75)', withFocus.status === 200 && withFocus.body.xpAwarded === 75);

  // Easy-XP daily cap (60) + diminishing returns (half XP after 6 completions)
  const t4 = await makeTask({ title: 'Drink a glass of water', skill, difficulty: 'easy', frequency: 'daily', repeatable: true });
  let sawDiminished = false;
  let sawEasyCap = false;
  for (let i = 0; i < 12; i++) {
    const r = await complete(t4);
    if (r.body.diminished) sawDiminished = true;
    if (r.body.cappedDifficulty && r.body.xpAwarded === 0) { sawEasyCap = true; break; }
  }
  check('diminishing returns kick in after 6 completions/day', sawDiminished);
  check('easy tasks stop paying XP at 60/day', sawEasyCap);

  // Daily XP cap (300)
  const t5 = await makeTask({ title: 'Deep work block', skill, difficulty: 'deepwork', frequency: 'daily', repeatable: true });
  let sawDailyCap = false;
  let finalUser = null;
  for (let i = 0; i < 12; i++) {
    const r = await complete(t5);
    finalUser = r.body.user;
    if (r.body.cappedDaily && r.body.xpAwarded === 0) { sawDailyCap = true; break; }
  }
  check('daily XP cap stops all XP at 300', sawDailyCap && finalUser?.totalXP === 300, `totalXP=${finalUser?.totalXP}`);
  check('level follows the 100*(L-1)^2 curve (300 XP = level 2)', finalUser?.level === 2);
  check('one huge day still cannot move the rank', finalUser?.rank === 'Grinder' && finalUser?.rankRating === 1000);

  // Weekly score
  const weekly = await jsonOf(await get('/stats/weekly'));
  check('GET /stats/weekly returns live components', typeof weekly.live?.consistencyScore === 'number' && typeof weekly.live?.weeklyScore === 'number');
  check('weekly consistency reflects 1 active day (~14.3)', Math.abs(weekly.live?.consistencyScore - 14.3) < 0.2, `got ${weekly.live?.consistencyScore}`);
  check('focus minutes feed the focus score (30min -> 5)', weekly.live?.focusScore === 5, `got ${weekly.live?.focusScore}`);
  check('weekly endpoint projects a rating change', typeof weekly.live?.projectedChange === 'number');

  // Dashboard / heatmap / profile
  const dash = await jsonOf(await get('/stats/dashboard'));
  check('dashboard stats: xpEarned today is 300', dash.today?.xpEarned === 300);
  check('dashboard stats: completedTaskIds includes the daily task', dash.completedTaskIds?.includes(t1));

  const heat = await jsonOf(await get('/stats/heatmap?days=30'));
  const todayEntry = heat.days?.[heat.days.length - 1];
  check('heatmap intensity is 3 (high) after 5+ tasks', todayEntry?.intensity === 3);

  const profile = await jsonOf(await get('/stats/profile'));
  check('profile stats: completions counted', profile.totalCompletions >= 15, `got ${profile.totalCompletions}`);
  check('profile stats: best skill is Discipline', profile.bestSkill?.name === 'Discipline');

  // Leaderboards
  const lbWeekly = await jsonOf(await get('/leaderboard/weekly'));
  const meWeekly = lbWeekly.entries?.find((e) => e.isYou);
  check('weekly leaderboard includes me with a live score', !!meWeekly && meWeekly.weeklyScore > 0);

  const lbSeason = await jsonOf(await get('/leaderboard/season'));
  const meSeason = lbSeason.entries?.find((e) => e.isYou);
  check('season leaderboard sorts by rating (mine = 1000 Grinder)', meSeason?.rankRating === 1000 && meSeason?.rank === 'Grinder');

  // Seasons
  const season = await jsonOf(await get('/seasons/current'));
  check('GET /seasons/current auto-creates Season 1', season.season?.number === 1 && season.season?.isActive === true);

  const recalc = await post('/seasons/recalculate-weekly-ranks');
  const recalcBody = await recalc.json();
  check('recalculate-weekly-ranks runs (no ended weeks yet = 0 finalized)', recalc.status === 200 && recalcBody.weeksFinalized === 0);
} catch (err) {
  console.error('Smoke test crashed:', err);
  failures++;
} finally {
  server.close();
  await mongoose.disconnect();
  await mongod.stop();
}

console.log(failures === 0 ? '\nAll smoke tests passed.' : `\n${failures} smoke test(s) FAILED.`);
process.exit(failures === 0 ? 0 : 1);
