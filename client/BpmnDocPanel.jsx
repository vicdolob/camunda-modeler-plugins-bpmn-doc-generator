import React, { useState, useCallback, useRef, useEffect } from 'react';
import Fill from 'camunda-modeler-plugin-helpers/components/Fill';
import { analyzeModel } from './modules/BpmnAnalyzer';
import { checkConnection, getModels } from './modules/LmStudioClient';
import { runChecks } from './modules/QualityChecker';
import { buildContext } from './modules/ContextBuilder';
import { orchestrate } from './modules/SkillOrchestrator';
import { composeDocument, composeMultiFile } from './modules/MarkdownComposer';
import { applyTraceability } from './skills/TraceabilitySkill';
import { saveSingleFile, saveMultipleFiles, copyToClipboard } from './modules/ExportManager';

import { ProcessSummarySkill } from './skills/ProcessSummarySkill';
import { InputOutputSkill } from './skills/InputOutputSkill';
import { FlowExplanationSkill } from './skills/FlowExplanationSkill';
import { BusinessRulesSkill } from './skills/BusinessRulesSkill';
import { ExceptionSkill } from './skills/ExceptionSkill';
import { GlossarySkill } from './skills/GlossarySkill';

import './style.css';

var SKILLS = [
  ProcessSummarySkill,
  InputOutputSkill,
  FlowExplanationSkill,
  BusinessRulesSkill,
  ExceptionSkill,
  GlossarySkill
];

var TEMPLATES = [
  { value: 'brief', label: 'Brief' },
  { value: 'standard', label: 'Standard' },
  { value: 'detailed', label: 'Detailed' },
  { value: 'technical', label: 'Technical' }
];

var LANGUAGES = [
  { value: 'ru', label: 'Russian' },
  { value: 'en', label: 'English' }
];

var DEFAULT_LLM = {
  endpoint: 'http://localhost:1234/v1',
  apiKey: 'lm-studio',
  model: '',
  temperature: 0.3,
  maxTokens: 2048,
  stream: true
};

function BpmnDocPanel(props) {
  var subscribe = props.subscribe || function() {};
  var triggerAction = props.triggerAction || function() {};
  var displayNotification = props.displayNotification || function() {};

  // State: model analysis
  var sGraph = useState(null), processGraph = sGraph[0], setProcessGraph = sGraph[1];
  var sQuality = useState(null), qualityReport = sQuality[0], setQualityReport = sQuality[1];

  // State: requirements
  var sReq = useState(''), requirementsText = sReq[0], setRequirementsText = sReq[1];

  // State: LLM settings
  var sLlm = useState({ ...DEFAULT_LLM }), llmConfig = sLlm[0], setLlmConfig = sLlm[1];
  var sConn = useState('disconnected'), connectionStatus = sConn[0], setConnectionStatus = sConn[1];
  var sModels = useState([]), modelList = sModels[0], setModelList = sModels[1];

  // State: generation profile
  var sProfile = useState({ template: 'standard', language: 'ru', detailLevel: 2 });
  var genProfile = sProfile[0], setGenProfile = sProfile[1];

  // State: generation
  var sGenStatus = useState('idle'), genStatus = sGenStatus[0], setGenStatus = sGenStatus[1];
  var sActiveSkill = useState(-1), activeSkill = sActiveSkill[0], setActiveSkill = sActiveSkill[1];
  var sSkillProgress = useState(''), skillProgress = sSkillProgress[0], setSkillProgress = sSkillProgress[1];
  var sPreview = useState(''), previewText = sPreview[0], setPreviewText = sPreview[1];
  var sSections = useState(null), sections = sSections[0], setSections = sSections[1];
  var sError = useState(null), error = sError[0], setError = sError[1];
  var sFileName = useState('untitled.bpmn'), fileName = sFileName[0], setFileName = sFileName[1];

  // State: UI tabs
  var sTab = useState('settings'), activeTab = sTab[0], setActiveTab = sTab[1];
  var sEditMode = useState(false), editMode = sEditMode[0], setEditMode = sEditMode[1];
  var sEditedMd = useState(''), editedMd = sEditedMd[0], setEditedMd = sEditedMd[1];

  var previewRef = useRef(null);

  // Subscribe to active tab changes to get file name
  useEffect(function() {
    subscribe('app.activeTabChanged', function(e) {
      if (e && e.tab && e.tab.file && e.tab.file.name) {
        setFileName(e.tab.file.name);
      }
    });
    subscribe('tab.saved', function(e) {
      if (e && e.file && e.file.name) {
        setFileName(e.file.name);
      }
    });
  }, []);

  // ---- Analyze BPMN Model ----
  var handleAnalyze = useCallback(async function() {
    var bridge = window.__bpmnDocGenBridge;
    if (!bridge || !bridge.modeler) {
      setError('No active BPMN modeler. Please open a BPMN diagram.');
      return;
    }

    try {
      var elementRegistry = bridge.get('elementRegistry');
      var graph = analyzeModel(elementRegistry, fileName);
      setProcessGraph(graph);

      var report = runChecks(graph);
      setQualityReport(report);

      if (report.warnings.some(function(w) { return w.level === 'ERROR'; })) {
        setError(report.warnings.filter(function(w) { return w.level === 'ERROR'; }).map(function(w) { return w.message; }).join('; '));
      } else {
        setError(null);
      }

      displayNotification({ type: 'success', title: 'BPMN Doc Generator', content: 'Model analyzed: ' + graph.metadata.elementCount + ' elements found' });
    } catch (err) {
      setError('Analysis failed: ' + (err.message || String(err)));
    }
  }, [fileName]);

  // ---- Check LM Studio Connection ----
  var handleCheckConnection = useCallback(async function() {
    setConnectionStatus('checking');
    try {
      var connected = await checkConnection(llmConfig.endpoint);
      setConnectionStatus(connected ? 'connected' : 'disconnected');

      if (connected) {
        var models = await getModels(llmConfig.endpoint);
        setModelList(models);
        if (models.length > 0 && !llmConfig.model) {
          setLlmConfig(Object.assign({}, llmConfig, { model: models[0] }));
        }
      }
    } catch (e) {
      setConnectionStatus('disconnected');
    }
  }, [llmConfig]);

  // ---- Generate Documentation ----
  var handleGenerate = useCallback(async function() {
    if (!processGraph) {
      setError('Analyze the BPMN model first.');
      return;
    }

    setGenStatus('running');
    setError(null);
    setPreviewText('');
    setSections(null);
    setSkillProgress('');

    try {
      var context = buildContext(processGraph, requirementsText, genProfile, llmConfig);
      var accumulatedPreview = '';

      var generatedSections = await orchestrate(
        SKILLS,
        context,
        {
          onSkillStart: function(idx, name, total) {
            setActiveSkill(idx);
            setSkillProgress('Skill ' + (idx + 1) + ' of ' + total + ': ' + name + '...');
          },
          onSkillProgress: function(idx, chunk) {
            accumulatedPreview += chunk;
            setPreviewText(accumulatedPreview);
          },
          onSkillComplete: function(idx, result) {
            // Section completed
          },
          onSkillError: function(idx, err) {
            console.warn('[BPMN Doc Generator] Skill failed:', err);
          }
        }
      );

      // Post-process: split multi-section skills
      var finalSections = {};

      // ProcessSummary → summary
      finalSections.summary = generatedSections.summary || '';

      // InputOutputSkill → inputs + outputs
      if (generatedSections.inputOutput) {
        try {
          var ioData = JSON.parse(generatedSections.inputOutput);
          finalSections.inputs = ioData.inputs || '';
          finalSections.outputs = ioData.outputs || '';
        } catch (e) {
          finalSections.inputs = generatedSections.inputOutput;
          finalSections.outputs = '(not generated separately)';
        }
      }

      // FlowExplanationSkill → flowMain + flowBranches
      if (generatedSections.flow) {
        try {
          var flowData = JSON.parse(generatedSections.flow);
          finalSections.flowMain = flowData.flowMain || '';
          finalSections.flowBranches = flowData.flowBranches || '';
        } catch (e) {
          finalSections.flowMain = generatedSections.flow;
          finalSections.flowBranches = '';
        }
      }

      // ExceptionSkill → exceptions
      finalSections.exceptions = generatedSections.exceptions || '';

      // BusinessRulesSkill → constraints
      finalSections.constraints = generatedSections.constraints || '';

      // GlossarySkill → glossary
      finalSections.glossary = generatedSections.glossary || '';

      // Apply traceability
      var elements = processGraph.elements || [];
      finalSections = applyTraceability(finalSections, elements);

      setSections(finalSections);

      // Compose document
      var doc = composeDocument(finalSections, {
        processName: processGraph.metadata.processName,
        processId: processGraph.metadata.processId,
        fileName: processGraph.metadata.fileName,
        llmModel: llmConfig.model
      });

      setPreviewText(doc);
      setEditedMd(doc);
      setGenStatus('done');
      setActiveTab('preview');
      displayNotification({ type: 'success', title: 'BPMN Doc Generator', content: 'Documentation generated successfully!' });

    } catch (err) {
      setGenStatus('error');
      setError('Generation failed: ' + (err.message || String(err)));
      // Preserve partial preview
      if (previewText) {
        setActiveTab('preview');
      }
    }
  }, [processGraph, requirementsText, genProfile, llmConfig]);

  // ---- Save Single File ----
  var handleSaveSingle = useCallback(async function() {
    var content = editMode ? editedMd : previewText;
    if (!content) return;

    var defaultName = (processGraph ? processGraph.metadata.processName : 'process').replace(/[^a-zA-Zа-яА-Я0-9_-]/g, '_') + '_documentation.md';
    try {
      var result = await saveSingleFile(content, defaultName);
      displayNotification({ type: 'success', title: 'BPMN Doc Generator', content: 'Saved: ' + result });
    } catch (err) {
      displayNotification({ type: 'error', title: 'BPMN Doc Generator', content: 'Save failed: ' + (err.message || String(err)) });
    }
  }, [previewText, editedMd, editMode, processGraph]);

  // ---- Save Multi File ----
  var handleSaveMulti = useCallback(async function() {
    if (!sections) return;
    var files = composeMultiFile(sections, {
      processName: processGraph ? processGraph.metadata.processName : 'process',
      processId: processGraph ? processGraph.metadata.processId : '',
      fileName: fileName
    });
    try {
      var result = await saveMultipleFiles(files);
      displayNotification({ type: 'success', title: 'BPMN Doc Generator', content: 'Saved ' + (Array.isArray(result) ? result.length : Object.keys(files).length) + ' files.' });
    } catch (err) {
      displayNotification({ type: 'error', title: 'BPMN Doc Generator', content: 'Save failed: ' + (err.message || String(err)) });
    }
  }, [sections, processGraph, fileName]);

  // ---- Copy to Clipboard ----
  var handleCopy = useCallback(function() {
    var content = editMode ? editedMd : previewText;
    copyToClipboard(content).then(function() {
      displayNotification({ type: 'success', title: 'BPMN Doc Generator', content: 'Copied to clipboard!' });
    });
  }, [previewText, editedMd, editMode]);

  // ---- Renderers ----

  var renderModelInfo = function() {
    if (!processGraph) {
      return React.createElement('div', { className: 'dg-section' },
        React.createElement('p', { className: 'dg-hint' }, 'Click "Analyze BPMN" to read the current model.')
      );
    }

    var meta = processGraph.metadata;
    return React.createElement('div', { className: 'dg-section' },
      React.createElement('div', { className: 'dg-info-grid' },
        React.createElement('span', { className: 'dg-label' }, 'Process:'),
        React.createElement('span', null, meta.processName || '(unnamed)'),
        React.createElement('span', { className: 'dg-label' }, 'ID:'),
        React.createElement('span', null, meta.processId),
        React.createElement('span', { className: 'dg-label' }, 'File:'),
        React.createElement('span', null, meta.fileName),
        React.createElement('span', { className: 'dg-label' }, 'Elements:'),
        React.createElement('span', null, meta.elementCount + ' (tasks: ' + meta.taskCount + ', events: ' + meta.eventCount + ', gateways: ' + meta.gatewayCount + ')')
      ),
      qualityReport && React.createElement('div', { className: 'dg-coverage' },
        React.createElement('span', { className: 'dg-coverage-label' }, 'Coverage:'),
        React.createElement('div', { className: 'dg-coverage-bar' },
          React.createElement('div', {
            className: 'dg-coverage-fill',
            style: { width: qualityReport.coverage + '%' }
          })
        ),
        React.createElement('span', { className: 'dg-coverage-text' }, qualityReport.coverageText)
      ),
      qualityReport && qualityReport.warnings.length > 0 && React.createElement('div', { className: 'dg-warnings' },
        qualityReport.warnings.map(function(w, i) {
          return React.createElement('div', { key: i, className: 'dg-warning dg-warning-' + w.level.toLowerCase() },
            React.createElement('span', { className: 'dg-warning-level' }, w.level),
            ' ',
            w.message
          );
        })
      )
    );
  };

  var renderRequirementsInput = function() {
    return React.createElement('div', { className: 'dg-section' },
      React.createElement('label', { className: 'dg-section-title' }, 'Requirements Description'),
      React.createElement('textarea', {
        className: 'dg-textarea',
        value: requirementsText,
        onChange: function(e) { setRequirementsText(e.target.value); },
        placeholder: 'Enter requirements text (optional, max 4000 chars)...',
        maxLength: 4000,
        rows: 4,
        disabled: genStatus === 'running'
      }),
      React.createElement('span', { className: 'dg-char-count' }, requirementsText.length + ' / 4000')
    );
  };

  var renderLlmSettings = function() {
    return React.createElement('div', { className: 'dg-section' },
      React.createElement('div', { className: 'dg-section-title' }, 'LLM Settings'),

      // Connection status
      React.createElement('div', { className: 'dg-form-row' },
        React.createElement('span', { className: 'dg-conn-status ' + connectionStatus },
          connectionStatus === 'connected' ? ' Connected' :
            connectionStatus === 'checking' ? ' Checking...' :
              connectionStatus === 'disconnected' ? ' Disconnected' : ' Not checked'
        ),
        React.createElement('button', {
          className: 'dg-btn dg-btn-sm',
          onClick: handleCheckConnection,
          disabled: connectionStatus === 'checking'
        }, 'Check Connection')
      ),

      // Endpoint
      React.createElement('div', { className: 'dg-form-group' },
        React.createElement('label', null, 'Endpoint'),
        React.createElement('input', {
          type: 'text',
          value: llmConfig.endpoint,
          onChange: function(e) { setLlmConfig(Object.assign({}, llmConfig, { endpoint: e.target.value })); },
          placeholder: 'http://localhost:1234/v1'
        })
      ),

      // Model
      React.createElement('div', { className: 'dg-form-group' },
        React.createElement('label', null, 'Model'),
        modelList.length > 0
          ? React.createElement('select', {
              value: llmConfig.model,
              onChange: function(e) { setLlmConfig(Object.assign({}, llmConfig, { model: e.target.value })); }
            },
            modelList.map(function(m) {
              return React.createElement('option', { key: m, value: m }, m);
            })
          )
          : React.createElement('input', {
              type: 'text',
              value: llmConfig.model,
              onChange: function(e) { setLlmConfig(Object.assign({}, llmConfig, { model: e.target.value })); },
              placeholder: 'Model name or ID'
            })
      ),

      // Temperature + Max Tokens
      React.createElement('div', { className: 'dg-form-row' },
        React.createElement('div', { className: 'dg-form-group dg-form-half' },
          React.createElement('label', null, 'Temperature: ', llmConfig.temperature),
          React.createElement('input', {
            type: 'range',
            min: '0', max: '1', step: '0.1',
            value: llmConfig.temperature,
            onChange: function(e) { setLlmConfig(Object.assign({}, llmConfig, { temperature: parseFloat(e.target.value) })); }
          })
        ),
        React.createElement('div', { className: 'dg-form-group dg-form-half' },
          React.createElement('label', null, 'Max Tokens'),
          React.createElement('input', {
            type: 'number',
            min: '256', max: '32768', step: '256',
            value: llmConfig.maxTokens,
            onChange: function(e) { setLlmConfig(Object.assign({}, llmConfig, { maxTokens: parseInt(e.target.value) || 2048 })); }
          })
        )
      ),

      // Template + Language
      React.createElement('div', { className: 'dg-form-row' },
        React.createElement('div', { className: 'dg-form-group dg-form-half' },
          React.createElement('label', null, 'Template'),
          React.createElement('select', {
            value: genProfile.template,
            onChange: function(e) { setGenProfile(Object.assign({}, genProfile, { template: e.target.value })); }
          },
            TEMPLATES.map(function(t) {
              return React.createElement('option', { key: t.value, value: t.value }, t.label);
            })
          )
        ),
        React.createElement('div', { className: 'dg-form-group dg-form-half' },
          React.createElement('label', null, 'Language'),
          React.createElement('select', {
            value: genProfile.language,
            onChange: function(e) { setGenProfile(Object.assign({}, genProfile, { language: e.target.value })); }
          },
            LANGUAGES.map(function(l) {
              return React.createElement('option', { key: l.value, value: l.value }, l.label);
            })
          )
        )
      )
    );
  };

  var renderActions = function() {
    return React.createElement('div', { className: 'dg-actions' },
      React.createElement('button', {
        className: 'dg-btn',
        onClick: handleAnalyze,
        disabled: genStatus === 'running'
      }, 'Analyze BPMN'),

      React.createElement('button', {
        className: 'dg-btn dg-btn-primary',
        onClick: handleGenerate,
        disabled: genStatus === 'running' || !processGraph
      }, genStatus === 'running' ? 'Generating...' : 'Generate Markdown'),

      genStatus === 'running' && React.createElement('div', { className: 'dg-progress' },
        React.createElement('div', { className: 'dg-spinner' }),
        skillProgress
      )
    );
  };

  var renderPreview = function() {
    if (genStatus === 'idle') {
      return React.createElement('div', { className: 'dg-section' },
        React.createElement('p', { className: 'dg-hint' }, 'Generated documentation will appear here.')
      );
    }

    return React.createElement('div', { className: 'dg-preview-container' },
      // Preview toolbar
      React.createElement('div', { className: 'dg-preview-toolbar' },
        editMode
          ? React.createElement('button', {
              className: 'dg-btn dg-btn-sm',
              onClick: function() { setEditMode(false); setEditedMd(previewText); }
            }, 'Preview')
          : React.createElement('button', {
              className: 'dg-btn dg-btn-sm',
              onClick: function() { setEditMode(true); setEditedMd(previewText); }
            }, 'Edit'),
        React.createElement('button', { className: 'dg-btn dg-btn-sm', onClick: handleCopy }, 'Copy'),
        React.createElement('button', { className: 'dg-btn dg-btn-sm', onClick: handleSaveSingle }, 'Save .md'),
        sections && React.createElement('button', { className: 'dg-btn dg-btn-sm', onClick: handleSaveMulti }, 'Save Multi')
      ),

      // Preview/Edit area
      editMode
        ? React.createElement('textarea', {
            className: 'dg-editor',
            value: editedMd,
            onChange: function(e) { setEditedMd(e.target.value); },
            ref: previewRef
          })
        : React.createElement('div', {
            className: 'dg-preview',
            ref: previewRef
          }, renderMarkdownPreview(previewText))
    );
  };

  // Simple Markdown-to-HTML renderer (basic subset)
  var renderMarkdownPreview = function(md) {
    if (!md) return null;

    var html = md
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/^### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      .replace(/^# (.+)$/gm, '<h2>$1</h2>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/^\| (.+)/gm, function(match) {
        return '<tr>' + match.split('|').filter(function(c) { return c.trim(); }).map(function(c) {
          return '<td>' + c.trim() + '</td>';
        }).join('') + '</tr>';
      })
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      .replace(/^---$/gm, '<hr/>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br/>');

    return React.createElement('div', {
      className: 'dg-md-preview',
      dangerouslySetInnerHTML: { __html: '<p>' + html + '</p>' }
    });
  };

  var renderError = function() {
    if (!error) return null;
    return React.createElement('div', { className: 'dg-error' },
      React.createElement('strong', null, 'Error: '),
      error
    );
  };

  // ---- Tabs ----
  var tabs = [
    { key: 'settings', label: 'Settings' },
    { key: 'preview', label: 'Preview' }
  ];

  var panelContent = React.createElement('div', { className: 'dg-panel' },
    // Header
    React.createElement('div', { className: 'dg-header' },
      React.createElement('span', { className: 'dg-title' },
        React.createElement('svg', { width: '16', height: '16', viewBox: '0 0 24 24', fill: '#52c41a' },
          React.createElement('path', { d: 'M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z' })
        ),
        'BPMN Doc Generator'
      ),
      React.createElement('span', { className: 'dg-version' }, 'v1.0')
    ),

    // Tab bar
    React.createElement('div', { className: 'dg-tabs' },
      tabs.map(function(tab) {
        return React.createElement('button', {
          key: tab.key,
          className: 'dg-tab' + (activeTab === tab.key ? ' active' : ''),
          onClick: function() { setActiveTab(tab.key); }
        }, tab.label);
      })
    ),

    // Tab content
    React.createElement('div', { className: 'dg-body' },
      activeTab === 'settings' && React.createElement(React.Fragment, null,
        renderModelInfo(),
        renderRequirementsInput(),
        renderLlmSettings(),
        renderActions(),
        renderError()
      ),
      activeTab === 'preview' && React.createElement(React.Fragment, null,
        renderPreview(),
        renderError()
      )
    )
  );

  return React.createElement(React.Fragment, null,
    React.createElement(Fill, { slot: 'bottom-panel', type: 'bpmn-doc-generator', label: 'Doc Generator' },
      panelContent
    )
  );
}

export default BpmnDocPanel;
