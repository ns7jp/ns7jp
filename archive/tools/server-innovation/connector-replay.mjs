import { readFileSync, writeFileSync } from 'node:fs';
import { collect } from '../portfolio-audit/scripts/github.mjs';
import { pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { discoveryConfig } from './discovery.mjs';

// The connected GitHub reader supplies a recorded GET response sequence. This tool
// validates the sequence with the same collector; it never fetches or executes text.
export async function replayConnector(capture) {
  if (!capture || typeof capture.responses !== 'object' || !capture.responses || Array.isArray(capture.responses) ||
      !Number.isFinite(Date.parse(capture.started_at)) || !Number.isFinite(Date.parse(capture.completed_at)) ||
      Date.parse(capture.completed_at) < Date.parse(capture.started_at)) throw new Error('Invalid connector capture');
  const calls = structuredClone(capture.responses);
  for (const [route, rows] of Object.entries(calls)) if (!route.startsWith('/repos/ns7jp/') || !Array.isArray(rows)) throw new Error('Invalid recorded GET sequence');
  let clockCalls = 0;
  const snapshot = await collect(discoveryConfig, async route => {
    if (!calls[route]?.length) throw new Error('Unrecorded connector request: ' + route);
    const value = calls[route].shift();
    return value.connector_decoded ? { sha: value.sha, encoding: 'base64', content: Buffer.from(value.text, 'utf8').toString('base64') } : value;
  }, () => clockCalls++ === 0 ? capture.started_at : capture.completed_at);
  snapshot.collection_transport = 'Connected GitHub GET capture, replayed through collector integrity and moving-ref checks';
  return snapshot;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    if (process.argv.length !== 4) throw new Error('Usage: connector-replay.mjs CAPTURE.json NEW_SNAPSHOT.json');
    const snapshot = await replayConnector(JSON.parse(readFileSync(process.argv[2], 'utf8')));
    writeFileSync(process.argv[3], JSON.stringify(snapshot, null, 2) + '\n', { flag: 'wx' });
    console.log(JSON.stringify({ collection_complete: snapshot.collection_complete, errors: snapshot.errors }));
    if (!snapshot.collection_complete) process.exitCode = 3;
  } catch (error) { console.error('Connector replay stopped: ' + error.message); process.exitCode = 2; }
}
