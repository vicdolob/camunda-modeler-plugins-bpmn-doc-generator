/**
 * QualityChecker — validates BPMN model completeness before generation.
 */

/**
 * Run all quality checks on a ProcessGraph.
 * Returns { warnings: QualityWarning[], coverage: number, coverageText: string }
 */
export function runChecks(processGraph) {
  var warnings = [];
  var elements = processGraph.elements || [];
  var totalElements = elements.length;

  if (totalElements === 0) {
    warnings.push({ level: 'ERROR', message: 'Model has no elements. Nothing to document.' });
    return { warnings: warnings, coverage: 0, coverageText: '0% (0 elements)' };
  }

  // Check for StartEvent
  var startEvents = elements.filter(function(e) { return e.type === 'bpmn:StartEvent'; });
  if (startEvents.length === 0) {
    warnings.push({ level: 'ERROR', message: 'Model has no StartEvent. Generation is impossible.' });
  }

  // Check for EndEvent
  var endEvents = elements.filter(function(e) { return e.type === 'bpmn:EndEvent'; });
  if (endEvents.length === 0) {
    warnings.push({ level: 'WARNING', message: 'Model has no EndEvent. Process structure is incomplete.' });
  }

  // Elements without names
  var unnamedCount = 0;
  elements.forEach(function(el) {
    if (!el.name || el.name.trim() === '') {
      if (el.type !== 'bpmn:StartEvent' && el.type !== 'bpmn:EndEvent') {
        unnamedCount++;
        warnings.push({
          level: 'WARNING',
          message: 'Unnamed element: ' + el.type + ' (id=' + el.id + '). Generation may be inaccurate.'
        });
      }
    }
  });
  if (unnamedCount > 3) {
    warnings.push({
      level: 'INFO',
      message: unnamedCount + ' elements have no name. Consider naming all elements for better results.'
    });
  }

  // Elements without documentation
  var noDoc = elements.filter(function(e) { return !e.documentation || e.documentation.trim() === ''; });
  if (noDoc.length > 0) {
    warnings.push({
      level: 'INFO',
      message: 'No documentation for ' + noDoc.length + ' element(s). Recommended to add docs in the model.'
    });
  }

  // Gateways without conditions
  var flows = processGraph.flows || [];
  var gatewayOutgoing = {};
  elements.forEach(function(el) {
    if (el.type.indexOf('Gateway') >= 0) {
      el.outgoing.forEach(function(fId) {
        gatewayOutgoing[fId] = el;
      });
    }
  });
  flows.forEach(function(f) {
    if (gatewayOutgoing[f.id] && (!f.conditionExpression || f.conditionExpression.trim() === '')) {
      var gw = gatewayOutgoing[f.id];
      warnings.push({
        level: 'WARNING',
        message: "Gateway '" + (gw.name || gw.id) + "' has outgoing flow without condition. Branch section will be incomplete."
      });
    }
  });

  // Large model warning
  if (totalElements > 50) {
    warnings.push({
      level: 'INFO',
      message: 'Large model (' + totalElements + ' elements). Generation will take longer.'
    });
  }

  // Coverage calculation
  var documented = elements.filter(function(e) {
    return (e.name && e.name.trim()) || (e.documentation && e.documentation.trim());
  }).length;
  var coverage = totalElements > 0 ? Math.round((documented / totalElements) * 100) : 0;
  var coverageText = coverage + '% (' + documented + ' of ' + totalElements + ' elements documented)';

  return { warnings: warnings, coverage: coverage, coverageText: coverageText };
}

export default { runChecks: runChecks };
