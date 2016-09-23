




window.MODE = 'development';

//location.port == 3001

var isNodeWebkit = ((/^file:/.test(window.location.protocol)) || (/^chrome-extension:/.test(window.location.protocol))) ? true : false;
if (isNodeWebkit) {
    global.isNodeWebkit = isNodeWebkit;
    window.gui = require('nw.gui');

	document.body.className = 'desctop' + (document.body.className ? ' '+document.body.className : '');
	
	
	function getCurrentApplicationPath() {
		if (global.process.platform === 'darwin') {
			return global.process.execPath.split('.app/Content')[0] + '.app';
		}
		return null;
	};

    var clipboard = gui.Clipboard.get();
    gui.App.clearCache();
    gui.Screen.Init();
}







window.configApp = {
	local: localStorage.getItem("locale") || 'ru',
	desktop: localStorage.getItem("desktop") ? JSON.parse(localStorage.getItem("desktop")) : ({
		prop_autoStart: 1,
		prop_autoIn: 1,
		prop_sendReport: 1,
	}),
	prop: {},
	fastPhrase: {},
	user: localStorage.getItem("user") ? JSON.parse(localStorage.getItem("user")) : ({login: '', password: ''}),
	windowState: localStorage.getItem("windowState") ? JSON.parse(localStorage.getItem("windowState")) : {},
	dev: false
}













var refresh = new Date().getTime();
//var refresh = version;



(function(tools, libs){
    var require_inner = function( scripts, onEnd ){
        onEnd = onEnd || function(){};
        if( !scripts || scripts.length < 1 )return onEnd();
        var src  = scripts.splice( 0, 1),
            script = document.createElement("script");
        script.setAttribute("src", src);
        tools.addEvent("load", script, function(){
            require_inner( scripts, onEnd );
        });
        document.getElementsByTagName("head")[0].appendChild(script);
    };
    require_inner( libs.slice(), function(){});
})(
    {
        addEvent : function(evnt, elem, func ){
            try{
                if( elem.addEventListener ){
                    elem.addEventListener( evnt, func, false );
                }else if( elem.attachEvent ){
                     var r = elem.attachEvent( "on" + evnt, func );
                }
                return true;
            }catch( e ){
                return false;
            }
        }
    },
    [
        'js/jquery-2.2.2.min.js?'+refresh,
		'js/jquery.cookie.js?'+refresh,
		'js/jquery.mousewheel.js?'+refresh,
		'js/lang.js?'+refresh,
		'js/scrollbar/jquery.scrollbar.js?'+refresh,
		'js/rangy/rangy-core.js?'+refresh,
		'js/undo/undo.js?'+refresh,
		'js/jscolor.min.js?'+refresh,
		//'js/medium/medium.min.js?'+refresh,
		'js/medium/medium.js?'+refresh,
		'js/socket.io.js?'+refresh,
		'js/sergDesctop.js?'+refresh,
		'js/jquery-ui.min.js?'+refresh,
		'js/custom.js?'+refresh,
    ]
);







if(isNodeWebkit) {


var d = require('domain').create();
d.on('error', function(er){
	console.log('error, but oh well', er.message);
});
d.run(function(){


	var gui = require('nw.gui');
	var win = gui.Window.get();













	var platform = require('./components/platform');
	var updater = require('./components/updater');





var gui = window.require('nw.gui');
var clipboard = gui.Clipboard.get();
var AutoLaunch = require('auto-launch');
//var windowBehaviour = require('./components/window-behaviour');
var dispatcher = require('./components/dispatcher');
var platform = require('./components/platform');
//var settings = require('./components/settings');
var updater = require('./components/updater');





// проверка обновлений
/*
updater.checkAndPrompt(gui.App.manifest, win);
updater.check(gui.App.manifest, function(error, newVersionExists, newManifest) {
    if (error || newVersionExists) {
		updater.prompt(win, false, error, newVersionExists, newManifest);
    } else {
		dispatcher.trigger('win.alert', {
            win: win,
            message: 'You’re using the latest version: ' + gui.App.manifest.version
        });
    }
});
*/






  var AutoLaunch = require('auto-launch');
  window.launcher = new AutoLaunch({
    name: 'Clever16',
    path: getCurrentApplicationPath(),
    isHidden: false,
  });

  launcher.removeNwjsLoginItem();

  launcher.isEnabled(function(enabled) {
    if(window.configApp.desktop.prop_autoStart == 1 && !enabled) {
      launcher.enable(function(error) {
        if (error) {
          console.error(error);
        }
      });
    } else if (window.configApp.desktop.prop_autoStart == 0 && enabled){
      launcher.disable(function(error) {
        if (error) {
          console.error(error);
        }
      });
    }
  });




//var menus = require('./components/menus');
var menus = {


  loadMenuBar: function(win) {

    if (!platform.isOSX) {
		return;
    }

    var menu = new gui.Menu({
		type: 'menubar'
    });
	menu.createMacBuiltin('Clever16');

	menu.append(new gui.MenuItem({
		label: 'Открыть Clever16',
		click: function() {
			win.show();
		}
    }));

	menu.append(new gui.MenuItem({
      label: 'Выход из Clever16',
      click: function() {
        win.close();
      }
    }));

    win.menu = menu;
  },


  createTrayMenu: function(win) {
    var menu = new gui.Menu();


    /*menu.append(new gui.MenuItem({
      type: 'separator'
    }));*/

    menu.append(new gui.MenuItem({
      label: 'Открыть Clever16',
      click: function() {
        win.show();
      }
    }));

    menu.append(new gui.MenuItem({
      label: 'Выход из Clever16',
      click: function() {
        win.close();
      }
    }));


    return menu;
  },


  loadTrayIcon: function(win) {
    if (win.tray) {
		win.tray = null;
    }

    var tray = new gui.Tray({
		icon: 'images/icon_' + (platform.isOSX ? 'menubar.tiff' : 'tray.png')
    });

    tray.on('click', function() {
		win.show();
    });

    tray.tooltip = 'Clever16';
    tray.menu = this.createTrayMenu(win);

    // keep the object in memory
    win.tray = tray;
  }

};






















	var windowBehaviour = {
	  set: function(win) {
		// Show the window when the dock icon is pressed
		gui.App.removeAllListeners('reopen');
		gui.App.on('reopen', function() {
		  win.show();
		});

		// Don't quit the app when the window is closed
		if (!platform.isLinux) {
		  win.removeAllListeners('close');
		  win.on('close', function(quit) {
			if (quit) {
			  this.saveWindowState(win);
			  win.close();
			} else {
			  win.hide();
			}
		  }.bind(this));
		}
	  },

	  /**
	   * Change the new window policy to open links in the browser or another window.
	   */
	  setNewWinPolicy: function(win) {
		win.removeAllListeners('new-win-policy');
		win.on('new-win-policy', function(frame, url, policy) {
			gui.Shell.openExternal(url);
			policy.ignore();
		});
	  },

	  /**
	   * Listen for window state events.
	   */
	  bindWindowStateEvents: function(win) {
		win.removeAllListeners('maximize');
		win.on('maximize', function() {
		  win.sizeMode = 'maximized';
		});

		win.removeAllListeners('unmaximize');
		win.on('unmaximize', function() {
		  win.sizeMode = 'normal';
		});

		win.removeAllListeners('minimize');
		win.on('minimize', function() {
		  win.sizeMode = 'minimized';
		});

		win.removeAllListeners('restore');
		win.on('restore', function() {
		  win.sizeMode = 'normal';
		});
	  },

	  /**
	   * Store the window state.
	   */
	  saveWindowState: function(win) {
		var state = {
		  mode: win.sizeMode || 'normal'
		};

		if (state.mode == 'normal') {
		  state.x = win.x;
		  state.y = win.y;
		  state.width = win.width;
		  state.height = win.height;
		}


		window.configApp.windowState = state;
		localStorage.setItem('windowState', JSON.stringify(state));
	  },

	  /**
	   * Restore the window size and position.
	   */
	  restoreWindowState: function(win) {
		var state = window.configApp.windowState;

		if (state.mode == 'maximized') {
			win.maximize();
		} else {
			win.resizeTo(state.width, state.height);
			win.moveTo(state.x, state.y);
		}

		win.show();
	  }
	};







	// Add dispatcher events
	dispatcher.addEventListener('win.alert', function(data) {
	  data.win.window.alert(data.message);
	});

	dispatcher.addEventListener('win.confirm', function(data) {
		data.callback(data.win.window.confirm(data.message));
	});


	// Window state
	windowBehaviour.restoreWindowState(win);
	windowBehaviour.bindWindowStateEvents(win);


	// Run as menu bar app MAC
	//win.setShowInTaskbar(false);
	//menus.loadTrayIcon(win);



	// Load the app menus
	menus.loadMenuBar(win);

	if (platform.isWindows) {
		menus.loadTrayIcon(win);
	}

	// Adjust the default behaviour of the main window
	windowBehaviour.set(win);
	windowBehaviour.setNewWinPolicy(win);



	// Add a context menu
	var gui = require("nw.gui");
  
	var menu = new gui.Menu;
	  
	  menu.append(new gui.MenuItem({
		label: "Вырезать",
		click: function() {
		  document.execCommand("cut");
		}
	  }));
	  
	  menu.append(new gui.MenuItem({
		label: "Копировать",
		click: function() {
		  document.execCommand("copy");
		}
	  }));
	  
	  menu.append(new gui.MenuItem({
		label: "Вставить",
		click: function() {
		  document.execCommand("paste");
		}
	  }));
	  
	/*
	menu.append(new gui.MenuItem({
      label: "Launch Dev Tools",
      click: function() {
          win.showDevTools();
      }
    }));
	*/
	  
	  document.addEventListener("contextmenu", function(e) {
		e.preventDefault();
		if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || e.target.isContentEditable) {
		  menu.popup(e.x, e.y);
		}
	  });
	
	
	
	
	
	
	
	
	
	
	



	win.on('close', function() {
		for (key in chat.notifyAppList) {
			chat.notifyAppList[key].close();
		}

		for (key1 in chat.notifyList) {
			for (key2 in chat.notifyList[key1]) {
				chat.notifyList[key1][key2].close();
			}
		}

		windowBehaviour.saveWindowState(win);

		win.close(true);
	});



	// Reload the app periodically until it loads
	var reloadIntervalId = setInterval(function() {
		if (win.window.navigator.onLine) {
			clearInterval(reloadIntervalId);
		} else {
			win.reload();
		}
	}, 10 * 1000);




});



}
