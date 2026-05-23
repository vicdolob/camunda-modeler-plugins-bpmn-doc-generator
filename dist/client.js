var __bpmnDocGenerator = (() => {
  var __create = Object.create;
  var __defProp = Object.defineProperty;
  var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
  var __getOwnPropNames = Object.getOwnPropertyNames;
  var __getProtoOf = Object.getPrototypeOf;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __commonJS = (cb, mod) => function __require() {
    return mod || (0, cb[__getOwnPropNames(cb)[0]])((mod = { exports: {} }).exports, mod), mod.exports;
  };
  var __copyProps = (to, from, except, desc) => {
    if (from && typeof from === "object" || typeof from === "function") {
      for (let key of __getOwnPropNames(from))
        if (!__hasOwnProp.call(to, key) && key !== except)
          __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
    }
    return to;
  };
  var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
    // If the importer is in node compatibility mode or this is not an ESM
    // file that has been converted to a CommonJS file using a Babel-
    // compatible transform (i.e. "__esModule" has not been set), then set
    // "default" to the CommonJS "module.exports" for node compatibility.
    isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
    mod
  ));

  // vendor/react.js
  var require_react = __commonJS({
    "vendor/react.js"(exports, module) {
      var React3 = window.react;
      module.exports = React3;
    }
  });

  // node_modules/camunda-modeler-plugin-helpers/helper.js
  var require_helper = __commonJS({
    "node_modules/camunda-modeler-plugin-helpers/helper.js"(exports, module) {
      function returnOrThrow2(getter, minimalModelerVersion) {
        let result;
        try {
          result = getter();
        } catch (error) {
        }
        if (!result) {
          throw new Error(`Not compatible with Camunda Modeler < ${minimalModelerVersion}`);
        }
        return result;
      }
      module.exports = {
        returnOrThrow: returnOrThrow2
      };
    }
  });

  // client/client.js
  var import_react2 = __toESM(require_react());

  // node_modules/camunda-modeler-plugin-helpers/index.js
  function registerClientPlugin(plugin, type) {
    var plugins = window.plugins || [];
    window.plugins = plugins;
    if (!plugin) {
      throw new Error("plugin not specified");
    }
    if (!type) {
      throw new Error("type not specified");
    }
    plugins.push({
      plugin,
      type
    });
  }
  function registerClientExtension(component) {
    registerClientPlugin(component, "client");
  }
  function registerBpmnJSPlugin(module) {
    registerClientPlugin(module, "bpmn.modeler.additionalModules");
  }

  // client/BpmnDocPanel.jsx
  var import_react = __toESM(require_react());

  // node_modules/camunda-modeler-plugin-helpers/components/Fill.js
  var import_helper = __toESM(require_helper());
  var Fill_default = (0, import_helper.returnOrThrow)(() => window.components?.Fill, "5.0");

  // client/modules/BpmnAnalyzer.js
  var TASK_TYPES = [
    "bpmn:Task",
    "bpmn:UserTask",
    "bpmn:ServiceTask",
    "bpmn:ScriptTask",
    "bpmn:BusinessRuleTask",
    "bpmn:SendTask",
    "bpmn:ReceiveTask",
    "bpmn:ManualTask"
  ];
  var GATEWAY_TYPES = [
    "bpmn:ExclusiveGateway",
    "bpmn:InclusiveGateway",
    "bpmn:ParallelGateway",
    "bpmn:EventBasedGateway"
  ];
  var EVENT_TYPES = [
    "bpmn:StartEvent",
    "bpmn:EndEvent",
    "bpmn:IntermediateCatchEvent",
    "bpmn:IntermediateThrowEvent",
    "bpmn:BoundaryEvent"
  ];
  function isType(bo, types) {
    return types.indexOf(bo.$type) >= 0;
  }
  function getDocumentation(bo) {
    if (!bo.documentation || bo.documentation.length === 0) return "";
    return bo.documentation.map(function(d) {
      return d.text || "";
    }).join("\n");
  }
  function getExtensionProperties(bo) {
    var props = {};
    if (!bo.extensionElements) return props;
    var values = bo.extensionElements.values || [];
    values.forEach(function(el) {
      if (el.$type === "camunda:Properties" && el.values) {
        el.values.forEach(function(p) {
          props[p.name] = p.value;
        });
      }
    });
    return props;
  }
  function extractElement(bo) {
    return {
      id: bo.id || "",
      type: bo.$type || "",
      name: bo.name || "",
      documentation: getDocumentation(bo),
      incoming: (bo.incoming || []).map(function(f) {
        return f.id || f;
      }),
      outgoing: (bo.outgoing || []).map(function(f) {
        return f.id || f;
      }),
      extensionProperties: getExtensionProperties(bo),
      warnings: []
    };
  }
  function extractEvent(bo) {
    var el = extractElement(bo);
    el.eventDefinitions = [];
    if (bo.eventDefinitions) {
      el.eventDefinitions = bo.eventDefinitions.map(function(ed) {
        return ed.$type;
      });
    }
    if (bo.attachedToRef) {
      el.attachedToRef = bo.attachedToRef.id || String(bo.attachedToRef);
    }
    return el;
  }
  function extractFlow(bo) {
    return {
      id: bo.id || "",
      name: bo.name || "",
      type: "bpmn:SequenceFlow",
      sourceRef: bo.sourceRef ? bo.sourceRef.id || "" : "",
      targetRef: bo.targetRef ? bo.targetRef.id || "" : "",
      conditionExpression: bo.conditionExpression ? bo.conditionExpression.body || bo.conditionExpression.text || "" : "",
      documentation: getDocumentation(bo)
    };
  }
  function extractLane(bo) {
    return {
      id: bo.id || "",
      name: bo.name || "",
      flowNodeRef: (bo.flowNodeRef || []).map(function(n) {
        return n.id || n;
      })
    };
  }
  function findPaths(elements, flows) {
    var adj = {};
    flows.forEach(function(f) {
      if (!adj[f.sourceRef]) adj[f.sourceRef] = [];
      adj[f.sourceRef].push({ target: f.targetRef, flowId: f.id, name: f.name });
    });
    var startIds = elements.filter(function(e) {
      return e.type === "bpmn:StartEvent";
    }).map(function(e) {
      return e.id;
    });
    var endIds = {};
    elements.filter(function(e) {
      return e.type === "bpmn:EndEvent";
    }).forEach(function(e) {
      endIds[e.id] = true;
    });
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
  function buildLaneMap(lanes) {
    var map = {};
    lanes.forEach(function(lane) {
      lane.flowNodeRef.forEach(function(ref) {
        map[ref] = lane.name || lane.id;
      });
    });
    return map;
  }
  function analyzeModel(elementRegistry, fileName) {
    var allBo = elementRegistry.getAll().map(function(el) {
      return el.businessObject;
    }).filter(function(bo) {
      return bo && bo.$type;
    });
    var elements = [];
    var flows = [];
    var lanes = [];
    var processData = null;
    allBo.forEach(function(bo) {
      if (bo.$type === "bpmn:Process" || bo.$type === "bpmn:Participant") {
        if (bo.$type === "bpmn:Participant" && bo.processRef) {
          var proc = bo.processRef;
          processData = {
            id: proc.id || "",
            name: proc.name || bo.name || "",
            isExecutable: proc.isExecutable || false,
            documentation: getDocumentation(proc)
          };
        } else if (bo.$type === "bpmn:Process" && !processData) {
          processData = {
            id: bo.id || "",
            name: bo.name || "",
            isExecutable: bo.isExecutable || false,
            documentation: getDocumentation(bo)
          };
        }
      } else if (bo.$type === "bpmn:Lane") {
        lanes.push(extractLane(bo));
      } else if (bo.$type === "bpmn:SequenceFlow") {
        flows.push(extractFlow(bo));
      } else if (isType(bo, EVENT_TYPES)) {
        elements.push(extractEvent(bo));
      } else if (isType(bo, TASK_TYPES) || bo.$type === "bpmn:SubProcess" || bo.$type === "bpmn:CallActivity") {
        elements.push(extractElement(bo));
      } else if (isType(bo, GATEWAY_TYPES)) {
        var gw = extractElement(bo);
        gw.gatewayDirection = bo.gatewayDirection || "";
        gw.defaultFlow = bo.default ? bo.default.id : "";
        elements.push(gw);
      }
    });
    if (!processData) {
      processData = { id: "unknown", name: "Unknown Process", isExecutable: false, documentation: "" };
    }
    var laneMap = buildLaneMap(lanes);
    elements.forEach(function(el) {
      el.lane = laneMap[el.id] || "";
    });
    var paths = findPaths(elements, flows);
    var taskCount = elements.filter(function(e) {
      return isType({ $type: e.type }, TASK_TYPES);
    }).length;
    var eventCount = elements.filter(function(e) {
      return isType({ $type: e.type }, EVENT_TYPES);
    }).length;
    var gatewayCount = elements.filter(function(e) {
      return isType({ $type: e.type }, GATEWAY_TYPES);
    }).length;
    return {
      metadata: {
        fileName: fileName || "untitled.bpmn",
        processId: processData.id,
        processName: processData.name,
        exportedAt: (/* @__PURE__ */ new Date()).toISOString(),
        elementCount: elements.length,
        taskCount,
        eventCount,
        gatewayCount
      },
      process: processData,
      lanes,
      elements,
      flows,
      paths
    };
  }

  // client/modules/LmStudioClient.js
  var DEFAULT_CONFIG = {
    endpoint: "http://localhost:1234/v1",
    apiKey: "lm-studio",
    temperature: 0.3,
    maxTokens: 4096,
    stream: true,
    timeout: 12e4
  };
  function mergeConfig(userConfig) {
    return Object.assign({}, DEFAULT_CONFIG, userConfig || {});
  }
  async function checkConnection(endpoint) {
    var url = (endpoint || DEFAULT_CONFIG.endpoint) + "/models";
    try {
      var resp = await fetch(url, {
        method: "GET",
        headers: { "Authorization": "Bearer lm-studio" },
        signal: AbortSignal.timeout(5e3)
      });
      return resp.ok;
    } catch (e) {
      return false;
    }
  }
  async function getModels(endpoint) {
    var url = (endpoint || DEFAULT_CONFIG.endpoint) + "/models";
    try {
      var resp = await fetch(url, {
        method: "GET",
        headers: { "Authorization": "Bearer lm-studio" },
        signal: AbortSignal.timeout(5e3)
      });
      if (!resp.ok) return [];
      var data = await resp.json();
      return (data.data || []).map(function(m) {
        return m.id;
      });
    } catch (e) {
      return [];
    }
  }
  async function complete(messages, config) {
    var cfg = mergeConfig(config);
    var url = cfg.endpoint + "/chat/completions";
    var body = {
      model: cfg.model || "",
      messages,
      temperature: cfg.temperature,
      max_tokens: cfg.maxTokens,
      stream: false
    };
    var resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + cfg.apiKey
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(cfg.timeout)
    });
    if (!resp.ok) {
      var errText = await resp.text().catch(function() {
        return "";
      });
      throw new Error("LM Studio error " + resp.status + ": " + errText);
    }
    var data = await resp.json();
    return data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content || "";
  }
  async function completeStream(messages, config, onChunk) {
    var cfg = mergeConfig(config);
    var url = cfg.endpoint + "/chat/completions";
    var body = {
      model: cfg.model || "",
      messages,
      temperature: cfg.temperature,
      max_tokens: cfg.maxTokens,
      stream: true
    };
    var resp = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + cfg.apiKey
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(cfg.timeout)
    });
    if (!resp.ok) {
      var errText = await resp.text().catch(function() {
        return "";
      });
      if (resp.status === 404) {
        throw new Error("Model not loaded in LM Studio. Load a model before generating.");
      }
      throw new Error("LM Studio error " + resp.status + ": " + errText);
    }
    var reader = resp.body.getReader();
    var decoder = new TextDecoder();
    var fullText = "";
    var buffer = "";
    while (true) {
      var result = await reader.read();
      if (result.done) break;
      buffer += decoder.decode(result.value, { stream: true });
      var lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (var i = 0; i < lines.length; i++) {
        var line = lines[i].trim();
        if (!line || !line.startsWith("data: ")) continue;
        var payload = line.slice(6);
        if (payload === "[DONE]") continue;
        try {
          var parsed = JSON.parse(payload);
          var content = parsed.choices && parsed.choices[0] && parsed.choices[0].delta && parsed.choices[0].delta.content;
          if (content) {
            fullText += content;
            if (onChunk) onChunk(content);
          }
        } catch (e) {
        }
      }
    }
    return fullText;
  }
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

  // client/modules/QualityChecker.js
  function runChecks(processGraph) {
    var warnings = [];
    var elements = processGraph.elements || [];
    var totalElements = elements.length;
    if (totalElements === 0) {
      warnings.push({ level: "ERROR", message: "Model has no elements. Nothing to document." });
      return { warnings, coverage: 0, coverageText: "0% (0 elements)" };
    }
    var startEvents = elements.filter(function(e) {
      return e.type === "bpmn:StartEvent";
    });
    if (startEvents.length === 0) {
      warnings.push({ level: "ERROR", message: "Model has no StartEvent. Generation is impossible." });
    }
    var endEvents = elements.filter(function(e) {
      return e.type === "bpmn:EndEvent";
    });
    if (endEvents.length === 0) {
      warnings.push({ level: "WARNING", message: "Model has no EndEvent. Process structure is incomplete." });
    }
    var unnamedCount = 0;
    elements.forEach(function(el) {
      if (!el.name || el.name.trim() === "") {
        if (el.type !== "bpmn:StartEvent" && el.type !== "bpmn:EndEvent") {
          unnamedCount++;
          warnings.push({
            level: "WARNING",
            message: "Unnamed element: " + el.type + " (id=" + el.id + "). Generation may be inaccurate."
          });
        }
      }
    });
    if (unnamedCount > 3) {
      warnings.push({
        level: "INFO",
        message: unnamedCount + " elements have no name. Consider naming all elements for better results."
      });
    }
    var noDoc = elements.filter(function(e) {
      return !e.documentation || e.documentation.trim() === "";
    });
    if (noDoc.length > 0) {
      warnings.push({
        level: "INFO",
        message: "No documentation for " + noDoc.length + " element(s). Recommended to add docs in the model."
      });
    }
    var flows = processGraph.flows || [];
    var gatewayOutgoing = {};
    elements.forEach(function(el) {
      if (el.type.indexOf("Gateway") >= 0) {
        el.outgoing.forEach(function(fId) {
          gatewayOutgoing[fId] = el;
        });
      }
    });
    flows.forEach(function(f) {
      if (gatewayOutgoing[f.id] && (!f.conditionExpression || f.conditionExpression.trim() === "")) {
        var gw = gatewayOutgoing[f.id];
        warnings.push({
          level: "WARNING",
          message: "Gateway '" + (gw.name || gw.id) + "' has outgoing flow without condition. Branch section will be incomplete."
        });
      }
    });
    if (totalElements > 50) {
      warnings.push({
        level: "INFO",
        message: "Large model (" + totalElements + " elements). Generation will take longer."
      });
    }
    var documented = elements.filter(function(e) {
      return e.name && e.name.trim() || e.documentation && e.documentation.trim();
    }).length;
    var coverage = totalElements > 0 ? Math.round(documented / totalElements * 100) : 0;
    var coverageText = coverage + "% (" + documented + " of " + totalElements + " elements documented)";
    return { warnings, coverage, coverageText };
  }

  // client/modules/ContextBuilder.js
  function formatElementsList(elements) {
    return elements.map(function(el) {
      var parts = ["- " + el.type.replace("bpmn:", "") + ": " + (el.name || "(unnamed)") + " (id: " + el.id + ")"];
      if (el.lane) parts.push("  Lane: " + el.lane);
      if (el.documentation) parts.push("  Docs: " + el.documentation.substring(0, 200));
      if (el.conditionExpression) parts.push("  Condition: " + el.conditionExpression);
      if (el.eventDefinitions && el.eventDefinitions.length > 0) parts.push("  Events: " + el.eventDefinitions.join(", "));
      return parts.join("\n");
    }).join("\n");
  }
  function formatFlowDescription(paths, elements) {
    if (!paths || paths.length === 0) return "No paths found in the model.";
    var elMap = {};
    elements.forEach(function(e) {
      elMap[e.id] = e;
    });
    return paths.slice(0, 10).map(function(path, idx) {
      var steps = path.map(function(step) {
        var el = elMap[step.elementId];
        return el ? el.type.replace("bpmn:", "") + ' "' + (el.name || el.id) + '"' : step.elementId;
      });
      return "Path " + (idx + 1) + ": " + steps.join(" -> ");
    }).join("\n");
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
      var el = elements.find(function(e) {
        return e.id === id;
      });
      if (el) ordered.push(el);
    }
    elements.filter(function(e) {
      return e.type === "bpmn:StartEvent";
    }).forEach(function(e) {
      topoSort(e.id);
    });
    elements.forEach(function(e) {
      if (!visited[e.id]) ordered.push(e);
    });
    return ordered.map(function(el) {
      return el.type.replace("bpmn:", "") + ' "' + (el.name || el.id) + '" (id: ' + el.id + ")" + (el.lane ? " [Lane: " + el.lane + "]" : "") + (el.documentation ? " \u2014 " + el.documentation.substring(0, 150) : "");
    }).join("\n");
  }
  function getGatewayConditions(elements, flows) {
    var flowMap = {};
    flows.forEach(function(f) {
      flowMap[f.id] = f;
    });
    return elements.filter(function(e) {
      return e.type.indexOf("Gateway") >= 0;
    }).map(function(gw) {
      var outFlows = gw.outgoing.map(function(fid) {
        return flowMap[fid];
      }).filter(Boolean);
      var branches = outFlows.map(function(f) {
        var target = elements.find(function(e) {
          return e.id === f.targetRef;
        });
        return "  - " + (f.name || f.id) + " \u2192 " + (target ? target.name || target.id : f.targetRef) + (f.conditionExpression ? " [Condition: " + f.conditionExpression + "]" : " [No condition specified]");
      }).join("\n");
      return 'Gateway "' + (gw.name || gw.id) + '" (' + gw.type.replace("bpmn:", "") + "):\n" + branches;
    }).join("\n\n");
  }
  function getStartEventDetails(elements) {
    return elements.filter(function(e) {
      return e.type === "bpmn:StartEvent";
    }).map(function(e) {
      return '"' + (e.name || e.id) + '" (id: ' + e.id + ")" + (e.eventDefinitions && e.eventDefinitions.length > 0 ? " events: " + e.eventDefinitions.join(", ") : "") + (e.documentation ? " \u2014 " + e.documentation : "");
    }).join("; ") || "None";
  }
  function getEndEventDetails(elements) {
    return elements.filter(function(e) {
      return e.type === "bpmn:EndEvent";
    }).map(function(e) {
      return '"' + (e.name || e.id) + '" (id: ' + e.id + ")" + (e.eventDefinitions && e.eventDefinitions.length > 0 ? " events: " + e.eventDefinitions.join(", ") : "") + (e.documentation ? " \u2014 " + e.documentation : "");
    }).join("; ") || "None";
  }
  function getFirstTasks(elements, flows) {
    var startIds = elements.filter(function(e) {
      return e.type === "bpmn:StartEvent";
    }).map(function(e) {
      return e.id;
    });
    var firstTaskIds = /* @__PURE__ */ new Set();
    flows.forEach(function(f) {
      if (startIds.indexOf(f.sourceRef) >= 0) {
        var target = elements.find(function(e) {
          return e.id === f.targetRef;
        });
        if (target) firstTaskIds.add(target);
      }
    });
    return Array.from(firstTaskIds).map(function(e) {
      return '"' + (e.name || e.id) + '" (id: ' + e.id + ")";
    }).join("; ") || "None";
  }
  function getLastTasks(elements, flows) {
    var endIds = {};
    elements.filter(function(e) {
      return e.type === "bpmn:EndEvent";
    }).forEach(function(e) {
      endIds[e.id] = true;
    });
    var lastTaskIds = /* @__PURE__ */ new Set();
    flows.forEach(function(f) {
      if (endIds[f.targetRef]) {
        var source = elements.find(function(e) {
          return e.id === f.sourceRef;
        });
        if (source) lastTaskIds.add(source);
      }
    });
    return Array.from(lastTaskIds).map(function(e) {
      return '"' + (e.name || e.id) + '" (id: ' + e.id + ")";
    }).join("; ") || "None";
  }
  function getExtensionData(elements) {
    return elements.filter(function(e) {
      return e.documentation || Object.keys(e.extensionProperties || {}).length > 0;
    }).map(function(e) {
      var parts = [e.type.replace("bpmn:", "") + ' "' + (e.name || e.id) + '"'];
      if (e.documentation) parts.push("  Docs: " + e.documentation);
      var keys = Object.keys(e.extensionProperties || {});
      if (keys.length > 0) {
        parts.push("  Extensions: " + keys.map(function(k) {
          return k + "=" + e.extensionProperties[k];
        }).join(", "));
      }
      return parts.join("\n");
    }).join("\n\n") || "No extension data found.";
  }
  function buildContext(processGraph, requirementsText, profile, llmConfig) {
    var elements = processGraph.elements || [];
    var flows = processGraph.flows || [];
    var lanes = processGraph.lanes || [];
    var meta = processGraph.metadata || {};
    var bpmnSummary = [
      "Process: " + meta.processName + " (ID: " + meta.processId + ")",
      "Total elements: " + meta.elementCount + " (tasks: " + meta.taskCount + ", events: " + meta.eventCount + ", gateways: " + meta.gatewayCount + ")",
      "Lanes (participants): " + lanes.map(function(l) {
        return l.name || l.id;
      }).join(", "),
      "Start events: " + getStartEventDetails(elements),
      "End events: " + getEndEventDetails(elements),
      "Process documentation: " + (processGraph.process.documentation || "(none)")
    ].join("\n");
    return {
      bpmnSummary,
      elementsList: formatElementsList(elements),
      flowDescription: formatFlowDescription(processGraph.paths, elements),
      orderedElements: formatOrderedElements(elements, flows),
      gatewayConditions: getGatewayConditions(elements, flows),
      startEventDetails: getStartEventDetails(elements),
      endEventDetails: getEndEventDetails(elements),
      firstTasks: getFirstTasks(elements, flows),
      lastTasks: getLastTasks(elements, flows),
      extensionData: getExtensionData(elements),
      allElementNames: elements.map(function(e) {
        return e.name || e.id;
      }).join(", "),
      laneNames: lanes.map(function(l) {
        return l.name || l.id;
      }).join(", "),
      allDocumentation: elements.filter(function(e) {
        return e.documentation;
      }).map(function(e) {
        return e.type.replace("bpmn:", "") + ' "' + (e.name || e.id) + '": ' + e.documentation;
      }).join("\n"),
      boundaryEvents: elements.filter(function(e) {
        return e.type === "bpmn:BoundaryEvent";
      }).map(function(e) {
        return '"' + (e.name || e.id) + '" attached to ' + (e.attachedToRef || "?") + " events: " + (e.eventDefinitions || []).join(", ");
      }).join("\n") || "None",
      errorEvents: elements.filter(function(e) {
        return e.eventDefinitions && e.eventDefinitions.indexOf("bpmn:ErrorEventDefinition") >= 0;
      }).map(function(e) {
        return '"' + (e.name || e.id) + '" (id: ' + e.id + ")";
      }).join("\n") || "None",
      timerEvents: elements.filter(function(e) {
        return e.eventDefinitions && e.eventDefinitions.indexOf("bpmn:TimerEventDefinition") >= 0;
      }).map(function(e) {
        return '"' + (e.name || e.id) + '" (id: ' + e.id + ")";
      }).join("\n") || "None",
      businessRuleTasks: elements.filter(function(e) {
        return e.type === "bpmn:BusinessRuleTask";
      }).map(function(e) {
        return '"' + (e.name || e.id) + '" (id: ' + e.id + ")";
      }).join("\n") || "None",
      requirementsText: requirementsText || "",
      generationProfile: profile || { template: "standard", language: "ru", detailLevel: 2 },
      llmConfig: llmConfig || {},
      processGraph
    };
  }

  // client/modules/SkillOrchestrator.js
  async function orchestrate(skills, context, callbacks) {
    var onSkillStart = callbacks && callbacks.onSkillStart || function() {
    };
    var onSkillProgress = callbacks && callbacks.onSkillProgress || function() {
    };
    var onSkillComplete = callbacks && callbacks.onSkillComplete || function() {
    };
    var onSkillError = callbacks && callbacks.onSkillError || function() {
    };
    var sections = {};
    var total = skills.length;
    for (var i = 0; i < skills.length; i++) {
      var skill = skills[i];
      onSkillStart(i, skill.name, total);
      try {
        var result = await skill.execute(context, function(chunk) {
          onSkillProgress(i, chunk);
        });
        sections[skill.sectionKey] = result || "";
        onSkillComplete(i, result);
      } catch (err) {
        var errorMsg = "[Generation failed: " + (err.message || String(err)) + "]";
        sections[skill.sectionKey] = errorMsg;
        onSkillError(i, err);
      }
    }
    return sections;
  }

  // client/modules/MarkdownComposer.js
  function composeDocument(sections, metadata) {
    var lines = [];
    lines.push("# " + (metadata.processName || "Process") + " \u2014 Documentation");
    lines.push("");
    lines.push("> **Model file:** " + (metadata.fileName || "untitled.bpmn"));
    lines.push("> **Process ID:** " + (metadata.processId || ""));
    lines.push("> **Generated at:** " + (/* @__PURE__ */ new Date()).toISOString());
    lines.push("> **LLM model:** " + (metadata.llmModel || "unknown"));
    lines.push("");
    lines.push("---");
    lines.push("");
    lines.push("## 1. Purpose and Objectives of the Process");
    lines.push("");
    lines.push(sections.summary || "(not generated)");
    lines.push("");
    lines.push("## 2. Input Data");
    lines.push("");
    lines.push(sections.inputs || "(not generated)");
    lines.push("");
    lines.push("## 3. Execution Logic");
    lines.push("");
    lines.push("### 3.1 Main Scenario");
    lines.push("");
    lines.push(sections.flowMain || "(not generated)");
    lines.push("");
    lines.push("### 3.2 Alternative Branches");
    lines.push("");
    lines.push(sections.flowBranches || "(not generated)");
    lines.push("");
    lines.push("### 3.3 Exceptions and Edge Cases");
    lines.push("");
    lines.push(sections.exceptions || "(not generated)");
    lines.push("");
    lines.push("## 4. Output Data");
    lines.push("");
    lines.push(sections.outputs || "(not generated)");
    lines.push("");
    lines.push("## 5. Constraints and Remarks");
    lines.push("");
    lines.push(sections.constraints || "(not generated)");
    lines.push("");
    lines.push("## 6. Key Terms");
    lines.push("");
    lines.push(sections.glossary || "(not generated)");
    lines.push("");
    lines.push("---");
    lines.push("");
    lines.push("*Document generated automatically by BPMN Doc Generator v1.0 plugin.*");
    lines.push("*Requires review and validation by a specialist.*");
    return lines.join("\n");
  }
  function composeMultiFile(sections, metadata) {
    var baseName = (metadata.processName || "process").replace(/[^a-zA-Zа-яА-Я0-9_-]/g, "_");
    var files = {};
    files[baseName + "_overview.md"] = [
      "# " + metadata.processName + " \u2014 Overview",
      "",
      "> Model: " + metadata.fileName + " | Process ID: " + metadata.processId,
      "",
      "## 1. Purpose and Objectives of the Process",
      "",
      sections.summary || "",
      "",
      "## 2. Input Data",
      "",
      sections.inputs || "",
      "",
      "## 4. Output Data",
      "",
      sections.outputs || "",
      ""
    ].join("\n");
    files[baseName + "_flow.md"] = [
      "# " + metadata.processName + " \u2014 Execution Logic",
      "",
      "### 3.1 Main Scenario",
      "",
      sections.flowMain || "",
      "",
      "### 3.2 Alternative Branches",
      "",
      sections.flowBranches || "",
      "",
      "### 3.3 Exceptions and Edge Cases",
      "",
      sections.exceptions || "",
      ""
    ].join("\n");
    files[baseName + "_constraints.md"] = [
      "# " + metadata.processName + " \u2014 Constraints and Remarks",
      "",
      sections.constraints || "",
      ""
    ].join("\n");
    files[baseName + "_glossary.md"] = [
      "# " + metadata.processName + " \u2014 Key Terms",
      "",
      sections.glossary || "",
      ""
    ].join("\n");
    return files;
  }

  // client/skills/TraceabilitySkill.js
  function addTraceability(sectionText, elements) {
    if (!sectionText || !elements || elements.length === 0) return sectionText;
    var annotated = sectionText;
    var sorted = elements.slice().sort(function(a, b) {
      return (b.name || "").length - (a.name || "").length;
    });
    sorted.forEach(function(el) {
      if (!el.name || el.name.trim() === "") return;
      var name = el.name;
      var escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      var regex = new RegExp("(" + escaped + ")(?!\\s*\\(id:)", "i");
      var alreadyAnnotated = annotated.indexOf("(id: " + el.id + ")") >= 0;
      if (!alreadyAnnotated) {
        annotated = annotated.replace(regex, "$1 (id: " + el.id + ")");
      }
    });
    return annotated;
  }
  function applyTraceability(sections, elements) {
    var result = {};
    for (var key in sections) {
      if (!sections.hasOwnProperty(key)) continue;
      result[key] = addTraceability(sections[key], elements);
    }
    return result;
  }

  // client/modules/ExportManager.js
  async function saveSingleFile(content, defaultName) {
    if (typeof window !== "undefined" && window.electronAPI && window.electronAPI.saveMarkdown) {
      return await window.electronAPI.saveMarkdown(content, defaultName);
    }
    var blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = defaultName || "documentation.md";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return defaultName || "documentation.md";
  }
  async function saveMultipleFiles(files) {
    if (typeof window !== "undefined" && window.electronAPI && window.electronAPI.saveMultipleFiles) {
      return await window.electronAPI.saveMultipleFiles(files);
    }
    var saved = [];
    for (var name in files) {
      if (!files.hasOwnProperty(name)) continue;
      var result = await saveSingleFile(files[name], name);
      saved.push(result);
    }
    return saved;
  }
  function copyToClipboard(text) {
    if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
      return navigator.clipboard.writeText(text);
    }
    var textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand("copy");
    document.body.removeChild(textarea);
    return Promise.resolve();
  }

  // client/skills/ProcessSummarySkill.js
  var SYSTEM_PROMPT = [
    "\u0422\u044B \u2014 \u0442\u0435\u0445\u043D\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u043F\u0438\u0441\u0430\u0442\u0435\u043B\u044C \u0438 \u0431\u0438\u0437\u043D\u0435\u0441-\u0430\u043D\u0430\u043B\u0438\u0442\u0438\u043A.",
    "\u0422\u0432\u043E\u044F \u0437\u0430\u0434\u0430\u0447\u0430 \u2014 \u043D\u0430\u043F\u0438\u0441\u0430\u0442\u044C \u0440\u0430\u0437\u0434\u0435\u043B \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430\u0446\u0438\u0438 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u0430.",
    "\u041F\u0438\u0448\u0438 \u043D\u0430 \u0440\u0443\u0441\u0441\u043A\u043E\u043C \u044F\u0437\u044B\u043A\u0435, \u043F\u0440\u043E\u0444\u0435\u0441\u0441\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u043C \u0434\u0435\u043B\u043E\u0432\u044B\u043C \u0441\u0442\u0438\u043B\u0435\u043C.",
    "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439 \u0422\u041E\u041B\u042C\u041A\u041E \u0434\u0430\u043D\u043D\u044B\u0435 \u0438\u0437 \u043F\u0440\u0435\u0434\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u043D\u043E\u0433\u043E \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442\u0430 BPMN.",
    "\u041D\u0435 \u043F\u0440\u0438\u0434\u0443\u043C\u044B\u0432\u0430\u0439 \u0434\u0435\u0442\u0430\u043B\u0438, \u043A\u043E\u0442\u043E\u0440\u044B\u0445 \u043D\u0435\u0442 \u0432 \u043C\u043E\u0434\u0435\u043B\u0438 \u0438\u043B\u0438 \u0442\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u044F\u0445.",
    '\u041F\u0440\u0438 \u043D\u0435\u0445\u0432\u0430\u0442\u043A\u0435 \u0434\u0430\u043D\u043D\u044B\u0445 \u044F\u0432\u043D\u043E \u043F\u043E\u043C\u0435\u0447\u0430\u0439 \u0440\u0430\u0437\u0434\u0435\u043B "[\u0422\u0440\u0435\u0431\u0443\u0435\u0442 \u0443\u0442\u043E\u0447\u043D\u0435\u043D\u0438\u044F]".',
    "\u041E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E \u043E\u043F\u0438\u0441\u044B\u0432\u0430\u0439 \u041A\u041E\u041D\u041A\u0420\u0415\u0422\u041D\u042B\u0415 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u044B \u0438\u0437 \u043C\u043E\u0434\u0435\u043B\u0438 \u2014 \u0437\u0430\u0434\u0430\u0447\u0438, \u0441\u043E\u0431\u044B\u0442\u0438\u044F, \u0440\u043E\u043B\u0438.",
    "\u0424\u043E\u0440\u043C\u0430\u0442: Markdown \u0441 \u043F\u043E\u0434\u0437\u0430\u0433\u043E\u043B\u043E\u0432\u043A\u0430\u043C\u0438 ### \u0433\u0434\u0435 \u0443\u043C\u0435\u0441\u0442\u043D\u043E."
  ].join("\n");
  function buildUserPrompt(context, profile) {
    var meta = context.processGraph.metadata;
    var detailInstruction = profile.detailLevel >= 3 ? "\u041D\u0430\u043F\u0438\u0448\u0438 \u043C\u0430\u043A\u0441\u0438\u043C\u0430\u043B\u044C\u043D\u043E \u043F\u043E\u0434\u0440\u043E\u0431\u043D\u044B\u0439 \u0440\u0430\u0437\u0434\u0435\u043B (\u0434\u043E 600 \u0441\u043B\u043E\u0432)." : profile.detailLevel === 1 ? "\u041D\u0430\u043F\u0438\u0448\u0438 \u043A\u0440\u0430\u0442\u043A\u0438\u0439 \u0440\u0430\u0437\u0434\u0435\u043B (\u0434\u043E 200 \u0441\u043B\u043E\u0432)." : "\u041D\u0430\u043F\u0438\u0448\u0438 \u0440\u0430\u0437\u0434\u0435\u043B \u0441\u0440\u0435\u0434\u043D\u0435\u0439 \u0434\u0435\u0442\u0430\u043B\u0438\u0437\u0430\u0446\u0438\u0438 (\u0434\u043E 400 \u0441\u043B\u043E\u0432).";
    return [
      "\u041F\u0440\u043E\u0446\u0435\u0441\u0441: " + meta.processName + " (ID: " + meta.processId + ")",
      "",
      "\u0423\u0447\u0430\u0441\u0442\u043D\u0438\u043A\u0438 (lanes): " + context.laneNames,
      "",
      "\u041D\u0430\u0447\u0430\u043B\u044C\u043D\u044B\u0435 \u0441\u043E\u0431\u044B\u0442\u0438\u044F:",
      context.startEventDetails,
      "",
      "\u041A\u043E\u043D\u0435\u0447\u043D\u044B\u0435 \u0441\u043E\u0431\u044B\u0442\u0438\u044F:",
      context.endEventDetails,
      "",
      "\u0412\u0441\u0435 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u044B \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u0430 (" + meta.elementCount + " \u0448\u0442):",
      context.elementsList,
      "",
      "\u0422\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u044F \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F: " + (context.requirementsText || "(\u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u044B)"),
      "",
      detailInstruction,
      "",
      '\u041D\u0430\u043F\u0438\u0448\u0438 \u0440\u0430\u0437\u0434\u0435\u043B "\u0426\u0435\u043B\u044C \u0438 \u0437\u0430\u0434\u0430\u0447\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u0430":',
      "- \u0427\u0442\u043E \u044F\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u0446\u0435\u043B\u044C\u044E \u0434\u0430\u043D\u043D\u043E\u0433\u043E \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u0430?",
      "- \u041A\u0442\u043E \u044F\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u0438\u043D\u0438\u0446\u0438\u0430\u0442\u043E\u0440\u043E\u043C \u0438 \u0432\u043B\u0430\u0434\u0435\u043B\u044C\u0446\u0435\u043C \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u0430?",
      "- \u041A\u0430\u043A\u043E\u0432 \u043E\u0436\u0438\u0434\u0430\u0435\u043C\u044B\u0439 \u0438\u0442\u043E\u0433 \u0443\u0441\u043F\u0435\u0448\u043D\u043E\u0433\u043E \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u044F?",
      "- \u041A\u0430\u043A\u0438\u0435 \u0431\u0438\u0437\u043D\u0435\u0441-\u043F\u043E\u0442\u0440\u0435\u0431\u043D\u043E\u0441\u0442\u0438 \u0437\u0430\u043A\u0440\u044B\u0432\u0430\u0435\u0442 \u043F\u0440\u043E\u0446\u0435\u0441\u0441?",
      "\u0423\u043F\u043E\u043C\u0438\u043D\u0430\u0439 \u043A\u043E\u043D\u043A\u0440\u0435\u0442\u043D\u044B\u0435 \u0437\u0430\u0434\u0430\u0447\u0438 \u0438 \u0440\u043E\u043B\u0438 \u0438\u0437 \u043C\u043E\u0434\u0435\u043B\u0438."
    ].join("\n");
  }
  var ProcessSummarySkill = {
    name: "Process Summary",
    sectionKey: "summary",
    execute: async function(context, onProgress) {
      var messages = [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(context, context.generationProfile) }
      ];
      return await completeStream(messages, context.llmConfig, onProgress);
    }
  };

  // client/skills/InputOutputSkill.js
  var SYSTEM_PROMPT2 = [
    "\u0422\u044B \u2014 \u0442\u0435\u0445\u043D\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u043F\u0438\u0441\u0430\u0442\u0435\u043B\u044C \u0438 \u0431\u0438\u0437\u043D\u0435\u0441-\u0430\u043D\u0430\u043B\u0438\u0442\u0438\u043A.",
    "\u041F\u0438\u0448\u0438 \u043D\u0430 \u0440\u0443\u0441\u0441\u043A\u043E\u043C \u044F\u0437\u044B\u043A\u0435, \u043F\u0440\u043E\u0444\u0435\u0441\u0441\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u043C \u0434\u0435\u043B\u043E\u0432\u044B\u043C \u0441\u0442\u0438\u043B\u0435\u043C.",
    "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439 \u0422\u041E\u041B\u042C\u041A\u041E \u0434\u0430\u043D\u043D\u044B\u0435 \u0438\u0437 \u043F\u0440\u0435\u0434\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u043D\u043E\u0433\u043E \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442\u0430 BPMN.",
    "\u041D\u0435 \u043F\u0440\u0438\u0434\u0443\u043C\u044B\u0432\u0430\u0439 \u0434\u0435\u0442\u0430\u043B\u0438, \u043A\u043E\u0442\u043E\u0440\u044B\u0445 \u043D\u0435\u0442 \u0432 \u043C\u043E\u0434\u0435\u043B\u0438 \u0438\u043B\u0438 \u0442\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u044F\u0445.",
    '\u041F\u0440\u0438 \u043D\u0435\u0445\u0432\u0430\u0442\u043A\u0435 \u0434\u0430\u043D\u043D\u044B\u0445 \u044F\u0432\u043D\u043E \u043F\u043E\u043C\u0435\u0447\u0430\u0439 "[\u0422\u0440\u0435\u0431\u0443\u0435\u0442 \u0443\u0442\u043E\u0447\u043D\u0435\u043D\u0438\u044F]".',
    "\u0424\u043E\u0440\u043C\u0430\u0442: Markdown-\u0442\u0430\u0431\u043B\u0438\u0446\u044B."
  ].join("\n");
  function buildUserPrompt2(context) {
    return [
      "\u041F\u0440\u043E\u0446\u0435\u0441\u0441: " + context.processGraph.metadata.processName,
      "",
      "StartEvent \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u044B:",
      context.startEventDetails,
      "",
      "EndEvent \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u044B:",
      context.endEventDetails,
      "",
      "\u041F\u0435\u0440\u0432\u044B\u0435 \u0437\u0430\u0434\u0430\u0447\u0438 \u043F\u043E\u0441\u043B\u0435 \u0441\u0442\u0430\u0440\u0442\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u0430:",
      context.firstTasks,
      "",
      "\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 \u0437\u0430\u0434\u0430\u0447\u0438 \u043F\u0435\u0440\u0435\u0434 \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0438\u0435\u043C:",
      context.lastTasks,
      "",
      "Documentation \u0438 extensionElements \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u043E\u0432:",
      context.extensionData,
      "",
      "\u0412\u0441\u0435 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u044B \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u0430:",
      context.elementsList,
      "",
      "\u0422\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u044F: " + (context.requirementsText || "(\u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u044B)"),
      "",
      "\u041E\u043F\u0440\u0435\u0434\u0435\u043B\u0438 \u0438 \u043E\u043F\u0438\u0448\u0438:",
      "1. \u0412\u0425\u041E\u0414\u041D\u042B\u0415 \u0414\u0410\u041D\u041D\u042B\u0415: \u0447\u0442\u043E \u0437\u0430\u043F\u0443\u0441\u043A\u0430\u0435\u0442 \u043F\u0440\u043E\u0446\u0435\u0441\u0441, \u043A\u0430\u043A\u0438\u0435 \u0434\u0430\u043D\u043D\u044B\u0435/\u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B/\u0441\u043E\u0431\u044B\u0442\u0438\u044F \u043D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u044B \u0434\u043B\u044F \u0441\u0442\u0430\u0440\u0442\u0430.",
      "   \u0414\u043B\u044F \u043A\u0430\u0436\u0434\u043E\u0433\u043E \u0432\u0445\u043E\u0434\u0430 \u0443\u043A\u0430\u0436\u0438: \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435, \u0442\u0438\u043F (\u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442/\u0441\u043E\u0431\u044B\u0442\u0438\u0435/\u0434\u0430\u043D\u043D\u044B\u0435/\u0440\u0435\u0448\u0435\u043D\u0438\u0435), \u0438\u0441\u0442\u043E\u0447\u043D\u0438\u043A (\u043A\u0442\u043E \u043F\u0440\u0435\u0434\u043E\u0441\u0442\u0430\u0432\u043B\u044F\u0435\u0442).",
      "2. \u0412\u042B\u0425\u041E\u0414\u041D\u042B\u0415 \u0414\u0410\u041D\u041D\u042B\u0415: \u0447\u0442\u043E \u044F\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u0440\u0435\u0437\u0443\u043B\u044C\u0442\u0430\u0442\u043E\u043C \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u0430 \u043F\u0440\u0438 \u0443\u0441\u043F\u0435\u0448\u043D\u043E\u043C \u0437\u0430\u0432\u0435\u0440\u0448\u0435\u043D\u0438\u0438.",
      "   \u0414\u043B\u044F \u043A\u0430\u0436\u0434\u043E\u0433\u043E \u0432\u044B\u0445\u043E\u0434\u0430 \u0443\u043A\u0430\u0436\u0438: \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435, \u0442\u0438\u043F, \u043F\u043E\u043B\u0443\u0447\u0430\u0442\u0435\u043B\u044C.",
      "",
      "\u0412\u0410\u0416\u041D\u041E: \u0412\u044B\u0432\u0435\u0434\u0438 \u0414\u0412\u0410 \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u044B\u0445 \u0440\u0430\u0437\u0434\u0435\u043B\u0430.",
      '\u041F\u0435\u0440\u0432\u044B\u0439 \u0437\u0430\u0433\u043E\u043B\u043E\u0432\u043E\u043A: "\u0412\u0425\u041E\u0414\u041D\u042B\u0415 \u0414\u0410\u041D\u041D\u042B\u0415"',
      '\u0412\u0442\u043E\u0440\u043E\u0439 \u0437\u0430\u0433\u043E\u043B\u043E\u0432\u043E\u043A: "\u0412\u042B\u0425\u041E\u0414\u041D\u042B\u0415 \u0414\u0410\u041D\u041D\u042B\u0415"',
      "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439 \u0444\u043E\u0440\u043C\u0430\u0442 Markdown-\u0442\u0430\u0431\u043B\u0438\u0446\u044B.",
      "\u041E\u0441\u043D\u043E\u0432\u044B\u0432\u0430\u0439\u0441\u044F \u043D\u0430 \u041A\u041E\u041D\u041A\u0420\u0415\u0422\u041D\u042B\u0425 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430\u0445 \u0438\u0437 \u043C\u043E\u0434\u0435\u043B\u0438."
    ].join("\n");
  }
  var InputOutputSkill = {
    name: "Input/Output Data",
    sectionKey: "inputOutput",
    execute: async function(context, onProgress) {
      var messages = [
        { role: "system", content: SYSTEM_PROMPT2 },
        { role: "user", content: buildUserPrompt2(context) }
      ];
      var fullText = await completeStream(messages, context.llmConfig, onProgress);
      var parts = fullText.split(/(?:ВЫХОДНЫЕ ДАННЫЕ|OUTPUT DATA|Выходные данные)/i);
      var inputs = (parts[0] || "").replace(/(?:ВХОДНЫЕ ДАННЫЕ|INPUT DATA|Входные данные)[^\n]*\n/i, "").trim();
      var outputs = (parts[1] || "").trim();
      return JSON.stringify({ inputs, outputs });
    }
  };

  // client/skills/FlowExplanationSkill.js
  var SYSTEM_PROMPT3 = [
    "\u0422\u044B \u2014 \u0442\u0435\u0445\u043D\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u043F\u0438\u0441\u0430\u0442\u0435\u043B\u044C \u0438 \u0431\u0438\u0437\u043D\u0435\u0441-\u0430\u043D\u0430\u043B\u0438\u0442\u0438\u043A.",
    "\u041F\u0438\u0448\u0438 \u043D\u0430 \u0440\u0443\u0441\u0441\u043A\u043E\u043C \u044F\u0437\u044B\u043A\u0435, \u043F\u0440\u043E\u0444\u0435\u0441\u0441\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u043C \u0434\u0435\u043B\u043E\u0432\u044B\u043C \u0441\u0442\u0438\u043B\u0435\u043C.",
    "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439 \u0422\u041E\u041B\u042C\u041A\u041E \u0434\u0430\u043D\u043D\u044B\u0435 \u0438\u0437 \u043F\u0440\u0435\u0434\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u043D\u043E\u0433\u043E \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442\u0430 BPMN.",
    "\u041D\u0435 \u043F\u0440\u0438\u0434\u0443\u043C\u044B\u0432\u0430\u0439 \u0434\u0435\u0442\u0430\u043B\u0438, \u043A\u043E\u0442\u043E\u0440\u044B\u0445 \u043D\u0435\u0442 \u0432 \u043C\u043E\u0434\u0435\u043B\u0438 \u0438\u043B\u0438 \u0442\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u044F\u0445.",
    '\u041F\u0440\u0438 \u043D\u0435\u0445\u0432\u0430\u0442\u043A\u0435 \u0434\u0430\u043D\u043D\u044B\u0445 \u044F\u0432\u043D\u043E \u043F\u043E\u043C\u0435\u0447\u0430\u0439 "[\u0422\u0440\u0435\u0431\u0443\u0435\u0442 \u0443\u0442\u043E\u0447\u043D\u0435\u043D\u0438\u044F]".',
    "\u041E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E \u0443\u043F\u043E\u043C\u0438\u043D\u0430\u0439 \u043A\u043E\u043D\u043A\u0440\u0435\u0442\u043D\u044B\u0435 BPMN-\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u044B \u043F\u043E \u0438\u0445 ID."
  ].join("\n");
  function buildUserPrompt3(context, profile) {
    var detailInstruction = profile.detailLevel >= 3 ? "\u041E\u043F\u0438\u0448\u0438 \u041A\u0410\u0416\u0414\u042B\u0419 \u0448\u0430\u0433 \u043C\u0430\u043A\u0441\u0438\u043C\u0430\u043B\u044C\u043D\u043E \u043F\u043E\u0434\u0440\u043E\u0431\u043D\u043E \u0441 \u0443\u043A\u0430\u0437\u0430\u043D\u0438\u0435\u043C \u0432\u0441\u0435\u0445 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u043E\u0432." : profile.detailLevel === 1 ? "\u041E\u043F\u0438\u0448\u0438 \u0442\u043E\u043B\u044C\u043A\u043E \u043E\u0441\u043D\u043E\u0432\u043D\u044B\u0435 \u0448\u0430\u0433\u0438 \u0431\u0435\u0437 \u043B\u0438\u0448\u043D\u0438\u0445 \u0434\u0435\u0442\u0430\u043B\u0435\u0439." : "\u041E\u043F\u0438\u0448\u0438 \u043A\u043B\u044E\u0447\u0435\u0432\u044B\u0435 \u0448\u0430\u0433\u0438 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u0430 \u0441 \u0443\u043A\u0430\u0437\u0430\u043D\u0438\u0435\u043C \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u043E\u0432.";
    return [
      "\u041F\u0440\u043E\u0446\u0435\u0441\u0441: " + context.processGraph.metadata.processName,
      "",
      "\u041F\u043E\u043B\u043D\u044B\u0439 \u0441\u043F\u0438\u0441\u043E\u043A \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u043E\u0432 \u043F\u043E \u043F\u043E\u0440\u044F\u0434\u043A\u0443 (\u043E\u0442 StartEvent \u0434\u043E EndEvent):",
      context.orderedElements,
      "",
      "\u0428\u043B\u044E\u0437\u044B \u0441 \u0443\u0441\u043B\u043E\u0432\u0438\u044F\u043C\u0438 \u043F\u0435\u0440\u0435\u0445\u043E\u0434\u043E\u0432:",
      context.gatewayConditions || "(\u043D\u0435\u0442 \u0448\u043B\u044E\u0437\u043E\u0432 \u0441 \u0443\u0441\u043B\u043E\u0432\u0438\u044F\u043C\u0438)",
      "",
      "\u0412\u0441\u0435 sequence flows (\u0441\u0432\u044F\u0437\u0438 \u043C\u0435\u0436\u0434\u0443 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430\u043C\u0438):",
      context.elementsList,
      "",
      "\u0422\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u044F: " + (context.requirementsText || "(\u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u044B)"),
      "",
      detailInstruction,
      "",
      '\u041D\u0430\u043F\u0438\u0448\u0438 \u0440\u0430\u0437\u0434\u0435\u043B "\u041B\u043E\u0433\u0438\u043A\u0430 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u044F" \u0441\u043E\u0441\u0442\u043E\u044F\u0449\u0438\u0439 \u0438\u0437 \u0434\u0432\u0443\u0445 \u043F\u043E\u0434\u0440\u0430\u0437\u0434\u0435\u043B\u043E\u0432.',
      "",
      '\u041F\u043E\u0434\u0440\u0430\u0437\u0434\u0435\u043B "\u041E\u0441\u043D\u043E\u0432\u043D\u043E\u0439 \u0441\u0446\u0435\u043D\u0430\u0440\u0438\u0439":',
      "\u041F\u043E\u0448\u0430\u0433\u043E\u0432\u043E\u0435 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u043D\u043E\u0440\u043C\u0430\u043B\u044C\u043D\u043E\u0433\u043E \u0445\u043E\u0434\u0430 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u044F \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u0430.",
      '\u041A\u0430\u0436\u0434\u044B\u0439 \u0448\u0430\u0433: "\u0428\u0430\u0433 N. [\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0437\u0430\u0434\u0430\u0447\u0438/\u0441\u043E\u0431\u044B\u0442\u0438\u044F]: [\u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F] | [\u0438\u0441\u043F\u043E\u043B\u043D\u0438\u0442\u0435\u043B\u044C/\u0441\u0438\u0441\u0442\u0435\u043C\u0430]"',
      '\u0421\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 BPMN element id \u0432 \u0444\u043E\u0440\u043C\u0430\u0442\u0435 "(id: element_id)"',
      "",
      '\u041F\u043E\u0434\u0440\u0430\u0437\u0434\u0435\u043B "\u0410\u043B\u044C\u0442\u0435\u0440\u043D\u0430\u0442\u0438\u0432\u043D\u044B\u0435 \u0432\u0435\u0442\u043A\u0438":',
      "\u041E\u043F\u0438\u0448\u0438 \u043A\u0430\u0436\u0434\u043E\u0435 \u0432\u0435\u0442\u0432\u043B\u0435\u043D\u0438\u0435 (ExclusiveGateway/InclusiveGateway):",
      "- \u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0448\u043B\u044E\u0437\u0430 \u0438 \u0443\u0441\u043B\u043E\u0432\u0438\u0435",
      "- \u0412\u0435\u0442\u043A\u0430 \u0410: \u043F\u0440\u0438 \u0443\u0441\u043B\u043E\u0432\u0438\u0438 X \u2014 \u0447\u0442\u043E \u043F\u0440\u043E\u0438\u0441\u0445\u043E\u0434\u0438\u0442",
      "- \u0412\u0435\u0442\u043A\u0430 \u0411: \u043F\u0440\u0438 \u0443\u0441\u043B\u043E\u0432\u0438\u0438 Y \u2014 \u0447\u0442\u043E \u043F\u0440\u043E\u0438\u0441\u0445\u043E\u0434\u0438\u0442",
      '\u0415\u0441\u043B\u0438 \u0443\u0441\u043B\u043E\u0432\u0438\u0435 \u043D\u0435 \u0437\u0430\u0434\u0430\u043D\u043E \u0432 \u043C\u043E\u0434\u0435\u043B\u0438 \u2014 \u043F\u043E\u043C\u0435\u0442\u044C "[\u0423\u0441\u043B\u043E\u0432\u0438\u0435 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u043E \u0432 \u043C\u043E\u0434\u0435\u043B\u0438]"'
    ].join("\n");
  }
  var FlowExplanationSkill = {
    name: "Flow Explanation",
    sectionKey: "flow",
    execute: async function(context, onProgress) {
      var messages = [
        { role: "system", content: SYSTEM_PROMPT3 },
        { role: "user", content: buildUserPrompt3(context, context.generationProfile) }
      ];
      var fullText = await completeStream(messages, context.llmConfig, onProgress);
      var parts = fullText.split(/(?:Альтернативные ветки|Alternative Branches|АЛЬТЕРНАТИВНЫЕ)/i);
      var main = (parts[0] || "").replace(/(?:Основной сценарий|Main Scenario|ОСНОВНОЙ)[^\n]*\n/i, "").trim();
      var branches = (parts[1] || "").trim();
      return JSON.stringify({ flowMain: main, flowBranches: branches });
    }
  };

  // client/skills/BusinessRulesSkill.js
  var SYSTEM_PROMPT4 = [
    "\u0422\u044B \u2014 \u0442\u0435\u0445\u043D\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u043F\u0438\u0441\u0430\u0442\u0435\u043B\u044C \u0438 \u0431\u0438\u0437\u043D\u0435\u0441-\u0430\u043D\u0430\u043B\u0438\u0442\u0438\u043A.",
    "\u041F\u0438\u0448\u0438 \u043D\u0430 \u0440\u0443\u0441\u0441\u043A\u043E\u043C \u044F\u0437\u044B\u043A\u0435, \u043F\u0440\u043E\u0444\u0435\u0441\u0441\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u043C \u0434\u0435\u043B\u043E\u0432\u044B\u043C \u0441\u0442\u0438\u043B\u0435\u043C.",
    "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439 \u0422\u041E\u041B\u042C\u041A\u041E \u0434\u0430\u043D\u043D\u044B\u0435 \u0438\u0437 \u043F\u0440\u0435\u0434\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u043D\u043E\u0433\u043E \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442\u0430 BPMN.",
    "\u041D\u0435 \u043F\u0440\u0438\u0434\u0443\u043C\u044B\u0432\u0430\u0439 \u0434\u0435\u0442\u0430\u043B\u0438, \u043A\u043E\u0442\u043E\u0440\u044B\u0445 \u043D\u0435\u0442 \u0432 \u043C\u043E\u0434\u0435\u043B\u0438 \u0438\u043B\u0438 \u0442\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u044F\u0445.",
    '\u0415\u0441\u043B\u0438 \u043F\u0440\u0430\u0432\u0438\u043B\u043E \u043D\u0435\u0447\u0451\u0442\u043A\u043E\u0435 \u2014 \u043F\u043E\u043C\u0435\u0442\u044C "[\u0422\u0440\u0435\u0431\u0443\u0435\u0442 \u0443\u0442\u043E\u0447\u043D\u0435\u043D\u0438\u044F \u0443 \u0432\u043B\u0430\u0434\u0435\u043B\u044C\u0446\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u0430]".',
    "\u0423\u043F\u043E\u043C\u0438\u043D\u0430\u0439 \u043A\u043E\u043D\u043A\u0440\u0435\u0442\u043D\u044B\u0435 BPMN-\u044D\u043B\u0435\u043C\u0435\u043D\u0442\u044B \u043F\u043E \u0438\u0445 ID."
  ].join("\n");
  function buildUserPrompt4(context) {
    return [
      "\u041F\u0440\u043E\u0446\u0435\u0441\u0441: " + context.processGraph.metadata.processName,
      "",
      "\u0428\u043B\u044E\u0437\u044B \u0441 \u0443\u0441\u043B\u043E\u0432\u0438\u044F\u043C\u0438 \u043F\u0435\u0440\u0435\u0445\u043E\u0434\u043E\u0432:",
      context.gatewayConditions || "(\u043D\u0435\u0442 \u0448\u043B\u044E\u0437\u043E\u0432 \u0441 \u0443\u0441\u043B\u043E\u0432\u0438\u044F\u043C\u0438)",
      "",
      "BusinessRuleTask \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u044B:",
      context.businessRuleTasks || "(\u043D\u0435\u0442)",
      "",
      "Documentation \u043F\u043E\u043B\u044F \u0432\u0441\u0435\u0445 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u043E\u0432:",
      context.allDocumentation || "(\u043D\u0435\u0442 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430\u0446\u0438\u0438)",
      "",
      "\u0412\u0441\u0435 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u044B:",
      context.elementsList,
      "",
      "\u0422\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u044F: " + (context.requirementsText || "(\u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u044B)"),
      "",
      "\u041E\u043F\u0438\u0448\u0438 \u0431\u0438\u0437\u043D\u0435\u0441-\u043F\u0440\u0430\u0432\u0438\u043B\u0430 \u0438 \u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D\u0438\u044F \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u0430:",
      "- \u0423\u0441\u043B\u043E\u0432\u0438\u044F \u043F\u0440\u0438\u043D\u044F\u0442\u0438\u044F \u0440\u0435\u0448\u0435\u043D\u0438\u0439 (\u0448\u043B\u044E\u0437\u044B)",
      "- \u0411\u0438\u0437\u043D\u0435\u0441-\u043F\u0440\u0430\u0432\u0438\u043B\u0430 (BusinessRuleTask)",
      "- \u0412\u0440\u0435\u043C\u0435\u043D\u043D\u044B\u0435 \u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D\u0438\u044F (Timer)",
      "- \u041D\u043E\u0440\u043C\u0430\u0442\u0438\u0432\u043D\u044B\u0435 \u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D\u0438\u044F \u0438\u0437 \u0442\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u0439",
      "- \u0422\u0435\u0445\u043D\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D\u0438\u044F",
      '\u0415\u0441\u043B\u0438 \u043F\u0440\u0430\u0432\u0438\u043B\u043E \u043D\u0435\u0447\u0451\u0442\u043A\u043E\u0435 \u2014 \u043F\u043E\u043C\u0435\u0442\u044C "[\u0422\u0440\u0435\u0431\u0443\u0435\u0442 \u0443\u0442\u043E\u0447\u043D\u0435\u043D\u0438\u044F \u0443 \u0432\u043B\u0430\u0434\u0435\u043B\u044C\u0446\u0430 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u0430]"'
    ].join("\n");
  }
  var BusinessRulesSkill = {
    name: "Business Rules",
    sectionKey: "constraints",
    execute: async function(context, onProgress) {
      var messages = [
        { role: "system", content: SYSTEM_PROMPT4 },
        { role: "user", content: buildUserPrompt4(context) }
      ];
      return await completeStream(messages, context.llmConfig, onProgress);
    }
  };

  // client/skills/ExceptionSkill.js
  var SYSTEM_PROMPT5 = [
    "\u0422\u044B \u2014 \u0442\u0435\u0445\u043D\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u043F\u0438\u0441\u0430\u0442\u0435\u043B\u044C \u0438 \u0431\u0438\u0437\u043D\u0435\u0441-\u0430\u043D\u0430\u043B\u0438\u0442\u0438\u043A.",
    "\u041F\u0438\u0448\u0438 \u043D\u0430 \u0440\u0443\u0441\u0441\u043A\u043E\u043C \u044F\u0437\u044B\u043A\u0435, \u043F\u0440\u043E\u0444\u0435\u0441\u0441\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u043C \u0434\u0435\u043B\u043E\u0432\u044B\u043C \u0441\u0442\u0438\u043B\u0435\u043C.",
    "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439 \u0422\u041E\u041B\u042C\u041A\u041E \u0434\u0430\u043D\u043D\u044B\u0435 \u0438\u0437 \u043F\u0440\u0435\u0434\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u043D\u043E\u0433\u043E \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442\u0430 BPMN.",
    "\u041D\u0435 \u043F\u0440\u0438\u0434\u0443\u043C\u044B\u0432\u0430\u0439 \u0434\u0435\u0442\u0430\u043B\u0438, \u043A\u043E\u0442\u043E\u0440\u044B\u0445 \u043D\u0435\u0442 \u0432 \u043C\u043E\u0434\u0435\u043B\u0438 \u0438\u043B\u0438 \u0442\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u044F\u0445.",
    "\u0424\u043E\u0440\u043C\u0430\u0442: Markdown-\u0442\u0430\u0431\u043B\u0438\u0446\u0430 | \u0418\u0441\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 | \u0422\u0440\u0438\u0433\u0433\u0435\u0440 | \u0420\u0435\u0430\u043A\u0446\u0438\u044F | BPMN \u044D\u043B\u0435\u043C\u0435\u043D\u0442 |"
  ].join("\n");
  function buildUserPrompt5(context) {
    return [
      "\u041F\u0440\u043E\u0446\u0435\u0441\u0441: " + context.processGraph.metadata.processName,
      "",
      "BoundaryEvent \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u044B:",
      context.boundaryEvents || "(\u043D\u0435\u0442)",
      "",
      "ErrorEvent \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u044B:",
      context.errorEvents || "(\u043D\u0435\u0442)",
      "",
      "TimerEvent \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u044B:",
      context.timerEvents || "(\u043D\u0435\u0442)",
      "",
      "\u0412\u0441\u0435 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u044B \u0441 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430\u0446\u0438\u0435\u0439:",
      context.allDocumentation || "(\u043D\u0435\u0442)",
      "",
      "\u0412\u0441\u0435 sequence flows:",
      context.elementsList,
      "",
      "\u0422\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u044F (\u043E\u0448\u0438\u0431\u043A\u0438 \u0438 \u0438\u0441\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F): " + (context.requirementsText || "(\u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u044B)"),
      "",
      "\u0421\u043E\u0441\u0442\u0430\u0432\u044C \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0438 \u0438\u0441\u043A\u043B\u044E\u0447\u0438\u0442\u0435\u043B\u044C\u043D\u044B\u0445 \u0441\u0438\u0442\u0443\u0430\u0446\u0438\u0439:",
      "\u0414\u043B\u044F \u043A\u0430\u0436\u0434\u043E\u0433\u043E \u0438\u0441\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u044F: \u0442\u0438\u043F -> \u0442\u0440\u0438\u0433\u0433\u0435\u0440 -> \u0440\u0435\u0430\u043A\u0446\u0438\u044F \u0441\u0438\u0441\u0442\u0435\u043C\u044B -> \u0438\u0442\u043E\u0433/\u043F\u0435\u0440\u0435\u0445\u043E\u0434",
      "\u0422\u0430\u0431\u043B\u0438\u0446\u0430: | \u0418\u0441\u043A\u043B\u044E\u0447\u0435\u043D\u0438\u0435 | \u0422\u0440\u0438\u0433\u0433\u0435\u0440 | \u0420\u0435\u0430\u043A\u0446\u0438\u044F | BPMN \u044D\u043B\u0435\u043C\u0435\u043D\u0442 |",
      "\u041E\u0441\u043D\u043E\u0432\u044B\u0432\u0430\u0439\u0441\u044F \u043D\u0430 \u041A\u041E\u041D\u041A\u0420\u0415\u0422\u041D\u042B\u0425 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u0430\u0445 \u0438\u0437 \u043C\u043E\u0434\u0435\u043B\u0438."
    ].join("\n");
  }
  var ExceptionSkill = {
    name: "Exceptions",
    sectionKey: "exceptions",
    execute: async function(context, onProgress) {
      var messages = [
        { role: "system", content: SYSTEM_PROMPT5 },
        { role: "user", content: buildUserPrompt5(context) }
      ];
      return await completeStream(messages, context.llmConfig, onProgress);
    }
  };

  // client/skills/GlossarySkill.js
  var SYSTEM_PROMPT6 = [
    "\u0422\u044B \u2014 \u0442\u0435\u0445\u043D\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u043F\u0438\u0441\u0430\u0442\u0435\u043B\u044C \u0438 \u0431\u0438\u0437\u043D\u0435\u0441-\u0430\u043D\u0430\u043B\u0438\u0442\u0438\u043A.",
    "\u041F\u0438\u0448\u0438 \u043D\u0430 \u0440\u0443\u0441\u0441\u043A\u043E\u043C \u044F\u0437\u044B\u043A\u0435, \u043F\u0440\u043E\u0444\u0435\u0441\u0441\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u044B\u043C \u0434\u0435\u043B\u043E\u0432\u044B\u043C \u0441\u0442\u0438\u043B\u0435\u043C.",
    "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439 \u0422\u041E\u041B\u042C\u041A\u041E \u0434\u0430\u043D\u043D\u044B\u0435 \u0438\u0437 \u043F\u0440\u0435\u0434\u043E\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u043D\u043E\u0433\u043E \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442\u0430 BPMN.",
    "\u0424\u043E\u0440\u043C\u0430\u0442: Markdown-\u0442\u0430\u0431\u043B\u0438\u0446\u0430 | \u0422\u0435\u0440\u043C\u0438\u043D | \u041E\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u0438\u0435 |"
  ].join("\n");
  function buildUserPrompt6(context) {
    return [
      "\u041F\u0440\u043E\u0446\u0435\u0441\u0441: " + context.processGraph.metadata.processName,
      "",
      "\u0412\u0441\u0435 \u0438\u043C\u0435\u043D\u0430 \u044D\u043B\u0435\u043C\u0435\u043D\u0442\u043E\u0432:",
      context.allElementNames || "(\u043D\u0435\u0442)",
      "",
      "\u0418\u043C\u0435\u043D\u0430 \u0440\u043E\u043B\u0435\u0439 (lanes):",
      context.laneNames || "(\u043D\u0435\u0442)",
      "",
      "Documentation \u043F\u043E\u043B\u0435\u0439:",
      context.allDocumentation || "(\u043D\u0435\u0442)",
      "",
      "\u0422\u0440\u0435\u0431\u043E\u0432\u0430\u043D\u0438\u044F: " + (context.requirementsText || "(\u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u044B)"),
      "",
      "\u0421\u043E\u0441\u0442\u0430\u0432\u044C \u0433\u043B\u043E\u0441\u0441\u0430\u0440\u0438\u0439 \u043A\u043B\u044E\u0447\u0435\u0432\u044B\u0445 \u0442\u0435\u0440\u043C\u0438\u043D\u043E\u0432 \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u0430.",
      "\u0414\u043B\u044F \u043A\u0430\u0436\u0434\u043E\u0433\u043E \u0442\u0435\u0440\u043C\u0438\u043D\u0430:",
      "- \u0422\u0435\u0440\u043C\u0438\u043D",
      "- \u041A\u0440\u0430\u0442\u043A\u043E\u0435 \u043E\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u0438\u0435 (1-2 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0435\u043D\u0438\u044F) \u0432 \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442\u0435 \u0434\u0430\u043D\u043D\u043E\u0433\u043E \u043F\u0440\u043E\u0446\u0435\u0441\u0441\u0430",
      "\u0412\u043A\u043B\u044E\u0447\u0438: \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044F \u0440\u043E\u043B\u0435\u0439, \u0441\u0438\u0441\u0442\u0435\u043C\u044B, \u0442\u0438\u043F\u044B \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u0432, \u0441\u043F\u0435\u0446\u0438\u0444\u0438\u0447\u0435\u0441\u043A\u0438\u0435 \u0431\u0438\u0437\u043D\u0435\u0441-\u0442\u0435\u0440\u043C\u0438\u043D\u044B.",
      '\u0424\u043E\u0440\u043C\u0430\u0442: Markdown-\u0442\u0430\u0431\u043B\u0438\u0446\u0430 "| \u0422\u0435\u0440\u043C\u0438\u043D | \u041E\u043F\u0440\u0435\u0434\u0435\u043B\u0435\u043D\u0438\u0435 |"'
    ].join("\n");
  }
  var GlossarySkill = {
    name: "Glossary",
    sectionKey: "glossary",
    execute: async function(context, onProgress) {
      var messages = [
        { role: "system", content: SYSTEM_PROMPT6 },
        { role: "user", content: buildUserPrompt6(context) }
      ];
      return await completeStream(messages, context.llmConfig, onProgress);
    }
  };

  // client/BpmnDocPanel.jsx
  var SKILLS = [
    ProcessSummarySkill,
    InputOutputSkill,
    FlowExplanationSkill,
    BusinessRulesSkill,
    ExceptionSkill,
    GlossarySkill
  ];
  var TEMPLATES = [
    { value: "brief", label: "Brief" },
    { value: "standard", label: "Standard" },
    { value: "detailed", label: "Detailed" },
    { value: "technical", label: "Technical" }
  ];
  var LANGUAGES = [
    { value: "ru", label: "Russian" },
    { value: "en", label: "English" }
  ];
  var DEFAULT_LLM = {
    endpoint: "http://localhost:1234/v1",
    apiKey: "lm-studio",
    model: "",
    temperature: 0.3,
    maxTokens: 2048,
    stream: true
  };
  function BpmnDocPanel(props) {
    var subscribe = props.subscribe || function() {
    };
    var triggerAction = props.triggerAction || function() {
    };
    var displayNotification = props.displayNotification || function() {
    };
    var sGraph = (0, import_react.useState)(null), processGraph = sGraph[0], setProcessGraph = sGraph[1];
    var sQuality = (0, import_react.useState)(null), qualityReport = sQuality[0], setQualityReport = sQuality[1];
    var sReq = (0, import_react.useState)(""), requirementsText = sReq[0], setRequirementsText = sReq[1];
    var sLlm = (0, import_react.useState)({ ...DEFAULT_LLM }), llmConfig = sLlm[0], setLlmConfig = sLlm[1];
    var sConn = (0, import_react.useState)("disconnected"), connectionStatus = sConn[0], setConnectionStatus = sConn[1];
    var sModels = (0, import_react.useState)([]), modelList = sModels[0], setModelList = sModels[1];
    var sProfile = (0, import_react.useState)({ template: "standard", language: "ru", detailLevel: 2 });
    var genProfile = sProfile[0], setGenProfile = sProfile[1];
    var sGenStatus = (0, import_react.useState)("idle"), genStatus = sGenStatus[0], setGenStatus = sGenStatus[1];
    var sActiveSkill = (0, import_react.useState)(-1), activeSkill = sActiveSkill[0], setActiveSkill = sActiveSkill[1];
    var sSkillProgress = (0, import_react.useState)(""), skillProgress = sSkillProgress[0], setSkillProgress = sSkillProgress[1];
    var sPreview = (0, import_react.useState)(""), previewText = sPreview[0], setPreviewText = sPreview[1];
    var sSections = (0, import_react.useState)(null), sections = sSections[0], setSections = sSections[1];
    var sError = (0, import_react.useState)(null), error = sError[0], setError = sError[1];
    var sFileName = (0, import_react.useState)("untitled.bpmn"), fileName = sFileName[0], setFileName = sFileName[1];
    var sTab = (0, import_react.useState)("settings"), activeTab = sTab[0], setActiveTab = sTab[1];
    var sEditMode = (0, import_react.useState)(false), editMode = sEditMode[0], setEditMode = sEditMode[1];
    var sEditedMd = (0, import_react.useState)(""), editedMd = sEditedMd[0], setEditedMd = sEditedMd[1];
    var previewRef = (0, import_react.useRef)(null);
    (0, import_react.useEffect)(function() {
      subscribe("app.activeTabChanged", function(e) {
        if (e && e.tab && e.tab.file && e.tab.file.name) {
          setFileName(e.tab.file.name);
        }
      });
      subscribe("tab.saved", function(e) {
        if (e && e.file && e.file.name) {
          setFileName(e.file.name);
        }
      });
    }, []);
    var handleAnalyze = (0, import_react.useCallback)(async function() {
      var bridge = window.__bpmnDocGenBridge;
      if (!bridge || !bridge.modeler) {
        setError("No active BPMN modeler. Please open a BPMN diagram.");
        return;
      }
      try {
        var elementRegistry = bridge.get("elementRegistry");
        var graph = analyzeModel(elementRegistry, fileName);
        setProcessGraph(graph);
        var report = runChecks(graph);
        setQualityReport(report);
        if (report.warnings.some(function(w) {
          return w.level === "ERROR";
        })) {
          setError(report.warnings.filter(function(w) {
            return w.level === "ERROR";
          }).map(function(w) {
            return w.message;
          }).join("; "));
        } else {
          setError(null);
        }
        displayNotification({ type: "success", title: "BPMN Doc Generator", content: "Model analyzed: " + graph.metadata.elementCount + " elements found" });
      } catch (err) {
        setError("Analysis failed: " + (err.message || String(err)));
      }
    }, [fileName]);
    var handleCheckConnection = (0, import_react.useCallback)(async function() {
      setConnectionStatus("checking");
      try {
        var connected = await checkConnection(llmConfig.endpoint);
        setConnectionStatus(connected ? "connected" : "disconnected");
        if (connected) {
          var models = await getModels(llmConfig.endpoint);
          setModelList(models);
          if (models.length > 0 && !llmConfig.model) {
            setLlmConfig(Object.assign({}, llmConfig, { model: models[0] }));
          }
        }
      } catch (e) {
        setConnectionStatus("disconnected");
      }
    }, [llmConfig]);
    var handleGenerate = (0, import_react.useCallback)(async function() {
      if (!processGraph) {
        setError("Analyze the BPMN model first.");
        return;
      }
      setGenStatus("running");
      setError(null);
      setPreviewText("");
      setSections(null);
      setSkillProgress("");
      try {
        var context = buildContext(processGraph, requirementsText, genProfile, llmConfig);
        var accumulatedPreview = "";
        var generatedSections = await orchestrate(
          SKILLS,
          context,
          {
            onSkillStart: function(idx, name, total) {
              setActiveSkill(idx);
              setSkillProgress("Skill " + (idx + 1) + " of " + total + ": " + name + "...");
            },
            onSkillProgress: function(idx, chunk) {
              accumulatedPreview += chunk;
              setPreviewText(accumulatedPreview);
            },
            onSkillComplete: function(idx, result) {
            },
            onSkillError: function(idx, err) {
              console.warn("[BPMN Doc Generator] Skill failed:", err);
            }
          }
        );
        var finalSections = {};
        finalSections.summary = generatedSections.summary || "";
        if (generatedSections.inputOutput) {
          try {
            var ioData = JSON.parse(generatedSections.inputOutput);
            finalSections.inputs = ioData.inputs || "";
            finalSections.outputs = ioData.outputs || "";
          } catch (e) {
            finalSections.inputs = generatedSections.inputOutput;
            finalSections.outputs = "(not generated separately)";
          }
        }
        if (generatedSections.flow) {
          try {
            var flowData = JSON.parse(generatedSections.flow);
            finalSections.flowMain = flowData.flowMain || "";
            finalSections.flowBranches = flowData.flowBranches || "";
          } catch (e) {
            finalSections.flowMain = generatedSections.flow;
            finalSections.flowBranches = "";
          }
        }
        finalSections.exceptions = generatedSections.exceptions || "";
        finalSections.constraints = generatedSections.constraints || "";
        finalSections.glossary = generatedSections.glossary || "";
        var elements = processGraph.elements || [];
        finalSections = applyTraceability(finalSections, elements);
        setSections(finalSections);
        var doc = composeDocument(finalSections, {
          processName: processGraph.metadata.processName,
          processId: processGraph.metadata.processId,
          fileName: processGraph.metadata.fileName,
          llmModel: llmConfig.model
        });
        setPreviewText(doc);
        setEditedMd(doc);
        setGenStatus("done");
        setActiveTab("preview");
        displayNotification({ type: "success", title: "BPMN Doc Generator", content: "Documentation generated successfully!" });
      } catch (err) {
        setGenStatus("error");
        setError("Generation failed: " + (err.message || String(err)));
        if (previewText) {
          setActiveTab("preview");
        }
      }
    }, [processGraph, requirementsText, genProfile, llmConfig]);
    var handleSaveSingle = (0, import_react.useCallback)(async function() {
      var content = editMode ? editedMd : previewText;
      if (!content) return;
      var defaultName = (processGraph ? processGraph.metadata.processName : "process").replace(/[^a-zA-Zа-яА-Я0-9_-]/g, "_") + "_documentation.md";
      try {
        var result = await saveSingleFile(content, defaultName);
        displayNotification({ type: "success", title: "BPMN Doc Generator", content: "Saved: " + result });
      } catch (err) {
        displayNotification({ type: "error", title: "BPMN Doc Generator", content: "Save failed: " + (err.message || String(err)) });
      }
    }, [previewText, editedMd, editMode, processGraph]);
    var handleSaveMulti = (0, import_react.useCallback)(async function() {
      if (!sections) return;
      var files = composeMultiFile(sections, {
        processName: processGraph ? processGraph.metadata.processName : "process",
        processId: processGraph ? processGraph.metadata.processId : "",
        fileName
      });
      try {
        var result = await saveMultipleFiles(files);
        displayNotification({ type: "success", title: "BPMN Doc Generator", content: "Saved " + (Array.isArray(result) ? result.length : Object.keys(files).length) + " files." });
      } catch (err) {
        displayNotification({ type: "error", title: "BPMN Doc Generator", content: "Save failed: " + (err.message || String(err)) });
      }
    }, [sections, processGraph, fileName]);
    var handleCopy = (0, import_react.useCallback)(function() {
      var content = editMode ? editedMd : previewText;
      copyToClipboard(content).then(function() {
        displayNotification({ type: "success", title: "BPMN Doc Generator", content: "Copied to clipboard!" });
      });
    }, [previewText, editedMd, editMode]);
    var renderModelInfo = function() {
      if (!processGraph) {
        return import_react.default.createElement(
          "div",
          { className: "dg-section" },
          import_react.default.createElement("p", { className: "dg-hint" }, 'Click "Analyze BPMN" to read the current model.')
        );
      }
      var meta = processGraph.metadata;
      return import_react.default.createElement(
        "div",
        { className: "dg-section" },
        import_react.default.createElement(
          "div",
          { className: "dg-info-grid" },
          import_react.default.createElement("span", { className: "dg-label" }, "Process:"),
          import_react.default.createElement("span", null, meta.processName || "(unnamed)"),
          import_react.default.createElement("span", { className: "dg-label" }, "ID:"),
          import_react.default.createElement("span", null, meta.processId),
          import_react.default.createElement("span", { className: "dg-label" }, "File:"),
          import_react.default.createElement("span", null, meta.fileName),
          import_react.default.createElement("span", { className: "dg-label" }, "Elements:"),
          import_react.default.createElement("span", null, meta.elementCount + " (tasks: " + meta.taskCount + ", events: " + meta.eventCount + ", gateways: " + meta.gatewayCount + ")")
        ),
        qualityReport && import_react.default.createElement(
          "div",
          { className: "dg-coverage" },
          import_react.default.createElement("span", { className: "dg-coverage-label" }, "Coverage:"),
          import_react.default.createElement(
            "div",
            { className: "dg-coverage-bar" },
            import_react.default.createElement("div", {
              className: "dg-coverage-fill",
              style: { width: qualityReport.coverage + "%" }
            })
          ),
          import_react.default.createElement("span", { className: "dg-coverage-text" }, qualityReport.coverageText)
        ),
        qualityReport && qualityReport.warnings.length > 0 && import_react.default.createElement(
          "div",
          { className: "dg-warnings" },
          qualityReport.warnings.map(function(w, i) {
            return import_react.default.createElement(
              "div",
              { key: i, className: "dg-warning dg-warning-" + w.level.toLowerCase() },
              import_react.default.createElement("span", { className: "dg-warning-level" }, w.level),
              " ",
              w.message
            );
          })
        )
      );
    };
    var renderRequirementsInput = function() {
      return import_react.default.createElement(
        "div",
        { className: "dg-section" },
        import_react.default.createElement("label", { className: "dg-section-title" }, "Requirements Description"),
        import_react.default.createElement("textarea", {
          className: "dg-textarea",
          value: requirementsText,
          onChange: function(e) {
            setRequirementsText(e.target.value);
          },
          placeholder: "Enter requirements text (optional, max 4000 chars)...",
          maxLength: 4e3,
          rows: 4,
          disabled: genStatus === "running"
        }),
        import_react.default.createElement("span", { className: "dg-char-count" }, requirementsText.length + " / 4000")
      );
    };
    var renderLlmSettings = function() {
      return import_react.default.createElement(
        "div",
        { className: "dg-section" },
        import_react.default.createElement("div", { className: "dg-section-title" }, "LLM Settings"),
        // Connection status
        import_react.default.createElement(
          "div",
          { className: "dg-form-row" },
          import_react.default.createElement(
            "span",
            { className: "dg-conn-status " + connectionStatus },
            connectionStatus === "connected" ? " Connected" : connectionStatus === "checking" ? " Checking..." : connectionStatus === "disconnected" ? " Disconnected" : " Not checked"
          ),
          import_react.default.createElement("button", {
            className: "dg-btn dg-btn-sm",
            onClick: handleCheckConnection,
            disabled: connectionStatus === "checking"
          }, "Check Connection")
        ),
        // Endpoint
        import_react.default.createElement(
          "div",
          { className: "dg-form-group" },
          import_react.default.createElement("label", null, "Endpoint"),
          import_react.default.createElement("input", {
            type: "text",
            value: llmConfig.endpoint,
            onChange: function(e) {
              setLlmConfig(Object.assign({}, llmConfig, { endpoint: e.target.value }));
            },
            placeholder: "http://localhost:1234/v1"
          })
        ),
        // Model
        import_react.default.createElement(
          "div",
          { className: "dg-form-group" },
          import_react.default.createElement("label", null, "Model"),
          modelList.length > 0 ? import_react.default.createElement(
            "select",
            {
              value: llmConfig.model,
              onChange: function(e) {
                setLlmConfig(Object.assign({}, llmConfig, { model: e.target.value }));
              }
            },
            modelList.map(function(m) {
              return import_react.default.createElement("option", { key: m, value: m }, m);
            })
          ) : import_react.default.createElement("input", {
            type: "text",
            value: llmConfig.model,
            onChange: function(e) {
              setLlmConfig(Object.assign({}, llmConfig, { model: e.target.value }));
            },
            placeholder: "Model name or ID"
          })
        ),
        // Temperature + Max Tokens
        import_react.default.createElement(
          "div",
          { className: "dg-form-row" },
          import_react.default.createElement(
            "div",
            { className: "dg-form-group dg-form-half" },
            import_react.default.createElement("label", null, "Temperature: ", llmConfig.temperature),
            import_react.default.createElement("input", {
              type: "range",
              min: "0",
              max: "1",
              step: "0.1",
              value: llmConfig.temperature,
              onChange: function(e) {
                setLlmConfig(Object.assign({}, llmConfig, { temperature: parseFloat(e.target.value) }));
              }
            })
          ),
          import_react.default.createElement(
            "div",
            { className: "dg-form-group dg-form-half" },
            import_react.default.createElement("label", null, "Max Tokens"),
            import_react.default.createElement("input", {
              type: "number",
              min: "256",
              max: "32768",
              step: "256",
              value: llmConfig.maxTokens,
              onChange: function(e) {
                setLlmConfig(Object.assign({}, llmConfig, { maxTokens: parseInt(e.target.value) || 2048 }));
              }
            })
          )
        ),
        // Template + Language
        import_react.default.createElement(
          "div",
          { className: "dg-form-row" },
          import_react.default.createElement(
            "div",
            { className: "dg-form-group dg-form-half" },
            import_react.default.createElement("label", null, "Template"),
            import_react.default.createElement(
              "select",
              {
                value: genProfile.template,
                onChange: function(e) {
                  setGenProfile(Object.assign({}, genProfile, { template: e.target.value }));
                }
              },
              TEMPLATES.map(function(t) {
                return import_react.default.createElement("option", { key: t.value, value: t.value }, t.label);
              })
            )
          ),
          import_react.default.createElement(
            "div",
            { className: "dg-form-group dg-form-half" },
            import_react.default.createElement("label", null, "Language"),
            import_react.default.createElement(
              "select",
              {
                value: genProfile.language,
                onChange: function(e) {
                  setGenProfile(Object.assign({}, genProfile, { language: e.target.value }));
                }
              },
              LANGUAGES.map(function(l) {
                return import_react.default.createElement("option", { key: l.value, value: l.value }, l.label);
              })
            )
          )
        )
      );
    };
    var renderActions = function() {
      return import_react.default.createElement(
        "div",
        { className: "dg-actions" },
        import_react.default.createElement("button", {
          className: "dg-btn",
          onClick: handleAnalyze,
          disabled: genStatus === "running"
        }, "Analyze BPMN"),
        import_react.default.createElement("button", {
          className: "dg-btn dg-btn-primary",
          onClick: handleGenerate,
          disabled: genStatus === "running" || !processGraph
        }, genStatus === "running" ? "Generating..." : "Generate Markdown"),
        genStatus === "running" && import_react.default.createElement(
          "div",
          { className: "dg-progress" },
          import_react.default.createElement("div", { className: "dg-spinner" }),
          skillProgress
        )
      );
    };
    var renderPreview = function() {
      if (genStatus === "idle") {
        return import_react.default.createElement(
          "div",
          { className: "dg-section" },
          import_react.default.createElement("p", { className: "dg-hint" }, "Generated documentation will appear here.")
        );
      }
      return import_react.default.createElement(
        "div",
        { className: "dg-preview-container" },
        // Preview toolbar
        import_react.default.createElement(
          "div",
          { className: "dg-preview-toolbar" },
          editMode ? import_react.default.createElement("button", {
            className: "dg-btn dg-btn-sm",
            onClick: function() {
              setEditMode(false);
              setEditedMd(previewText);
            }
          }, "Preview") : import_react.default.createElement("button", {
            className: "dg-btn dg-btn-sm",
            onClick: function() {
              setEditMode(true);
              setEditedMd(previewText);
            }
          }, "Edit"),
          import_react.default.createElement("button", { className: "dg-btn dg-btn-sm", onClick: handleCopy }, "Copy"),
          import_react.default.createElement("button", { className: "dg-btn dg-btn-sm", onClick: handleSaveSingle }, "Save .md"),
          sections && import_react.default.createElement("button", { className: "dg-btn dg-btn-sm", onClick: handleSaveMulti }, "Save Multi")
        ),
        // Preview/Edit area
        editMode ? import_react.default.createElement("textarea", {
          className: "dg-editor",
          value: editedMd,
          onChange: function(e) {
            setEditedMd(e.target.value);
          },
          ref: previewRef
        }) : import_react.default.createElement("div", {
          className: "dg-preview",
          ref: previewRef
        }, renderMarkdownPreview(previewText))
      );
    };
    var renderMarkdownPreview = function(md) {
      if (!md) return null;
      var html = md.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/^### (.+)$/gm, "<h4>$1</h4>").replace(/^## (.+)$/gm, "<h3>$1</h3>").replace(/^# (.+)$/gm, "<h2>$1</h2>").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>").replace(/`(.+?)`/g, "<code>$1</code>").replace(/^\| (.+)/gm, function(match) {
        return "<tr>" + match.split("|").filter(function(c) {
          return c.trim();
        }).map(function(c) {
          return "<td>" + c.trim() + "</td>";
        }).join("") + "</tr>";
      }).replace(/^> (.+)$/gm, "<blockquote>$1</blockquote>").replace(/^---$/gm, "<hr/>").replace(/\n\n/g, "</p><p>").replace(/\n/g, "<br/>");
      return import_react.default.createElement("div", {
        className: "dg-md-preview",
        dangerouslySetInnerHTML: { __html: "<p>" + html + "</p>" }
      });
    };
    var renderError = function() {
      if (!error) return null;
      return import_react.default.createElement(
        "div",
        { className: "dg-error" },
        import_react.default.createElement("strong", null, "Error: "),
        error
      );
    };
    var tabs = [
      { key: "settings", label: "Settings" },
      { key: "preview", label: "Preview" }
    ];
    var panelContent = import_react.default.createElement(
      "div",
      { className: "dg-panel" },
      // Header
      import_react.default.createElement(
        "div",
        { className: "dg-header" },
        import_react.default.createElement(
          "span",
          { className: "dg-title" },
          import_react.default.createElement(
            "svg",
            { width: "16", height: "16", viewBox: "0 0 24 24", fill: "#52c41a" },
            import_react.default.createElement("path", { d: "M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z" })
          ),
          "BPMN Doc Generator"
        ),
        import_react.default.createElement("span", { className: "dg-version" }, "v1.0")
      ),
      // Tab bar
      import_react.default.createElement(
        "div",
        { className: "dg-tabs" },
        tabs.map(function(tab) {
          return import_react.default.createElement("button", {
            key: tab.key,
            className: "dg-tab" + (activeTab === tab.key ? " active" : ""),
            onClick: function() {
              setActiveTab(tab.key);
            }
          }, tab.label);
        })
      ),
      // Tab content
      import_react.default.createElement(
        "div",
        { className: "dg-body" },
        activeTab === "settings" && import_react.default.createElement(
          import_react.default.Fragment,
          null,
          renderModelInfo(),
          renderRequirementsInput(),
          renderLlmSettings(),
          renderActions(),
          renderError()
        ),
        activeTab === "preview" && import_react.default.createElement(
          import_react.default.Fragment,
          null,
          renderPreview(),
          renderError()
        )
      )
    );
    return import_react.default.createElement(
      import_react.default.Fragment,
      null,
      import_react.default.createElement(
        Fill_default,
        { slot: "bottom-panel", type: "bpmn-doc-generator", label: "Doc Generator" },
        panelContent
      )
    );
  }
  var BpmnDocPanel_default = BpmnDocPanel;

  // client/modules/ModelerBridgeModule.js
  function DocGenBridge(eventBus, injector) {
    try {
      var modeler = injector.get("bpmnjs");
      window.__bpmnDocGenBridge = {
        modeler,
        saveXML: function(opts) {
          return modeler.saveXML(opts || { format: true });
        },
        get: function(name) {
          return modeler.get(name);
        },
        eventBus
      };
      eventBus.on("diagram.destroy", function() {
        if (window.__bpmnDocGenBridge && window.__bpmnDocGenBridge.modeler === modeler) {
          window.__bpmnDocGenBridge = null;
        }
      });
    } catch (e) {
      console.warn("[BPMN Doc Generator] Could not acquire modeler reference:", e);
    }
  }
  DocGenBridge.$inject = ["eventBus", "injector"];
  var ModelerBridgeModule_default = {
    __init__: ["docGenBridge"],
    docGenBridge: ["type", DocGenBridge]
  };

  // client/client.js
  registerClientExtension(BpmnDocPanel_default);
  registerBpmnJSPlugin(ModelerBridgeModule_default);
})();
