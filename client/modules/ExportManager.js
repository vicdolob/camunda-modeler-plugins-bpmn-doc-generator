/**
 * ExportManager — handles file saving via Electron IPC.
 * The main process (menu.js) registers IPC handlers for save operations.
 */

/**
 * Save a single Markdown file.
 * Uses Electron dialog.showSaveDialog via IPC.
 */
export async function saveSingleFile(content, defaultName) {
  // Check if we have access to Electron IPC
  if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.saveMarkdown) {
    return await window.electronAPI.saveMarkdown(content, defaultName);
  }

  // Fallback: trigger browser download (works in sandboxed contexts)
  var blob = new Blob([content], { type: 'text/markdown;charset=utf-8' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = defaultName || 'documentation.md';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
  return defaultName || 'documentation.md';
}

/**
 * Save multiple Markdown files to a directory.
 * Uses Electron IPC for directory selection.
 */
export async function saveMultipleFiles(files) {
  if (typeof window !== 'undefined' && window.electronAPI && window.electronAPI.saveMultipleFiles) {
    return await window.electronAPI.saveMultipleFiles(files);
  }

  // Fallback: save each file individually via download
  var saved = [];
  for (var name in files) {
    if (!files.hasOwnProperty(name)) continue;
    var result = await saveSingleFile(files[name], name);
    saved.push(result);
  }
  return saved;
}

/**
 * Copy text content to clipboard.
 */
export function copyToClipboard(text) {
  if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text);
  }
  // Fallback for older Electron
  var textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
  return Promise.resolve();
}

export default { saveSingleFile: saveSingleFile, saveMultipleFiles: saveMultipleFiles, copyToClipboard: copyToClipboard };
