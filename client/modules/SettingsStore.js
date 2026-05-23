/**
 * SettingsStore — persistent storage for LLM connection settings.
 * Uses localStorage (available in Electron/Camunda Modeler context).
 */

var STORAGE_KEY = 'bpmnDocGen_settings';

var DEFAULT_SETTINGS = {
  providerId: 'lmstudio',
  endpoint: 'http://localhost:1234/v1',
  apiKey: 'lm-studio',
  model: '',
  apiFormat: 'openai',
  temperature: 0.3,
  maxTokens: 4096,
  language: 'ru',
  template: 'standard',
  detailLevel: 2
};

/**
 * Load settings from localStorage. Returns DEFAULT_SETTINGS if not found.
 */
export function loadSettings() {
  try {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULT_SETTINGS };
    var saved = JSON.parse(raw);
    // Merge with defaults to handle new fields added in updates
    return Object.assign({}, DEFAULT_SETTINGS, saved);
  } catch (e) {
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * Save settings to localStorage.
 */
export function saveSettings(settings) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    return true;
  } catch (e) {
    console.warn('[BPMN Doc Generator] Could not save settings:', e);
    return false;
  }
}

/**
 * Clear saved settings.
 */
export function clearSettings() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) { /* ignore */ }
}

export default { loadSettings: loadSettings, saveSettings: saveSettings, clearSettings: clearSettings };
