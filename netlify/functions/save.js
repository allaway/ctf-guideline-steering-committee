// Netlify serverless function — proxies classification saves to GitHub.
// Requires env vars: WRITE_PASSWORD, GITHUB_TOKEN
// Node 18+ (fetch available globally).

exports.handler = async (event) => {
  const CORS = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers: CORS };
  if (event.httpMethod !== 'POST')    return { statusCode: 405, headers: CORS, body: 'Method not allowed' };

  const { WRITE_PASSWORD, GITHUB_TOKEN } = process.env;

  let payload;
  try { payload = JSON.parse(event.body); }
  catch { return { statusCode: 400, headers: CORS, body: 'Invalid JSON' }; }

  if (!WRITE_PASSWORD || payload.password !== WRITE_PASSWORD) {
    return { statusCode: 401, headers: CORS, body: JSON.stringify({ error: 'Incorrect password' }) };
  }

  const { content, message } = payload;
  if (!content || !message) {
    return { statusCode: 400, headers: CORS, body: 'Missing content or message' };
  }

  const OWNER  = 'allaway';
  const REPO   = 'ctf-guideline-steering-committee';
  const BRANCH = 'main';
  const FILE   = 'classifications_web.json';
  const BASE   = `https://api.github.com/repos/${OWNER}/${REPO}`;
  const H = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'User-Agent': 'ctf-guideline-netlify',
  };

  async function gh(method, path, body) {
    const r = await fetch(`${BASE}${path}`, {
      method, headers: H,
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    const data = await r.json();
    if (!r.ok) throw new Error(`GitHub ${method} ${path}: ${r.status} — ${JSON.stringify(data.message || data)}`);
    return data;
  }

  try {
    const ref        = await gh('GET',   `/git/ref/heads/${BRANCH}`);
    const latestSha  = ref.object.sha;

    const commit     = await gh('GET',   `/git/commits/${latestSha}`);
    const baseTree   = commit.tree.sha;

    const blob       = await gh('POST',  `/git/blobs`, {
      content: Buffer.from(content).toString('base64'),
      encoding: 'base64',
    });

    const tree       = await gh('POST',  `/git/trees`, {
      base_tree: baseTree,
      tree: [{ path: FILE, mode: '100644', type: 'blob', sha: blob.sha }],
    });

    const newCommit  = await gh('POST',  `/git/commits`, {
      message, tree: tree.sha, parents: [latestSha],
    });

    await gh('PATCH', `/git/refs/heads/${BRANCH}`, { sha: newCommit.sha });

    return {
      statusCode: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true }),
    };
  } catch (e) {
    console.error('Save error:', e.message);
    return {
      statusCode: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: e.message }),
    };
  }
};
