/**
 * MarkdownComposer — assembles final Markdown document from generated sections.
 */

/**
 * Compose a single Markdown document from sections.
 */
export function composeDocument(sections, metadata) {
  var lines = [];

  lines.push('# ' + (metadata.processName || 'Process') + ' — Documentation');
  lines.push('');
  lines.push('> **Model file:** ' + (metadata.fileName || 'untitled.bpmn'));
  lines.push('> **Process ID:** ' + (metadata.processId || ''));
  lines.push('> **Generated at:** ' + new Date().toISOString());
  lines.push('> **LLM model:** ' + (metadata.llmModel || 'unknown'));
  lines.push('');
  lines.push('---');
  lines.push('');

  // Section 1: Process Summary
  lines.push('## 1. Purpose and Objectives of the Process');
  lines.push('');
  lines.push(sections.summary || '(not generated)');
  lines.push('');

  // Section 2: Input Data
  lines.push('## 2. Input Data');
  lines.push('');
  lines.push(sections.inputs || '(not generated)');
  lines.push('');

  // Section 3: Execution Logic
  lines.push('## 3. Execution Logic');
  lines.push('');
  lines.push('### 3.1 Main Scenario');
  lines.push('');
  lines.push(sections.flowMain || '(not generated)');
  lines.push('');
  lines.push('### 3.2 Alternative Branches');
  lines.push('');
  lines.push(sections.flowBranches || '(not generated)');
  lines.push('');
  lines.push('### 3.3 Exceptions and Edge Cases');
  lines.push('');
  lines.push(sections.exceptions || '(not generated)');
  lines.push('');

  // Section 4: Output Data
  lines.push('## 4. Output Data');
  lines.push('');
  lines.push(sections.outputs || '(not generated)');
  lines.push('');

  // Section 5: Constraints and Remarks
  lines.push('## 5. Constraints and Remarks');
  lines.push('');
  lines.push(sections.constraints || '(not generated)');
  lines.push('');

  // Section 6: Key Terms
  lines.push('## 6. Key Terms');
  lines.push('');
  lines.push(sections.glossary || '(not generated)');
  lines.push('');

  lines.push('---');
  lines.push('');
  lines.push('*Document generated automatically by BPMN Doc Generator v1.0 plugin.*');
  lines.push('*Requires review and validation by a specialist.*');

  return lines.join('\n');
}

/**
 * Compose multi-file export set.
 * Returns { filename: content } map.
 */
export function composeMultiFile(sections, metadata) {
  var baseName = (metadata.processName || 'process').replace(/[^a-zA-Zа-яА-Я0-9_-]/g, '_');

  var files = {};

  // Overview file: sections 1, 2, 4
  files[baseName + '_overview.md'] = [
    '# ' + metadata.processName + ' — Overview',
    '',
    '> Model: ' + metadata.fileName + ' | Process ID: ' + metadata.processId,
    '',
    '## 1. Purpose and Objectives of the Process',
    '',
    sections.summary || '',
    '',
    '## 2. Input Data',
    '',
    sections.inputs || '',
    '',
    '## 4. Output Data',
    '',
    sections.outputs || '',
    ''
  ].join('\n');

  // Flow file: section 3
  files[baseName + '_flow.md'] = [
    '# ' + metadata.processName + ' — Execution Logic',
    '',
    '### 3.1 Main Scenario',
    '',
    sections.flowMain || '',
    '',
    '### 3.2 Alternative Branches',
    '',
    sections.flowBranches || '',
    '',
    '### 3.3 Exceptions and Edge Cases',
    '',
    sections.exceptions || '',
    ''
  ].join('\n');

  // Constraints file: section 5
  files[baseName + '_constraints.md'] = [
    '# ' + metadata.processName + ' — Constraints and Remarks',
    '',
    sections.constraints || '',
    ''
  ].join('\n');

  // Glossary file: section 6
  files[baseName + '_glossary.md'] = [
    '# ' + metadata.processName + ' — Key Terms',
    '',
    sections.glossary || '',
    ''
  ].join('\n');

  return files;
}

export default { composeDocument: composeDocument, composeMultiFile: composeMultiFile };
