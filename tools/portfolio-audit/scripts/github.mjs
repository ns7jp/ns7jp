import { createHash } from 'node:crypto';

export const digest = text => createHash('sha256').update(text).digest('hex');
export const blobHash = bytes => createHash('sha1').update(Buffer.concat([
  Buffer.from(`blob ${bytes.length}\0`), bytes
])).digest('hex');

export function assert(condition, message) {
  if (!condition) throw new Error(message);
}

// Only public, allowlisted GitHub API GETs. Never execute collected repository text.
export function githubClient({ fetchImpl = fetch, token = process.env.GITHUB_TOKEN,
  sleep = ms => new Promise(resolve => setTimeout(resolve, ms)) } = {}) {
  return async function get(route) {
    assert(route.startsWith('/repos/ns7jp/') && !route.includes('..'), 'API route outside allowlist');
    for (let attempt = 0; attempt < 3; attempt++) {
      let response;
      try {
        response = await fetchImpl('https://api.github.com' + route, {
          method: 'GET', redirect: 'error', signal: AbortSignal.timeout(20000),
          headers: { Accept: 'application/vnd.github+json', 'User-Agent': 'ns7jp-portfolio-audit',
            ...(token ? { Authorization: `Bearer ${token}` } : {}) }
        });
      } catch {
        if (attempt < 2) { await sleep((attempt + 1) * 500); continue; }
        throw new Error('GitHub request failed (network, timeout or redirect)');
      }
      if ((response.status === 429 || response.status >= 500) && attempt < 2) {
        await sleep((attempt + 1) * 1000); continue;
      }
      assert(response.ok, `GitHub HTTP ${response.status}; collection is UNKNOWN`);
      const reader = response.body.getReader();
      const chunks = []; let size = 0;
      try {
        for (;;) {
          const { done, value } = await reader.read();
          if (done) break;
          size += value.length;
          assert(size <= 8 * 1024 * 1024, 'GitHub response exceeds 8 MiB');
          chunks.push(Buffer.from(value));
        }
      } finally { await reader.cancel(); }
      return JSON.parse(Buffer.concat(chunks).toString('utf8'));
    }
  };
}

export async function pages(get, route, key = null) {
  const result = [];
  for (let page = 1; page <= 10; page++) {
    const data = await get(`${route}${route.includes('?') ? '&' : '?'}per_page=100&page=${page}`);
    const items = key ? data[key] : data;
    assert(Array.isArray(items), 'Invalid paginated API response');
    result.push(...items);
    if (items.length < 100) return result;
  }
  throw new Error('Pagination limit reached; collection is incomplete');
}

export function validateConfig(config) {
  assert(config?.schema_version === 1, 'Invalid live config version');
  const expected = new Map([
    ['ns7jp/server', 1227986187], ['ns7jp/ns7jp', 1222104783], ['ns7jp/ns7jp.github.io', 1222186977]
  ]);
  assert(Array.isArray(config.repositories) && config.repositories.length === 3, 'Exactly three repositories required');
  for (const repo of config.repositories) {
    assert(expected.get(repo.full_name) === repo.id, 'Repository name or ID outside allowlist');
    expected.delete(repo.full_name);
    assert(Array.isArray(repo.files) && repo.files.length > 0, 'Watched files required');
    for (const file of repo.files) assert(safePath(file), 'Invalid watched file path');
  }
  assert(expected.size === 0, 'Duplicate repository');
  assert(Number.isFinite(config.snapshot_max_age_hours) && config.snapshot_max_age_hours > 0 && config.snapshot_max_age_hours <= 48, 'Invalid freshness limit');
  assert(/^[a-f0-9]{64}$/.test(config.reviewed_el9_evidence_sha256 ?? ''), 'Reviewed evidence SHA-256 required');
  assert(Array.isArray(config.probes) && config.probes.length > 0, 'Probes required');
  const ids = new Set();
  for (const p of config.probes) {
    assert(/^[a-z0-9-]+$/.test(p.id) && !ids.has(p.id), 'Invalid or duplicate probe ID'); ids.add(p.id);
    assert(config.repositories.some(r => r.full_name === p.repository && r.files.includes(p.path)), 'Uncollected probe source');
    assert(typeof p.prefix === 'string' && p.prefix.startsWith('| '), 'Probe must select one table row');
    assert([1, 2, 3].includes(p.priority), 'Invalid probe priority');
    assert(['local-vm', 'persistent-host', 'external-service'].includes(p.environment), 'Invalid probe environment');
  }
}

export function safePath(path) {
  return typeof path === 'string' && path.length > 0 && !/[\\:\x00-\x1f]/.test(path) &&
    path.split('/').every(part => part && part !== '.' && part !== '..' && !/[. ]$/.test(part));
}

export async function collect(config, get = githubClient(), now = () => new Date().toISOString()) {
  validateConfig(config);
  const snapshot = { schema_version: 2, observed_at: now(), completed_at: null,
    kind: 'github-api-read-only', collection_complete: true, repositories: [], errors: [] };
  for (const spec of config.repositories) {
    try {
      const base = '/repos/' + spec.full_name;
      const meta = await get(base);
      assert(meta.id === spec.id && meta.full_name === spec.full_name && meta.private === false, 'Repository identity or visibility changed');
      const head = await get(`${base}/commits/${encodeURIComponent(meta.default_branch)}`);
      assert(/^[a-f0-9]{40}$/.test(head.sha), 'Invalid repository HEAD');
      const tree = await get(`${base}/git/trees/${head.sha}?recursive=1`);
      assert(tree.truncated === false && Array.isArray(tree.tree), 'Truncated or invalid tree');
      const files = {};
      for (const path of spec.files) {
        const entry = tree.tree.find(e => e.path === path);
        if (!entry) { files[path] = { missing: true }; continue; }
        assert(entry.type === 'blob' && ['100644', '100755'].includes(entry.mode), 'Watched source is not a regular file');
        assert(entry.size <= 1024 * 1024, 'Watched source exceeds 1 MiB');
        const blob = await get(`${base}/git/blobs/${entry.sha}`);
        assert(blob.encoding === 'base64', 'Unsupported blob encoding');
        const bytes = Buffer.from(blob.content, 'base64');
        assert(blob.sha === entry.sha && blobHash(bytes) === entry.sha && bytes.length === entry.size, 'Git blob integrity mismatch');
        const text = bytes.toString('utf8');
        assert(!text.includes('\ufffd'), 'Invalid UTF-8 source');
        files[path] = { text, sha256: digest(text), blob_sha: entry.sha,
          url: `https://github.com/${spec.full_name}/blob/${head.sha}/${path}` };
      }
      const pulls = await pages(get, `${base}/pulls?state=open`);
      const open_prs = [];
      for (const pr of pulls) {
        const changed = await pages(get, `${base}/pulls/${pr.number}/files`);
        // Capture at both sides of pagination; a moving PR is not safe to plan against.
        const current = await get(`${base}/pulls/${pr.number}`);
        assert(current.head.sha === pr.head.sha && current.state === 'open', 'PR changed during collection');
        assert(changed.length === current.changed_files, 'Incomplete PR file list');
        open_prs.push({ number: pr.number, title: pr.title, url: pr.html_url,
          head_sha: pr.head.sha, draft: pr.draft, paths: changed.flatMap(f => [f.filename, ...(f.previous_filename ? [f.previous_filename] : [])]) });
      }
      const runs = await pages(get, `${base}/actions/runs?head_sha=${head.sha}`, 'workflow_runs');
      const latest = new Map();
      for (const run of runs.filter(r => r.head_sha === head.sha).sort((a, b) => b.id - a.id)) {
        if (!latest.has(run.workflow_id)) latest.set(run.workflow_id, { id: run.id, name: run.name,
          path: run.path, head_sha: run.head_sha, status: run.status, conclusion: run.conclusion,
          url: run.html_url, updated_at: run.updated_at });
      }
      const finalHead = await get(`${base}/commits/${encodeURIComponent(meta.default_branch)}`);
      const finalPulls = await pages(get, `${base}/pulls?state=open`);
      const prVersions = list => JSON.stringify(list.map(p => [p.number, p.head.sha]).sort((a, b) => a[0] - b[0]));
      assert(finalHead.sha === head.sha && prVersions(finalPulls) === prVersions(pulls), 'HEAD or open PR set changed during collection');
      snapshot.repositories.push({ id: spec.id, full_name: spec.full_name, head_sha: head.sha,
        default_branch: meta.default_branch, files, tree_paths: tree.tree.filter(e => e.type === 'blob').map(e => e.path),
        open_prs, ci_runs: [...latest.values()] });
    } catch (error) {
      snapshot.collection_complete = false;
      snapshot.errors.push({ repository: spec.full_name, message: error.message });
    }
  }
  snapshot.completed_at = now();
  return snapshot;
}
