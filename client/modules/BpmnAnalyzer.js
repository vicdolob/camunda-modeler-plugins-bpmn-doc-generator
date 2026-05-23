/**
 * BpmnAnalyzer — parses BPMN XML and ElementRegistry into a normalized ProcessGraph.
 */

var TASK_TYPES = [
  'bpmn:Task', 'bpmn:UserTask', 'bpmn:ServiceTask', 'bpmn:ScriptTask',
  'bpmn:BusinessRuleTask', 'bpmn:SendTask', 'bpmn:ReceiveTask', 'bpmn:ManualTask'
];

var GATEWAY_TYPES = [
  'bpmn:ExclusiveGateway', 'bpmn:InclusiveGateway',
  'bpmn:ParallelGateway', 'bpmn:EventBasedGateway'
];

var EVENT_TYPES = [
  'bpmn:StartEvent', 'bpmn:EndEvent',
  'bpmn:IntermediateCatchEvent', 'bpmn:IntermediateThrowEvent',
  'bpmn:BoundaryEvent'
];

function isType(bo, types) {
  return types.indexOf(bo.$type) >= 0;
}

function getDocumentation(bo) {
  if (!bo.documentation || bo.documentation.length === 0) return '';
  return bo.documentation.map(function(d) { return d.text || ''; }).join('\n');
}

function getExtensionProperties(bo) {
  var props = {};
  if (!bo.extensionElements) return props;
  var values = bo.extensionElements.values || [];
  values.forEach(function(el) {
    if (el.$type === 'camunda:Properties' && el.values) {
      el.values.forEach(function(p) {
        props[p.name] = p.value;
      });
    }
  });
  return props;
}

function extractElement(bo) {
  return {
    id: bo.id || '',
    type: bo.$type || '',
    name: bo.name || '',
    documentation: getDocumentation(bo),
    incoming: (bo.incoming || []).map(function(f) { return f.id || f; }),
    outgoing: (bo.outgoing || []).map(function(f) { return f.id || f; }),
    extensionProperties: getExtensionProperties(bo),
    warnings: []
  };
}

function extractEvent(bo) {
  var el = extractElement(bo);
  el.eventDefinitions = [];
  if (bo.eventDefinitions) {
    el.eventDefinitions = bo.eventDefinitions.map(function(ed) { return ed.$type; });
  }
  if (bo.attachedToRef) {
    el.attachedToRef = bo.attachedToRef.id || String(bo.attachedToRef);
  }
  return el;
}

function extractFlow(bo) {
  return {
    id: bo.id || '',
    name: bo.name || '',
    type: 'bpmn:SequenceFlow',
    sourceRef: bo.sourceRef ? (bo.sourceRef.id || '') : '',
    targetRef: bo.targetRef ? (bo.targetRef.id || '') : '',
    conditionExpression: bo.conditionExpression ? bo.conditionExpression.body || bo.conditionExpression.text || '' : '',
    documentation: getDocumentation(bo)
  };
}

function extractLane(bo) {
  return {
    id: bo.id || '',
    name: bo.name || '',
    flowNodeRef: (bo.flowNodeRef || []).map(function(n) { return n.id || n; })
  };
}

/**
 * Find all paths from StartEvents to EndEvents via BFS.
 */
function findPaths(elements, flows) {
  var adj = {};
  flows.forEach(function(f) {
    if (!adj[f.sourceRef]) adj[f.sourceRef] = [];
    adj[f.sourceRef].push({ target: f.targetRef, flowId: f.id, name: f.name });
  });

  var startIds = elements.filter(function(e) { return e.type === 'bpmn:StartEvent'; }).map(function(e) { return e.id; });
  var endIds = {};
  elements.filter(function(e) { return e.type === 'bpmn:EndEvent'; }).forEach(function(e) { endIds[e.id] = true; });

  var paths = [];
  var MAX_PATHS = 20;
  var MAX_DEPTH = 50;

  function dfs(current, path, visited) {
    if (paths.length >= MAX_PATHS) return;
    if (endIds[current]) {
      paths.push(path.slice());
      return;
    }
    if (path.length > MAX_DEPTH) return;

    var neighbors = adj[current] || [];
    neighbors.forEach(function(edge) {
      if (visited[edge.target]) return;
      visited[edge.target] = true;
      path.push({ elementId: edge.target, flowId: edge.flowId, flowName: edge.name });
      dfs(edge.target, path, visited);
      path.pop();
      delete visited[edge.target];
    });
  }

  startIds.forEach(function(sid) {
    var visited = {};
    visited[sid] = true;
    dfs(sid, [{ elementId: sid, flowId: null, flowName: null }], visited);
  });

  return paths;
}

/**
 * Build lane assignment map: elementId -> laneName
 */
function buildLaneMap(lanes) {
  var map = {};
  lanes.forEach(function(lane) {
    lane.flowNodeRef.forEach(function(ref) {
      map[ref] = lane.name || lane.id;
    });
  });
  return map;
}

/**
 * Analyze BPMN model from ElementRegistry.
 */
export function analyzeModel(elementRegistry, fileName) {
  var allBo = elementRegistry.getAll()
    .map(function(el) { return el.businessObject; })
    .filter(function(bo) { return bo && bo.$type; });

  var elements = [];
  var flows = [];
  var lanes = [];
  var processData = null;

  allBo.forEach(function(bo) {
    if (bo.$type === 'bpmn:Process' || bo.$type === 'bpmn:Participant') {
      if (bo.$type === 'bpmn:Participant' && bo.processRef) {
        var proc = bo.processRef;
        processData = {
          id: proc.id || '',
          name: proc.name || bo.name || '',
          isExecutable: proc.isExecutable || false,
          documentation: getDocumentation(proc)
        };
      } else if (bo.$type === 'bpmn:Process' && !processData) {
        processData = {
          id: bo.id || '',
          name: bo.name || '',
          isExecutable: bo.isExecutable || false,
          documentation: getDocumentation(bo)
        };
      }
    } else if (bo.$type === 'bpmn:Lane') {
      lanes.push(extractLane(bo));
    } else if (bo.$type === 'bpmn:SequenceFlow') {
      flows.push(extractFlow(bo));
    } else if (isType(bo, EVENT_TYPES)) {
      elements.push(extractEvent(bo));
    } else if (isType(bo, TASK_TYPES) || bo.$type === 'bpmn:SubProcess' || bo.$type === 'bpmn:CallActivity') {
      elements.push(extractElement(bo));
    } else if (isType(bo, GATEWAY_TYPES)) {
      var gw = extractElement(bo);
      gw.gatewayDirection = bo.gatewayDirection || '';
      gw.defaultFlow = bo.default ? bo.default.id : '';
      elements.push(gw);
    }
  });

  if (!processData) {
    processData = { id: 'unknown', name: 'Unknown Process', isExecutable: false, documentation: '' };
  }

  var laneMap = buildLaneMap(lanes);
  elements.forEach(function(el) {
    el.lane = laneMap[el.id] || '';
  });

  var paths = findPaths(elements, flows);

  var taskCount = elements.filter(function(e) { return isType({ $type: e.type }, TASK_TYPES); }).length;
  var eventCount = elements.filter(function(e) { return isType({ $type: e.type }, EVENT_TYPES); }).length;
  var gatewayCount = elements.filter(function(e) { return isType({ $type: e.type }, GATEWAY_TYPES); }).length;

  return {
    metadata: {
      fileName: fileName || 'untitled.bpmn',
      processId: processData.id,
      processName: processData.name,
      exportedAt: new Date().toISOString(),
      elementCount: elements.length,
      taskCount: taskCount,
      eventCount: eventCount,
      gatewayCount: gatewayCount
    },
    process: processData,
    lanes: lanes,
    elements: elements,
    flows: flows,
    paths: paths
  };
}

export default { analyzeModel: analyzeModel };
