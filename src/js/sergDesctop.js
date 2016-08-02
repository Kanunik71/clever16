if(isNodeWebkit) {
	
	
	
		
	
	
	var sergDesctop = function() {
	
		/**
			* Initialize a new `Emitter`.
	 *
	 * @api public
	 */

	function Emitter(obj) {
	  if (obj) return mixin(obj);
	};

	/**
	 * Mixin the emitter properties.
	 *
	 * @param {Object} obj
	 * @return {Object}
	 * @api private
	 */

	function mixin(obj) {
	  for (var key in Emitter.prototype) {
		obj[key] = Emitter.prototype[key];
	  }
	  return obj;
	}

	/**
	 * Listen on the given `event` with `fn`.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */

	Emitter.prototype.on =
	Emitter.prototype.addEventListener = function(event, fn){
	  this._callbacks = this._callbacks || {};
	  (this._callbacks[event] = this._callbacks[event] || [])
		.push(fn);
	  return this;
	};

	/**
	 * Adds an `event` listener that will be invoked a single
	 * time then automatically removed.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */

	Emitter.prototype.once = function(event, fn){
	  var self = this;
	  this._callbacks = this._callbacks || {};

	  function on() {
		self.off(event, on);
		fn.apply(this, arguments);
	  }

	  on.fn = fn;
	  this.on(event, on);
	  return this;
	};

	/**
	 * Remove the given callback for `event` or all
	 * registered callbacks.
	 *
	 * @param {String} event
	 * @param {Function} fn
	 * @return {Emitter}
	 * @api public
	 */

	Emitter.prototype.off =
	Emitter.prototype.removeListener =
	Emitter.prototype.removeAllListeners =
	Emitter.prototype.removeEventListener = function(event, fn){
	  this._callbacks = this._callbacks || {};

	  // all
	  if (0 == arguments.length) {
		this._callbacks = {};
		return this;
	  }

	  // specific event
	  var callbacks = this._callbacks[event];
	  if (!callbacks) return this;

	  // remove all handlers
	  if (1 == arguments.length) {
		delete this._callbacks[event];
		return this;
	  }

	  // remove specific handler
	  var cb;
	  for (var i = 0; i < callbacks.length; i++) {
		cb = callbacks[i];
		if (cb === fn || cb.fn === fn) {
		  callbacks.splice(i, 1);
		  break;
		}
	  }
	  return this;
	};

	/**
	 * Emit `event` with the given args.
	 *
	 * @param {String} event
	 * @param {Mixed} ...
	 * @return {Emitter}
	 */

	Emitter.prototype.emit = function(event){
	  this._callbacks = this._callbacks || {};
	  var args = [].slice.call(arguments, 1)
		, callbacks = this._callbacks[event];

	  if (callbacks) {
		callbacks = callbacks.slice(0);
		for (var i = 0, len = callbacks.length; i < len; ++i) {
		  callbacks[i].apply(this, args);
		}
	  }

	  return this;
	};

	/**
	 * Return array of callbacks for `event`.
	 *
	 * @param {String} event
	 * @return {Array}
	 * @api public
	 */

	Emitter.prototype.listeners = function(event){
	  this._callbacks = this._callbacks || {};
	  return this._callbacks[event] || [];
	};

	/**
	 * Check if this emitter has `event` handlers.
	 *
	 * @param {String} event
	 * @return {Boolean}
	 * @api public
	 */

	Emitter.prototype.hasListeners = function(event){
	  return !! this.listeners(event).length;
	};
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
	
		var self = this;
		
		var gui = require('nw.gui');
		
		var optionsDef = {
			width: 500, 
			height: 100, 
			x: 10000,
			y: 10000,
			frame: false,
			
			//toolbar: false,
			//'always-on-top': true,
			always_on_top: true,
			
			show: true,
			resizable: false,
			focus: false,
		};
		var margin = 10;
		
		var id = 0;

		this.pool = {};
		this.queue = [];
		
		
		this.add = function (optionsA, cb) {
			var options = self.cloneObject(optionsDef);
			for(var key in optionsA) {
				options[key] = optionsA[key];
			}
			
			var winOpt = {
				width: options.width, 
				height: options.height, 
				x: options.x,
				y: options.y,
				frame: options.frame,
				
				//'always-on-top': options.always_on_top,
				//toolbar: false,
				always_on_top: options.always_on_top,
				
				
				show: options.show,
				resizable: options.resizable,
				focus: options.focus,
			};
			var winData = {
				isShow: false,
				win: {}
			};
			var idWin = id++;
	
			self.pool[idWin] = winData;
			
			
			
			
			var link = window.location.origin+"/js/desktopNotification.html";
			gui.Window.open(link, winOpt, function(win) {
				//win.resizeTo(options.width, options.height);
				
				win.on('loaded', function(){
					Emitter(this.window);

					win.window.document.body.innerHTML = options.htmlBody;

					win.window.on('chat.click', function() {
						//console.log(34343);
					});
					win.window.on('answer.click', function() {
						//console.log(34343);
					});
					win.window.on('ignore.click', function() {
						//console.log(34343);
					});
					
					if(cb) {
						cb();
					}
					
				});

				winData.win = win;
			});
			
			
			
			/*
			var scripts = document.getElementsByTagName('script'), script = scripts[scripts.length - 1];
			var scriptArr = script.src.split("/");
			scriptArr.splice(scriptArr.length - 1, 1);
			var link = scriptArr.join("/") + "/desktopNotification.html";
			var win = gui.Window.open(link, winOpt);
			win.on('loaded', function(){
				Emitter(this.window);
					
				win.window.document.body.innerHTML = options.htmlBody;
				
				console.log(win.window.document);
				console.log(link);

				win.window.on('chat.click', function() {
					//console.log(34343);
				});
				win.window.on('answer.click', function() {
					//console.log(34343);
				});
				win.window.on('ignore.click', function() {
					//console.log(34343);
				});
					
				if(cb) {
					cb();
				}
			});
			winData.win = win;
			*/
			
			
			
			
			
			
			
			
			winData.show = function() {
				var show = true;
				var h = self.getNextAvailTop();
				if( (h + winData.win.height + margin) > screen.availHeight) {
					show = false;
				}
				if(show) {
					winData.win.moveTo(winData.win.window.screen.availLeft + winData.win.window.screen.availWidth - winData.win.window.innerWidth - 10, h);
					winData.isShow = true;
				} else {
					self.queue.push(idWin);
				}
			}
			
			winData.close = function(cb) {
				winData.win.close();
				self.close(idWin);
				if(cb) {
					cb();
				}
			}
			
			winData.on = function(){
				var arg = arguments;  
				this.win.window.on.apply(this.win.window, arg);
			};
						
			return winData;
		}
		
		
			
		this.close = function(idWin) {
			delete self.pool[idWin];
			
			var h = screen.availTop + margin;
			for (key in self.pool) {
				if(self.pool[key].isShow == true) {
					self.pool[key].win.moveTo(self.pool[key].win.x, h);
					h += self.pool[key].win.height + margin; 
				}
			};
			if(self.queue.length > 0) {
				var n = self.queue.shift();
				self.pool[n].show();
			}
		}
		
		
		this.cloneObject = function (obj) {
			var clone = {};
			for(var i in obj) {
				if(typeof(obj[i])=="object" && obj[i] != null)
					clone[i] = self.cloneObject(obj[i]);
				else
					clone[i] = obj[i];
			}
			return clone;
		}
		
		this.rightBorder = function(){ 
			var screen = global.window.screen;
			return screen.availLeft + screen.availWidth;
		}
		this.getNextAvailTop = function (toIth){
			var summHeight = screen.availTop + margin;
			for (key in self.pool) {
				if(self.pool[key].isShow == true) {
					summHeight+= self.pool[key].win.height + margin;
				}
			};
			
			return summHeight;
		}

	}
	window.sergDesctop = new sergDesctop();		
	
	
	
	window.generateNotify = function generate() {
		var notify = sergDesctop.add(
			{
				height: 200, 
				htmlBody: '<div id="notification" class="notifylist notifyDesctop">'+
					'<div class="notify new" data-jid=""><div class="name">Новый диалог</div><div class="text_top">jjj</div><div class="text"><textarea>kk</textarea></div><div class="btns"><button class="chat btn submit" onclick="window.emit(\'chat.click\')">Ответить</button><button class="answer btn gray_sv" onclick="window.emit(\'answer.click\');console.log(3434343);">Быстрый ответ</button><button class="ignore btn cancel" onclick="window.emit(\'ignore.click\')">Игнорировать</button></div></div>'+
				'</div>'
			}, 
			function() {
				notify.show();
				
				notify.on('chat.click', function() {
					console.log(1);
				});
				notify.on('answer.click', function() {
					console.log(2);
				});
				notify.on('ignore.click', function() {
					notify.close(function() {
						console.log(55);
					});
				});
				
				//console.log(notify);
				
			}
		);
	}
	
	
	
}	
