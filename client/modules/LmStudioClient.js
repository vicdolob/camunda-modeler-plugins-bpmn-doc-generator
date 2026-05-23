/**
 * LLM Client — универсальный адаптер для OpenAI-compatible и Anthropic API.
 * Провайдеры: LM Studio, OpenAI, Anthropic, DeepSeek, Z.ai, Custom.
 */

// --- Provider presets ---
export var PROVIDERS = [
  {
    id: 'lmstudio',
    name: 'LM Studio (local)',
    endpoint: 'http://localhost:1234/v1',
    apiKey: 'lm-studio',
    model: '',
    apiFormat: 'openai'
  },
  {
    id: 'openai',
    name: 'OpenAI',
    endpoint: 'https://api.openai.com/v1',
    apiKey: '',
    model: 'gpt-4o',
    apiFormat: 'openai'
  },
  {
    id: 'anthropic',
    name: 'Anthropic',
    endpoint: 'https://api.anthropic.com',
    apiKey: '',
    model: 'claude-sonnet-4-20250514',
    apiFormat: 'anthropic'
  },
  {
    id: 'deepseek',
    name: 'DeepSeek',
    endpoint: 'https://api.deepseek.com/v1',
    apiKey: '',
    model: 'deepseek-chat',
    apiFormat: 'openai'
  },
  {
    id: 'zai',
    name: 'Z.ai',
    endpoint: 'https://api.z.ai/api/anthropic',
    apiKey: '',
    model: 'GLM-5.1',
    apiFormat: 'anthropic'
  },
  {
    id: 'custom',
    name: 'Custom (OpenAI-compatible)',
    endpoint: '',
    apiKey: '',
    model: '',
    apiFormat: 'openai'
  }
];

var DEFAULT_CONFIG = {
  providerId: 'lmstudio',
  endpoint: 'http://localhost:1234/v1',
  apiKey: 'lm-studio',
  model: '',
  apiFormat: 'openai',
  temperature: 0.3,
  maxTokens: 4096,
  stream: true,
  timeout: 120000
};

function mergeConfig(userConfig) {
  return Object.assign({}, DEFAULT_CONFIG, userConfig || {});
}

// --- Build request headers based on API format ---
function buildHeaders(cfg) {
  if (cfg.apiFormat === 'anthropic') {
    return {
      'Content-Type': 'application/json',
      'x-api-key': cfg.apiKey || '',
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true'
    };
  }
  // OpenAI-compatible
  return {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + (cfg.apiKey || 'lm-studio')
  };
}

// --- Convert OpenAI messages to Anthropic format ---
function toAnthropicMessages(messages) {
  var system = '';
  var converted = [];
  messages.forEach(function(m) {
    if (m.role === 'system') {
      system += (system ? '\n' : '') + m.content;
    } else {
      converted.push({ role: m.role, content: m.content });
    }
  });
  return { system: system, messages: converted };
}

/**
 * Check if server is reachable.
 */
export async function checkConnection(endpoint, apiKey, apiFormat) {
  var format = apiFormat || 'openai';
  try {
    if (format === 'anthropic') {
      // Anthropic doesn't have a /models endpoint in the same way, use a simple ping
      var resp = await fetch(endpoint + '/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey || '',
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        },
        body: JSON.stringify({ model: 'ping', messages: [], max_tokens: 1 }),
        signal: AbortSignal.timeout(5000)
      });
      // Any response (even error) means server is reachable
      return true;
    }
    // OpenAI-compatible: try /models
    var modelsUrl = (endpoint || DEFAULT_CONFIG.endpoint) + '/models';
    var resp2 = await fetch(modelsUrl, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + (apiKey || 'lm-studio') },
      signal: AbortSignal.timeout(5000)
    });
    return resp2.ok;
  } catch (e) {
    return false;
  }
}

/**
 * Get list of models (OpenAI-compatible only).
 */
export async function getModels(endpoint, apiKey) {
  var url = (endpoint || DEFAULT_CONFIG.endpoint) + '/models';
  try {
    var resp = await fetch(url, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer ' + (apiKey || 'lm-studio') },
      signal: AbortSignal.timeout(5000)
    });
    if (!resp.ok) return [];
    var data = await resp.json();
    return (data.data || []).map(function(m) { return m.id; });
  } catch (e) {
    return [];
  }
}

/**
 * Streaming chat completion. Handles both OpenAI and Anthropic formats.
 */
export async function completeStream(messages, config, onChunk) {
  var cfg = mergeConfig(config);
  var headers = buildHeaders(cfg);

  if (cfg.apiFormat === 'anthropic') {
    return await completeStreamAnthropic(messages, cfg, headers, onChunk);
  }
  return await completeStreamOpenAI(messages, cfg, headers, onChunk);
}

/**
 * OpenAI-compatible streaming.
 */
async function completeStreamOpenAI(messages, cfg, headers, onChunk) {
  var url = cfg.endpoint.replace(/\/+$/, '') + '/chat/completions';
  var body = {
    model: cfg.model || '',
    messages: messages,
    temperature: cfg.temperature,
    max_tokens: cfg.maxTokens,
    stream: true
  };

  var resp = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(cfg.timeout)
  });

  if (!resp.ok) {
    var errText = await resp.text().catch(function() { return ''; });
    if (resp.status === 404) throw new Error('Model not found. Check model name.');
    throw new Error('API error ' + resp.status + ': ' + errText.substring(0, 300));
  }

  return await readSSEStream(resp, onChunk, function(parsed) {
    return parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content;
  });
}

/**
 * Anthropic streaming.
 */
async function completeStreamAnthropic(messages, cfg, headers, onChunk) {
  var url = cfg.endpoint.replace(/\/+$/, '') + '/v1/messages';
  var anth = toAnthropicMessages(messages);
  var body = {
    model: cfg.model || 'claude-sonnet-4-20250514',
    messages: anth.messages,
    max_tokens: cfg.maxTokens || 4096,
    stream: true
  };
  if (anth.system) body.system = anth.system;

  var resp = await fetch(url, {
    method: 'POST',
    headers: headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(cfg.timeout)
  });

  if (!resp.ok) {
    var errText = await resp.text().catch(function() { return ''; });
    throw new Error('Anthropic API error ' + resp.status + ': ' + errText.substring(0, 300));
  }

  return await readSSEStream(resp, onChunk, function(parsed) {
    if (parsed.type === 'content_block_delta' && parsed.delta && parsed.delta.text) {
      return parsed.delta.text;
    }
    return null;
  });
}

/**
 * Generic SSE stream reader.
 */
async function readSSEStream(resp, onChunk, extractContent) {
  var reader = resp.body.getReader();
  var decoder = new TextDecoder();
  var fullText = '';
  var buffer = '';

  while (true) {
    var result = await reader.read();
    if (result.done) break;

    buffer += decoder.decode(result.value, { stream: true });
    var lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i].trim();
      if (!line || !line.startsWith('data: ')) continue;
      var payload = line.slice(6);
      if (payload === '[DONE]') continue;

      try {
        var parsed = JSON.parse(payload);
        var content = extractContent(parsed);
        if (content) {
          fullText += content;
          if (onChunk) onChunk(content);
        }
      } catch (e) {
        // skip malformed chunks
      }
    }
  }

  return fullText;
}

/**
 * Non-streaming completion (for simple calls).
 */
export async function complete(messages, config) {
  var cfg = mergeConfig(config);
  var headers = buildHeaders(cfg);

  if (cfg.apiFormat === 'anthropic') {
    var url = cfg.endpoint.replace(/\/+$/, '') + '/v1/messages';
    var anth = toAnthropicMessages(messages);
    var body = {
      model: cfg.model || 'claude-sonnet-4-20250514',
      messages: anth.messages,
      max_tokens: cfg.maxTokens || 4096
    };
    if (anth.system) body.system = anth.system;

    var resp = await fetch(url, {
      method: 'POST', headers: headers, body: JSON.stringify(body),
      signal: AbortSignal.timeout(cfg.timeout)
    });
    if (!resp.ok) throw new Error('Anthropic API error ' + resp.status);
    var data = await resp.json();
    return (data.content && data.content[0] && data.content[0].text) || '';
  }

  // OpenAI-compatible
  var url2 = cfg.endpoint.replace(/\/+$/, '') + '/chat/completions';
  var body2 = { model: cfg.model || '', messages: messages, temperature: cfg.temperature, max_tokens: cfg.maxTokens };

  var resp2 = await fetch(url2, {
    method: 'POST', headers: headers, body: JSON.stringify(body2),
    signal: AbortSignal.timeout(cfg.timeout)
  });
  if (!resp2.ok) throw new Error('API error ' + resp2.status);
  var data2 = await resp2.json();
  return (data2.choices && data2.choices[0] && data2.choices[0].message && data2.choices[0].message.content) || '';
}
