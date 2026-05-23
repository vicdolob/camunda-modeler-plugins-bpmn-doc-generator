/**
 * Menu entries for BPMN Doc Generator plugin.
 * Runs in Electron main process.
 */
module.exports = function(electronApp, menuState) {
  return [
    {
      label: 'Generate Documentation',
      submenu: [
        {
          label: 'Open Doc Generator Panel',
          accelerator: 'CommandOrControl+Shift+D',
          enabled: function() {
            return menuState.bpmn;
          },
          action: function() {
            // The panel is always available as a bottom-panel tab;
            // this menu entry serves as a shortcut hint.
            console.log('[BPMN Doc Generator] Panel activated via menu shortcut.');
          }
        }
      ]
    }
  ];
};
