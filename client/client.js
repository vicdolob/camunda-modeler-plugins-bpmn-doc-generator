import React from 'react';
import { registerClientExtension, registerBpmnJSPlugin } from 'camunda-modeler-plugin-helpers';
import BpmnDocPanel from './BpmnDocPanel';
import ModelerBridgeModule from './modules/ModelerBridgeModule';

registerClientExtension(BpmnDocPanel);
registerBpmnJSPlugin(ModelerBridgeModule);
