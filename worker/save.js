// Cloudflare Worker — proxies classification saves to GitHub.
// Deploy at: https://dash.cloudflare.com → Workers & Pages → Create Worker
// Set env vars: WRITE_PASSWORD, GITHUB_TOKEN (fine-grained PAT, contents:write)

const OWNER  = 'allaway';
const REPO   = 'ctf-guideline-steering-committee';
const BRANCH = 'main';
const FILE   = 'classifications_web.json';

export default {
  async fetch(request, env) {
    const CORS = {
      'Access-Control-Allow-Origin':  '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
    if (request.method !== 'POST')    return new Response('Method not allowed', { status: 405, headers: CORS });

    let payload;
    try { payload = await request.json(); }
    catch { return new Response('Invalid JSON', { status: 400, headers: CORS }); }

    if (!env.WRITE_PASSWORD || payload.password !== env.WRITE_PASSWORD) {
      return Response.json({ error: 'Incorrect password' }, { status: 401, headers: CORS });
    }

    const { content, message } = payload;
    if (!content || !message) return new Response('Missing fields', { status: 400, headers: CORS });

    const BASE = `https://api.github.com/repos/${OWNER}/${REPO}`;
    const H = {
      Authorization:  `Bearer ${env.GITHUB_TOKEN}`,
      Accept:         'application/vnd.github+json',
      'Content-Type': 'application/json',
      'User-Agent':   'ctf-guideline-worker',
    };

    async function gh(method, path, body) {
      const r = await fetch(`${BASE}${path}`, {
        method, headers: H,
        ...(body ? { body: JSON.stringify(body) } : {}),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(`GitHub ${method} ${path}: ${r.status} — ${data.message || JSON.stringify(data)}`);
      return data;
    }

    try {
      const ref       = await gh('GET',   `/git/ref/heads/${BRANCH}`);
      const commit    = await gh('GET',   `/git/commits/${ref.object.sha}`);
      const blob      = await gh('POST',  `/git/blobs`, {
        content:  btoa(new TextEncoder().encode(content).reduce((s,b) => s + String.fromCharCode(b), '')),
        encoding: 'base64',
      });
      const tree      = await gh('POST',  `/git/trees`, {
        base_tree: commit.tree.sha,
        tree: [{ path: FILE, mode: '100644', type: 'blob', sha: blob.sha }],
      });
      const newCommit = await gh('POST',  `/git/commits`, {
        message, tree: tree.sha, parents: [ref.object.sha],
      });
      await gh('PATCH', `/git/refs/heads/${BRANCH}`, { sha: newCommit.sha });

      return Response.json({ success: true }, { headers: CORS });
    } catch (e) {
      console.error(e.message);
      return Response.json({ error: e.message }, { status: 500, headers: CORS });
    }
  },
};
