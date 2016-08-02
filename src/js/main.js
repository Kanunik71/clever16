





window.MODE = 'development';
var isNodeWebkit = ((/^file:/.test(window.location.protocol)) || (/^chrome-extension:/.test(window.location.protocol))) ? true : false;
if (isNodeWebkit) {
    global.isNodeWebkit = isNodeWebkit;
    window.gui = require('nw.gui');
    var clipboard = gui.Clipboard.get();
    gui.App.clearCache();
    gui.Screen.Init();
}
		
		
