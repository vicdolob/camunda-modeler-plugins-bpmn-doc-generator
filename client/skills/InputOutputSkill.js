/**
 * Skill 2: InputOutputSkill
 * Generates sections "2. Input Data" and "4. Output Data".
 */
import { completeStream } from '../modules/LmStudioClient';

var SYSTEM_PROMPT = [
  'Ты — технический писатель и бизнес-аналитик.',
  'Пиши на русском языке, профессиональным деловым стилем.',
  'Используй ТОЛЬКО данные из предоставленного контекста BPMN.',
  'Не придумывай детали, которых нет в модели или требованиях.',
  'При нехватке данных явно помечай "[Требует уточнения]".',
  'Формат: Markdown-таблицы.'
].join('\n');

function buildUserPrompt(context) {
  return [
    'Процесс: ' + context.processGraph.metadata.processName,
    '',
    'StartEvent элементы:',
    context.startEventDetails,
    '',
    'EndEvent элементы:',
    context.endEventDetails,
    '',
    'Первые задачи после старта процесса:',
    context.firstTasks,
    '',
    'Последние задачи перед завершением:',
    context.lastTasks,
    '',
    'Documentation и extensionElements элементов:',
    context.extensionData,
    '',
    'Все элементы процесса:',
    context.elementsList,
    '',
    'Требования: ' + (context.requirementsText || '(не указаны)'),
    '',
    'Определи и опиши:',
    '1. ВХОДНЫЕ ДАННЫЕ: что запускает процесс, какие данные/документы/события необходимы для старта.',
    '   Для каждого входа укажи: название, тип (документ/событие/данные/решение), источник (кто предоставляет).',
    '2. ВЫХОДНЫЕ ДАННЫЕ: что является результатом процесса при успешном завершении.',
    '   Для каждого выхода укажи: название, тип, получатель.',
    '',
    'ВАЖНО: Выведи ДВА отдельных раздела.',
    'Первый заголовок: "ВХОДНЫЕ ДАННЫЕ"',
    'Второй заголовок: "ВЫХОДНЫЕ ДАННЫЕ"',
    'Используй формат Markdown-таблицы.',
    'Основывайся на КОНКРЕТНЫХ элементах из модели.'
  ].join('\n');
}

export var InputOutputSkill = {
  name: 'Input/Output Data',
  sectionKey: 'inputOutput',

  execute: async function(context, onProgress) {
    var messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(context) }
    ];

    var fullText = await completeStream(messages, context.llmConfig, onProgress);

    // Split into inputs and outputs sections
    var parts = fullText.split(/(?:ВЫХОДНЫЕ ДАННЫЕ|OUTPUT DATA|Выходные данные)/i);
    var inputs = (parts[0] || '').replace(/(?:ВХОДНЫЕ ДАННЫЕ|INPUT DATA|Входные данные)[^\n]*\n/i, '').trim();
    var outputs = (parts[1] || '').trim();

    return JSON.stringify({ inputs: inputs, outputs: outputs });
  }
};

export default InputOutputSkill;
