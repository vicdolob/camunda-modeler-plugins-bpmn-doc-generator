/**
 * Skill 3: FlowExplanationSkill
 * Generates section "3. Execution Logic" (main scenario + alternative branches).
 */
import { completeStream } from '../modules/LmStudioClient';

var SYSTEM_PROMPT = [
  'Ты — технический писатель и бизнес-аналитик.',
  'Пиши на русском языке, профессиональным деловым стилем.',
  'Используй ТОЛЬКО данные из предоставленного контекста BPMN.',
  'Не придумывай детали, которых нет в модели или требованиях.',
  'При нехватке данных явно помечай "[Требует уточнения]".',
  'Обязательно упоминай конкретные BPMN-элементы по их ID.'
].join('\n');

function buildUserPrompt(context, profile) {
  var detailInstruction = profile.detailLevel >= 3
    ? 'Опиши КАЖДЫЙ шаг максимально подробно с указанием всех элементов.'
    : profile.detailLevel === 1
      ? 'Опиши только основные шаги без лишних деталей.'
      : 'Опиши ключевые шаги процесса с указанием элементов.';

  return [
    'Процесс: ' + context.processGraph.metadata.processName,
    '',
    'Полный список элементов по порядку (от StartEvent до EndEvent):',
    context.orderedElements,
    '',
    'Шлюзы с условиями переходов:',
    context.gatewayConditions || '(нет шлюзов с условиями)',
    '',
    'Все sequence flows (связи между элементами):',
    context.elementsList,
    '',
    'Требования: ' + (context.requirementsText || '(не указаны)'),
    '',
    detailInstruction,
    '',
    'Напиши раздел "Логика выполнения" состоящий из двух подразделов.',
    '',
    'Подраздел "Основной сценарий":',
    'Пошаговое описание нормального хода выполнения процесса.',
    'Каждый шаг: "Шаг N. [Название задачи/события]: [описание действия] | [исполнитель/система]"',
    'Ссылка на BPMN element id в формате "(id: element_id)"',
    '',
    'Подраздел "Альтернативные ветки":',
    'Опиши каждое ветвление (ExclusiveGateway/InclusiveGateway):',
    '- Название шлюза и условие',
    '- Ветка А: при условии X — что происходит',
    '- Ветка Б: при условии Y — что происходит',
    'Если условие не задано в модели — пометь "[Условие не указано в модели]"'
  ].join('\n');
}

export var FlowExplanationSkill = {
  name: 'Flow Explanation',
  sectionKey: 'flow',

  execute: async function(context, onProgress) {
    var messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(context, context.generationProfile) }
    ];

    var fullText = await completeStream(messages, context.llmConfig, onProgress);

    // Split into main and branches sections
    var parts = fullText.split(/(?:Альтернативные ветки|Alternative Branches|АЛЬТЕРНАТИВНЫЕ)/i);
    var main = (parts[0] || '').replace(/(?:Основной сценарий|Main Scenario|ОСНОВНОЙ)[^\n]*\n/i, '').trim();
    var branches = (parts[1] || '').trim();

    return JSON.stringify({ flowMain: main, flowBranches: branches });
  }
};

export default FlowExplanationSkill;
