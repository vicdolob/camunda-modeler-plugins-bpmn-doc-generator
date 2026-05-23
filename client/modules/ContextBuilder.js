/**
 * ContextBuilder — assembles the PromptContext JSON object from ProcessGraph,
 * user requirements, generation profile, and LLM config.
 */

function formatElementsList(elements) {
  return elements.map(function(el) {
    var parts = ['- ' + el.type.replace('bpmn:', '') + ': ' + (el.name || '(unnamed)') + ' (id: ' + el.id + ')'];
    if (el.lane) parts.push('  Lane: ' + el.lane);
    if (el.documentation) parts.push('  Docs: ' + el.documentation.substring(0, 200));
    if (el.conditionExpression) parts.push('  Condition: ' + el.conditionExpression);
    if (el.eventDefinitions && el.eventDefinitions.length > 0) parts.push('  Events: ' + el.eventDefinitions.join(', '));
    return parts.join('\n');
  }).join('\n');
}

function formatFlowDescription(paths, elements) {
  if (!paths || paths.length === 0) return 'No paths found in the model.';

  var elMap = {};
  elements.forEach(function(e) { elMap[e.id] = e; });

  return paths.slice(0, 10).map(function(path, idx) {
    var steps = path.map(function(step) {
      var el = elMap[step.elementId];
      return (el ? (el.type.replace('bpmn:', '') + ' "' + (el.name || el.id) + '"') : step.elementId);
    });
    return 'Path ' + (idx + 1) + ': ' + steps.join(' -> ');
  }).join('\n');
}

function formatOrderedElements(elements, flows) {
  var adj = {};
  flows.forEach(function(f) {
    if (!adj[f.sourceRef]) adj[f.sourceRef] = [];
    adj[f.sourceRef].push(f.targetRef);
  });

  var visited = {};
  var ordered = [];

  function topoSort(id) {
    if (visited[id]) return;
    visited[id] = true;
    (adj[id] || []).forEach(topoSort);
    var el = elements.find(function(e) { return e.id === id; });
    if (el) ordered.push(el);
  }

  elements.filter(function(e) { return e.type === 'bpmn:StartEvent'; }).forEach(function(e) { topoSort(e.id); });
  // Add remaining elements not reachable from start
  elements.forEach(function(e) { if (!visited[e.id]) ordered.push(e); });

  return ordered.map(function(el) {
    return el.type.replace('bpmn:', '') + ' "' + (el.name || el.id) + '" (id: ' + el.id + ')' +
      (el.lane ? ' [Lane: ' + el.lane + ']' : '') +
      (el.documentation ? ' — ' + el.documentation.substring(0, 150) : '');
  }).join('\n');
}

function getGatewayConditions(elements, flows) {
  var flowMap = {};
  flows.forEach(function(f) { flowMap[f.id] = f; });

  return elements
    .filter(function(e) { return e.type.indexOf('Gateway') >= 0; })
    .map(function(gw) {
      var outFlows = gw.outgoing.map(function(fid) { return flowMap[fid]; }).filter(Boolean);
      var branches = outFlows.map(function(f) {
        var target = elements.find(function(e) { return e.id === f.targetRef; });
        return '  - ' + (f.name || f.id) + ' → ' + (target ? (target.name || target.id) : f.targetRef) +
          (f.conditionExpression ? ' [Condition: ' + f.conditionExpression + ']' : ' [No condition specified]');
      }).join('\n');
      return 'Gateway "' + (gw.name || gw.id) + '" (' + gw.type.replace('bpmn:', '') + '):\n' + branches;
    }).join('\n\n');
}

function getStartEventDetails(elements) {
  return elements.filter(function(e) { return e.type === 'bpmn:StartEvent'; })
    .map(function(e) {
      return '"' + (e.name || e.id) + '" (id: ' + e.id + ')' +
        (e.eventDefinitions && e.eventDefinitions.length > 0 ? ' events: ' + e.eventDefinitions.join(', ') : '') +
        (e.documentation ? ' — ' + e.documentation : '');
    }).join('; ') || 'None';
}

function getEndEventDetails(elements) {
  return elements.filter(function(e) { return e.type === 'bpmn:EndEvent'; })
    .map(function(e) {
      return '"' + (e.name || e.id) + '" (id: ' + e.id + ')' +
        (e.eventDefinitions && e.eventDefinitions.length > 0 ? ' events: ' + e.eventDefinitions.join(', ') : '') +
        (e.documentation ? ' — ' + e.documentation : '');
    }).join('; ') || 'None';
}

function getFirstTasks(elements, flows) {
  var startIds = elements.filter(function(e) { return e.type === 'bpmn:StartEvent'; }).map(function(e) { return e.id; });
  var firstTaskIds = new Set();
  flows.forEach(function(f) {
    if (startIds.indexOf(f.sourceRef) >= 0) {
      var target = elements.find(function(e) { return e.id === f.targetRef; });
      if (target) firstTaskIds.add(target);
    }
  });
  return Array.from(firstTaskIds).map(function(e) {
    return '"' + (e.name || e.id) + '" (id: ' + e.id + ')';
  }).join('; ') || 'None';
}

function getLastTasks(elements, flows) {
  var endIds = {};
  elements.filter(function(e) { return e.type === 'bpmn:EndEvent'; }).forEach(function(e) { endIds[e.id] = true; });
  var lastTaskIds = new Set();
  flows.forEach(function(f) {
    if (endIds[f.targetRef]) {
      var source = elements.find(function(e) { return e.id === f.sourceRef; });
      if (source) lastTaskIds.add(source);
    }
  });
  return Array.from(lastTaskIds).map(function(e) {
    return '"' + (e.name || e.id) + '" (id: ' + e.id + ')';
  }).join('; ') || 'None';
}

function getExtensionData(elements) {
  return elements
    .filter(function(e) { return e.documentation || Object.keys(e.extensionProperties || {}).length > 0; })
    .map(function(e) {
      var parts = [e.type.replace('bpmn:', '') + ' "' + (e.name || e.id) + '"'];
      if (e.documentation) parts.push('  Docs: ' + e.documentation);
      var keys = Object.keys(e.extensionProperties || {});
      if (keys.length > 0) {
        parts.push('  Extensions: ' + keys.map(function(k) { return k + '=' + e.extensionProperties[k]; }).join(', '));
      }
      return parts.join('\n');
    }).join('\n\n') || 'No extension data found.';
}

/**
 * Build a PromptContext from ProcessGraph and user inputs.
 */
export function buildContext(processGraph, requirementsText, profile, llmConfig) {
  var elements = processGraph.elements || [];
  var flows = processGraph.flows || [];
  var lanes = processGraph.lanes || [];
  var meta = processGraph.metadata || {};

  var bpmnSummary = [
    'Process: ' + meta.processName + ' (ID: ' + meta.processId + ')',
    'Total elements: ' + meta.elementCount + ' (tasks: ' + meta.taskCount + ', events: ' + meta.eventCount + ', gateways: ' + meta.gatewayCount + ')',
    'Lanes (participants): ' + lanes.map(function(l) { return l.name || l.id; }).join(', '),
    'Start events: ' + getStartEventDetails(elements),
    'End events: ' + getEndEventDetails(elements),
    'Process documentation: ' + (processGraph.process.documentation || '(none)')
  ].join('\n');

  return {
    bpmnSummary: bpmnSummary,
    elementsList: formatElementsList(elements),
    flowDescription: formatFlowDescription(processGraph.paths, elements),
    orderedElements: formatOrderedElements(elements, flows),
    gatewayConditions: getGatewayConditions(elements, flows),
    startEventDetails: getStartEventDetails(elements),
    endEventDetails: getEndEventDetails(elements),
    firstTasks: getFirstTasks(elements, flows),
    lastTasks: getLastTasks(elements, flows),
    extensionData: getExtensionData(elements),
    allElementNames: elements.map(function(e) { return e.name || e.id; }).join(', '),
    laneNames: lanes.map(function(l) { return l.name || l.id; }).join(', '),
    allDocumentation: elements.filter(function(e) { return e.documentation; })
      .map(function(e) { return e.type.replace('bpmn:', '') + ' "' + (e.name || e.id) + '": ' + e.documentation; }).join('\n'),
    boundaryEvents: elements.filter(function(e) { return e.type === 'bpmn:BoundaryEvent'; })
      .map(function(e) { return '"' + (e.name || e.id) + '" attached to ' + (e.attachedToRef || '?') + ' events: ' + (e.eventDefinitions || []).join(', '); }).join('\n') || 'None',
    errorEvents: elements.filter(function(e) { return e.eventDefinitions && e.eventDefinitions.indexOf('bpmn:ErrorEventDefinition') >= 0; })
      .map(function(e) { return '"' + (e.name || e.id) + '" (id: ' + e.id + ')'; }).join('\n') || 'None',
    timerEvents: elements.filter(function(e) { return e.eventDefinitions && e.eventDefinitions.indexOf('bpmn:TimerEventDefinition') >= 0; })
      .map(function(e) { return '"' + (e.name || e.id) + '" (id: ' + e.id + ')'; }).join('\n') || 'None',
    businessRuleTasks: elements.filter(function(e) { return e.type === 'bpmn:BusinessRuleTask'; })
      .map(function(e) { return '"' + (e.name || e.id) + '" (id: ' + e.id + ')'; }).join('\n') || 'None',
    requirementsText: requirementsText || '',
    generationProfile: profile || { template: 'standard', language: 'ru', detailLevel: 2 },
    llmConfig: llmConfig || {},
    processGraph: processGraph
  };
}

export default { buildContext: buildContext };
