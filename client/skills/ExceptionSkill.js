/**
 * Skill 5: ExceptionSkill
 * Generates section "3.3 Exceptions and Edge Cases".
 */
import { completeStream } from '../modules/LmStudioClient';

var SYSTEM_PROMPT = [
  'Ты — технический писатель и бизнес-аналитик.',
  'Пиши на русском языке, профессиональным деловым стилем.',
  'Используй ТОЛЬКО данные из предоставленного контекста BPMN.',
  'Не придумывай детали, которых нет в модели или требованиях.',
  'Формат: Markdown-таблица | Исключение | Триггер | Реакция | BPMN элемент |'
].join('\n');

function buildUserPrompt(context) {
  return [
    'Процесс: ' + context.processGraph.metadata.processName,
    '',
    'BoundaryEvent элементы:',
    context.boundaryEvents || '(нет)',
    '',
    'ErrorEvent элементы:',
    context.errorEvents || '(нет)',
    '',
    'TimerEvent элементы:',
    context.timerEvents || '(нет)',
    '',
    'Все элементы с документацией:',
    context.allDocumentation || '(нет)',
    '',
    'Все sequence flows:',
    context.elementsList,
    '',
    'Требования (ошибки и исключения): ' + (context.requirementsText || '(не указаны)'),
    '',
    'Составь описание обработки исключительных ситуаций:',
    'Для каждого исключения: тип -> триггер -> реакция системы -> итог/переход',
    'Таблица: | Исключение | Триггер | Реакция | BPMN элемент |',
    'Основывайся на КОНКРЕТНЫХ элементах из модели.'
  ].join('\n');
}

export var ExceptionSkill = {
  name: 'Exceptions',
  sectionKey: 'exceptions',

  execute: async function(context, onProgress) {
    var messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(context) }
    ];

    return await completeStream(messages, context.llmConfig, onProgress);
  }
};

export default ExceptionSkill;
