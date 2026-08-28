const { describe, it, afterEach } = require('node:test');
const assert = require('node:assert');
const http = require('http');
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const SCRIPT = path.join(__dirname, 'generate-image');
const PNG_BASE64 = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==';
const PNG_BUF = Buffer.from(PNG_BASE64, 'base64');
const CHAT_DATA_URI = `data:image/png;base64,${PNG_BASE64}`;

async function startServer(routes) {
  const requests = [];
  const server = http.createServer((req, res) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => {
      const bodyRaw = Buffer.concat(chunks).toString('utf-8');
      requests.push({ method: req.method, url: req.url, bodyRaw });
      if (req.url === '/img.png') {
        res.writeHead(200, { 'Content-Type': 'image/png' });
        res.end(PNG_BUF);
        return;
      }
      const route = routes[req.url];
      if (!route) {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'no route for ' + req.url }));
        return;
      }
      const out = route({ url: req.url, bodyRaw });
      res.writeHead(out.status || 200, out.headers || { 'Content-Type': 'application/json' });
      res.end(out.body);
    });
  });
  await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address();
  return {
    server,
    port,
    requests,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

function runCli(args, { port, outputDir, extraEnv = {} } = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, [SCRIPT, ...args], {
      env: {
        ...process.env,
        OPENAI_API_KEY: 'test-key',
        OPENAI_BASE_URL: `http://127.0.0.1:${port}/v1`,
        IMAGE_GEN_OUTPUT_DIR: outputDir,
        ...extraEnv,
      },
    });
    let stdout = '';
    let stderr = '';
    child.stdout.on('data', (d) => { stdout += d; });
    child.stderr.on('data', (d) => { stderr += d; });
    const timer = setTimeout(() => child.kill('SIGKILL'), 15000);
    child.on('error', reject);
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ code, stdout, stderr });
    });
  });
}

function makeTmp() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'image-gen-test-'));
}

const b64Resp = () => JSON.stringify({ data: [{ b64_json: PNG_BASE64 }] });
const chatDataUriResp = () => JSON.stringify({ choices: [{ message: { role: 'assistant', content: `Here you go: ${CHAT_DATA_URI}` } }] });

describe('CLI E2E', () => {
  const activeServers = [];
  afterEach(async () => {
    for (const s of activeServers.splice(0)) await s.close();
  });

  async function boot(routes) {
    const s = await startServer(routes);
    activeServers.push(s);
    return s;
  }

  it('images 路线成功并按 -s 透传尺寸', async () => {
    const srv = await boot({
      '/v1/images/generations': () => ({ status: 200, body: b64Resp() }),
    });
    const outDir = makeTmp();
    const outFile = path.join(outDir, 'wide.png');
    const result = await runCli(['a wide landscape', outFile, '-m', 'gpt-image-2', '-s', '1536x1024'], {
      port: srv.port,
      outputDir: outDir,
    });
    assert.strictEqual(result.code, 0, result.stderr);
    assert.ok(result.stdout.includes('MEDIA:'), result.stdout);
    assert.ok(result.stdout.includes(outFile), result.stdout);

    const req = srv.requests[0];
    assert.strictEqual(req.url, '/v1/images/generations');
    const body = JSON.parse(req.bodyRaw);
    assert.strictEqual(body.model, 'gpt-image-2');
    assert.strictEqual(body.size, '1536x1024');
    assert.strictEqual(body.n, 1);
    assert.strictEqual(body.response_format, 'b64_json');

    const saved = fs.readFileSync(outFile);
    assert.deepStrictEqual(saved, PNG_BUF);
    fs.rmSync(outDir, { recursive: true, force: true });
  });

  it('不传 -s 时默认 1024x1024', async () => {
    const srv = await boot({
      '/v1/images/generations': () => ({ status: 200, body: b64Resp() }),
    });
    const outDir = makeTmp();
    const result = await runCli(['a cat', 'out.png', '-m', 'gpt-image-2'], { port: srv.port, outputDir: outDir });
    assert.strictEqual(result.code, 0, result.stderr);
    assert.strictEqual(JSON.parse(srv.requests[0].bodyRaw).size, '1024x1024');
    fs.rmSync(outDir, { recursive: true, force: true });
  });

  it('gemini chat 路线成功且请求体不含 size', async () => {
    const srv = await boot({
      '/v1/chat/completions': () => ({ status: 200, body: chatDataUriResp() }),
    });
    const outDir = makeTmp();
    const outFile = path.join(outDir, 'g.png');
    const result = await runCli(['a cat', outFile, '--chat-model', 'gemini-3.1-flash-image'], {
      port: srv.port,
      outputDir: outDir,
    });
    assert.strictEqual(result.code, 0, result.stderr);

    assert.deepStrictEqual(srv.requests.map((r) => r.url), ['/v1/chat/completions']);
    const body = JSON.parse(srv.requests[0].bodyRaw);
    assert.ok(!('size' in body), 'gemini 请求体不应包含 size 字段');
    assert.deepStrictEqual(fs.readFileSync(outFile), PNG_BUF);
    fs.rmSync(outDir, { recursive: true, force: true });
  });

  it('非 gemini 强制 chat 路线仍透传 -s', async () => {
    const srv = await boot({
      '/v1/chat/completions': () => ({ status: 200, body: chatDataUriResp() }),
    });
    const outDir = makeTmp();
    const result = await runCli(['a cat', 'out.png', '--chat-model', 'some-image-model', '-s', '1024x1536'], {
      port: srv.port,
      outputDir: outDir,
    });
    assert.strictEqual(result.code, 0, result.stderr);
    const body = JSON.parse(srv.requests[0].bodyRaw);
    assert.strictEqual(body.size, '1024x1536');
    fs.rmSync(outDir, { recursive: true, force: true });
  });

  it('响应返回 URL 时自动下载', async () => {
    let baseUrl = '';
    const srv = await boot({
      '/v1/images/generations': () => ({
        status: 200,
        body: JSON.stringify({ data: [{ url: baseUrl + '/img.png' }] }),
      }),
    });
    baseUrl = `http://127.0.0.1:${srv.port}`;
    const outDir = makeTmp();
    const outFile = path.join(outDir, 'dl.png');
    const result = await runCli(['a cat', outFile, '-m', 'gpt-image-2'], { port: srv.port, outputDir: outDir });
    assert.strictEqual(result.code, 0, result.stderr);
    assert.ok(srv.requests.some((r) => r.url === '/img.png'), '应请求图片 URL');
    assert.deepStrictEqual(fs.readFileSync(outFile), PNG_BUF);
    fs.rmSync(outDir, { recursive: true, force: true });
  });

  it('images 返回 400 时自动回退 chat 路线', async () => {
    let chatHit = false;
    const srv = await boot({
      '/v1/images/generations': () => ({ status: 400, body: JSON.stringify({ error: 'bad request' }) }),
      '/v1/chat/completions': () => { chatHit = true; return { status: 200, body: chatDataUriResp() }; },
    });
    const outDir = makeTmp();
    const outFile = path.join(outDir, 'fb.png');
    const result = await runCli(['a cat', outFile, '-m', 'grok-4.2-image'], { port: srv.port, outputDir: outDir });
    assert.strictEqual(result.code, 0, result.stderr);
    assert.ok(result.stderr.includes('fallback'), result.stderr);
    assert.ok(chatHit, '应命中 chat 端点');
    assert.deepStrictEqual(srv.requests.map((r) => r.url), ['/v1/images/generations', '/v1/chat/completions']);
    assert.deepStrictEqual(fs.readFileSync(outFile), PNG_BUF);
    fs.rmSync(outDir, { recursive: true, force: true });
  });

  it('非 200 报错退出 exit 1', async () => {
    const srv = await boot({
      '/v1/images/generations': () => ({ status: 500, body: JSON.stringify({ error: 'server error' }) }),
    });
    const outDir = makeTmp();
    const result = await runCli(['a cat', 'out.png', '-m', 'gpt-image-2'], { port: srv.port, outputDir: outDir });
    assert.strictEqual(result.code, 1);
    assert.ok(result.stderr.includes('API Error'), result.stderr);
    fs.rmSync(outDir, { recursive: true, force: true });
  });

  it('响应无图片数据时 exit 1', async () => {
    const srv = await boot({
      '/v1/images/generations': () => ({ status: 200, body: JSON.stringify({ data: [] }) }),
    });
    const outDir = makeTmp();
    const result = await runCli(['a cat', 'out.png', '-m', 'gpt-image-2'], { port: srv.port, outputDir: outDir });
    assert.strictEqual(result.code, 1);
    assert.ok(result.stderr.includes('No image data'), result.stderr);
    fs.rmSync(outDir, { recursive: true, force: true });
  });

  it('相对路径写到 OUTPUT_DIR，支持子目录', async () => {
    const srv = await boot({
      '/v1/images/generations': () => ({ status: 200, body: b64Resp() }),
    });
    const outDir = makeTmp();
    const result = await runCli(['a cat', 'sub/deep.png', '-m', 'gpt-image-2'], { port: srv.port, outputDir: outDir });
    assert.strictEqual(result.code, 0, result.stderr);
    assert.ok(fs.existsSync(path.join(outDir, 'sub', 'deep.png')));
    fs.rmSync(outDir, { recursive: true, force: true });
  });

  it('绝对路径文件名原样使用', async () => {
    const srv = await boot({
      '/v1/images/generations': () => ({ status: 200, body: b64Resp() }),
    });
    const outDir = makeTmp();
    const abs = path.join(outDir, 'absolute', 'x.png');
    const result = await runCli(['a cat', abs, '-m', 'gpt-image-2'], { port: srv.port, outputDir: outDir });
    assert.strictEqual(result.code, 0, result.stderr);
    assert.ok(fs.existsSync(abs));
    assert.ok(result.stdout.includes(abs), result.stdout);
    fs.rmSync(outDir, { recursive: true, force: true });
  });

  it('不传文件名自动生成 image-<timestamp>.png', async () => {
    const srv = await boot({
      '/v1/images/generations': () => ({ status: 200, body: b64Resp() }),
    });
    const outDir = makeTmp();
    const result = await runCli(['a cat', '-m', 'gpt-image-2'], { port: srv.port, outputDir: outDir });
    assert.strictEqual(result.code, 0, result.stderr);
    const files = fs.readdirSync(outDir);
    assert.strictEqual(files.length, 1);
    assert.match(files[0], /^image-\d+\.png$/);
    fs.rmSync(outDir, { recursive: true, force: true });
  });
});