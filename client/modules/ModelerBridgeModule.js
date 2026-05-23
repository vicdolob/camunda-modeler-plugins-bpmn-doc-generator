/**
 * bpmn-js bridge module. Captures the Modeler instance reference
 * so the client extension can access saveXML(), get('elementRegistry'), etc.
 */
function DocGenBridge(eventBus, injector) {
  try {
    var modeler = injector.get('bpmnjs');

    window.__bpmnDocGenBridge = {
      modeler: modeler,
      saveXML: function(opts) {
        return modeler.saveXML(opts || { format: true });
      },
      get: function(name) {
        return modeler.get(name);
      },
      eventBus: eventBus
    };

    eventBus.on('diagram.destroy', function() {
      if (window.__bpmnDocGenBridge && window.__bpmnDocGenBridge.modeler === modeler) {
        window.__bpmnDocGenBridge = null;
      }
    });
  } catch (e) {
    console.warn('[BPMN Doc Generator] Could not acquire modeler reference:', e);
  }
}

DocGenBridge.$inject = ['eventBus', 'injector'];

export default {
  __init__: ['docGenBridge'],
  docGenBridge: ['type', DocGenBridge]
};
