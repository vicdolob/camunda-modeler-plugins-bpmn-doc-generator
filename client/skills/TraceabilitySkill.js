/**
 * Skill 7: TraceabilitySkill
 * Deterministic post-processor — no LLM call.
 * Adds BPMN element id references to generated sections.
 */

/**
 * Find element names mentioned in text and add traceability links.
 */
export function addTraceability(sectionText, elements) {
  if (!sectionText || !elements || elements.length === 0) return sectionText;

  var annotated = sectionText;

  // Sort elements by name length (longest first) to avoid partial matches
  var sorted = elements.slice().sort(function(a, b) {
    return (b.name || '').length - (a.name || '').length;
  });

  sorted.forEach(function(el) {
    if (!el.name || el.name.trim() === '') return;

    var name = el.name;
    var escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    // Only annotate first occurrence of each element name
    var regex = new RegExp('(' + escaped + ')(?!\\s*\\(id:)', 'i');
    var alreadyAnnotated = annotated.indexOf('(id: ' + el.id + ')') >= 0;

    if (!alreadyAnnotated) {
      annotated = annotated.replace(regex, '$1 (id: ' + el.id + ')');
    }
  });

  return annotated;
}

/**
 * Apply traceability to all sections in a sections object.
 */
export function applyTraceability(sections, elements) {
  var result = {};
  for (var key in sections) {
    if (!sections.hasOwnProperty(key)) continue;
    result[key] = addTraceability(sections[key], elements);
  }
  return result;
}

export var TraceabilitySkill = {
  name: 'Traceability',
  sectionKey: 'traceability',

  execute: async function(context) {
    // This is a post-processor — it modifies sections in place via the orchestrator callback
    // The actual traceability is applied after all skills complete
    return '[traceability applied]';
  }
};

export default TraceabilitySkill;
