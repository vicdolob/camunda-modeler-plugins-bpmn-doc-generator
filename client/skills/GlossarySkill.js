/**
 * Skill 6: GlossarySkill
 * Generates section "6. Key Terms".
 */
import { completeStream } from '../modules/LmStudioClient';

var SYSTEM_PROMPT = [
  'Ты — технический писатель и бизнес-аналитик.',
  'Пиши на русском языке, профессиональным деловым стилем.',
  'Используй ТОЛЬКО данные из предоставленного контекста BPMN.',
  'Формат: Markdown-таблица | Термин | Определение |'
].join('\n');

function buildUserPrompt(context) {
  return [
    'Процесс: ' + context.processGraph.metadata.processName,
    '',
    'Все имена элементов:',
    context.allElementNames || '(нет)',
    '',
    'Имена ролей (lanes):',
    context.laneNames || '(нет)',
    '',
    'Documentation полей:',
    context.allDocumentation || '(нет)',
    '',
    'Требования: ' + (context.requirementsText || '(не указаны)'),
    '',
    'Составь глоссарий ключевых терминов процесса.',
    'Для каждого термина:',
    '- Термин',
    '- Краткое определение (1-2 предложения) в контексте данного процесса',
    'Включи: названия ролей, системы, типы документов, специфические бизнес-термины.',
    'Формат: Markdown-таблица "| Термин | Определение |"'
  ].join('\n');
}

export var GlossarySkill = {
  name: 'Glossary',
  sectionKey: 'glossary',

  execute: async function(context, onProgress) {
    var messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(context) }
    ];

    return await completeStream(messages, context.llmConfig, onProgress);
  }
};

export default GlossarySkill;
