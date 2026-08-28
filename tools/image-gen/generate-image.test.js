const { describe, it, mock } = require('node:test');
const assert = require('node:assert');
const { globMatch, isChatRoute, extractBase64FromContent, extractFromChatResponse, parseArgs } = require('./generate-image-lib');

const chatPatterns = ['gemini-*-image*', 'gemini-*-flash-image*'];

describe('globMatch', () => {
  it('精确匹配', () => {
    assert.strictEqual(globMatch('gemini-3.1-flash-image', 'gemini-*-image*'), true);
  });

  it('通配符匹配多条', () => {
    assert.strictEqual(globMatch('gemini-3.1-flash-image', 'gemini-*-flash-image*'), true);
    assert.strictEqual(globMatch('gemini-3.1-image', 'gemini-*-image*'), true);
  });

  it('不匹配', () => {
    assert.strictEqual(globMatch('gpt-image-2', 'gemini-*-image*'), false);
    assert.strictEqual(globMatch('gemini-3.1-flash-text', 'gemini-*-image*'), false);
  });
});

describe('isChatRoute', () => {
  it('gemini 生图模型命中', () => {
    assert.strictEqual(isChatRoute('gemini-3.1-flash-image', chatPatterns), true);
  });

  it('gpt 模型不命中', () => {
    assert.strictEqual(isChatRoute('gpt-image-2', chatPatterns), false);
  });

  it('自定义扩展模式命中', () => {
    const patterns = [...chatPatterns, 'foo-*-image'];
    assert.strictEqual(isChatRoute('foo-v1-image', patterns), true);
  });
});

describe('extractBase64FromContent', () => {
  const pngBase64 = 'iVBORw0KGgoICQoLSUhEUhAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWltcXV5fYGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3';
  const jpegBase64 = '/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAAgGBgcGBQgHBwcJCQgKDBQNDAsLDBkSEw8UHRofHh0aHBwgJC4nICIsIxwcKDcpLDAxNDQ0Hyc5PTgyPC4zNDIAAAAAAAAAAAAAAAAAAAAAAAAAAA==';

  it('data URI 提取', () => {
    const content = `Here's your image: data:image/png;base64,${pngBase64}`;
    assert.strictEqual(extractBase64FromContent(content), pngBase64);
  });

  it('markdown 图片提取', () => {
    const content = `![result](data:image/png;base64,${pngBase64})`;
    assert.strictEqual(extractBase64FromContent(content), pngBase64);
  });

  it('裸 base64 有效魔数提取', () => {
    assert.strictEqual(extractBase64FromContent(pngBase64), pngBase64);
  });

  it('裸 base64 无效魔数跳过', () => {
    const invalidContent = 'A'.repeat(200) + 'some text after';
    assert.strictEqual(extractBase64FromContent(invalidContent), null);
  });

  it('无图片返回 null', () => {
    assert.strictEqual(extractBase64FromContent('Just some text without images'), null);
    assert.strictEqual(extractBase64FromContent(''), null);
    assert.strictEqual(extractBase64FromContent(null), null);
  });

  it('jpeg 裸 base64 提取', () => {
    assert.strictEqual(extractBase64FromContent(jpegBase64), jpegBase64);
  });
});

describe('extractFromChatResponse', () => {
  const pngBase64 = 'iVBORw0KGgoICQoLSUhEUhAREhMUFRYXGBkaGxwdHh8gISIjJCUmJygpKissLS4vMDEyMzQ1Njc4OTo7PD0+P0BBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWltcXV5fYGFiY2RlZmdoaWprbG1ub3BxcnN0dXZ3';

  it('从 message.images 提取', () => {
    const data = {
      choices: [{
        message: {
          role: 'assistant',
          content: null,
          images: [{ type: 'image_url', image_url: { url: `data:image/png;base64,${pngBase64}` }, index: 0 }]
        }
      }]
    };
    assert.strictEqual(extractFromChatResponse(data), pngBase64);
  });

  it('从 content 回退提取', () => {
    const data = {
      choices: [{
        message: { role: 'assistant', content: `data:image/png;base64,${pngBase64}` }
      }]
    };
    assert.strictEqual(extractFromChatResponse(data), pngBase64);
  });

  it('无图片返回 null', () => {
    const data = { choices: [{ message: { role: 'assistant', content: 'text only' } }] };
    assert.strictEqual(extractFromChatResponse(data), null);
  });

  it('空 choices 返回 null', () => {
    assert.strictEqual(extractFromChatResponse({}), null);
  });
});

describe('parseArgs', () => {
  it('无参数', () => {
    const r = parseArgs([], '');
    assert.strictEqual(r.model, '');
    assert.strictEqual(r.forceChat, false);
    assert.strictEqual(r.prompt, undefined);
  });

  it('prompt + 文件名', () => {
    const r = parseArgs(['hello', 'out.png'], '');
    assert.strictEqual(r.prompt, 'hello');
    assert.strictEqual(r.filename, 'out.png');
  });

  it('-m 指定模型', () => {
    const r = parseArgs(['hello', '-m', 'gpt-image-2'], '');
    assert.strictEqual(r.model, 'gpt-image-2');
    assert.strictEqual(r.forceChat, false);
  });

  it('--model 指定模型', () => {
    const r = parseArgs(['hello', '--model', 'grok-4.2-image'], '');
    assert.strictEqual(r.model, 'grok-4.2-image');
  });

  it('--chat-model 强制 chat 路线', () => {
    const r = parseArgs(['hello', '--chat-model', 'gemini-3.1-flash-image'], '');
    assert.strictEqual(r.model, 'gemini-3.1-flash-image');
    assert.strictEqual(r.forceChat, true);
  });

  it('默认模型兜底', () => {
    const r = parseArgs(['hello'], 'default-model');
    assert.strictEqual(r.model, 'default-model');
  });

  it('--chat-model 优先级高于 --model', () => {
    const r = parseArgs(['hello', '-m', 'gpt-image-2', '--chat-model', 'gemini-3.1-flash-image'], '');
    assert.strictEqual(r.model, 'gemini-3.1-flash-image');
    assert.strictEqual(r.forceChat, true);
  });

  it('-s 指定尺寸', () => {
    const r = parseArgs(['hello', 'out.png', '-s', '1536x1024'], '');
    assert.strictEqual(r.size, '1536x1024');
  });

  it('--size 指定尺寸', () => {
    const r = parseArgs(['hello', '--size', '1024x1536'], '');
    assert.strictEqual(r.size, '1024x1536');
  });

  it('未传尺寸时 size 为空字符串', () => {
    const r = parseArgs(['hello', 'out.png'], '');
    assert.strictEqual(r.size, '');
  });

  it('--chat-model 与 --size 组合', () => {
    const r = parseArgs(['hello', '--chat-model', 'gemini-3.1-flash-image', '-s', '1536x1024'], '');
    assert.strictEqual(r.model, 'gemini-3.1-flash-image');
    assert.strictEqual(r.forceChat, true);
    assert.strictEqual(r.size, '1536x1024');
  });
});