/**
 * Skill 4: BusinessRulesSkill
 * Generates section "5. Constraints and Remarks".
 */
import { completeStream } from '../modules/LmStudioClient';

var SYSTEM_PROMPT = [
  'Ты — технический писатель и бизнес-аналитик.',
  'Пиши на русском языке, профессиональным деловым стилем.',
  'Используй ТОЛЬКО данные из предоставленного контекста BPMN.',
  'Не придумывай детали, которых нет в модели или требованиях.',
  'Если правило нечёткое — пометь "[Требует уточнения у владельца процесса]".',
  'Упоминай конкретные BPMN-элементы по их ID.'
].join('\n');

function buildUserPrompt(context) {
  return [
    'Процесс: ' + context.processGraph.metadata.processName,
    '',
    'Шлюзы с условиями переходов:',
    context.gatewayConditions || '(нет шлюзов с условиями)',
    '',
    'BusinessRuleTask элементы:',
    context.businessRuleTasks || '(нет)',
    '',
    'Documentation поля всех элементов:',
    context.allDocumentation || '(нет документации)',
    '',
    'Все элементы:',
    context.elementsList,
    '',
    'Требования: ' + (context.requirementsText || '(не указаны)'),
    '',
    'Опиши бизнес-правила и ограничения процесса:',
    '- Условия принятия решений (шлюзы)',
    '- Бизнес-правила (BusinessRuleTask)',
    '- Временные ограничения (Timer)',
    '- Нормативные ограничения из требований',
    '- Технические ограничения',
    'Если правило нечёткое — пометь "[Требует уточнения у владельца процесса]"'
  ].join('\n');
}

export var BusinessRulesSkill = {
  name: 'Business Rules',
  sectionKey: 'constraints',

  execute: async function(context, onProgress) {
    var messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(context) }
    ];

    return await completeStream(messages, context.llmConfig, onProgress);
  }
};

export default BusinessRulesSkill;
