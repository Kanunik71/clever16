'use strict';




console.log('old App');


if (isNodeWebkit) {
	var gui = require('nw.gui');
}
//if (!Object.observe) require("object.observe");



$(document).ready(function() {
	
	
	//localStorage.setItem("test", JSON.stringify({ru: this.ruPhrases,en: this.enPhrases,version: this.version}));


	var Chat = function () {

        var self = this;
		
		
        this.user = {login: '', password: ''};
		
		this.windowStatus = "show";
		
		
		
		/*var b = {};
		b.isNodeWebkit = /^file:/.test(window.location.protocol), b.isWebApp = /^http:|^https:/.test(window.location.protocol), b.OS = b.isNodeWebkit ? process.platform : navigator.platform, b.isWindows = /^win/.test(b.OS), b.isMac = /^darwin/.test(b.OS), b.isLinux = /^linux/.test(b.OS), b.locale = a(window.preliminaryLanguage || navigator.language || navigator.systemLanguage), window.env = b;*/
		
		
		
		this.history = {};
        this.userExtraData = {};
        this.delayFunc = {};
        this.notifyDesctopList = {};
        this.notifyAppList = {};

        this.logLevel = 2;
		
        this.connection = false;
        this.jid = false;
        //this.host = 'cleversite.ru';
		this.domen = 'cleversite.ru';
		this.titleDocument = document.title;
		
		this.generateNotifyTitleTimeout;
		this.generateNotifyTitleTimeoutList = {};
		//this.reconnectTimeout;
		//this.resource = 'webpult';
		
		this.messageId = function() {
			return Date.now() + '-' + Math.floor(Math.random() * (10000 - 1 + 1)) + 1;
		}
		this.threadJid = '';
		this.myDialogList = [];
		this.myIgnoreList = [];
		this.myNameList = [];
		this.roster = [];
		
		this.userData = [];

		
		this.socket = io('https://nodejs01.cleversite.ru:3001/');
		
        this.init = function () {
	
			
		

			
			self.resizeThread();
			$(window).resize(function() {
				self.resizeThread();
			});
			
			self.valudate_auth();
			$('#auth_form_form').find('input').on('keyup', function() {
				self.valudate_auth();
			});
			
			if(isNodeWebkit) {
				$('.property_top').show();
			}
			
			//кнопка выхода
			$('.exit_top').click(function() {
				
				self.socket.emit('message', {type: 'disconnect'});
					
				self.closePult(1);
				
				$.cookie('pult_login', '');
				$.cookie('pult_password', '');
				
				event.preventDefault();
			});
			
			$('.content_left_tab').on('click',function() {
				if(!$(this).hasClass('act')) {
					$('.content_left_tab_list').find('.act').removeClass('act');
					$(this).addClass('act');
					$('.content_left_block').hide();
					$('#'+$(this).attr('data')).show();
				}
			});
			
			$('.top_status').click(function() {
				if($('.status_circle').parent().hasClass('off')) {
					self.setStatus('chat');
				} else {
					self.setStatus('away'); 
				}
			});
			
			$('.property_top').click(function() {
				/*if($('.status_circle').parent().hasClass('off')) {
					self.setStatus('chat');
				} else {
					self.setStatus('away'); 
				}*/
			});
			
			
			$('.content_top_ico[data="give_thread"]').on('click', function() {
				if(!$(this).hasClass('innact')) {
					if($(this).hasClass('act')) {
						$('.operator_give_list').addClass('hide');
						$(this).removeClass('act');
					} else {
						$('.operator_give_list').html('');
						$('#operators').find('.left_list_line').find('.left_list_line_status').find('.on').each(function() {
							var p = $(this).parent().parent();
							$('.operator_give_list').append('<div class="operator_give_list_line" data="'+p.attr('jid')+'"><div class="operator_give_list_status on"><div class="ico"></div></div><div class="operator_give_list_name">'+p.find('.left_list_line_name').text()+'</div></div>');
						});
						if($('.operator_give_list').html()==''){
							$('.operator_give_list').append('<div class="empty">Операторы отсутствуют</div>');
						}
						
						
						$('.operator_give_list_line').on('click', function() {
							self.generateDialogEvent(self.threadJid, 'redirect', $(this).attr('data'));
						});
						
						$('.operator_give_list').removeClass('hide');
						$(this).addClass('act');
					}
				}
			});
			
			$('.content_top_ico[data="blocked"]').on('click', function() {
				if(!$(this).hasClass('innact')) {
					self.generateDialogEvent(self.threadJid, 'block');
				}
			});
			
			$('.content_top_ico[data="send_to_mail"]').on('click', function() {
				if(!$(this).hasClass('innact')) {
					self.generateDialogEvent(self.threadJid, 'sendHistory');
				}
			});
			 
			
			$(document).on("click", ".left_list_line", function() {
				if(!$(this).hasClass('act')) {
					$('.left_list_line.act').removeClass('act');
					$(this).addClass('act');
					var jid = $(this).attr('jid');
					self.actionThread(jid); 
				}
			});
			
			$(document).on("click", ".left_list_line_close span", function() {
				var jid = $(this).parent().parent().attr('jid');
				self.closeThread(jid, true); 
			});
			
			$('.content_bottom_right_send').on('click', function() {
				self.sendMessageThread();
			});
			
			$('.content_bottom_right_fast').on('click', function() {
				if($(this).hasClass('act')) {
					$('.fast_message_block').addClass('hide');
					$(this).removeClass('act');
					
					//scrollingTo('top', '.fast_message_block_scroll');
				} else {
					$('.fast_message_block').removeClass('hide');
					$(this).addClass('act');
					self.scrollingTo('top', '.fast_message_block_scroll');
				}
			});
			$('.fast_message_block_line').on('click', function() {
				$('.fast_message_block').addClass('hide');
				$(this).removeClass('act');
				$('#msgwnd').html($(this).text());
				$('.content_bottom_right_send').removeClass('disabled_submit');
				$('.content_bottom_right_fast').removeClass('hide');
			});			
			
			
			
			$('.content_middle_ico').on('click', function() {
				if($(this).hasClass('act')) {
					$('.client_info').addClass('hide');
					$(this).removeClass('act');
					
					//scrollingTo('top', '.fast_message_block_scroll');
				} else {
					$('.client_info').removeClass('hide');
					$(this).addClass('act');
					self.scrollingTo('top', '.client_info_block_line2');
					self.resizeThread();
				}
			});
			$('.client_info_icon').on('click', function() {
				$('.client_info').addClass('hide');
				$('.content_middle_ico').removeClass('act');
			});
			
			$('.show_history').on('click', function() {
				self.loadClientsHistoryAll(function(jid) {
					if(jid == self.threadJid) {
						self.loadHistory(jid);
						$('.show_history').addClass('hide');
					}
				}, self.threadJid);
			});
			

			/*
			new Medium({
				element: document.getElementById('msgwnd'),
				mode: Medium.richMode,
				attributes: null,
				tags: null
			});
			*/
		
			$('#msgwnd').keydown(function(e) {
				if($('#msgwnd').html() != '') {
					$('.content_bottom_right_send').removeClass('disabled_submit');
				} else {
					$('.content_bottom_right_send').addClass('disabled_submit');
				}
				if (e.ctrlKey && e.keyCode == 13) {
					self.sendMessageThread();
					return false;
				} else if(!e.ctrlKey && e.keyCode == 13) {
					self.sendMessageThread();
					return false;
				}
			});


			if (isNodeWebkit) {
				gui.Window.get().on("blur",  function(){ 
					self.windowStatus = "hide"; 
				});
				gui.Window.get().on("focus", function(){ 
					self.windowStatus = "show"; 
					if(self.threadJid) {
						self.closeNotify(self.threadJid);
					}
				});
			} else {
				window.addEventListener("blur",  function(){
					//console.log('statusDoc - hide');
					self.windowStatus = "hide"; 
				});
				window.addEventListener("focus", function(){ 
					//console.log('statusDoc - show');
					self.windowStatus = "show"; 
					if(self.threadJid) {
						self.closeNotify(self.threadJid);
					}
				});
			}
			
			
			/*
			$(document).on('visibilitychange', function() {
				if (!document.hidden) {
				
					if(self.threadJid) {
						self.closeNotify(self.threadJid);
					}
					if(typeof cleversite_title_thispage_interval!='undefined' && cleversite_title_thispage_interval) { 
						if($('#cleversite_clever').hasClass('cleversite_clever_hide')){
							open_cleversite_window();
						}
					}
					if(self.jid == self.threadJid) {
						self.closeNotify();
					}
				}
			});
			*/
			
			if(Notification) {
				if (Notification.permission !== "granted") {
					Notification.requestPermission();
				}
			}
			
			

			$('.content_top_ico[data="send_file"]').on('click', function() {
				if(!$(this).hasClass('innact')) {
					$("#uploadFiles").replaceWith($("#uploadFiles").clone(true));
					$("#uploadFiles").click();
				}
			});
			$("#uploadFiles").change(function() {
				var files = this.files;
				self.addFiles(files);
			});			
			
			$('#auth_form_form').on('submit', function(event) {
				event.preventDefault();
				var l = $('#auth_form_form').find('input[name="login"]');
				var p = $('#auth_form_form').find('input[name="password"]');
				var login = l.val().replace(/[@.-]/g,'_');
				var password = p.val();
				self.user = {login: login, password: password};
				self.connecting_main(login, password);
			});
			
			$('.auth_reset').on('click', function() {
				
				self.socket.emit('message', {type: 'disconnect'});
				
				$.cookie('pult_login', '');
				$.cookie('pult_password', '');
			});
			
			
			

			/*self.delayFunc['main'] = setTimeout(function() {
			
			});*/
			
			//автоматическая авторизация
			if($.cookie('pult_login') && $.cookie('pult_password')) {
				self.connecting_main($.cookie('pult_login'), $.cookie('pult_password'));
			} else {
				$('.auth_form_parent').removeClass('hide');
				$('.preloader').addClass('hide');
			}
						
			
		
			
			
        };
		
		
		 
			
		
  
  
  
  
		this.connecting_main = function(login, password) {
			
			$('.auth_form_form_f_1').addClass('hide');
			$('.auth_form_form_f_2').removeClass('hide');

			
			self.socket.emit('message', {type: 'connect', login: login, password: password});
			
			//$.cookie('pult_login', login);
			//$.cookie('pult_password', password);
			
		},
		
		
		/*this.reconnect = function() {
			
			self.reconnectTimeout = setTimeout(function timer() {
				//self.connecting_main(self.user.login, self.user.password);
			}, 5000);
			
			//$('.auth_form_form_f_1').addClass('hide');
			//$('.auth_form_form_f_2').removeClass('hide');
			
			//self.socket.emit('message', {type: 'connect', login: login, password: password});
		},*/
		
		
		this.socket.on('message', function(msg) {
		
			console.log(msg);
		
			if(msg.type=='xmpp') {//xmpp
			
				if(msg.act=='connect') {//успешное соединение

					$.cookie('pult_login', msg.login);
					$.cookie('pult_password', msg.password);
					
					self.jid = msg.login+'@'+self.domen;
				
					self.socket.emit('message', {type: 'getvcard', jid: self.jid});
					
					self.socket.emit('message', {type: 'getroster'});
					
				
					
					
				} else if(msg.act=='vcard') {
			
					if(self.jid == msg.jid) {
						$('.top_text').html(msg.nick);
					}
					self.myNameList[msg.jid] = msg.nick;
					
				} else if(msg.act=='roster_all') {
				
					$('.auth_form_parent').addClass('hide');
					$('.preloader').addClass('hide');
					$('#content').removeClass('hide');
					self.resizeThread();
									
					self.loadClients(function() {
						self.setStatus('chat');
					});
					
				} else if(msg.act=='roster') {
					console.log('rooosterrr');
					self.upgradeList(msg.roster);
					
				} else if(msg.act=='close') {
				
					self.closePult(1);
				
				} else if(msg.act=='error') {
				
					
					var e = '';
					var err = msg.err;
					if(typeof err == 'object') {
						if(typeof err.stanza != 'undefuned') {
							e = self.getAllText(err.stanza);
						}else if(typeof err.code != 'undefuned') {
							e = err.code;
						}
					} else {
						e = err;
					}

					
					
					if(e == 'XMPP authentication failure') {
						self.closePult(1, 'Неправильные имя или пароль');
					} else if(e == 'Replaced by new connection') {
						self.closePult(1, 'Было подключение с другого устройства');
					} else if(e.indexOf('You are blocked') != -1) {
						if(e.indexOf('<400>') != -1) {
							
						}
					} else if(e == 'ECONNRESET') {
						self.closePult(1, 'Разрыв интернет соединения');
						
					}
				} else if(msg.act=='message') {
				
						
								var messasge = self.transformXml(msg.stanza);
								
								var body = messasge.find("body");
								var from = messasge.attr("from").split('/')[0];
								var type = messasge.attr("type");
								var id = messasge.attr("id");
								
								var threadId = 0;
								if(messasge.find('thread').size()) {
									threadId = messasge.find('thread').text();
								}
								
						if(self.myIgnoreList.indexOf(from) == -1) {
								
								var proc_body = true;
								if(messasge.find('data').size()) {
									if(messasge.find('data').attr('xmlns') == 'cleversite:data:client') {
										self.setClientData(from, messasge.find('data'), threadId, 'open');
										var item = {
											jid: from,
											name: messasge.find('data').find('client_name').text(),
										}
										self.addItemToList('#clients', item, 0, false);
									
										if(self.threadJid == from) {
											self.generateDialogEvent(from, 'noopen');
										}
										proc_body = false;
									} else if(messasge.find('data').attr('xmlns') == 'cleversite:data:ignore') {
										if(messasge.find('data').attr('result') == 'ok') {
											
											self.removeClient(from);
											self.myIgnoreList[from];
										} else if(messasge.find('data').attr('result') == 'cancel'){ 
										
											self.generateDialogEvent(from, 'noignore');
											self.generateNotify('noIgnore', from);
											
										}
									} else if(messasge.find('data').attr('xmlns') == 'cleversite:data:redirect') {
										if(messasge.find('data').attr('result')) {
											if(messasge.find('data').attr('result') == 'ok') {
												self.giveRedirectToUser(messasge.find('data').attr('contact'), from);
											} else if(messasge.find('data').attr('result') == 'cancel'){ 
												self.generateDialogEvent(messasge.find('data').attr('contact'), 'redirectCancel');
											}
										}
										if(messasge.find('data').find('client').size()) {
											self.setClientData(messasge.find('data').attr('contact'), messasge.find('data').find('client'), threadId, 'open');
											//self.generateDialogEvent(messasge.find('data').attr('contact'), 'redirect_me', from, messasge.find('data').attr('comment'));
											
											self.generateNotify('redirect_me', from, {contact: messasge.find('data').attr('contact'), comment: messasge.find('data').attr('comment')});
										}
									}
								}

								
								if(messasge.find('notification').size()) {
									if(messasge.find('notification').attr('xmlns') == 'cleversite:notification') {
										if(messasge.find('notification').attr('event') == 'begin_dialog') {
											self.acceptDialog(from);
										}
										if(messasge.find('notification').attr('event') == 'end_dialog') {
											self.closeThread(from, false);
											self.setClientData(from, false, false, 'close');
											//proc_body = false;
										}
										if(messasge.find('notification').attr('event') == 'cancel_redirect') {
											//self.generateDialogEvent(messasge.find('data').attr('contact'), 'redirect_me_cancel', from, messasge.find('data').attr('comment'));
											
											self.generateNotify('redirect_me_cancel', from, {contact: messasge.find('data').attr('contact'), comment: messasge.find('data').attr('comment')});
											proc_body = false;
										}
										if(messasge.find('notification').attr('event') == 'blocked') {
											self.generateDialogEvent(from, 'blockOk');
											proc_body = false;
										}
									}
								}
							
					
								if(body.size() && proc_body) {
									var message = body.text();
									var item = {
										to: self.jid,
										from: from,
										time: Date.now(),
										message: message,
										id: id,
										see: false,
									}
									if(self.threadJid == from) {
										item.see = true;
										$('#data').append(self.convertToMessage(item));
										
										self.scrollingTo('bottom', '#data_scroll');
										setTimeout(function() {
											$('#data').find('.message_block.notshow').removeClass('notshow').addClass('show');
										}, 333);
										
									} else {
										if($('.left_list_line[jid="'+from+'"]').size()) {
											var m = $('.left_list_line[jid="'+from+'"]').find('.left_list_line_mess');
											m.removeClass('hide').find('span').text(+m.find('span').text() + 1);
										}
									}
									self.addToHistory(from, item, 'before');	
									
									
									var t = self.cloneObject(self.roster[from]);
									console.log(from);
									console.log(t);
									console.log('-------');
									
									if(self.myDialogList.indexOf(from) == -1 && self.roster[from].groups.indexOf('operators') == -1) {
										self.generateNotify('newDialog', from, item.message);
									} else {
										self.generateNotify('messageDialog', from, item.message);
									}
									
								}
								
						}
				}
				
			}
			
		});
		
		
		
		
		

		
	
		this.closePult = function(status, str) {
			//if(self.jid) { если вводить неверный логин и пароль, то хуня выходит
					$('.auth_form_form_f_1').removeClass('hide');
					$('.auth_form_form_f_2').addClass('hide');
				
					$('.auth_form_parent').removeClass('hide');
					$('#content').addClass('hide');
					$('.preloader').addClass('hide');
					
					$('.left_list_line').remove();
					$('.client_info').addClass('hide');
					$('.content_top_ico').removeClass('act');
					$('.content_bottom_noopen_dialog').addClass('hide');
					$('.content_bottom_dialog').addClass('hide');
					$('.content_dialog').addClass('hide');
					$('.content_info').removeClass('hide');
					
					var s = '';
					if(str) {
						s = '<div class="text error">'+str+'</div>';
						$('.auth_form_cont_text').html(s);
					}
					
					
					if(status == 2) {//ошибка авторазации
						$.cookie('pult_login', '');
						$.cookie('pult_password', '');
					}
					
					self.history = {};
					self.userExtraData = {};
					self.delayFunc = {};
					self.jid = false;
					self.threadJid = '';
					self.myDialogList = [];
					self.myIgnoreList = [];
					self.myNameList = [];
					
		//}
		};
		
  
  
  
  
  
        this.sendMessage = function(item) {
			
			self.socket.emit('message', {type: 'message', data: {
				message: {
					attr: {
						to: item.to, 
						type: 'chat', 
						id: item.id
					},
					body: item.message,
				}
			}});
			
        };
		
		this.setStatus = function(s) {
			
			if(s == 'away') {
				if(self.myDialogList.length == 0) {
					self.socket.emit('message', {type: 'presence', status: s});
					$('.status_circle').parent().removeClass('on').addClass('off');
				} else {
					self.generateDialogEvent(false, 'closeAllDialogs');
				}
			} else {
				self.socket.emit('message', {type: 'presence', status: s});
				$('.status_circle').parent().removeClass('off').addClass('on');
			}

					
        };
		
		
		
		this.actionThread = function(threadJid) {
		
			window.focus();
			
			self.threadJid = threadJid;
			var threadUser = self.roster[threadJid];

			self.closeNotify(threadJid);
			
			if(self.history[threadJid] == 'undefined') { 
				self.history[threadJid]= [];
			}
			
			$('.show_history').addClass('hide');
			$('.client_info').addClass('hide');
			$('.content_bottom_noopen_dialog').addClass('hide');
			$('.content_bottom_dialog').removeClass('hide');
			$('.content_top_ico').addClass('innact');
			
			
			//выбрать пункт меню слева
			$('.left_list_line.act').removeClass('act');
			$('.left_list_line[jid="'+threadJid+'"]').addClass('act');
			
			$('.content_left_tab.act').removeClass('act');
			$('.content_left_tab[data="'+$('.left_list_line[jid="'+threadJid+'"]').parent().attr('id')+'"]').addClass('act');
			$('.content_left_block').hide();
			$('#'+$('.left_list_line[jid="'+threadJid+'"]').parent().attr('id')).show();
			
			
			
			if($.inArray('operators', threadUser.groups) != -1) {
				$('.content_top').addClass('hide');
				$('.content_middle').addClass('hide');
			} else if ($.inArray('clients', threadUser.groups) != -1) {
				$('.content_top').removeClass('hide');
				$('.content_middle').removeClass('hide');
				//$('.left_list_line[jid="'+threadJid+'"]').find('.left_list_line_close').removeClass('hide');
			}
			
			//если юзер оффлайн, то ему нельзя писать
			if(Object.keys(threadUser.resources).length == 0) {
				$('.content_bottom_dialog').addClass('hide');
			}
			
			//если это клиент
			if($.inArray('clients', threadUser.groups) != -1) {
				
				var begin = null;
				var end = null;
				if(self.history[threadJid] != 'undefined') {
					if(self.history[threadJid].length > 0) {
						end = self.date(self.history[threadJid][0].time - 3*1000);//костылек)
					}
				}
				self.loadClientsHistoryInfo(function(data) {
					if(data.count > 0 && self.threadJid == threadJid) {
						$('.show_history').removeClass('hide');
					}
				}, threadJid, begin, end);
				
				//если этот диалог клиента еще не принят
				if(self.myDialogList.indexOf(threadJid) == -1) {
				
					self.generateDialogEvent(threadJid, 'noopen');
					
				} else {
				
					$('.content_top_ico').removeClass('innact');
					
				}
				
				self.loadClientsInfo(threadJid);
			} 
			
			var threadText = '';
			self.history[self.threadJid].forEach(function(item, i, arr) {
				threadText += self.convertToMessage(item);
			});
			$('#data').html(threadText);
			
			$('.left_list_line[jid="'+threadJid+'"]').find('.left_list_line_mess').addClass('hide').find('span').html('');
			
			$('.content_info').addClass('hide');
			$('.content_dialog').removeClass('hide');
			setTimeout(function() {
				$('#data').find('.message_block.notshow').removeClass('notshow').addClass('show');
				self.scrollingTo('bottom', '#data_scroll');;
			}, 333);
			self.resizeThread();
        };
		
		
		this.sendMessageThread = function() {
			if($('.content_bottom_textarea').find('#msgwnd').attr('disabled') != 'disabled' && !$('.content_bottom_right_send').hasClass('disabled_submit')) {
				$('.content_bottom_textarea').find('#msgwnd').attr('disabled', 'disabled');
				/*var item = {
					to: self.threadJid,
					from: self.jid,
					time: Date.now(),
					message: $('.content_bottom_textarea').find('#msgwnd').html(),
					id: 'web_' + self.messageId(),
					see: true
				}
				self.sendMessage(item);
				self.addToHistory(self.threadJid, item, 'before');
				$('#data').append(self.convertToMessage(item));
				*/
				
				self.sendMessageJid(self.threadJid, $('.content_bottom_textarea').find('#msgwnd').html());

				$('.content_bottom_textarea').find('#msgwnd').html('').removeAttr("disabled").focus();
				$('.content_bottom_right_send').addClass('disabled_submit');
				
			}
        };

		this.sendMessageJid = function(jid, text) {
				var item = {
					to: jid,
					from: self.jid,
					time: Date.now(),
					message: text,
					id: 'web_' + self.messageId(),
					see: true
				}
				self.sendMessage(item);
				self.addToHistory(jid, item, 'before');	
				
				if(jid == self.threadJid) {
					$('#data').append(self.convertToMessage(item));	
					
					setTimeout(function() {
						$('#data').find('.message_block.notshow').removeClass('notshow').addClass('show');
						self.scrollingTo('bottom', '#data_scroll');;
					}, 333);
				}
		}
		
		
		
		this.convertToMessage = function(obj) {
			var d_now = new Date();
			var curr_now_date = d_now.getDate();
			var curr_now_month = d_now.getMonth();
			var curr_now_year = d_now.getFullYear();
			var d = new Date(obj.time);
			var curr_date = d.getDate();
			var curr_month = d.getMonth();
			var curr_year = d.getFullYear();
			var dateStr = '';
			if(curr_now_date!=curr_date || curr_now_month!=curr_month || curr_now_year!=curr_year) {
				dateStr += self.coorect0(curr_date) + '.' + self.coorect0(curr_month) + '.' + curr_year + ' ';
			}
			dateStr += self.coorect0(d.getHours()) + ':' + self.coorect0(d.getMinutes());
			
			
			var str = '';
			str = '<div class="message_block notshow '+( (obj.from != self.jid)?'me':'' )+'" data="'+obj.id+'"><div class="message_block_text"><div class="message_block_text_h">'+self.myNameList[obj.from]+'</div><div class="message_block_time">'+dateStr+'</div><div class="clear"></div><div class="message_block_text_t">'+obj.message+'</div></div></div>'
			return str;
        };
		
		
		
		
		
	
		
		
		this.upgradeList = function(roster) {

							var jidList = [];
							//мы перебираем людей из списка ростера
							self.roster = roster;
							for (var key in roster) {
								if(roster[key].subscription == 'both') {
									jidList.push(roster[key].jid);
									
									if(self.history[roster[key].jid] == undefined) { 
										self.history[roster[key].jid] = [];
									}
									
									var block = '';
									if($.inArray('operators', roster[key].groups) != -1) { 
										if(!$('#operators').find('div[jid="'+roster[key].jid+'"]').size()) { 
											var cntmessage = 0;
											self.history[roster[key].jid].forEach(function(item, i, arr) {
												if(item.see == false) {
													cntmessage++;
												}
											});

											self.addItemToList('#operators', roster[key], cntmessage, false);
											
											
											self.myNameList[roster[key].jid] = roster[key].name?roster[key].name:roster[key].jid;
											
											//self.setClientData(roster[key].jid, {client_name: self.myNameList[roster[key].jid]});
											//setClientData.
											
										}
									} else if($.inArray('clients', roster[key].groups) != -1) { 
					
									} 
									var stat = 'off';
									if (Object.keys(roster[key].resources).length != 0) {
										for (var i in roster[key].resources) {
											if(roster[key].resources[i].show == 'away') {
												stat = 'away';
											} else {
												stat = 'on';
											}
											break;
										}
									}
									
									$('.left_list_line[jid="'+roster[key].jid+'"]').find('.left_list_line_status').find('span').removeClass('off on away').addClass(stat);
								}
								
							}
			
				
			
			$('#operators').find('.left_list_line').each(function() {
				if(jidList.indexOf($(this).attr('jid')) == -1) {
					$(this).remove();
					if(self.threadJid == $(this).attr('jid')) {
						$('.content_bottom_dialog').addClass('hide');
					}
				}
			});
			$('#clients').find('.left_list_line').each(function() {
				if(jidList.indexOf($(this).attr('jid')) == -1) {
					//$(this).remove();
				
				
				}
			});
			self.resizeThread();
        };
		this.addItemToList = function(block, item, cntmessage, yes_close) {
			if(!$('.left_list_line[jid="'+item.jid+'"]').size()) {
				$(block).append('<div class="left_list_line" jid="'+item.jid+'"><div class="left_list_line_close '+( !yes_close?'hide':'' )+'"><span></span></div><div class="left_list_line_status"><span class="off"></span></div><div class="left_list_line_name">'+(item.name?item.name:item.jid)+'</div><div class="left_list_line_mess '+( (cntmessage==0)?'hide':'' )+'"><span>'+cntmessage+'</span></div></div>');
				console.log('removeDelay' + item.jid);
				self.delayFunc[item.jid] != 'undefined' ? clearTimeout(self.delayFunc[item.jid]) : '';
			}
		}
		
		
		
		this.loadHistory = function(jid) {
			if(jid == self.threadJid) {
		
				
				/*var copy = {};
				for (var key in histori) {
					copy[key] = histori[key];
				}*/
				var copy = self.history[jid].slice(0);
				while(copy.length) {
					var item = copy.pop();
					if(!$('#data').find('.message_block[data="'+item.id+'"]').size()) {
						$('#data').prepend(self.convertToMessage(item));
					}
				}
				
				/*
				self.history[jid].forEach(function(item, i, arr) {
					if(!$('#data').find('.message_block[data="'+item.id+'"]').size()) {
						$('#data').prepend(self.convertToMessage(item));
					}
				});
				*/
				
				
				setTimeout(function() {
					$('#data').find('.message_block.notshow').removeClass('notshow').addClass('show');
					self.scrollingTo('bottom', '#data_scroll');;
				}, 333);
			}
        };
		this.addToHistory = function(jid, item, where) {
			
			
			
			var doublevar = false;
			if(self.history[jid] == undefined) { 
				self.history[jid]= [];
			}
			
			for (var i = 0; i < self.history[jid].length ; i++){
				if(self.history[jid][i].id == item.id) {
					doublevar = true;
				}
			}
			
			if(!doublevar) {
				
				
				if(where == 'back') {//вставка в начало
					self.history[jid].unshift(item);
				} else if(where == 'before'){//вставка в конец
					self.history[jid].push(item);
				}
			}
        };
		
		
		
		

		
		this.setClientData = function(from, data, threadId, status) {
			if(self.userExtraData[from] == undefined) {
			
				self.userExtraData[from] = {}
			}
			if(data) {
				self.myNameList[from] = data.find('client_name').text() ? data.find('client_name').text() : from;
				
				self.userExtraData[from].client_name = data.find('client_name').text();
				self.userExtraData[from].site = data.find('site').text();
				self.userExtraData[from].page = data.find('page').text();
				self.userExtraData[from].source = data.find('source').text();
				self.userExtraData[from].location = data.find('location').text();
				self.userExtraData[from].provider = data.find('provider').text();
				self.userExtraData[from].organization = data.find('organization').text();
				self.userExtraData[from].address = data.find('address').text();
				self.userExtraData[from].browser = data.find('browser').text();
				self.userExtraData[from].visits = data.find('visits').text();
				self.userExtraData[from].dialogs = data.find('dialogs').text();
				self.userExtraData[from].scan_pages = data.find('scan_pages').text();
				
			}
			if(threadId) {
				self.userExtraData[from].threadId = threadId;
			}
			if(status) {
				self.userExtraData[from].status = status;	
			}
		};

		
		
		this.loadClients = function(callback) {
			
			$.ajax({
				type: "POST",
				url: "https://cleversite.ru/cleversite/system/send_data.php",
				data: {from: self.jid, xmlns: 'cleversite:data:dialogs', localTime: self.date(null, true), id: Date.now()},
				dataType: 'xml',
				success: function(data){ 
				
					
					
					$(data).find('message').find('data[xmlns="cleversite:data:dialogs:opened"]').find('message').each(function() {
						//добавляем клиента в список тех, с кем наш оператор ведёт диалог
						self.myDialogList.push($(this).attr('from'));
						self.setClientData($(this).attr('from'), $(this).find('data[xmlns="cleversite:data:client"]'), $(this).find('thread').text(), 'open');
						var item = {
							jid: $(this).attr('from'),
							name: $(this).find('client_name').text(),
						}
						
						self.loadClientsHistory(null, $(this).attr('from'), null, null, $(this).find('thread').text());
						self.addItemToList('#clients', item, 0, true);

						
					});
					$(data).find('message').find('data[xmlns="cleversite:data:dialogs:new"]').find('message').each(function() {
						self.setClientData($(this).attr('from'), $(this).find('data[xmlns="cleversite:data:client"]'), $(this).find('thread').text(), 'open');
						var item = {
							jid: $(this).attr('from'),
							name: $(this).find('client_name').text(),
						}
						self.addItemToList('#clients',item, 0, false);
				
						
						self.loadClientsHistory(null, $(this).attr('from'), null, null, $(this).find('thread').text());
						
						//self.loadClientsHistory(function() {}, $(this).attr('from'), null, null, $(this).find('thread').text());
					});
					
					if(callback) {
						callback();
					}
				}
			});
        };
		
		
		


		self.loadClientsInfo = function(jid) {
			var d = self.userExtraData[jid];
			$('.import[data="client_name"]').val(d.client_name);
			$('.import[data="site"]').html(self.filterSite(d.site));
			
			$('.import[data="begin"]').html('<a target="_blank" href="'+d.site+'">'+d.page+'</a>');
			$('.import[data="source"]').html(d.source);
			$('.import[data="location"]').html(d.location);
			$('.import[data="address"]').html(d.address);
			$('.import[data="provider"]').html(d.provider);
			$('.import[data="browser"]').html(d.browser);
			$('.import[data="visits"]').html(d.visits);
			$('.import[data="dialogs"]').html(d.dialogs);
			$('.import[data="scan_pages"]').html(d.scan_pages);
			
			$('.content_middle_text_name').html(d.client_name);
			$('.content_middle_text_info').html('<div class="content_middle_text_info_line1"><a target="_blank" href="'+d.site+'">'+d.page+'</a></div><div class="content_middle_text_info_line2">'+self.filterSite(d.site)+' '+d.location+' Количество посещений: '+d.visits+' Количество диалогов:'+d.dialogs+'</div>');
		}
		

		
		
		
		//запрос информации об истории
		this.loadClientsHistoryInfo = function(callback, jid, begin, end, dialog_id) {
			var d = {
				from: self.jid, 
				xmlns: 'cleversite:data:history:info', 
				localTime: self.date(null, true), 
				id: Date.now(), 
				contact_id: jid,
			};
			if(begin) {d.begin = begin;};
			if(end) {d.end = end;}
			if(dialog_id) {d.dialog_id = dialog_id;};
			$.ajax({
				type: "POST",
				url: "https://cleversite.ru/cleversite/system/history_send.php",
				data: d,
				dataType: 'xml',
				success: function(data){ 
					var d = {
						count: $(data).find('data[xmlns="cleversite:data:history:info"]').attr('count')
					}
					if(callback) {
						callback(d);
					}

				}
			});
		}

		
		this.loadClientsHistory = function(callback, jid, begin, end, dialog_id, start, count) {
			var d = {
				from: self.jid, 
				xmlns: 'cleversite:data:history', 
				localTime: self.date(null, true), 
				id: Date.now(), 
				contact_id: jid,
			};
			if(begin) {d.begin = begin;};
			if(start) {d.start = start;};
			if(count) {d.count = count;};
			if(end) {d.end = end;};
			if(dialog_id) {d.dialog_id = dialog_id;};
			$.ajax({
				type: "POST",
				url: "https://cleversite.ru/cleversite/system/history_send.php",
				data: d,
				dataType: 'xml',
				success: function(data){
					
					var histori = [];
					$(data).find('data[xmlns="cleversite:data:history"]').find('message').each(function() {
						var t = $(this);
						var item = {
							to: jid,
							from: t.attr('from'),
							time: self.convertDateISOtoTime(t.find('x').attr('stamp')),
							message: t.find('body').text(),
							id: t.attr('id'),
							see: true
						}
						histori.push(item);
					});
					
					
					
	
					
					
					
					while (histori.length) {
						//вставка задом на перед
						var a = histori.pop();
						//var a = histori.shift();
						self.addToHistory(jid, a, 'back');
					}
					if(callback) {
						callback(jid);
					}
				}
			});
		}
		

		this.loadClientsHistoryAll = function(callback, jid) {
			self.loadClientsHistoryInfo(function(data) {
				var total = data.count
				var cnt = 25;
				var c = total - cnt;
				if(c < 1) {c = 1;}
				self.loadClientsHistoryAllrecursia(callback, jid, c, cnt, total);
			}, jid);
		}
		this.loadClientsHistoryAllrecursia = function(callback, jid, c, cnt, total) { 
			self.loadClientsHistory(function() { 
				if(c == 1) {
					if(callback) {
						callback(jid);
					}
				} else {
					c = c - cnt;if(c < 1) {c = 1;}
					self.loadClientsHistoryAllrecursia(callback, jid, c, cnt, total);
				}
				
			}, jid, null, null, null, c, cnt); 
		}
		
		
		
		
		this.acceptDialogSend = function(jid, threadId) {
		
			self.socket.emit('message', {type: 'message', data: {
					message: {
						attr: {
							to: jid, 
							type: 'headline', 
						},
						child: {
							notification: {
								attr: {
									xmlns: 'cleversite:notification', 
									event: 'begin_dialog', 
								},
							},
							thread: {
								body: self.userExtraData[jid].threadId,
							}
						}
					}
				}
			});
		}
		this.acceptDialog = function(jid) {
			if(self.myDialogList.indexOf(jid) == -1) {
				self.myDialogList.push(jid);
			}
			if(self.threadJid == jid) {
				$('.content_bottom_dialog').removeClass('hide');
				$('.content_bottom_noopen_dialog').addClass('hide');
				$('.content_top_ico').removeClass('innact');
			}
			$('.left_list_line[jid="'+jid+'"]').find('.left_list_line_close').removeClass('hide');
		}
		this.closeThread = function(jid, send) {
		
			$('.left_list_line[jid="'+jid+'"]').find('.left_list_line_close').addClass('hide');

			var myDialogNumber = self.myDialogList.indexOf(jid);
			if(myDialogNumber == -1) {
				self.removeClient(jid);
			} else {
				self.myDialogList.splice(self.myDialogList.indexOf(jid), 1);
				
				if(self.threadJid == jid) {
					$('.content_bottom_dialog').addClass('hide');
					$('.content_bottom_noopen_dialog').removeClass('hide');
					$('.content_top_ico').addClass('innact');
					this.generateDialogEvent(jid, 'closethread');
				}

				
				if(send) {

					self.socket.emit('message', {type: 'message', data: {
							message: {
								attr: {
									to: jid, 
									type: 'headline', 
								},
								child: {
									notification: {
										attr: {
											xmlns: 'cleversite:notification', 
											event: 'end_dialog', 
										},
									},
									thread: {
										body: self.userExtraData[jid].threadId,
									}
								}
							}
						}
					});

				} else {
					
					//console.log('setDelay'+jid);
					self.delayFunc[jid] = setTimeout(function() {
						if(self.userExtraData[jid].status == 'close') {
							self.removeClient(jid);
						}
					}, 1000*60*5);
					
				}
				
				
			}
			
			self.closeNotify(jid);
			
			

			
		}
		this.ignoreDialog = function(jid) {
		
				self.socket.emit('message', {type: 'message', data: {
						message: {
							attr: {
								to: jid, 
								type: 'headline', 
							},
							child: {
								data: {
									attr: {
										xmlns: 'cleversite:data:ignore', 
									},
								},
								thread: {
									body: self.userExtraData[jid].threadId,
								}
							}
						}
					}
				});
			
			
			if(self.threadJid == jid) {
				$('.content_bottom_noopen_dialog').addClass('hide');
			}
			
			self.closeNotify(jid);
			
		}
		this.removeClient = function(jid) {
			if($('.left_list_line[jid="'+jid+'"]').size()) {
				$('.left_list_line[jid="'+jid+'"]').remove();
			}
			if(self.threadJid == jid) {
				$('.content_info').removeClass('hide');
				$('.content_dialog').addClass('hide');
				self.threadJid = false;
			}
		}
	
		
		
		
		this.generateSound = function(sound) {
			if(!$('#sound').size()) {
				$('body').append('<div id="sound"></div>');
			}
			var filename = 'notify_3';
			if(sound == 1) {
				filename = 'notify_3';
			}
            $("#sound").html('<audio autoplay="autoplay"><source src="sound/'+filename+'.mp3" type="audio/mpeg" /><source src="sound/'+filename+'.ogg" type="audio/ogg" /><embed hidden="true" autostart="true" loop="false" src="sound/'+filename+'.mp3" /></audio>');
		}
		
		
		this.generateNotifyHtml5 = function(jid, title, text) {
			if (Notification) {
				if (Notification.permission !== "granted") {
					Notification.requestPermission();
				} else {
					if(typeof self.notifyDesctopList[jid] == 'undefined') {
						self.notifyDesctopList[jid] = [];
					}
					
					var notification = new Notification(title, {
						//icon: 'http://cdn.sstatic.net/stackexchange/img/logos/so/so-icon.png',
						body: text,
					});
					notification.onshow = function() {
						setTimeout(function() {notification.close();}, 15000);
					};
					notification.onclick = function () {
						window.focus();
						notification.close();
					};
					
					self.notifyDesctopList[jid].push(notification);
					
					var n = self.notifyDesctopList[jid].length;

					notification.onclose = function () {
						self.notifyDesctopList[jid].slice(n, 1);
					};
				}
			} 
		}
		
	
		this.generateNotifyTitle = function(jid, title) {
			self.generateNotifyTitleTimeoutList[jid] = true;
			if(!self.generateNotifyTitleTimeout) {
				self.generateNotifyTitleTimeout = setTimeout(function titleReset() {
					if(document.title != self.titleDocument) {
						document.title = self.titleDocument;
					} else {
						document.title = title;
					} 
					self.generateNotifyTitleTimeout = setTimeout(titleReset, 1000);
				}, 1000);
			}
		}
		
		
		this.closeNotify = function(jid) {
			
			if(isNodeWebkit) {
				if(typeof self.notifyAppList[jid] != 'undefined') {
					self.notifyAppList[jid].close(function() {
						delete self.notifyAppList[jid];
					});
				}
			} else {
				$('.notifylist').find('.notify[data-jid="'+jid+'"]').remove();
				
				if(typeof self.generateNotifyTitleTimeoutList[jid]  != 'undefined') {
					delete self.generateNotifyTitleTimeoutList[jid];
				}
				if(self.generateNotifyTitleTimeout) {
					if(Object.keys(self.generateNotifyTitleTimeoutList).length == 0) {
						clearTimeout(self.generateNotifyTitleTimeout);
						document.title = self.titleDocument;
					}
				}
			}
			
			
		
			
			if(typeof self.notifyDesctopList[jid] != 'undefined') {
				self.notifyDesctopList[jid].forEach(function(item, i) {
					item.close();
				}); 
			}
			
		}
		
		
		this.generateNotify = function(type, jid, a) {
			var d = self.userExtraData[jid];
			

			var showNotify = true;
			var showMainNotify = true;
			var showHtmlNotify = true;
			var showTitleNotify = true;

			if(typeof d != 'undefined') {
				if(d.status == 'close') {
					showNotify = false;
				}
			}
			
			if(jid == self.threadJid && self.windowStatus == 'show') {
				showMainNotify = false;
				showHtmlNotify = false;
			}
			if(jid == self.threadJid && self.windowStatus == 'hide') {
				//showMainNotify = false;
			}
			if(jid != self.threadJid && self.windowStatus == 'hide') {
				
			}
			if(jid != self.threadJid && self.windowStatus == 'show') {
				//showHtmlNotify = false;
			}
			if(isNodeWebkit) {
				showHtmlNotify = false;
				showTitleNotify = false;
			} else {
				if(self.windowStatus == "show") {
					showTitleNotify = false;
				}
			}
			
			/*
			console.log('----');
			console.log(showNotify);
			console.log(showMainNotify);
			console.log(showHtmlNotify);
			console.log(self.windowStatus );
			console.log(self.threadJid);
			console.log(jid);
			console.log('----');
			*/
			
	
			if(showNotify) {
	
				if(type == 'newDialog') {
					
					if(showMainNotify) {
						if(isNodeWebkit) {
							if(typeof self.notifyAppList[jid] == 'undefined') {
									
									/*
									var htmlText = '<div id="notification" class="notifylist notifyDesctop">'+
										'<div class="notify new" data-jid="'+jid+'"><div class="name">Новый диалог</div><div class="text_top">'+self.myNameList[jid]+'</div><div class="text"><textarea>'+a+'</textarea></div><div class="btns"><button class="chat btn submit" onclick="window.emit(\'chat.click\')">Ответить</button><button class="answer btn gray_sv" onclick="window.emit(\'answer.click\')">Быстрый ответ</button><button class="ignore btn cancel" onclick="window.emit(\'ignore.click\')">Игнорировать</button></div></div>'+
									'</div>';
									var notif = new DesktopNotification('Новое сообщение', {
										//icon: icon, 
										htmlBody: htmlText, 
										//ease: DesktopNotification.ease.easeInOutElastic,
										easeTime:500,
										width:500,
										height:260
									});
									notif.show();
									notif.on('chat.click', function(){
										if(!$(self.notifyAppList[jid].win.window.document.body).find('.notifylist').find('.notify[data-jid="'+jid+'"]').find('.fastanswer_block').size()) {
											self.acceptDialogSend(jid);
											self.actionThread(jid);
										} else {
											self.sendMessageJid(jid, $(self.notifyAppList[jid].win.window.document.body).find('.notifylist').find('.notify[data-jid="'+jid+'"]').find('.fastanswer_block').find('textarea').val());
											self.closeNotify(jid);
										}
									})
									notif.on('answer.click', function(){
										self.acceptDialogSend(jid);
										self.genereteFastAnswerForm(jid);
									})
									notif.on('ignore.click', function(){
										self.ignoreDialog(jid);
									})
									self.notifyAppList[jid] = notif;
									*/
									
																		
									
									
									
									var notify = sergDesctop.add(
									{
										width:500,
										height:260,
										htmlBody: '<div id="notification" class="notifylist notifyDesctop">'+
											'<div class="notify new" data-jid="'+jid+'"><div class="name">Новый диалог</div><div class="text_top">'+self.myNameList[jid]+'</div><div class="text"><textarea>'+a+'</textarea></div><div class="btns"><button class="chat btn submit" onclick="window.emit(\'chat.click\')">Ответить</button><button class="answer btn gray_sv" onclick="window.emit(\'answer.click\')">Быстрый ответ</button><button class="ignore btn cancel" onclick="window.emit(\'ignore.click\')">Игнорировать</button></div></div>'+
										'</div>'
									}, 
									function() {
										notify.show();
										
										notify.on('chat.click', function() {
											if(!$(self.notifyAppList[jid].win.window.document.body).find('.notifylist').find('.notify[data-jid="'+jid+'"]').find('.fastanswer_block').size()) {
												self.acceptDialogSend(jid);
												self.actionThread(jid);
											} else {
												self.sendMessageJid(jid, $(self.notifyAppList[jid].win.window.document.body).find('.notifylist').find('.notify[data-jid="'+jid+'"]').find('.fastanswer_block').find('textarea').val());
												self.closeNotify(jid);
											}
										});
										notify.on('answer.click', function() {
											self.acceptDialogSend(jid);
											self.genereteFastAnswerForm(jid);
										});
										notify.on('ignore.click', function() {
											self.ignoreDialog(jid);
										});
										
										self.notifyAppList[jid] = notify;
										
									}
								);
									
									
									
							} else {
									$(self.notifyAppList[jid].win.window.document.body).find('.notifylist').find('.notify[data-jid="'+jid+'"]').find('.text').find('textarea').append("\n\r"+a);
							}
						} else {
							if(!$('.notifylist').find('.notify[data-jid="'+jid+'"]').size()) {
								//var u = self.userExtraData[jid];
								$('.notifylist').append('<div class="notify new" data-jid="'+jid+'"><div class="name">Новый диалог</div><div class="text_top">'+self.myNameList[jid]+'</div><div class="text"><textarea>'+a+'</textarea></div><div class="btns"><button class="chat btn submit">Ответить</button><button class="answer btn gray_sv">Быстрый ответ</button><button class="ignore btn cancel">Игнорировать</button></div></div>');
								
								$('.notifylist').find('.notify[data-jid="'+jid+'"]').find('.chat').on('click', function() {
									if(!$('.notifylist').find('.notify[data-jid="'+jid+'"]').find('.fastanswer_block').size()) {
										self.acceptDialogSend(jid);
										self.actionThread(jid);
									} else {
										self.sendMessageJid(jid, $('.notifylist').find('.notify[data-jid="'+jid+'"]').find('.fastanswer_block').find('textarea').val());
										self.closeNotify(jid);
									}
								});
								$('.notifylist').find('.notify[data-jid="'+jid+'"]').find('.answer').on('click', function() {
									self.acceptDialogSend(jid);
									self.genereteFastAnswerForm(jid);
								});
								$('.notifylist').find('.notify[data-jid="'+jid+'"]').find('.ignore').on('click', function() {
									self.ignoreDialog(jid);
								});
							} else {
								$('.notifylist').find('.notify[data-jid="'+jid+'"]').find('.text').find('textarea').append("\n\r"+a);
							}
						}
					}
					
					if(showHtmlNotify) {
						self.generateNotifyHtml5(jid, 'Новый диалог', a);
					}
					if(showTitleNotify) {
						self.generateNotifyTitle(jid, 'Новый диалог');
					}
				}
			
			


			
			
				if(type == 'messageDialog') {
					if(showMainNotify) {
						if(isNodeWebkit) {
							
							if(typeof self.notifyAppList[jid] == 'undefined') {
								//var u = self.userExtraData[jid];
								var htmlText = '<div id="notification" class="notifylist notifyDesctop">'+
									'<div class="notify" data-jid="'+jid+'"><div class="name">'+self.myNameList[jid]+'</div><div class="text"><textarea>'+a+'</textarea></div><div class="btns"><button onclick="window.emit(\'chat.click\')" class="chat btn submit">К чату</button><button class="answer btn gray_sv" onclick="window.emit(\'answer.click\')">Быстрый ответ</button><button class="ignore btn cancel" onclick="window.emit(\'ignore.click\')">Игнорировать</button></div></div>'+
								'</div>';
								var notif = new DesktopNotification('Новое сообщение', {
									//icon: icon, 
									htmlBody: htmlText, 
									ease: DesktopNotification.ease.easeInOutElastic,
									easeTime:500,
									width:500,
									height:235
								});
								notif.show();
								notif.on('chat.click', function(){
									if(!$(self.notifyAppList[jid].win.window.document.body).find('.notifylist').find('.notify[data-jid="'+jid+'"]').find('.fastanswer_block').size()) {
										self.actionThread(jid);
									} else {
										self.sendMessageJid(jid, $(self.notifyAppList[jid].win.window.document.body).find('.notifylist').find('.notify[data-jid="'+jid+'"]').find('.fastanswer_block').find('textarea').val());
										self.closeNotify(jid);
									}
								})
								notif.on('answer.click', function(){
									self.genereteFastAnswerForm(jid);
								})
								notif.on('ignore.click', function(){
									self.closeNotify(jid);
								})
								self.notifyAppList[jid] = notif;
							} else {
								$(self.notifyAppList[jid].win.window.document.body).find('.notifylist').find('.notify[data-jid="'+jid+'"]').find('.text').find('textarea').append("\n\r"+a);
							}

						} else {
							if(!$('.notifylist').find('.notify[data-jid="'+jid+'"]').size()) {
								//var u = self.userExtraData[jid];
								$('.notifylist').append('<div class="notify" data-jid="'+jid+'"><div class="name">'+self.myNameList[jid]+'</div><div class="text"><textarea>'+a+'</textarea></div><div class="btns"><button class="chat btn submit">К чату</button><button class="answer btn gray_sv">Быстрый ответ</button><button class="ignore btn cancel">Игнорировать</button></div></div>');
								$('.notifylist').find('.notify[data-jid="'+jid+'"]').find('.chat').on('click', function() {
									if(!$('.notifylist').find('.notify[data-jid="'+jid+'"]').find('.fastanswer_block').size()) {
										self.actionThread(jid);
									} else {
										self.sendMessageJid(jid, $('.notifylist').find('.notify[data-jid="'+jid+'"]').find('.fastanswer_block').find('textarea').val());
										self.closeNotify(jid);
									}
								});
								$('.notifylist').find('.notify[data-jid="'+jid+'"]').find('.answer').on('click', function() {
									self.genereteFastAnswerForm(jid);
								});
								$('.notifylist').find('.notify[data-jid="'+jid+'"]').find('.ignore').on('click', function() {
									self.closeNotify(jid);
								});
							} else {
								$('.notifylist').find('.notify[data-jid="'+jid+'"]').find('.text').find('textarea').append("\n\r"+a);
							}
						}
					}
					
					if(showHtmlNotify) {
						self.generateNotifyHtml5(jid, 'Новое сообщение', a);
					}
					if(showTitleNotify) {
						self.generateNotifyTitle(jid, 'Новое сообщение');
					}
				}
				
				
				if(type == 'noIgnore') {
					if(showMainNotify) {
						if(isNodeWebkit) {
							if(typeof self.notifyAppList[jid] == 'undefined') {
									//var u = self.userExtraData[jid];
									var htmlText = '<div id="notification" class="notifylist notifyDesctop">'+
										'<div class="notify" data-jid="'+jid+'"><div class="name">'+self.myNameList[jid]+'</div><div class="text">Вы не можете игнорировать этот диалог, т.к. вы единственный оставшийся оператор</div><div class="btns"><button class="chat btn submit" onclick="window.emit(\'chat.click\')">К чату</button><button class="answer btn gray_sv" onclick="window.emit(\'answer.click\')">Быстрый ответ</button></div></div>'+
									'</div>';
									var notif = new DesktopNotification('Новое сообщение', {
										//icon: icon, 
										htmlBody: htmlText, 
										ease: DesktopNotification.ease.easeInOutElastic,
										easeTime:500,
										width:500,
										height:260,
										styles: style,
									});
									notif.show();
									notif.on('chat.click', function(){
										if(!$(self.notifyAppList[jid].win.window.document.body).find('.notifylist').find('.notify[data-jid="'+jid+'"]').find('.fastanswer_block').size()) {
											self.acceptDialogSend(jid);
											self.actionThread(jid);
										} else {
											self.sendMessageJid(jid, $(self.notifyAppList[jid].win.window.document.body).find('.notifylist').find('.notify[data-jid="'+jid+'"]').find('.fastanswer_block').find('textarea').val());
											self.closeNotify(jid);
										}
									})
									notif.on('answer.click', function(){
										self.genereteFastAnswerForm(jid);
									});
									self.notifyAppList[jid] = notif;
							} else {
									$(self.notifyAppList[jid].win.window.document.body).find('.notifylist').find('.notify[data-jid="'+jid+'"]').find('.text').find('textarea').append("\n\r"+a);
							}
						} else {
							if(!$('.notifylist').find('.notify[data-jid="'+jid+'"]').size()) {
								//var u = self.userExtraData[jid];
								$('.notifylist').append('<div class="notify" data-jid="'+jid+'"><div class="name">'+self.myNameList[jid]+'</div><div class="text">Вы не можете игнорировать этот диалог, т.к. вы единственный оставшийся оператор</div><div class="btns"><button class="chat btn submit">К чату</button><button class="answer btn gray_sv">Быстрый ответ</button></div></div>');
								$('.notifylist').find('.notify[data-jid="'+jid+'"]').find('.chat').on('click', function() {
									if(!$('.notifylist').find('.notify[data-jid="'+jid+'"]').find('.fastanswer_block').size()) {
										self.acceptDialogSend(jid);
										self.actionThread(jid);
									} else {
										self.sendMessageJid(jid, $('.notifylist').find('.notify[data-jid="'+jid+'"]').find('.fastanswer_block').find('textarea').val());
										self.closeNotify(jid);
									}
								});
								$('.notifylist').find('.notify[data-jid="'+jid+'"]').find('.answer').on('click', function() {
									self.genereteFastAnswerForm(jid);
								});
							} else {
								$('.notifylist').find('.notify[data-jid="'+jid+'"]').find('.text').find('textarea').append("\n\r"+a);
							}
						}
					}
					
					if(showHtmlNotify) {
						self.generateNotifyHtml5(jid, 'Новое сообщение', a);
					}
					if(showTitleNotify) {
						self.generateNotifyTitle(jid, 'Новое сообщение');
					}
				}
				
	
				
				if(type == 'redirect_me') {
					if(showMainNotify) {
						self.closeNotify(jid);
						
						if(isNodeWebkit) {
							//if(typeof self.notifyAppList[jid] == 'undefined') {
								
								var htmlText = '<div id="notification" class="notifylist notifyDesctop">'+
									'<div class="notify" data-jid="'+jid+'"><div class="name">Перевод диалога</div><div class="text"><b>От оператора:</b> '+self.myNameList[jid]+'<br/><b>От клиента:</b> '+self.myNameList[a.contact]+'<br/><br/><b>Комментарий</b>:<br/>'+a.comment+'</div><div class="btns"><button class="chat btn submit" onclick="window.emit(\'chat.click\')">Принять</button><button class="ignore btn cancel" onclick="window.emit(\'ignore.click\')">Отклонить</button></div></div>'+
								'</div>';
								var notif = new DesktopNotification('Перевод диалога', {
									//icon: icon, 
									htmlBody: htmlText, 
									ease: DesktopNotification.ease.easeInOutElastic,
									easeTime:500,
									width:500,
									height:235
								});
								notif.show();
								notif.on('chat.click', function(){
									self.giveRedirectMeAnsver(a.contact, jid, 'ok');
									self.closeNotify(jid);
								})
								notif.on('ignore.click', function(){
									self.giveRedirectMeAnsver(a.contact, jid, 'cancel');
									self.closeNotify(jid);
								})
								self.notifyAppList[jid] = notif;
								//console.log('show' + jid);
							//}
						} else {
							
						
								$('.notifylist').append('<div class="notify" data-jid="'+jid+'"><div class="name">Перевод диалога</div><div class="text"><b>От оператора:</b> '+self.myNameList[jid]+'<br/><b>От клиента:</b> '+self.myNameList[a.contact]+'<br/><br/><b>Комментарий</b>:<br/>'+a.comment+'</div><div class="btns"><button class="chat btn submit">Принять</button><button class="ignore btn cancel">Отклонить</button></div></div>');
								$('.notifylist').find('.notify[data-jid="'+jid+'"]').find('.chat').on('click', function() {
									self.giveRedirectMeAnsver(a.contact, jid, 'ok');
									self.closeNotify(jid);
								});
								$('.notifylist').find('.notify[data-jid="'+jid+'"]').find('.ignore').on('click', function() {
									self.giveRedirectMeAnsver(a.contact, jid, 'cancel');
									self.closeNotify(jid);
								});
						
						}
					}
					
					if(showHtmlNotify) {
						self.generateNotifyHtml5(jid, 'Перевод диалога', a.comment);
					}
					if(showTitleNotify) {
						self.generateNotifyTitle(jid, 'Перевод диалога');
					}
				}
				
				
				
				
				if(type == 'redirect_me_cancel') {
					if(showMainNotify) {
						self.closeNotify(jid);
						
						if(isNodeWebkit) {
								var htmlText = '<div id="notification" class="notifylist notifyDesctop">'+
									'<div class="notify" data-jid="'+jid+'"><div class="name">Перевод диалога</div><div class="text"><b>От оператора:</b> '+self.myNameList[jid]+'<br/><b>От клиента:</b> '+self.myNameList[a.contact]+'<br/><br/>Запрос на перевод отменен</div><div class="btns"><button class="ignore btn cancel" onclick="window.emit(\'ignore.click\')">Закрыть</button></div></div>'+
								'</div>';
								var notif = new DesktopNotification('Новое сообщение', {
									//icon: icon, 
									htmlBody: htmlText, 
									ease: DesktopNotification.ease.easeInOutElastic,
									easeTime:500,
									width:500,
									height:205
								});
								notif.show();
								notif.on('ignore.click', function(){
									self.closeNotify(jid);
								})
								self.notifyAppList[jid] = notif;
						} else {
							
							//if(!$('.notifylist').find('.notify[data-jid="'+jid+'"]').size()) {
								
								$('.notifylist').append('<div class="notify" data-jid="'+jid+'"><div class="name">Перевод диалога</div><div class="text"><b>От оператора:</b> '+self.myNameList[jid]+'<br/><b>От клиента:</b> '+self.myNameList[a.contact]+'<br/><br/>Запрос на перевод отменен</div><div class="btns"><button class="ignore btn cancel">Закрыть</button></div></div>');
								$('.notifylist').find('.notify[data-jid="'+jid+'"]').find('.ignore').on('click', function() {
									self.closeNotify(jid);
								});
							//}
						}
					}
					
					if(showHtmlNotify) {
						self.generateNotifyHtml5(jid, 'Перевод диалога', a.comment);
					}
					if(showTitleNotify) {
						self.generateNotifyTitle(jid, 'Перевод диалога');
					}
				}
			
				
				
				
				self.generateSound(1);
			}
		}
		
		
		
		
		this.genereteFastAnswerForm = function(jid) {
			if(isNodeWebkit) {

				$(self.notifyAppList[jid].win.window.document.body).find('.notifylist').find('.notify').find('.btns').before('<div class="fastanswer_block"><textarea></textarea></div>');
				$(self.notifyAppList[jid].win.window.document.body).find('.notify').find('.btns').find('.answer').remove();
				$(self.notifyAppList[jid].win.window.document.body).find('.notify').find('.btns').find('.ignore').remove();
				self.notifyAppList[jid].win.height = self.notifyAppList[jid].win.height + 100;
				$(self.notifyAppList[jid].win.window.document.body).find('.notify').addClass('answer');

			} else {
					$('.notifylist').find('.notify[data-jid="'+jid+'"]').find('.btns').before('<div class="fastanswer_block"><textarea></textarea></div>');
					$('.notifylist').find('.notify[data-jid="'+jid+'"]').find('.btns').find('.answer').remove();
					$('.notifylist').find('.notify[data-jid="'+jid+'"]').find('.btns').find('.ignore').remove();
					$('.notifylist').find('.notify[data-jid="'+jid+'"]').addClass('answer');
			}
		}
				
		
				
		
		
		
		
		this.generateDialogEvent = function(jid, type, attr1, attr2) {
		
			if(type == 'closeAllDialogs') {
					
					var u = self.userExtraData[jid];
					
					$('.dialog_window').addClass('dialog_window_redirect').removeClass('hide').html('<div class="dialog_window_h">Переход в AWAY</div><div class="dialog_window_t">Для перехода в AWAY необходимо закрыть все активные диалоги</div><div class="dialog_window_btns"><div class="dialog_window_btn btn submit" data="'+attr1+'">Закрыть</div><div class="dialog_window_btn btn gray_sv">Отменить</div></div>');
					
					$('.dialog_window_btn.submit').on('click', function() {
						self.myDialogList.forEach(function(item, i, arr) {
							self.closeThread(item, true);

						});
						self.setStatus('away');
						$('.dialog_window').addClass('hide');
					});
					$('.dialog_window_btn.gray_sv').on('click', function() {
						$('.dialog_window').addClass('hide');
					});
					
			}
			
			
			if(type == 'noopen') {
					
					$('.content_bottom_noopen_dialog').html('<div class="content_bottom_noopen_dialog_text">Выберите действие, которое необходимо сделать с диалогом</div><div class="content_bottom_noopen_dialog_btnlist"><div class="content_bottom_noopen_dialog_no btn gray_sv">Игнорировать</div><div class="content_bottom_noopen_dialog_my btn submit">Принять</div></div><div class="clear"></div>')

					//кнопка принятия из окна
					$('.content_bottom_noopen_dialog_my').on('click', function() {
						self.acceptDialogSend(jid);
					});
					//кнопка игнорирования из окна
					$('.content_bottom_noopen_dialog_no').on('click', function() {
						self.ignoreDialog(jid);
					});
					
					$('.content_bottom_dialog').addClass('hide');
					$('.content_bottom_noopen_dialog').removeClass('hide');
			}
			
			if(type == 'noignore') {
				
				if(self.threadJid == jid) {
				
					$('.content_bottom_noopen_dialog').html('<div class="content_bottom_noopen_dialog_text">Данныей диалог нельзя игнорировать т.к. вы единственный оператор</div><div class="content_bottom_noopen_dialog_btnlist"><div class="content_bottom_noopen_dialog_my btn submit">Принять</div></div><div class="clear"></div>')
					
					//кнопка принятия из окна
					$('.content_bottom_noopen_dialog_my').click(function() {
						self.acceptDialogSend(jid);
					});
					
					$('.content_bottom_dialog').addClass('hide');
					$('.content_bottom_noopen_dialog').removeClass('hide');
					
				}
			}
			
			if(type == 'closethread') {
				
				$('.content_bottom_noopen_dialog').html('<div class="content_bottom_noopen_dialog_text">Диалог закрыт</div><div class="clear"></div>')
				
			}
			
			//попытка редиректа
			if(type == 'redirect') {

					var u = self.userExtraData[jid];
					
					$('.dialog_window').addClass('dialog_window_redirect').removeClass('hide').html('<div class="dialog_window_h">Перевод диалога</div><div class="dialog_window_t"><b>Сайт:</b> '+self.filterSite(u.site)+'<br/><b>Клиент:</b> '+u.client_name+'</div><div class="dialog_window_area"><textarea></textarea></div><div class="dialog_window_btns"><div class="dialog_window_btn btn submit" data="'+attr1+'">Послать</div><div class="dialog_window_btn btn gray_sv">Отменить</div></div>');
					
					$('.dialog_window_btn.submit').on('click', function() {
						self.giveRedirect(jid, attr1, $('.dialog_window_area').find('textarea').val());
					});
					$('.dialog_window_btn.gray_sv').on('click', function() {
						$('.dialog_window').addClass('hide');
					});
				//}
			}
			
	
			//успешный перевод
			if(type == 'redirectOk') {
				
				var u = self.userExtraData[jid];

				$('.dialog_window').addClass('dialog_window_redirect').removeClass('hide').html('<div class="dialog_window_h">Перевод диалога</div><div class="dialog_window_t"><b>Сайт:</b> '+self.filterSite(u.site)+'<br/><b>Клиент:</b> '+u.client_name+'</div><div class="dialog_window_inform">Диалог успешно переведен</div><div class="dialog_window_btns"><div class="dialog_window_btn btn gray_sv">Закрыть</div></div>');

				$('.dialog_window_btn.gray_sv').on('click', function() {
					$('.dialog_window').addClass('hide');
				});
				
			}
			
			//отклоненный перевод
			if(type == 'redirectCancel') {
				
				var u = self.userExtraData[jid];
				
				$('.dialog_window').addClass('dialog_window_redirect').removeClass('hide').html('<div class="dialog_window_h">Перевод диалога</div><div class="dialog_window_t"><b>Сайт:</b> '+self.filterSite(u.site)+'<br/><b>Клиент:</b> '+u.client_name+'</div><div class="dialog_window_inform">Перевод диалога отклонен</div><div class="dialog_window_btns"><div class="dialog_window_btn btn gray_sv">Закрыть</div></div>');

				$('.dialog_window_btn.gray_sv').on('click', function() {
					$('.dialog_window').addClass('hide');
				});
				
			}
			
			
			
			
			//блокировка
			if(type == 'block') {
				
				var u = self.userExtraData[jid];
				
				$('.dialog_window').addClass('dialog_window_block').removeClass('hide').html('<div class="dialog_window_h">Блокировка клиента</div><div class="dialog_window_t"><b>Сайт:</b> '+self.filterSite(u.site)+'<br/><b>Клиент:</b> '+u.client_name+'</div><div class="dialog_window_area"><textarea></textarea></div><div class="dialog_window_btns"><div class="dialog_window_btn btn submit">Послать</div><div class="dialog_window_btn btn gray_sv">Отменить</div></div>');
				
				$('.dialog_window_btn.submit').on('click', function() {
					self.blockClient(jid, $('.dialog_window_area').find('textarea').val());
				});
				$('.dialog_window_btn.gray_sv').on('click', function() {
					$('.dialog_window').addClass('hide');
				});
				
			}
			
			//блокировка успешна
			if(type == 'blockOk') {
				
				var u = self.userExtraData[jid];
				
				$('.dialog_window').addClass('dialog_window_redirect').removeClass('hide').html('<div class="dialog_window_h">Блокировка клиента</div><div class="dialog_window_t"><b>Сайт:</b> '+self.filterSite(u.site)+'<br/><b>Клиент:</b> '+u.client_name+'</div><div class="dialog_window_inform">Блокировка завершена</div><div class="dialog_window_btns"><div class="dialog_window_btn btn gray_sv">Закрыть</div></div>');

				$('.dialog_window_btn.gray_sv').on('click', function() {
					$('.dialog_window').addClass('hide');
				});
				
			}
			
			
			//послать историю
			if(type == 'sendHistory') {
				
				var u = self.userExtraData[jid];
				
				$('.dialog_window').addClass('dialog_window_history').removeClass('hide').html('<div class="dialog_window_h">Отправить диалог с клиентом</div><div class="dialog_window_t"><b>Клиент:</b> '+u.client_name+'</div><div class="dialog_window_area"><b>Email</b><br/><input type="text" value="" name="email"></input></div><div class="dialog_window_area"><b>Примечание к письму</b><br/><textarea name="comment"></textarea></div><div class="dialog_window_btns"><div class="dialog_window_btn btn submit">Послать</div><div class="dialog_window_btn btn gray_sv">Отменить</div></div>');
				
				$('.dialog_window_btn.submit').on('click', function() {
					self.sendHistoryToEmail(null, jid, $('.dialog_window_area').find('input[name="email"]').val(), $('.dialog_window_area').find('textarea[name="comment"]').val(), u.threadId);
				});
				$('.dialog_window_btn.gray_sv').on('click', function() {
					$('.dialog_window').addClass('hide');
				});
				
			}
			
			//успешно послал историю
			if(type == 'sendHistoryOk') {
				
				var u = self.userExtraData[jid];
				
				$('.dialog_window').addClass('dialog_window_history').removeClass('hide').html('<div class="dialog_window_h">Отправить диалог с клиентом</div><div class="dialog_window_t"><b>Сайт:</b> '+self.filterSite(u.site)+'<br/><b>Клиент:</b> '+u.client_name+'</div><div class="dialog_window_inform">Успешно отправлено</div><div class="dialog_window_btns"><div class="dialog_window_btn btn gray_sv">Закрыть</div></div>');
				
	
				$('.dialog_window_btn.gray_sv').on('click', function() {
					$('.dialog_window').addClass('hide');
				});
				
			}
			
			
			
			
			//успешно послал историю
			if(type == 'uploadError') {
				
				var u = self.userExtraData[jid];
				
				$('.dialog_window').addClass('dialog_error').removeClass('hide').html('<div class="dialog_window_h">Ошибка загрузки файла</div></div><div class="dialog_window_inform">'+attr1+'</div><div class="dialog_window_btns"><div class="dialog_window_btn btn gray_sv">Закрыть</div></div>');
				
	
				$('.dialog_window_btn.gray_sv').on('click', function() {
					$('.dialog_window').addClass('hide');
				});
				
			}

			
			
			
			
			
			
		}
		
		
		
		this.sendHistoryToEmail = function(callback, jid, email, comment, threadId) {
			var d = {
				send_history: 1,
				from: self.jid,
				threadid: threadId,
				email: email,
				comment: comment
			}
			$.ajax({
				type: "GET",
				url: "https://cleversite.ru/cleversite/bitrix_sender_senderdefenderser.php",
				data: d,
				dataType: 'xml',
				success: function(data){
					
					self.generateDialogEvent(jid, 'sendHistoryOk');
						
					if(callback) {
						callback();
					}
				}
			});
		}

		
		
		this.blockClient = function(jid, comment) {
			var u = self.userExtraData[jid];

				self.socket.emit('message', {type: 'message', data: {
						message: {
							attr: {
								to: jid, 
								type: 'headline', 
							},
							child: {
								notification: {
									attr: {
										xmlns: 'cleversite:notification', 
										event: 'block', 
										comment: comment, 
									},
								},
							}
						}
					}
				});
			
			
			
		}
	
		
		this.giveRedirectMeAnsver = function(jid, jidOperator, status) {
			var u = self.userExtraData[jid];

				self.socket.emit('message', {type: 'message', data: {
						message: {
							attr: {
								to: jidOperator, 
								type: 'headline', 
							},
							child: {
								data: {
									attr: {
										xmlns: 'cleversite:data:redirect', 
										contact: jid, 
										result: status, 
									},
								},
								thread: {
									body: u.threadId
								}
							}
						}
					}
				});
			
			
			
			if(status=='ok') {
				var item = {
					jid: jid,
					name: u.client_name,
				}
				self.addItemToList('#clients', item, 0, false);
			
			}
		}

		
		
		//попытка передачи диалога
		this.giveRedirect = function(jid, jidOperator, comment) {
			var u = self.userExtraData[jid];
			
			self.socket.emit('message', {type: 'message', data: {
						message: {
							attr: {
								to: jidOperator, 
								type: 'headline', 
							},
							child: {
								data: {
									attr: {
										xmlns: 'cleversite:data:redirect', 
										contact: jid, 
										comment: comment, 
									},
									child: {
										client: {
											attr: { 
												xmlns: 'cleversite:data:client',
											},
											child: {
												client_name: {body: u.client_name},
												site: {body: u.site},
												page: {body: u.page},
												source: {body: u.source},
												location: {body: u.location},
												provider: {body: u.provider},
												organization: {body: u.organization},
												address: {body: u.address},
												browser: {body: u.browser},
												visits: {body: u.visits},
												dialogs: {body: u.dialogs},
												scan_pages: {body: u.scan_pages},
											},
										},
									},
								},
								thread: {
									body: u.threadId
								}
							}
						}
					}
				});

			
		}
				

		this.giveRedirectToUser = function(jid, jidOperator) {

			var u = self.userExtraData[jid];
			
				self.socket.emit('message', {type: 'message', data: {
						message: {
							attr: {
								to: jid, 
								type: 'headline', 
							},
							child: {
								notification: {
									attr: {
										xmlns: 'cleversite:notification', 
										contact: jidOperator, 
										comment: '', 
										event: 'redirect', 
									},
								},
								thread: {
									body: u.threadId
								}
							}
						}
					}
				});
			
			
			
			
			
			
			self.generateDialogEvent(jid, 'redirectOk');
		}

		
		this.filterSite = function(url) {

			url = url.replace(/http:\/\//g, '').replace(/https:\/\//g, '');
			url = url.substr(0, url.indexOf('/'));
			return url;
		}
		
		this.transformXml = function(el) {
						if(typeof el == 'object') {
							var r = $('<'+el.name+'></'+el.name+'>');
							if(typeof el.attrs != 'undefined') {
								for (var key in el.attrs) {
									r.attr(key, el.attrs[key]);
								}
							}
							for(var i = 0; i < el.children.length; i++) {
								r.append(self.transformXml(el.children[i]));
							}
							return r;
						} else if(typeof el == 'string') {
							return el;
						}
		}
		this.getAllText = function getAllText (el) {
		  return !el.children ? el : el.children.reduce(function (text, child) {
			return text + getAllText(child)
		  }, '')
		}
		this.date = function(time, z) {
			var d = new Date(), str = '';
			if(time) {
				d = new Date(time);
			}

			str = d.getFullYear() +
				'-' + self.coorect0(d.getMonth() + 1) +
				'-' + self.coorect0(d.getDate()) +
				'T' + self.coorect0(d.getHours()) +
				':' + self.coorect0(d.getMinutes()) +
				':' + self.coorect0(d.getSeconds());
			
			if(z) {
				var t = -d.getTimezoneOffset()/60;
				str += 'Z' + ( (t>0)?'+' + self.coorect0(t):'-' + self.coorect0(-t));
			}
			
			return str;
				//'.' + (d.getMilliseconds() / 1000).toFixed(3).slice(2, 5) +
				//'Z';
		} 

		this.coorect0 = function(n) {
			if(n < 10) {
				n = '0' + n;
			}
			return n;
		} 
		this.convertDateISOtoTime = function(string) {
			var regexp =    "([0-9]{4})(-?([0-9]{2})(-?([0-9]{2})" +
							"(T([0-9]{2}):([0-9]{2})(:([0-9]{2})(\.([0-9]+))?)?" +
							"(Z|(([-+])([0-9]{2}):([0-9]{2})))?)?)?)?";
			var d = string.match(new RegExp(regexp));

			var offset = 0;
			var date = new Date(d[1], 0, 1);

			if (d[3]) { date.setMonth(d[3] - 1); }
			if (d[5]) { date.setDate(d[5]); }
			if (d[7]) { date.setHours(d[7]); }
			if (d[8]) { date.setMinutes(d[8]); }
			if (d[10]) { date.setSeconds(d[10]); }
			if (d[12]) { date.setMilliseconds(Number("0." + d[12]) * 1000); }
			if (d[14]) {
				offset = (Number(d[16]) * 60) + Number(d[17]);
				offset *= ((d[15] == '-') ? 1 : -1);
			}

			//offset -= date.getTimezoneOffset();
			var time = (Number(date) + (offset * 60 * 1000));
	
			return Number(time);
		}
		
		
		
		
		
		
		
		this.resizeThread = function() {
			var h_content = 0, h_header = 0, h_middle = 0, h_top = 0, h_bottom = 0, h_left_selectblock = 0, h_footer = 5;
			
			h_content = $('#content').height() + 54;
			
			h_header = $('#header').height() + 1;//бордер
			if(!$('.content_middle').hasClass('hide')) {
				h_middle = $('.content_middle').height() + 1//бордер;
			}
			if(!$('.content_top').hasClass('hide')) {
				h_top = $('.content_top').height() + 1//бордер;
			}
			if(!$('.content_bottom').hasClass('hide')) {
				h_bottom = $('.content_bottom').height() + 14//отктуп;
			}
			h_left_selectblock = $('.content_left_tab_list').height() + 2 + 12;//бордер и отступ;
			h_footer = 0;//бордер и отступ;

			//основной контент
			$('.content_section').height(h_content - h_header - h_middle - h_top - h_bottom - h_footer - 10 - 10);//отступ у контента и отступ снизу
			if(!$('.content_dialog').hasClass('hide')) {
				self.scrollingTo('', '#data_scroll');
			}
			
			//инфо о клиенте
			$('.client_info_block_line2').height(h_content - h_header - h_middle - h_top - h_bottom - h_footer - 4);//бордер
			if(!$('.client_info').hasClass('hide')) {
				self.scrollingTo('top', '.client_info_block_line2');
			}
			
			//левые операторы
			$('.content_left_blocks').height(h_content - h_header - h_left_selectblock - h_footer);
			self.scrollingTo('top', '.content_left_blocks');
		}



		this.valudate_auth = function() {
			var active = true;
			var b = $('#auth_form_form').find('button[name="submit"]');
			/*var l = $('#auth_form_form').find('input[name="login"]');
			var p = $('#auth_form_form').find('input[name="password"]');
			

			if(l.val().length <= 0) {
				active = false;
			}
			if(p.val().length <= 0) {
				active = false;
			}
			*/
			if(active) {
				b.removeClass('disabled_submit');
			} else {
				b.addClass('disabled_submit');
			}
		}


		this.scrollingTo = function(to, idblockscroll) {
			if($(idblockscroll).size()) {
				$(idblockscroll).addClass('scrollbar-inner').scrollbar({
					"showArrows": true,
					"scrolly": "advanced"
				});
				if(to == 'bottom') {
					$(idblockscroll).addClass('scrollbar-inner').scrollTop(9999)
				}
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
				
				
			
			
		 this.addFiles = function(files) {
			$.each(files, function(i, file) {
				var temp = {file: file, progressTotal: 0, progressDone: 0, element: null, valid: false};

				/*temp.valid = (file.type == 'image/png'
					|| file.type == 'image/jpeg'
				|| file.type == 'image/jpg') && file.size / 1024 / 1024 < 2;*/

				//temp.element = baseClass.attachFileToView(temp);

				var isValidType = (file.type == 'image/png'
					|| file.type == 'image/jpeg'
					|| file.type == 'image/jpg');

				var isValidSize = file.size / 1024 / 1024 < 2;
				
				temp.valid = isValidType && isValidSize;

				//create message column
				if(!isValidType) {
					self.generateDialogEvent(self.threadJid, 'uploadError', 'Неверный тип загружаемого ' + file.type);
				} else if(!isValidSize) {
					self.generateDialogEvent(self.threadJid, 'uploadError', 'Превышен размер файла. Зугражаемый - ' + Math.floor(file.size / 1024 / 1024) + 'Mb. Лимит - 2 Mb.');
				} else {
					self.uploadFile(temp);
				}

			});
		};	
			
		this.uploadFile =  function(file) {
			//var file = baseClass.allFiles[index];
			
			//Создаем объек FormData
			var data = new FormData();

			//headers: {"HTTP_TO": self.jid, "HTTP_THREADID": self.userExtraData[self.threadJid].threadId, "HTTP_USERID": self.threadJid},
			data.append('HTTP_TO', self.jid);
			data.append('HTTP_THREADID', self.userExtraData[self.threadJid].threadId);
			data.append('HTTP_USERID', self.threadJid);
			
			//Добавлем туда файл
			data.append('file', file.file);
		
			
			//отсылаем с попощью Ajax
			$.ajax({
				url: 'https://cleversite.ru/cleversite/upload_file.php',
				data: data,
				cache: false,
				contentType: false,
				processData: false,
				type: 'POST',
				success: function(response) {
					if(response.indexOf('//')) {
					
						self.sendMessageJid(self.threadJid, response);
						
					} else {
						
						self.generateDialogEvent(self.threadJid, 'uploadError', response);
						
					}
				},
				xhr: function() {
					var xhr = $.ajaxSettings.xhr();

					if ( xhr.upload ) {
						//console.log('xhr upload');
					}

					return xhr;
				}
			});
		};	
				
			
			

		
	
		this.socket.on('connect', function () {

			self.init();

		});
		this.socket.on('connect_error', function () {

			self.closePult(1, 'Сервер не отвечает');
			
		});

        
    };
    window.chat = new Chat();
	

	
});
































































