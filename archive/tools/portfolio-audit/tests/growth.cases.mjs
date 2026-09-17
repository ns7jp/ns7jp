import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { tmpdir } from 'node:os';
import { createHash, randomUUID } from 'node:crypto';
import { execute as learner, learningSnapshot } from '../../../scripts/server-engineer.mjs';
import { execute as career } from '../scripts/career.mjs';
import { choose, allocate, validateFollowups, execute, readInputs, signature } from '../scripts/growth.mjs';

const now = '2026-09-08T12:00:00.000Z';
const sha = 'a'.repeat(40);
const digest = text => createHash('sha256').update(text).digest('hex');
function fixture() {
  const root = fs.mkdtempSync(path.join(tmpdir(), 'growth-test-'));
  for (const relative of ['docs/server-engineer/curriculum.json','docs/server-projects/workflow.json','tools/portfolio-audit/career.config.example.json']) {
    const target = path.join(root, relative); fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(new URL('../../../' + relative, import.meta.url), target);
  }
  const template = JSON.parse(fs.readFileSync(path.join(root, 'tools/portfolio-audit/career.config.example.json'), 'utf8'));
  for (const action of template.actions) { const file = path.join(root, action.reference); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, '# Synthetic document\n'); }
  const curriculum = JSON.parse(fs.readFileSync(path.join(root, 'docs/server-engineer/curriculum.json'), 'utf8'));
  let counter = 0;
  function add(criterion = 'SE00-C1', result = 'PASS', options = {}) {
    counter++;
    const recordTime = new Date(Date.parse('2026-09-01T00:00:00Z') + counter * 1000).toISOString();
    const evidence = '.local/input-' + counter + '.md'; fs.writeFileSync(path.join(root, evidence), 'SYNTHETIC TEST RECORD ' + counter);
    learner(['record', '--learner','learner-a','--criterion',criterion,'--result',result,'--evidence',evidence,'--sanitized',
      '--environment',options.environment ?? 'vm','--target','PRIVATE_TARGET_SENTINEL','--assistance',options.assistance ?? 'independent',
      '--session',options.session ?? 'session-' + counter,'--note','PRIVATE_NOTE_SENTINEL', '--revision',sha,
      '--performed-at',options.performed_at ?? recordTime], { root, now: () => new Date(recordTime) });
    return snapshot().attempts.at(-1);
  }
  function snapshot() { return learningSnapshot(root, 'learner-a', new Date(now)); }
  function approve(stage) {
    counter++;
    const evidence = '.local/review-' + counter + '.md'; fs.writeFileSync(path.join(root, evidence), 'SYNTHETIC REVIEW RECORD');
    learner(['review','--learner','learner-a','--stage',stage,'--reviewer','synthetic-reviewer','--decision','APPROVE',
      '--evidence',evidence,'--sanitized','--note','PRIVATE_REVIEW_SENTINEL'], { root, now: () => new Date(Date.parse('2026-09-01T00:00:00Z') + counter * 1000) });
  }
  function followups() { return { schema_version: 1, learner_id: 'learner-a', recalls: [], review_requests: [] }; }
  function record(text = 'SYNTHETIC RECALL RECORD') {
    const record_ref = '.local/autonomous-growth/records/' + randomUUID() + '.md';
    const file = path.join(root, record_ref); fs.mkdirSync(path.dirname(file), { recursive: true }); fs.writeFileSync(file, text);
    return { record_ref, record_sha256: digest(text) };
  }
  async function init(connect = true) {
    await career(['init','10'], { root, now: () => now });
    if (connect) {
      learner(['init','--learner','learner-a'], { root, now: () => new Date('2026-07-30T00:00:00Z') });
      const file = path.join(root, '.local/engineer-career/profile.json'); const profile = JSON.parse(fs.readFileSync(file, 'utf8'));
      profile.connections.learner_id = 'learner-a'; fs.writeFileSync(file, JSON.stringify(profile));
    }
  }
  return { root, curriculum, init, add, approve, snapshot, followups, record,
    close: () => fs.rmSync(root, { recursive: true, force: true }) };
}
const use = (fn, connect = true) => async () => { const f = fixture(); try { await f.init(connect); await fn(f); } finally { f.close(); } };
const select = (f, input = f.followups()) => choose(f.snapshot(), input, now);
function recall(f, a, days, at, result = 'EXPLAINED', assistance = 'independent') {
  return { id: randomUUID(), attempt_id: a.id, interval_days: days, performed_at: at, result, assistance, ...f.record() };
}

test('validated learning snapshot excludes private targets, notes, reviewers and evidence bodies', use(f => {
  f.add(); const s = JSON.stringify(f.snapshot());
  assert.ok(!s.includes('PRIVATE_')); assert.ok(!s.includes('SYNTHETIC TEST RECORD')); assert.ok(!s.includes('reviewer'));
}));
test('source evidence tampering is rejected by the original SE validator', use(f => {
  f.add(); const progress = JSON.parse(fs.readFileSync(path.join(f.root, '.local/server-engineer/learner-a/progress.json'), 'utf8'));
  fs.writeFileSync(path.join(f.root, '.local/server-engineer/learner-a', progress.attempts[0].evidence.path), 'changed');
  assert.throws(f.snapshot, /Evidence changed/);
}));
test('no connection is distinct from a connected empty learner ledger', use(async f => {
  const r = await readInputs(f.root, now); assert.equal(r.snapshot, null); assert.equal(r.result.deferred[0].rule, 'CONNECT_LEARNER');
}, false));
test('an empty ledger starts with SE00-C1 without awarding a PASS', use(f => {
  const s = select(f); assert.equal(s.candidates[0].criterion, 'SE00-C1'); assert.ok(s.states.every(x => x.status === 'NOT RUN'));
}));
test('append order determines the latest attempt, even for a backfilled earlier performance', use(f => {
  f.add('SE00-C1','PASS', { performed_at: '2026-08-25T00:00:00Z' });
  const last = f.add('SE00-C1','FAIL', { performed_at: '2026-08-01T00:00:00Z' });
  const s = select(f); assert.equal(s.candidates[0].rule, 'INVESTIGATE_FAILURE'); assert.deepEqual(s.candidates[0].attempt_ids, [last.id]);
  assert.ok(!s.candidates.some(c => c.rule === 'RECALL'));
}));
test('repeated FAIL requires distinct sessions and does not diagnose a common cause', use(f => {
  f.add('SE00-C1','FAIL', { session: 'same' }); f.add('SE00-C1','FAIL', { session: 'same' });
  assert.equal(select(f).candidates[0].rule, 'INVESTIGATE_FAILURE');
  f.add('SE00-C1','FAIL', { session: 'different' }); assert.equal(select(f).candidates[0].rule, 'CHANGE_METHOD_OR_ASK');
  f.add('SE00-C1','PASS'); f.add('SE00-C1','FAIL'); assert.equal(select(f).candidates[0].rule, 'INVESTIGATE_FAILURE');
}));
test('BLOCKED selects precondition work rather than attempting runtime again', use(f => {
  f.add('SE00-C1','BLOCKED'); assert.equal(select(f).candidates[0].rule, 'RESOLVE_PRECONDITION');
}));
test('a PASS from the wrong environment still requires an appropriate environment', use(f => {
  f.add('SE00-C1'); f.add('SE00-C2','PASS',{ environment:'desk' }); f.add('SE00-C3'); f.add('SE00-C4');
  assert.equal(select(f).candidates[0].rule, 'REQUIRED_ENVIRONMENT');
}));
test('ready for review does not advance to the next stage or invent a sent request', use(f => {
  for (let c = 1; c <= 4; c++) f.add('SE00-C' + c);
  const s = select(f); assert.equal(s.candidates[0].rule, 'PREPARE_REVIEW'); assert.equal(s.states[0].status, 'READY FOR REVIEW');
  assert.ok(!s.candidates.some(c => c.criterion?.startsWith('SE01')));
}));
test('review requests bind to exact current attempts and expose the real follow-up date', use(f => {
  for (let c = 1; c <= 4; c++) f.add('SE00-C' + c);
  const inputs = f.followups(); inputs.review_requests.push({ id:randomUUID(), stage_id:'SE00', attempt_ids:f.snapshot().stages[0].attemptIds,
    requested_at:'2026-09-02T00:00:00Z',next_check_at:'2026-09-10T00:00:00Z',...f.record() });
  validateFollowups(inputs,f.snapshot(),now,f.root); assert.ok(!select(f,inputs).candidates.some(c => c.rule === 'PREPARE_REVIEW'));
  assert.equal(select(f,inputs).reminders[0].due_at, '2026-09-10T00:00:00Z');
  f.add('SE00-C1'); assert.equal(select(f,inputs).candidates[0].rule, 'PREPARE_REVIEW');
}));
test('only the first unfinished recall window is proposed and time alone never completes it', use(f => {
  const a = f.add('SE00-C1','PASS',{ performed_at:'2026-08-01T00:00:00Z' });
  const s = select(f); const r = s.candidates.filter(c => c.rule === 'RECALL'); assert.equal(r.length,1); assert.equal(r[0].interval_days,1);
  assert.deepEqual(r[0].attempt_ids,[a.id]);
}));
test('guided or AI explanation does not count as independent recall', use(f => {
  const a = f.add('SE00-C1','PASS',{ performed_at:'2026-08-01T00:00:00Z' });
  for (const assistance of ['guided','ai']) { const input=f.followups(); input.recalls.push(recall(f,a,1,'2026-08-02T00:00:00Z','EXPLAINED',assistance));
    validateFollowups(input,f.snapshot(),now,f.root); assert.equal(select(f,input).candidates.find(c=>c.rule==='RECALL').interval_days,1); }
}));
test('late catch-up does not propose a second interval on the same UTC day', use(f => {
  const a=f.add('SE00-C1','PASS',{performed_at:'2026-08-01T00:00:00Z'}), input=f.followups();
  input.recalls.push(recall(f,a,1,'2026-09-08T09:00:00Z'));
  validateFollowups(input,f.snapshot(),now,f.root);
  assert.ok(!select(f,input).candidates.some(c=>c.rule==='RECALL'));
  assert.ok(select(f,input).reminders.some(r=>r.rule==='RECALL_NOT_BEFORE'));
  input.recalls.push(recall(f,a,7,'2026-09-08T10:00:00Z'));
  assert.throws(()=>validateFollowups(input,f.snapshot(),now,f.root),/multiple spaced/);
}));
test('early, future, duplicate and wrong-learner recall records are rejected', use(f => {
  const a=f.add('SE00-C1','PASS',{performed_at:'2026-08-01T00:00:00Z'});
  for (const time of ['2026-08-01T12:00:00Z','2027-01-01T00:00:00Z']) { const input=f.followups(); input.recalls.push(recall(f,a,1,time)); assert.throws(()=>validateFollowups(input,f.snapshot(),now,f.root)); }
  const input=f.followups(); input.learner_id='someone-else'; assert.throws(()=>validateFollowups(input,f.snapshot(),now,f.root),/different learner/);
}));
test('latest recall observation wins without invalidating the historical SE PASS', use(f => {
  const a=f.add('SE00-C1','PASS',{performed_at:'2026-08-01T00:00:00Z'}), input=f.followups();
  input.recalls.push(recall(f,a,1,'2026-08-02T00:00:00Z'),recall(f,a,1,'2026-08-03T00:00:00Z','GAP'));
  validateFollowups(input,f.snapshot(),now,f.root); assert.equal(select(f,input).candidates.find(c=>c.rule==='RECALL').last_observation,'GAP');
  assert.equal(f.snapshot().stages[0].criteria[0].result,'PASS');
}));
test('an unrelated technical task is never implicitly repurposed', use(f => {
  const week={selected:[{id:'db-recovery',kind:'technical',owner:'human',minutes:180}],planned_minutes:390};
  const r=allocate(select(f),week,now); assert.equal(r.growth_minutes,0); assert.equal(r.career_action_id,null);
}));
test('growth fits inside an explicit selected slot and adds no weekly time', use(f => {
  const week={selected:[{id:'study',kind:'technical',owner:'human',minutes:65}],planned_minutes:390};
  f.add(); const r=allocate(select(f),week,now,'study'); assert.ok(r.growth_minutes<=65); assert.equal(r.additional_weekly_minutes,0);
  assert.equal(r.career_planned_minutes,390);
}));
test('explicit binding and changed action semantics are checked without editing the career profile', use(async f => {
  const file=path.join(f.root,'.local/engineer-career/profile.json'), before=fs.readFileSync(file,'utf8');
  await execute(['bind-slot','evidence-map'],{root:f.root,now:()=>now}); assert.equal(fs.readFileSync(file,'utf8'),before);
  assert.equal((await readInputs(f.root,now)).result.binding_status,'BOUND');
  const profile=JSON.parse(before); profile.actions.find(a=>a.id==='evidence-map').title='Changed commitment'; fs.writeFileSync(file,JSON.stringify(profile));
  const r=await readInputs(f.root,now); assert.equal(r.result.binding_status,'ACTION_CHANGED_REBIND_REQUIRED'); assert.equal(r.result.growth_minutes,0);
}));
test('saved results do not modify SE records and unchanged decisions do not renotify', use(async f => {
  await execute(['bind-slot','evidence-map'],{root:f.root,now:()=>now});
  const file=path.join(f.root,'.local/server-engineer/learner-a/progress.json'), before=fs.readFileSync(file,'utf8');
  assert.equal(JSON.parse(await execute(['plan'],{root:f.root,now:()=>now})).notify,true);
  assert.equal(JSON.parse(await execute(['plan'],{root:f.root,now:()=>now})).notify,false);
  assert.equal(fs.readFileSync(file,'utf8'),before);
}));
test('changing a referenced followup record after loading is detected before saving', use(async f => {
  const a=f.add('SE00-C1','PASS',{performed_at:'2026-08-01T00:00:00Z'}), input=f.followups();
  input.recalls.push(recall(f,a,1,'2026-08-02T00:00:00Z')); const file=path.join(f.root,'.local/autonomous-growth/followups.json');
  fs.writeFileSync(file,JSON.stringify(input)); const loaded=await readInputs(f.root,now);
  fs.writeFileSync(path.join(f.root,input.recalls[0].record_ref),'changed'); assert.throws(loaded.verify,/changed/);
}));
test('active locks and malformed latest state are preserved and block writes', use(async f => {
  await execute(['bind-slot','evidence-map'],{root:f.root,now:()=>now}); const base=path.join(f.root,'.local/autonomous-growth');
  fs.writeFileSync(path.join(base,'latest.json'),'{}'); await assert.rejects(execute(['plan'],{root:f.root,now:()=>now}),/Invalid/);
  assert.equal(fs.readFileSync(path.join(base,'latest.json'),'utf8'),'{}');
  fs.writeFileSync(path.join(base,'plan.lock'),'busy'); await assert.rejects(execute(['plan'],{root:f.root,now:()=>now}),/EEXIST/);
}));
test('the previous source signature is checked after nonasync profile changes too', use(async f => {
  const loaded=await readInputs(f.root,now); const file=path.join(f.root,'.local/engineer-career/profile.json');
  const profile=JSON.parse(fs.readFileSync(file,'utf8')); profile.weekly_minutes=180; fs.writeFileSync(file,JSON.stringify(profile));
  assert.throws(loaded.verify,/Career profile changed/);
}));
test('independent criteria never accept an AI-assisted PASS as independent', use(f => {
  const target=f.curriculum.stages.find(s=>s.criteria.some(c=>c.independent));
  for (const stage of f.curriculum.stages) {
    for (const c of stage.criteria) f.add(c.id,'PASS',{assistance:stage.id===target.id&&c.independent?'ai':'independent'});
    if (stage.id===target.id) break;
    f.approve(stage.id);
  }
  assert.equal(select(f).candidates[0].rule,'INDEPENDENT_RETRY');
}));
test('SE07 same-day rebuilds remain unmet and select the distinct-day preparation', use(f => {
  for (const stage of f.curriculum.stages) {
    for (const c of stage.criteria) f.add(c.id);
    if (stage.id!=='SE07') f.approve(stage.id);
  }
  assert.equal(select(f).candidates[0].rule,'SEPARATE_REBUILD');
}));
test('all verified stages lead to selecting an existing advanced exercise, not a new credential', use(f => {
  for (const stage of f.curriculum.stages) {
    for (const c of stage.criteria) f.add(c.id,'PASS',stage.id==='SE07'?{performed_at:c.id==='SE07-C2'?'2026-08-30T00:00:00Z':'2026-08-29T00:00:00Z'}:{});
    f.approve(stage.id);
  }
  const result=select(f); assert.ok(result.states.every(s=>s.status==='PASS')); assert.equal(result.candidates[0].rule,'ADVANCED_SELECTION');
}));
test('duplicate followup IDs, unknown attempts and unsafe record references are rejected', use(f => {
  const a=f.add('SE00-C1','PASS',{performed_at:'2026-08-01T00:00:00Z'}), input=f.followups();
  const r=recall(f,a,1,'2026-08-02T00:00:00Z'); input.recalls=[r,{...r}];
  assert.throws(()=>validateFollowups(input,f.snapshot(),now,f.root),/Duplicate/);
  input.recalls=[{...r,attempt_id:randomUUID()}]; assert.throws(()=>validateFollowups(input,f.snapshot(),now,f.root),/existing PASS/);
  input.recalls=[{...r,record_ref:'.local/autonomous-growth/records/../../outside'}]; assert.throws(()=>validateFollowups(input,f.snapshot(),now,f.root),/Unsafe/);
}));
test('a paused career week cannot allocate extra growth time', use(async f => {
  await execute(['bind-slot','evidence-map'],{root:f.root,now:()=>now});
  const file=path.join(f.root,'.local/engineer-career/profile.json'), profile=JSON.parse(fs.readFileSync(file,'utf8'));
  profile.load_mode='paused'; fs.writeFileSync(file,JSON.stringify(profile));
  const {result}=await readInputs(f.root,now); assert.equal(result.growth_minutes,0); assert.equal(result.additional_weekly_minutes,0);
}));
test('normal first-day completion never advances the original seven-day deadline', use(f => {
  const a=f.add('SE00-C1','PASS',{performed_at:'2026-09-01T00:00:00Z'}), input=f.followups();
  input.recalls.push(recall(f,a,1,'2026-09-02T10:00:00Z'));
  const s=choose(f.snapshot(),input,'2026-09-02T12:00:00Z');
  assert.equal(s.reminders.find(r=>r.rule==='RECALL_NOT_BEFORE').due_at,'2026-09-08T00:00:00.000Z');
}));
