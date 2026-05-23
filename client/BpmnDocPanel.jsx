import React, { useState, useCallback, useRef, useEffect } from 'react';
import Fill from 'camunda-modeler-plugin-helpers/components/Fill';
import { analyzeModel } from './modules/BpmnAnalyzer';
import { PROVIDERS, checkConnection, getModels } from './modules/LmStudioClient';
import { runChecks } from './modules/QualityChecker';
import { buildContext } from './modules/ContextBuilder';
import { orchestrate } from './modules/SkillOrchestrator';
import { composeDocument, composeMultiFile } from './modules/MarkdownComposer';
import { applyTraceability } from './skills/TraceabilitySkill';
import { saveSingleFile, saveMultipleFiles, copyToClipboard } from './modules/ExportManager';
import { loadSettings, saveSettings } from './modules/SettingsStore';

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

function BpmnDocPanel(props) {
  var subscribe = props.subscribe || function() {};
  var triggerAction = props.triggerAction || function() {};
  var displayNotification = props.displayNotification || function() {};

  // --- Load persisted settings on first render ---
  var savedSettings = useRef(loadSettings()).current;

  // State: model analysis
  var sGraph = useState(null), processGraph = sGraph[0], setProcessGraph = sGraph[1];
  var sQuality = useState(null), qualityReport = sQuality[0], setQualityReport = sQuality[1];

  // State: requirements
  var sReq = useState(''), requirementsText = sReq[0], setRequirementsText = sReq[1];

  // State: LLM settings (initialized from persisted storage)
  var sLlm = useState({
    providerId: savedSettings.providerId || 'lmstudio',
    endpoint: savedSettings.endpoint || 'http://localhost:1234/v1',
    apiKey: savedSettings.apiKey || 'lm-studio',
    model: savedSettings.model || '',
    apiFormat: savedSettings.apiFormat || 'openai',
    temperature: savedSettings.temperature || 0.3,
    maxTokens: savedSettings.maxTokens || 4096,
    stream: true,
    timeout: 120000
  }), llmConfig = sLlm[0], setLlmConfig = sLlm[1];

  var sConn = useState(''), connectionStatus = sConn[0], setConnectionStatus = sConn[1];
  var sModels = useState([]), modelList = sModels[0], setModelList = sModels[1];

  // State: generation profile (persisted)
  var sProfile = useState({
    template: savedSettings.template || 'standard',
    language: savedSettings.language || 'ru',
    detailLevel: savedSettings.detailLevel || 2
  }), genProfile = sProfile[0], setGenProfile = sProfile[1];

  // State: generation
  var sGenStatus = useState('idle'), genStatus = sGenStatus[0], setGenStatus = sGenStatus[1];
  var sSkillProgress = useState(''), skillProgress = sSkillProgress[0], setSkillProgress = sSkillProgress[1];
  var sPreview = useState(''), previewText = sPreview[0], setPreviewText = sPreview[1];
  var sSections = useState(null), sections = sSections[0], setSections = sSections[1];
  var sError = useState(null), error = sError[0], setError = sError[1];
  var sFileName = useState('untitled.bpmn'), fileName = sFileName[0], setFileName = sFileName[1];

  // State: generation log
  var sGenLog = useState([]), genLog = sGenLog[0], setGenLog = sGenLog[1];
  var sLogOpen = useState(false), logOpen = sLogOpen[0], setLogOpen = sLogOpen[1];

  // State: UI
  var sTab = useState('settings'), activeTab = sTab[0], setActiveTab = sTab[1];
  var sEditMode = useState(false), editMode = sEditMode[0], setEditMode = sEditMode[1];
  var sEditedMd = useState(''), editedMd = sEditedMd[0], setEditedMd = sEditedMd[1];
  var sShowSettings = useState(false), showSettings = sShowSettings[0], setShowSettings = sShowSettings[1];

  var previewRef = useRef(null);

  // --- Helper: persist current settings ---
  var persistSettings = useCallback(function(cfg, profile) {
    saveSettings({
      providerId: cfg.providerId,
      endpoint: cfg.endpoint,
      apiKey: cfg.apiKey,
      model: cfg.model,
      apiFormat: cfg.apiFormat,
      temperature: cfg.temperature,
      maxTokens: cfg.maxTokens,
      template: profile.template,
      language: profile.language,
      detailLevel: profile.detailLevel
    });
  }, []);

  // Subscribe to active tab changes
  useEffect(function() {
    subscribe('app.activeTabChanged', function(e) {
      if (e && e.tab && e.tab.file && e.tab.file.name) setFileName(e.tab.file.name);
    });
    subscribe('tab.saved', function(e) {
      if (e && e.file && e.file.name) setFileName(e.file.name);
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

  // ---- Check Connection ----
  var handleCheckConnection = useCallback(async function() {
    setConnectionStatus('checking');
    try {
      var connected = await checkConnection(llmConfig.endpoint, llmConfig.apiKey, llmConfig.apiFormat);
      setConnectionStatus(connected ? 'connected' : 'disconnected');
      if (connected && llmConfig.apiFormat === 'openai') {
        var models = await getModels(llmConfig.endpoint, llmConfig.apiKey);
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
    if (!processGraph) { setError('Analyze the BPMN model first.'); return; }
    setGenStatus('running');
    setError(null);
    setPreviewText('');
    setSections(null);
    setSkillProgress('');
    setGenLog([]);
    setLogOpen(false);

    try {
      var context = buildContext(processGraph, requirementsText, genProfile, llmConfig);
      var accumulatedPreview = '';
      var logEntries = [];

      var generatedSections = await orchestrate(SKILLS, context, {
        onSkillStart: function(idx, name, total) {
          var msg = 'Skill ' + (idx + 1) + '/' + total + ': ' + name + ' — started';
          setSkillProgress(msg);
          logEntries = logEntries.concat([{ time: new Date().toLocaleTimeString(), msg: msg, type: 'start' }]);
          setGenLog(logEntries.slice());
        },
        onSkillProgress: function(idx, chunk) {
          accumulatedPreview += chunk;
          setPreviewText(accumulatedPreview);
        },
        onSkillComplete: function(idx, result) {
          var msg = 'Skill ' + (idx + 1) + ' — completed (' + (result ? result.length : 0) + ' chars)';
          logEntries = logEntries.concat([{ time: new Date().toLocaleTimeString(), msg: msg, type: 'done' }]);
          setGenLog(logEntries.slice());
        },
        onSkillError: function(idx, err) {
          var msg = 'Skill ' + (idx + 1) + ' — FAILED: ' + (err.message || String(err));
          logEntries = logEntries.concat([{ time: new Date().toLocaleTimeString(), msg: msg, type: 'error' }]);
          setGenLog(logEntries.slice());
        }
      });

      // Post-process
      var finalSections = {};
      finalSections.summary = generatedSections.summary || '';
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
      finalSections.exceptions = generatedSections.exceptions || '';
      finalSections.constraints = generatedSections.constraints || '';
      finalSections.glossary = generatedSections.glossary || '';
      finalSections = applyTraceability(finalSections, processGraph.elements || []);
      setSections(finalSections);

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
      logEntries = logEntries.concat([{ time: new Date().toLocaleTimeString(), msg: 'All skills completed. Document assembled.', type: 'done' }]);
      setGenLog(logEntries);
      displayNotification({ type: 'success', title: 'BPMN Doc Generator', content: 'Documentation generated successfully!' });
    } catch (err) {
      setGenStatus('error');
      setError('Generation failed: ' + (err.message || String(err)));
      if (previewText) setActiveTab('preview');
    }
  }, [processGraph, requirementsText, genProfile, llmConfig]);

  // ---- Save / Copy ----
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

  var handleCopy = useCallback(function() {
    copyToClipboard(editMode ? editedMd : previewText).then(function() {
      displayNotification({ type: 'success', title: 'BPMN Doc Generator', content: 'Copied to clipboard!' });
    });
  }, [previewText, editedMd, editMode]);

  // ---- Provider change handler ----
  var handleProviderChange = useCallback(function(providerId) {
    var preset = PROVIDERS.find(function(p) { return p.id === providerId; });
    if (!preset) return;
    var newCfg = Object.assign({}, llmConfig, {
      providerId: preset.id,
      endpoint: preset.endpoint || llmConfig.endpoint,
      apiKey: preset.apiKey !== undefined ? preset.apiKey : llmConfig.apiKey,
      model: preset.model || '',
      apiFormat: preset.apiFormat
    });
    setLlmConfig(newCfg);
    setConnectionStatus('');
    setModelList([]);
    persistSettings(newCfg, genProfile);
  }, [llmConfig, genProfile, persistSettings]);

  // ---- Save settings on any change ----
  var updateLlmConfig = useCallback(function(updates) {
    var newCfg = Object.assign({}, llmConfig, updates);
    setLlmConfig(newCfg);
    persistSettings(newCfg, genProfile);
  }, [llmConfig, genProfile, persistSettings]);

  var updateGenProfile = useCallback(function(updates) {
    var newProfile = Object.assign({}, genProfile, updates);
    setGenProfile(newProfile);
    persistSettings(llmConfig, newProfile);
  }, [llmConfig, genProfile, persistSettings]);

  // ===================== RENDERERS =====================

  // --- Settings Panel (behind gear icon) ---
  var renderSettingsPanel = function() {
    if (!showSettings) return null;
    return React.createElement('div', { className: 'dg-settings-overlay' },
      React.createElement('div', { className: 'dg-settings-panel' },
        // Header
        React.createElement('div', { className: 'dg-settings-header' },
          React.createElement('span', { className: 'dg-settings-title' }, 'LLM Connection Settings'),
          React.createElement('button', {
            className: 'dg-btn dg-btn-sm',
            onClick: function() { setShowSettings(false); },
            title: 'Close settings'
          }, '✕')
        ),

        // Provider selector
        React.createElement('div', { className: 'dg-form-group' },
          React.createElement('label', null, 'Provider'),
          React.createElement('select', {
            value: llmConfig.providerId || 'lmstudio',
            onChange: function(e) { handleProviderChange(e.target.value); }
          },
            PROVIDERS.map(function(p) {
              return React.createElement('option', { key: p.id, value: p.id }, p.name);
            })
          )
        ),

        // Endpoint
        React.createElement('div', { className: 'dg-form-group' },
          React.createElement('label', null, 'Endpoint URL'),
          React.createElement('input', {
            type: 'text',
            value: llmConfig.endpoint,
            onChange: function(e) { updateLlmConfig({ endpoint: e.target.value }); },
            placeholder: llmConfig.apiFormat === 'anthropic' ? 'https://api.anthropic.com' : 'http://localhost:1234/v1'
          })
        ),

        // API Key
        React.createElement('div', { className: 'dg-form-group' },
          React.createElement('label', null, 'API Key'),
          React.createElement('input', {
            type: 'password',
            value: llmConfig.apiKey,
            onChange: function(e) { updateLlmConfig({ apiKey: e.target.value }); },
            placeholder: llmConfig.providerId === 'lmstudio' ? 'lm-studio' : 'sk-...'
          })
        ),

        // Model
        React.createElement('div', { className: 'dg-form-group' },
          React.createElement('label', null, 'Model'),
          modelList.length > 0
            ? React.createElement('select', {
                value: llmConfig.model,
                onChange: function(e) { updateLlmConfig({ model: e.target.value }); }
              }, modelList.map(function(m) { return React.createElement('option', { key: m, value: m }, m); }))
            : React.createElement('input', {
                type: 'text',
                value: llmConfig.model,
                onChange: function(e) { updateLlmConfig({ model: e.target.value }); },
                placeholder: 'Model name or ID'
              })
        ),

        // Temperature + Max Tokens
        React.createElement('div', { className: 'dg-form-row' },
          React.createElement('div', { className: 'dg-form-group dg-form-half' },
            React.createElement('label', null, 'Temperature: ', llmConfig.temperature),
            React.createElement('input', {
              type: 'range', min: '0', max: '1', step: '0.1',
              value: llmConfig.temperature,
              onChange: function(e) { updateLlmConfig({ temperature: parseFloat(e.target.value) }); }
            })
          ),
          React.createElement('div', { className: 'dg-form-group dg-form-half' },
            React.createElement('label', null, 'Max Tokens'),
            React.createElement('input', {
              type: 'number', min: '256', max: '32768', step: '256',
              value: llmConfig.maxTokens,
              onChange: function(e) { updateLlmConfig({ maxTokens: parseInt(e.target.value) || 4096 }); }
            })
          )
        ),

        // Connection check
        React.createElement('div', { className: 'dg-form-row', style: { marginTop: '8px' } },
          React.createElement('button', {
            className: 'dg-btn dg-btn-sm',
            onClick: handleCheckConnection,
            disabled: connectionStatus === 'checking'
          }, connectionStatus === 'checking' ? 'Checking...' : 'Check Connection'),
          React.createElement('span', { className: 'dg-conn-status ' + connectionStatus },
            connectionStatus === 'connected' ? ' Connected' :
              connectionStatus === 'checking' ? ' Checking...' :
                connectionStatus === 'disconnected' ? ' Disconnected' : ''
          )
        ),

        // Template + Language
        React.createElement('div', { className: 'dg-form-row', style: { marginTop: '12px' } },
          React.createElement('div', { className: 'dg-form-group dg-form-half' },
            React.createElement('label', null, 'Template'),
            React.createElement('select', {
              value: genProfile.template,
              onChange: function(e) { updateGenProfile({ template: e.target.value }); }
            }, TEMPLATES.map(function(t) { return React.createElement('option', { key: t.value, value: t.value }, t.label); }))
          ),
          React.createElement('div', { className: 'dg-form-group dg-form-half' },
            React.createElement('label', null, 'Language'),
            React.createElement('select', {
              value: genProfile.language,
              onChange: function(e) { updateGenProfile({ language: e.target.value }); }
            }, LANGUAGES.map(function(l) { return React.createElement('option', { key: l.value, value: l.value }, l.label); }))
          )
        )
      )
    );
  };

  // --- Model Info ---
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
          React.createElement('div', { className: 'dg-coverage-fill', style: { width: qualityReport.coverage + '%' } })
        ),
        React.createElement('span', { className: 'dg-coverage-text' }, qualityReport.coverageText)
      ),
      qualityReport && qualityReport.warnings.length > 0 && React.createElement('div', { className: 'dg-warnings' },
        qualityReport.warnings.map(function(w, i) {
          return React.createElement('div', { key: i, className: 'dg-warning dg-warning-' + w.level.toLowerCase() },
            React.createElement('span', { className: 'dg-warning-level' }, w.level), ' ', w.message
          );
        })
      )
    );
  };

  // --- Requirements Input ---
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

  // --- Collapsible Generation Log ---
  var renderGenLog = function() {
    if (genLog.length === 0 && genStatus === 'idle') return null;
    return React.createElement('div', { className: 'dg-section dg-log-section' },
      React.createElement('div', {
        className: 'dg-log-header',
        onClick: function() { setLogOpen(!logOpen); }
      },
        React.createElement('span', { className: 'dg-log-toggle' }, logOpen ? '▼' : '▶'),
        React.createElement('span', { className: 'dg-log-title' }, 'Generation Log'),
        genStatus === 'running' && React.createElement('span', { className: 'dg-spinner dg-spinner-sm' }),
        React.createElement('span', { className: 'dg-log-count' }, genLog.length + ' entries')
      ),
      logOpen && React.createElement('div', { className: 'dg-log-body' },
        genLog.map(function(entry, i) {
          return React.createElement('div', { key: i, className: 'dg-log-entry dg-log-' + entry.type },
            React.createElement('span', { className: 'dg-log-time' }, entry.time),
            ' ',
            entry.msg
          );
        }),
        genStatus === 'running' && React.createElement('div', { className: 'dg-log-entry dg-log-start' },
          React.createElement('span', { className: 'dg-log-time' }, new Date().toLocaleTimeString()),
          ' ',
          skillProgress,
          ' ...'
        )
      )
    );
  };

  // --- Actions ---
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

  // --- Preview ---
  var renderPreview = function() {
    if (genStatus === 'idle') {
      return React.createElement('div', { className: 'dg-section' },
        React.createElement('p', { className: 'dg-hint' }, 'Generated documentation will appear here.')
      );
    }
    return React.createElement('div', { className: 'dg-preview-container' },
      React.createElement('div', { className: 'dg-preview-toolbar' },
        editMode
          ? React.createElement('button', { className: 'dg-btn dg-btn-sm', onClick: function() { setEditMode(false); setEditedMd(previewText); } }, 'Preview')
          : React.createElement('button', { className: 'dg-btn dg-btn-sm', onClick: function() { setEditMode(true); setEditedMd(previewText); } }, 'Edit'),
        React.createElement('button', { className: 'dg-btn dg-btn-sm', onClick: handleCopy }, 'Copy'),
        React.createElement('button', { className: 'dg-btn dg-btn-sm', onClick: handleSaveSingle }, 'Save .md'),
        sections && React.createElement('button', { className: 'dg-btn dg-btn-sm', onClick: handleSaveMulti }, 'Save Multi')
      ),
      editMode
        ? React.createElement('textarea', { className: 'dg-editor', value: editedMd, onChange: function(e) { setEditedMd(e.target.value); }, ref: previewRef })
        : React.createElement('div', { className: 'dg-preview', ref: previewRef }, renderMarkdownPreview(previewText))
    );
  };

  var renderMarkdownPreview = function(md) {
    if (!md) return null;
    var html = md
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
      .replace(/^### (.+)$/gm, '<h4>$1</h4>')
      .replace(/^## (.+)$/gm, '<h3>$1</h3>')
      .replace(/^# (.+)$/gm, '<h2>$1</h2>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.+?)\*/g, '<em>$1</em>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/^\| (.+)/gm, function(match) {
        return '<tr>' + match.split('|').filter(function(c) { return c.trim(); }).map(function(c) { return '<td>' + c.trim() + '</td>'; }).join('') + '</tr>';
      })
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      .replace(/^---$/gm, '<hr/>')
      .replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br/>');
    return React.createElement('div', { className: 'dg-md-preview', dangerouslySetInnerHTML: { __html: '<p>' + html + '</p>' } });
  };

  var renderError = function() {
    if (!error) return null;
    return React.createElement('div', { className: 'dg-error' }, React.createElement('strong', null, 'Error: '), error);
  };

  // --- Gear icon SVG ---
  var gearIcon = React.createElement('svg', { width: '16', height: '16', viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: '2' },
    React.createElement('circle', { cx: '12', cy: '12', r: '3' }),
    React.createElement('path', { d: 'M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z' })
  );

  // --- Status bar (compact, in header) ---
  var currentProvider = PROVIDERS.find(function(p) { return p.id === (llmConfig.providerId || 'lmstudio'); });

  var statusBar = React.createElement('div', { className: 'dg-status-bar' },
    React.createElement('span', { className: 'dg-conn-dot ' + connectionStatus }),
    React.createElement('span', { className: 'dg-status-text' },
      (currentProvider ? currentProvider.name : 'Custom'),
      llmConfig.model ? ' · ' + llmConfig.model : ''
    )
  );

  // ===================== MAIN LAYOUT =====================
  var tabs = [
    { key: 'settings', label: 'Settings' },
    { key: 'preview', label: 'Preview' }
  ];

  var panelContent = React.createElement('div', { className: 'dg-panel' },
    // Header with gear icon
    React.createElement('div', { className: 'dg-header' },
      React.createElement('span', { className: 'dg-title' },
        React.createElement('svg', { width: '16', height: '16', viewBox: '0 0 24 24', fill: '#52c41a' },
          React.createElement('path', { d: 'M14 2H6c-1.1 0-2 .9-2 2v16c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V8l-6-6zm-1 7V3.5L18.5 9H13z' })
        ),
        'BPMN Doc Generator'
      ),
      React.createElement('div', { className: 'dg-header-right' },
        statusBar,
        React.createElement('button', {
          className: 'dg-gear-btn' + (showSettings ? ' active' : ''),
          onClick: function() { setShowSettings(!showSettings); },
          title: 'LLM Connection Settings'
        }, gearIcon)
      )
    ),

    // Settings overlay (opens on gear click)
    renderSettingsPanel(),

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
        renderGenLog(),
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
