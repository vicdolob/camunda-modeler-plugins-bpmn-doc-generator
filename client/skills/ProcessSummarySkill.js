/**
 * Skill 1: ProcessSummarySkill
 * Generates section "1. Purpose and Objectives of the Process".
 */
import { completeStream } from '../modules/LmStudioClient';

var SYSTEM_PROMPT = [
  'Ты — технический писатель и бизнес-аналитик.',
  'Твоя задача — написать раздел документации процесса.',
  'Пиши на русском языке, профессиональным деловым стилем.',
  'Используй ТОЛЬКО данные из предоставленного контекста BPMN.',
  'Не придумывай детали, которых нет в модели или требованиях.',
  'При нехватке данных явно помечай раздел "[Требует уточнения]".',
  'Обязательно описывай КОНКРЕТНЫЕ элементы из модели — задачи, события, роли.',
  'Формат: Markdown с подзаголовками ### где уместно.'
].join('\n');

function buildUserPrompt(context, profile) {
  var meta = context.processGraph.metadata;
  var detailInstruction = profile.detailLevel >= 3
    ? 'Напиши максимально подробный раздел (до 600 слов).'
    : profile.detailLevel === 1
      ? 'Напиши краткий раздел (до 200 слов).'
      : 'Напиши раздел средней детализации (до 400 слов).';

  return [
    'Процесс: ' + meta.processName + ' (ID: ' + meta.processId + ')',
    '',
    'Участники (lanes): ' + context.laneNames,
    '',
    'Начальные события:',
    context.startEventDetails,
    '',
    'Конечные события:',
    context.endEventDetails,
    '',
    'Все элементы процесса (' + meta.elementCount + ' шт):',
    context.elementsList,
    '',
    'Требования пользователя: ' + (context.requirementsText || '(не указаны)'),
    '',
    detailInstruction,
    '',
    'Напиши раздел "Цель и задача процесса":',
    '- Что является целью данного процесса?',
    '- Кто является инициатором и владельцем процесса?',
    '- Каков ожидаемый итог успешного выполнения?',
    '- Какие бизнес-потребности закрывает процесс?',
    'Упоминай конкретные задачи и роли из модели.'
  ].join('\n');
}

export var ProcessSummarySkill = {
  name: 'Process Summary',
  sectionKey: 'summary',

  execute: async function(context, onProgress) {
    var messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(context, context.generationProfile) }
    ];

    return await completeStream(messages, context.llmConfig, onProgress);
  }
};

export default ProcessSummarySkill;
