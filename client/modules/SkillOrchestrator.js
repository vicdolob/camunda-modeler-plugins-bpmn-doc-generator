/**
 * SkillOrchestrator — runs generation skills sequentially.
 * Each skill receives PromptContext and returns a section string.
 * On skill failure, continues with remaining skills.
 */

/**
 * @typedef {Object} Skill
 * @property {string} name - Display name for progress reporting
 * @property {string} sectionKey - Key in the sections result object
 * @property {function} execute - async (context, onProgress) => string
 */

/**
 * Run all skills sequentially.
 * @param {Skill[]} skills - Array of skill objects
 * @param {Object} context - PromptContext
 * @param {function} onSkillStart - (index, skillName, total) => void
 * @param {function} onSkillProgress - (index, chunk) => void
 * @param {function} onSkillComplete - (index, result) => void
 * @param {function} onSkillError - (index, error) => void
 * @returns {Object} sections - { sectionKey: sectionContent }
 */
export async function orchestrate(skills, context, callbacks) {
  var onSkillStart = (callbacks && callbacks.onSkillStart) || function() {};
  var onSkillProgress = (callbacks && callbacks.onSkillProgress) || function() {};
  var onSkillComplete = (callbacks && callbacks.onSkillComplete) || function() {};
  var onSkillError = (callbacks && callbacks.onSkillError) || function() {};

  var sections = {};
  var total = skills.length;

  for (var i = 0; i < skills.length; i++) {
    var skill = skills[i];
    onSkillStart(i, skill.name, total);

    try {
      var result = await skill.execute(context, function(chunk) {
        onSkillProgress(i, chunk);
      });
      sections[skill.sectionKey] = result || '';
      onSkillComplete(i, result);
    } catch (err) {
      var errorMsg = '[Generation failed: ' + (err.message || String(err)) + ']';
      sections[skill.sectionKey] = errorMsg;
      onSkillError(i, err);
    }
  }

  return sections;
}

export default { orchestrate: orchestrate };
