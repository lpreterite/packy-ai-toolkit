function globMatch(str, pattern) {
  const regexStr = '^' + pattern.replace(/\*/g, '[^/]*') + '$';
  return new RegExp(regexStr).test(str);
}

function isChatRoute(model, allChatPatterns) {
  return allChatPatterns.some(p => globMatch(model, p));
}

function extractBase64FromContent(content) {
  if (!content) return null;
  const dataUriMatch = content.match(/data:image\/[a-z+]+;base64,([a-zA-Z0-9+/=]+)/i);
  if (dataUriMatch) return dataUriMatch[1];
  const mdMatch = content.match(/!\[.*?\]\(data:image\/[a-z+]+;base64,([a-zA-Z0-9+/=]+)\)/i);
  if (mdMatch) return mdMatch[1];
  const nakedMatch = content.match(/([a-zA-Z0-9+/=]{100,})/);
  if (nakedMatch) {
    const buf = Buffer.from(nakedMatch[1], 'base64');
    if (buf.length > 4) {
      const magic = buf.slice(0, 4).toString('latin1');
      if (magic === '\x89PNG' || magic.startsWith('\xff\xd8\xff')) return nakedMatch[1];
    }
  }
  return null;
}

function extractFromChatResponse(data) {
  const images = data.choices?.[0]?.message?.images;
  if (images?.[0]?.image_url?.url?.startsWith('data:')) {
    const match = images[0].image_url.url.match(/data:image\/[a-z+]+;base64,([a-zA-Z0-9+/=]+)/i);
    if (match) return match[1];
  }
  const content = data.choices?.[0]?.message?.content || data.choices?.[0]?.delta?.content || '';
  if (content) return extractBase64FromContent(content);
  return null;
}

function parseArgs(argv, defaultModel) {
  const values = [];
  let model = defaultModel;
  let forceChat = false;
  let size = '';
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '-m' || argv[i] === '--model') { model = argv[++i]; continue; }
    if (argv[i] === '--chat-model') { model = argv[++i]; forceChat = true; continue; }
    if (argv[i] === '-s' || argv[i] === '--size') { size = argv[++i] || ''; continue; }
    values.push(argv[i]);
  }
  return { prompt: values[0], filename: values[1] || '', model, forceChat, size };
}

module.exports = { globMatch, isChatRoute, extractBase64FromContent, extractFromChatResponse, parseArgs };