/**
 * LmStudioClient — HTTP adapter for LM Studio OpenAI-compatible API.
 * Supports connection check, model listing, and streaming chat completions.
 */

var DEFAULT_CONFIG = {
  endpoint: 'http://localhost:1234/v1',
  apiKey: 'lm-studio',
  temperature: 0.3,
  maxTokens: 4096,
  stream: true,
  timeout: 120000
};

function mergeConfig(userConfig) {
  return Object.assign({}, DEFAULT_CONFIG, userConfig || {});
}

/**
 * Check if LM Studio server is reachable.
 */
export async function checkConnection(endpoint) {
  var url = (endpoint || DEFAULT_CONFIG.endpoint) + '/models';
  try {
    var resp = await fetch(url, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer lm-studio' },
      signal: AbortSignal.timeout(5000)
    });
    return resp.ok;
  } catch (e) {
    return false;
  }
}

/**
 * Get list of loaded models from LM Studio.
 */
export async function getModels(endpoint) {
  var url = (endpoint || DEFAULT_CONFIG.endpoint) + '/models';
  try {
    var resp = await fetch(url, {
      method: 'GET',
      headers: { 'Authorization': 'Bearer lm-studio' },
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
 * Non-streaming chat completion.
 */
export async function complete(messages, config) {
  var cfg = mergeConfig(config);
  var url = cfg.endpoint + '/chat/completions';

  var body = {
    model: cfg.model || '',
    messages: messages,
    temperature: cfg.temperature,
    max_tokens: cfg.maxTokens,
    stream: false
  };

  var resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + cfg.apiKey
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(cfg.timeout)
  });

  if (!resp.ok) {
    var errText = await resp.text().catch(function() { return ''; });
    throw new Error('LM Studio error ' + resp.status + ': ' + errText);
  }

  var data = await resp.json();
  return (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '';
}

/**
 * Streaming chat completion. Calls onChunk for each SSE data chunk.
 * Returns the full accumulated text.
 */
export async function completeStream(messages, config, onChunk) {
  var cfg = mergeConfig(config);
  var url = cfg.endpoint + '/chat/completions';

  var body = {
    model: cfg.model || '',
    messages: messages,
    temperature: cfg.temperature,
    max_tokens: cfg.maxTokens,
    stream: true
  };

  var resp = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer ' + cfg.apiKey
    },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(cfg.timeout)
  });

  if (!resp.ok) {
    var errText = await resp.text().catch(function() { return ''; });
    if (resp.status === 404) {
      throw new Error('Model not loaded in LM Studio. Load a model before generating.');
    }
    throw new Error('LM Studio error ' + resp.status + ': ' + errText);
  }

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
        var content = parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content;
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
 * Class wrapper matching PRD interface.
 */
var LmStudioClient = function(config) {
  this.config = mergeConfig(config);
};

LmStudioClient.prototype.checkConnection = function() {
  return checkConnection(this.config.endpoint);
};

LmStudioClient.prototype.getModels = function() {
  return getModels(this.config.endpoint);
};

LmStudioClient.prototype.complete = function(messages, config) {
  return complete(messages, Object.assign({}, this.config, config));
};

LmStudioClient.prototype.completeStream = function(messages, config, onChunk) {
  return completeStream(messages, Object.assign({}, this.config, config), onChunk);
};

export { LmStudioClient };
export default LmStudioClient;
