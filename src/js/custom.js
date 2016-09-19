'use strict';

console.log('new App 0.1.1');

if (isNodeWebkit) {
	var gui = require('nw.gui');
	var win = gui.Window.get();
}

$(document).ready(function() {

	//localStorage.setItem("test", JSON.stringify({ru: this.ruPhrases,en: this.enPhrases,version: this.version}));


	var Chat = function () {

        var self = this;

		//данные текущего юзера, для авторизации
        this.user = {login: '', password: '', status: '', autoAway: false, jid: ''};
		//статус окна пользователя
		this.windowStatus = "show";
		//последняя активность в пульте
		this.lastActive = Date.now();

		//массив Таймаутов (на 1го изера - 1н таймают, использую для удалению юзера из списка через 30 сек, после закрытия диалога)
        this.delayFunc = {
			redirect: {},
			removeLeftItem: {},
		};
		//список десктоп нотификаций (стандартные нотификации)
        this.notifyDesctopList = {};
		//список нотификаций
		this.notifyList = {
			newMessage: {},
			message: {},
			noIgnore: {},
			redirect: {},
			redirectCancel: {},
		};


		//список всех операторов и пользователей
        this.userList = {};

		//вровень логирования, не используется
        this.logLevel = 2;

		//сокет соединение
        this.connection = false;
		//джид юзера
        this.jid = false;
		//хмпп домен
		this.domen = 'cleversite.ru';
		//тайтл документа
		this.titleDocument = document.title;
		this.generateNotifyTitleTimeout;
		//список нотификаций с миганющим Тайтлом
		this.generateNotifyTitleTimeoutList = {};



		//this.reconnectTimeout;
		//this.resource = 'webpult';

		//данные по текущему выбранному диалогу
		this.thread = {
			jid: ''
		};
		//список принятых диалогов
		this.myDialogList = [];
		//список игнорируемых диалогов
		this.myIgnoreList = [];
		//ростер
		this.roster = [];


		if(location.port == 3001) {
			this.socket = io('https://nodejs01.cleversite.ru:3001/');
		} else {
			this.socket = io('https://nodejs01.cleversite.ru/');
		}



		//список смайлов
		this.smiles = {
			SM1: ['=)', '<img data="SM1" class="smile" src="/images/smiles/1.png" />'],
			SM2: ['=(', '<img data="SM2" class="smile" src="/images/smiles/2.png" />'],
			SM3: ['=*(', '<img data="SM3" class="smile" src="/images/smiles/3.png" />'],
			SM4: [';)', '<img data="SM4" class="smile" src="/images/smiles/4.png" />'],
			SM5: [':-@', '<img data="SM5" class="smile" src="/images/smiles/5.png" />'],
			SM6: [':-D', '<img data="SM6" class="smile" src="/images/smiles/6.png" />'],
			SM7: [':-[', '<img data="SM7" class="smile" src="/images/smiles/7.png" />'],
			SM8: ['=-O', '<img data="SM8" class="smile" src="/images/smiles/8.png" />']
		};






        this.init = function () {



			/*self.resizeThread();
			$(window).resize(function() {
				self.resizeThread();
			});*/

			self.loadLocalize();

			self.scrollingTo('top', '.user_list');

			self.valudate_auth();
			$('#auth_form_form').find('input').on('keyup', function() {
				self.valudate_auth();
			});

			/*
			if(isNodeWebkit) {
				$('.property_top').show();
			} else {
				$('.exit_top').show();
			}
			*/



			$('.menu').on('mouseover', function() {
				$(this).addClass('hover');
			}).on('mouseout', function() {
				$(this).removeClass('hover');
			});

			$('.user_info').on('mouseover', function() {
				$(this).addClass('hover');
			}).on('mouseout', function() {
				$(this).removeClass('hover');
			});


			if (isNodeWebkit) {
				gui.Window.get().on("blur",  function(){
					self.windowStatus = "hide";
				});
				gui.Window.get().on("focus", function(){
					self.windowStatus = "show";
					if(self.thread.jid) {
						self.closeNotify(self.thread.jid, ['message']);
					}
				});
			} else {
				window.addEventListener("blur",  function(){
					self.windowStatus = "hide";
				});
				window.addEventListener("focus", function(){
					self.windowStatus = "show";
					if(self.thread.jid) {
						self.closeNotify(self.thread.jid, ['message']);
					}
				});
			}

			if(typeof Notification != 'undefined') {
				if (Notification.permission !== "granted") {
					Notification.requestPermission();
				}
			}



			new Medium({
				element: document.getElementById('msgwnd'),
				mode: Medium.richMode,
				attributes: null,
				tags: null
			});
















			//smiles
			for(var key in self.smiles) {
				$('.smiles_list').find('.smiles_list_cont').append(self.smiles[key][1]);
			}


			$('.content_bottom_dialog').find('.smiles_list').on('mouseenter', function() {
				$('.smiles_list').removeClass('hide');
				$('.smiles_list').addClass('act');
			}).on('mouseleave', function() {
				$('.smiles_list').removeClass('act');
				setTimeout(function() {
					if(!$('.smiles_list').hasClass('act')) {
						$('.smiles_list').addClass('hide');
					}
				}, 777);
			})

			$('.content_bottom_dialog').find('.btns').find('.smile').on('mouseenter', function() {
				$('.smiles_list').addClass('act');
				$('.smiles_list').removeClass('hide');
				self.caretAtEnd($('.content_bottom_dialog').find('#msgwnd'));
			}).on('mouseleave', function() {
				$('.smiles_list').removeClass('act');
				setTimeout(function() {
					if(!$('.smiles_list').hasClass('act')) {
						$('.smiles_list').addClass('hide');
					}
				}, 777);
			});

			$('.smiles_list').find('.smiles_list_cont').find('img').on('click', function(event) {
				var cl = $(this).attr('data');
				$('.content_bottom_dialog').find('.send').removeClass('disabled');
				$('.content_bottom_dialog').find('#msgwnd').append( self.smiles[cl][1] );
				self.caretAtEnd($('.content_bottom_dialog').find('#msgwnd'));
			});

			//---------//








			//


			$(document).mousemove(function( event ) {
				self.lastActive = Date.now();
				if(self.user.autoAway) {
					self.setStatus('chat');
					self.user.autoAway = false;
				}
			});


			$('.top_menu').find('li[data="exit"]').click(function() {

				self.socket.emit('message', {type: 'disconnect'});

				self.closePult(1);

				$.cookie('pult_login', '');
				$.cookie('pult_password', '');

				if(isNodeWebkit) {
					win.close();
				}

				event.preventDefault();
			});

			$('.top_menu').find('li[data="operators"]').on('click', function() {
				if(!$(this).hasClass('act')) {
					$('.top_menu').find('li[data="clients"]').removeClass('act');
					$('.top_menu').find('li[data="operators"]').addClass('act');
					$('.content_left_block[data="clients"]').hide();
					$('.content_left_block[data="operators"]').show();
				}
			});
			$('.top_menu').find('li[data="clients"]').on('click', function() {
				if(!$(this).hasClass('act')) {
					$('.top_menu').find('li[data="operators"]').removeClass('act');
					$('.top_menu').find('li[data="clients"]').addClass('act');
					$('.content_left_block[data="operators"]').hide();
					$('.content_left_block[data="clients"]').show();
				}
			});

			$('.top_status').click(function() {
				if($('.top_status').find('.circle').parent().hasClass('off')) {
					self.setStatus('chat');
				} else {
					self.setStatus('away');
				}
				self.user.autoAway = false;
			});




			$('.top_menu').find('li[data="transfer"]').on('click', function() {
				if(!$(this).hasClass('disabled')) {
					self.generateDialogWindow(self.thread.jid, 'redirectList');
				}
			});

			$('.top_menu').find('li[data="block"]').on('click', function() {
				if(!$(this).hasClass('disabled')) {
					self.generateDialogWindow(self.thread.jid, 'block');
				}
			});

			$('.top_menu').find('li[data="send_email"]').on('click', function() {
				if(!$(this).hasClass('disabled')) {
					self.generateDialogWindow(self.thread.jid, 'sendHistory');
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

			$(document).on("click", ".left_list_line .close", function(e) {
				e.stopPropagation();
				var jid = $(this).parent().parent().parent().attr('jid');
				self.closeThread(jid, true);
			});

			$('.content_bottom_dialog').find('.send').on('click', function() {
				self.sendMessageThread();
			});

			$('.content_bottom_right_fast').on('click', function() {
				if($(this).hasClass('act')) {
					$('.fast_message_block').addClass('hide');
					$(this).removeClass('act');
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
				$('.content_bottom_dialog').find('.send').removeClass('disabled');
				$('.content_bottom_right_fast').removeClass('hide');
			});





			//-- бычтрые фразы --//

			$('.fast_phrase').on('click', function() {
				if($('.phrase_list').hasClass('hide')) {
					self.fastPhrase.open();
				} else {
					self.fastPhrase.close();
				}
			});

			self.scrollingTo('top', '.phrase_list_cont');

			$(document).on("click", ".phrase_list .phrase", function() {
				self.fastPhrase.change($(this).attr('data'));
			});

			//---//



			/*
			$('.content_middle_ico').on('click', function() {
				if($(this).hasClass('act')) {
					$('.client_info').addClass('hide');
					$(this).removeClass('act');
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
			*/

			$('.show_history').on('click', function() {
				self.loadClientsHistoryAll(function(jid) {
					if(jid == self.thread.jid) {
						self.loadHistory(jid);
						$('.show_history').addClass('hide');
					}
				}, self.thread.jid);
			});





			$('#msgwnd').keydown(function(e) {
				var t = $('#msgwnd').html();
				if(t != '') {
					$('.content_bottom_dialog').find('.send').removeClass('disabled');

				} else {
					$('.content_bottom_dialog').find('.send').addClass('disabled');
				}

				if(self.userList[self.user.jid].write.text != t) {
					if(self.userList[self.user.jid].write.status != 'composing') {
						if(self.userList[self.user.jid].write.status == 'inactive') {
							self.seewriter.send(self.thread.jid, 'active');
						}
						self.seewriter.send(self.thread.jid, 'composing');
					}

					if(typeof self.seewriter.delay[self.thread.jid] != undefined) {
						clearTimeout(self.seewriter.delay[self.thread.jid]);
					}
					var j = self.thread.jid;
					self.seewriter.delay[self.thread.jid] = setTimeout(function() {
						if(self.userList[self.user.jid].write.status != 'paused' && self.userList[self.user.jid].write.status != 'inactive' && self.userList[self.user.jid].write.status != 'active') {
							self.seewriter.send(j, 'paused');
						}
						self.seewriter.delay[j] = setTimeout(function() {
							if(self.userList[self.user.jid].write.status != 'inactive') {
								self.seewriter.send(j, 'inactive');
							}
						}, 55000);
					}, 5000);
				}


				self.upgradeUser(self.user.jid, {
					write: {
						text: $('#msgwnd').html()
					}
				});


				if (e.ctrlKey && e.keyCode == 13) {
					self.sendMessageThread();
					return false;
				} else if(!e.ctrlKey && e.keyCode == 13) {
					self.sendMessageThread();
					return false;
				}
			});









			$('.content_bottom_dialog').find('.file').on('click', function() {
				if(!$(this).hasClass('disable')) {
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

			//автоматическая авторизация
			var _in = false;
			if(window.configApp.desktop.prop_autoIn) {
				if($.cookie('pult_login') && $.cookie('pult_password')) {
					self.connecting_main($.cookie('pult_login'), $.cookie('pult_password'));
					_in = true;
				}
			}
			if(!_in) {
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


			//проверка версии
			if(!isNodeWebkit) {
				if(msg.type=='version') {
					if(msg.ver != version) {
						self.generateDialogWindow(null, 'versionUpdate', null, null);
					}
				}
			}


			if(msg.type=='xmpp') {//xmpp

				if(msg.act=='connect') {//успешное соединение

					$.cookie('pult_login', msg.login);
					$.cookie('pult_password', msg.password);

					self.user.jid = msg.login+'@'+self.domen;

					self.socket.emit('message', {type: 'getvcard', jid: self.user.jid});

					self.socket.emit('message', {type: 'getroster'});

					self.setDefaultProp();

					self.upgradeUser(self.user.jid, {
						name: self.user.jid,
						write: {
							status: 'inactive',
							text: '',
							time: 0
						}
					});


				} else if(msg.act=='vcard') {

					if(self.user.jid == msg.jid) {
						$('.main_user').find('.name').html(msg.nick);
					}

					self.upgradeUser(msg.jid, {
						name: msg.nick
					});



				} else if(msg.act=='roster_all') {

					$('.auth_form_parent').addClass('hide');
					$('.preloader').addClass('hide');
					$('#content').removeClass('hide');
					self.resizeThread();

					self.loadClients(function() {
						self.setStatus('chat');
						self.user.autoAway = false;
					});

				} else if(msg.act=='roster') {

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

					console.log(e);

					if(e == 'XMPP authentication failure') {
						self.closePult(1, window.langClever.lang[window.configApp.local].xmpp_error.loginOrPass);
					} else if(e == 'Replaced by new connection') {
						self.closePult(1, window.langClever.lang[window.configApp.local].xmpp_error.replace);
					} else if(e.indexOf('You are blocked') != -1) {
						if(e.indexOf('<400>') != -1) {
							self.closePult(1, window.langClever.lang[window.configApp.local].xmpp_error.limit);
						} else if(e.indexOf('<200>') != -1) {
							self.closePult(1, window.langClever.lang[window.configApp.local].xmpp_error.block1);
						} else if(e.indexOf('<200s>') != -1) {
							self.closePult(1, window.langClever.lang[window.configApp.local].xmpp_error.block2);
						} else if(e.indexOf('<305>') != -1) {//нету счетов
							self.closePult(1, window.langClever.lang[window.configApp.local].xmpp_error.dataPay1);
						} else if(e.indexOf('<310>') != -1) {
							self.closePult(1, window.langClever.lang[window.configApp.local].xmpp_error.dataPay2);
						}
					} else if(e == 'ECONNRESET') {
						self.closePult(1, window.langClever.lang[window.configApp.local].xmpp_error.connect);

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



								if(messasge.find('active').size()) {
									self.seewriter.writeStatus(from, 'active');
								}
								if(messasge.find('composing').size()) {
									self.seewriter.writeStatus(from, 'composing');
								}
								if(messasge.find('paused').size()) {
									self.seewriter.writeStatus(from, 'paused');
								}
								if(messasge.find('inactive').size()) {
									self.seewriter.writeStatus(from, 'inactive');
								}



						if(self.myIgnoreList.indexOf(from) == -1) {

								var proc_body = true;
								if(messasge.find('data').size()) {
									if(messasge.find('data').attr('xmlns') == 'cleversite:data:client') {


										self.upgradeUser(from, {
											thread: self.generateClientsDataForXml(messasge.find('data'), threadId, 'open'),
											name: messasge.find('data').find('client_name').text(),
											yes_close: false,
											cntmessage: 0,
										});

										self.leftItem(from);


										if(self.thread.jid == from) {
											self.generateDialogEvent(from, 'noopen');
										}
										proc_body = false;
									} else if(messasge.find('data').attr('xmlns') == 'cleversite:data:ignore') {
										if(messasge.find('data').attr('result') == 'ok') {

											self.removeClient(from);
											self.myIgnoreList[from];


										} else if(messasge.find('data').attr('result') == 'cancel'){

											if(self.thread.jid == from) {
												self.generateDialogEvent(from, 'noignore');
											}
											self.generateNotify('noIgnore', from);

										}
									} else if(messasge.find('data').attr('xmlns') == 'cleversite:data:redirect') {
										if(messasge.find('data').attr('result')) {
											if(messasge.find('data').attr('result') == 'ok') {
												self.giveRedirectToUser(messasge.find('data').attr('contact'), from);
											} else if(messasge.find('data').attr('result') == 'cancel'){
												self.generateDialogWindow(messasge.find('data').attr('contact'), 'redirectCancel');
											}
										}
										if(messasge.find('data').find('client').size()) {

											self.upgradeUser(messasge.find('data').attr('contact'), {
												thread: self.generateClientsDataForXml(messasge.find('data').find('client'), threadId, 'open'),
											});


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
											//proc_body = false;
										}
										if(messasge.find('notification').attr('event') == 'cancel_redirect') {
											//self.generateDialogEvent(messasge.find('data').attr('contact'), 'redirect_me_cancel', from, messasge.find('data').attr('comment'));

											self.generateNotify('redirect_me_cancel', from, {contact: messasge.find('notification').attr('contact'), comment: messasge.find('notification').attr('comment')});
											proc_body = false;
										}
										if(messasge.find('notification').attr('event') == 'blocked') {
											self.generateDialogWindow(from, 'blockOk');
											self.myDialogList.splice(self.myDialogList.indexOf(from), 1);
											proc_body = false;
										}
										if(messasge.find('notification').attr('event') == 'composing') {
											self.seewriter.writeText(from, messasge.find('notification').attr('text'));
											proc_body = false;
										}
									}
								}


								if(body.size() && proc_body) {
									var message = body.text();
									var item = {
										to: self.user.jid,
										from: from,
										time: Date.now(),
										message: message,
										id: id,
										see: false,
									}
									if(self.thread.jid == from) {
										item.see = true;
										$('#data').find('.write').before(self.convertToMessage(item));

										self.scrollingTo('bottom', '#data_scroll');
										setTimeout(function() {
											$('#data').find('.message_block.notshow').not(".write").removeClass('notshow').addClass('show');
										}, 333);

									} else {
										if($('.left_list_line[jid="'+from+'"]').size()) {

											self.upgradeUser(from, {
												cntmessage: +$('.left_list_line[jid="'+from+'"]').find('.message').text() + 1
											});
											self.leftItem(from);

										}
									}
									self.addToHistory(from, item, 'before');


									if(self.myDialogList.indexOf(from) == -1 && self.userList[from].groups.indexOf('operators') == -1) {
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
			//if(self.user.jid) { если вводить неверный логин и пароль, то хуня выходит
					$('.auth_form_form_f_1').removeClass('hide');
					$('.auth_form_form_f_2').addClass('hide');

					$('.auth_form_parent').removeClass('hide');
					$('#content').addClass('hide');
					$('.preloader').addClass('hide');

					$('.left_list_line').remove();
					$('.user_block_top').find('.user_block').addClass('hide');
					$('.user_block_top').find('.user_info').addClass('hide');
					$('.content_bottom_noopen_dialog').addClass('hide');
					$('.content_bottom_dialog').addClass('hide');
					$('.content_dialog').addClass('hide');
					$('.content_info').removeClass('hide');

					$('.top_menu').find('li[data="transfer"]').addClass('disabled');
					$('.top_menu').find('li[data="block"]').addClass('disabled');
					$('.top_menu').find('li[data="send_email"]').addClass('disabled');

					$('.property').addClass('hide');

					$('.dialog_window').remove();
					$('.wall').remove();

					var s = '';
					if(str) {
						s = '<div class="text error">'+str+'</div>';
						$('.auth_form_cont_text').html(s);
					}


					if(status == 2) {//ошибка авторазации
						$.cookie('pult_login', '');
						$.cookie('pult_password', '');
					}




					for(var key in self.delayFunc.redirect) {
						clearTimeout(self.delayFunc.redirect[key]);
					}
					for(var key in self.delayFunc.removeLeftItem) {
						clearTimeout(self.delayFunc.removeLeftItem[key]);
					}
					self.delayFunc = {
						redirect: {},
						removeLeftItem: {},
					};

					self.user.jid = '';
					self.thread.jid = '';
					self.myDialogList = [];
					self.myIgnoreList = [];


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

		this.setStatus = function(s, ignoreForm) {

			if(s == 'away') {

				if(window.configApp.prop.prop_closeThreadChangeStatus == 1) {
					if(self.myDialogList.length == 0) {
						self.socket.emit('message', {type: 'presence', status: s});
						$('.status_circle').parent().removeClass('on').addClass('off');
						self.user.status = s;

					} else {
						if(ignoreForm) {
							self.closeAllThread();

							self.socket.emit('message', {type: 'presence', status: s});
							$('.status_circle').parent().removeClass('on').addClass('off');
							self.user.status = s;

						} else {
							self.generateDialogWindow(false, 'closeAllDialogs');
						}
					}
				} else {
					self.socket.emit('message', {type: 'presence', status: s});
					$('.status_circle').parent().removeClass('on').addClass('off');
					self.user.status = s;
				}
			} else {
				self.socket.emit('message', {type: 'presence', status: s});
				$('.status_circle').parent().removeClass('off').addClass('on');
				self.user.status = s;
			}


        };




		this.actionThread = function(threadJid) {


			if (isNodeWebkit) {
				var win = gui.Window.get();
				win.show();
				win.focus();
			} else {
				window.focus();
			}

			self.thread.jid = threadJid;
			self.closeNotify(threadJid, ['newMessage','message']);



			$('.show_history').addClass('hide');
			//$('.client_info').addClass('hide');
			$('.content_bottom_noopen_dialog').addClass('hide');
			$('.content_bottom_dialog').removeClass('hide');



			//выбрать пункт меню слева
			$('.left_list_line.act').removeClass('act');
			$('.left_list_line[jid="'+threadJid+'"]').addClass('act');

			$('.content_left_block').hide();
			$('.content_left_block[data="'+ $('.left_list_line[jid="'+threadJid+'"]').parent().attr('data') +'"]').show();


			//загружаем блок сверху

			self.loadClientsInfo(threadJid);



			if($.inArray('operators', self.userList[threadJid].groups) != -1) {

				$('.user_block_top').find('.user_info').addClass('hide');

				$('.top_menu').find('li[data="transfer"]').addClass('disabled');
				$('.top_menu').find('li[data="block"]').addClass('disabled');
				$('.top_menu').find('li[data="send_email"]').addClass('disabled');

				$('.content_bottom').find('.file').addClass('hide');

				$('.user_block_top').find('.user_block').removeClass('hide');
				$('.user_block_top').find('.user_info').addClass('hide');

			} else if ($.inArray('clients', self.userList[threadJid].groups) != -1) {

				$('.user_block_top').find('.user_info').removeClass('hide');

				$('.content_bottom').find('.file').removeClass('hide');

				$('.user_block_top').find('.user_block').removeClass('hide');
				$('.user_block_top').find('.user_info').removeClass('hide');
			}


			//если юзер оффлайн, то ему нельзя писать
			if(Object.keys(self.userList[threadJid].resources).length == 0) {
				$('.content_bottom_dialog').addClass('hide');
			}


			//если это клиент
			if($.inArray('clients', self.userList[threadJid].groups) != -1) {

				var begin = null;
				var end = null;




				if(self.userList[threadJid].history.length > 0) {
					end = self.date(self.userList[threadJid].history[0].time - 3*1000);//костылек)
				}

				self.loadClientsHistoryInfo(function(data) {
					if(data.count > 0 && self.thread.jid == threadJid) {
						$('.show_history').removeClass('hide');
					}
				}, threadJid, begin, end);

				//если этот диалог клиента еще не принят
				if(self.myDialogList.indexOf(threadJid) == -1) {

					if(self.userList[threadJid].thread.statusDialog == 'open') {
						self.generateDialogEvent(threadJid, 'noopen');
					} else if(self.userList[threadJid].thread.statusDialog == 'close') {
						self.generateDialogEvent(threadJid, 'closethread');
					}

				} else {

					$('.top_menu').find('li[data="transfer"]').removeClass('disabled');
					$('.top_menu').find('li[data="block"]').removeClass('disabled');
					$('.top_menu').find('li[data="send_email"]').removeClass('disabled');

				}


			}







			/*
			Добавляются сообщения НЕТУДА!Ё!!!!! должны в конец, а они хуй!!!!!! да ещё и свтатус надо писать в self.thread - хотя хуй знает зачем
			*/


			var threadText = '';
			self.userList[self.thread.jid].history.forEach(function(item, i, arr) {
				threadText += self.convertToMessage(item);
			});
			var item = {
				from: threadJid,
				message: '',
				mtype: 'write',
			}
			threadText +=self.convertToMessage(item);
			$('#data').html(threadText);


			self.upgradeUser(threadJid, {
				cntmessage: 0
			});
			self.leftItem(threadJid);

			$('.content_info').addClass('hide');
			$('.content_dialog').removeClass('hide');

			setTimeout(function() {
				$('#data').find('.message_block.notshow').not(".write").removeClass('notshow').addClass('show');
				self.scrollingTo('bottom', '#data_scroll');;
			}, 333);

			self.resizeThread();
        };


		this.sendMessageThread = function() {
			if($('.content_bottom_textarea').find('#msgwnd').attr('disabled') != 'disabled' && !$('.content_bottom_dialog').find('.send').hasClass('disabled')) {
				$('.content_bottom_textarea').find('#msgwnd').attr('disabled', 'disabled');

				var text = self.convertTextForElToXmpp($('.content_bottom_textarea').find('#msgwnd'));

				self.sendMessageJid(self.thread.jid, text);

				$('.content_bottom_textarea').find('#msgwnd').html('').removeAttr("disabled").focus();
				$('.content_bottom_dialog').find('.send').addClass('disabled');

					if(typeof self.seewriter.delay[self.thread.jid] != undefined) {
						clearTimeout(self.seewriter.delay[self.thread.jid]);
					}
					self.seewriter.send(self.thread.jid, 'inactive');

			}
        };




		this.convertTextForElToXmpp = function(el) {
			for(var key in self.smiles) {
				el.find('.smile[data="'+key+'"]').replaceWith(self.smiles[key][0]);
			}
			return el.html();
		}
		this.convertTextForWeb = function(text) {
			$.each(self.smiles, function(key, value) {
				text = text.split(value[0]).join(value[1]);
			});
			return text;
		}

















		this.sendMessageJid = function(jid, text) {


				//text

				var item = {
					to: jid,
					from: self.user.jid,
					time: Date.now(),
					message: text,
					id: self.messageId(),
					see: true
				}
				self.sendMessage(item);
				self.addToHistory(jid, item, 'before');

				if(jid == self.thread.jid) {
					$('#data').find('.write').before(self.convertToMessage(item));

					setTimeout(function() {
						$('#data').find('.message_block.notshow').not(".write").removeClass('notshow').addClass('show');
						self.scrollingTo('bottom', '#data_scroll');;
					}, 333);
				}
		}



		this.convertDate = function(dt, type) {
			var dateStr = '';
			var d_now = new Date();
			var curr_now_date = d_now.getDate();
			var curr_now_month = d_now.getMonth();
			var curr_now_year = d_now.getFullYear();

			var d = new Date(dt);
			var curr_date = d.getDate();
			var curr_month = d.getMonth();
			var curr_year = d.getFullYear();
			if((curr_now_date!=curr_date || curr_now_month!=curr_month || curr_now_year!=curr_year) && type != 'min') {
				dateStr += self.coorect0(curr_date) + '.' + self.coorect0(curr_month) + '.' + curr_year + ' ';
			};
			dateStr += self.coorect0(d.getHours()) + ':' + self.coorect0(d.getMinutes());

			return dateStr;
		};

		this.convertToMessage = function(obj) {
			var dateStr = '';
			var mtype = '';
			if(obj.mtype) {
				mtype = obj.mtype;
			}
			if(obj.time) {
				dateStr = self.convertDate(obj.time);
			};

			obj.message = self.reconvert_link(obj.message);

			var str = '';
			str = '<div class="message_block clr notshow '+mtype+' '+ ((obj.from != self.user.jid)?'me':'') +'" data="'+obj.id+'">'+
					'<div class="message_block_ugol">'+
						( (obj.from != self.user.jid) ? '<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="11px" height="12px" version="1.1" style="display:block;shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd" viewBox="0 0 3 3" xmlns:xlink="http://www.w3.org/1999/xlink"><g id="x0020_1"><path d="M1 0c1,1 1,2 2,3 -1,0 -2,0 -3,0 1,-1 1,-2 1,-3z"></path></g></svg>' : '<svg xmlns="http://www.w3.org/2000/svg" xml:space="preserve" width="13px" height="10px" version="1.1" style="display:block;shape-rendering:geometricPrecision; text-rendering:geometricPrecision; image-rendering:optimizeQuality; fill-rule:evenodd; clip-rule:evenodd" viewBox="0 0 5 4" xmlns:xlink="http://www.w3.org/1999/xlink"><g id="x0020_1"><path d="M0 0c1,0 2,0 3,0 0,2 0,3 2,4 -3,0 -3,0 -5,-1 0,-1 0,-2 0,-3z"></path></g></svg>' )+
					'</div>'+
					'<div class="message_block_text">'+
						'<div class="message_block_text_t">'+obj.message+'</div>'+
					'</div>'+
					'<div class="message_block_time">'+dateStr+'</div>'+
				  '</div>'+
				  '<div class="clr"></div>';

			return str;
        };









		this.upgradeList = function(roster) {



				if (Object.keys(roster).length != 0) {
					self.roster = roster;


					var jidList = [];


							for (var key in roster) {
								if(roster[key].jid) {





										self.upgradeUser(roster[key].jid, {
											groups: roster[key].groups,
											subscription: roster[key].subscription,
											name: roster[key].name ? roster[key].name : roster[key].jid,
										});
										if(self.userList[key].thread.client_name != '') {
											self.upgradeUser(roster[key].jid, {
												name: self.userList[key].thread.client_name
											});
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

										self.upgradeUser(roster[key].jid, {
											status: stat,
											resources: roster[key].resources,
										});




										if($.inArray('operators', roster[key].groups) != -1) {
											if(!$('.content_left_block[data="operators"]').find('div[jid="'+roster[key].jid+'"]').size()) {

												var cntmessage = 0;
												self.userList[roster[key].jid].history.forEach(function(item, i, arr) {
													if(item.see == false) {
														cntmessage++;
													}
												});

												self.upgradeUser(roster[key].jid, {
													cntmessage: cntmessage,
													yes_close: false
												});

											}
											self.leftItem(roster[key].jid);
										}

										if($.inArray('clients', roster[key].groups) != -1) {

											self.leftItem(roster[key].jid)

										}



										if(roster[key].subscription == 'both') {
											jidList.push(roster[key].jid);
										}





								}
							}



							$('.content_left_block[data="operators"]').find('.left_list_line').each(function() {
								if(jidList.indexOf($(this).attr('jid')) == -1) {
									$(this).remove();
									if(self.thread.jid == $(this).attr('jid')) {
										$('.content_bottom_dialog').addClass('hide');
									}
								}
							});
							$('content_left_block[data="clients"]').find('.left_list_line').each(function() {
								if(jidList.indexOf($(this).attr('jid')) == -1) {
									//$(this).remove();
								}
							});
							//self.resizeThread();

			}
        };



		this.getColorUser = function() {
			var a = ['orange','blue','violet','red','green'];
			return a[Math.floor(Math.random()*a.length)];
		}

		this.upgradeUser = function(jid, data) {

			if(self.userList[jid] == undefined) {
				self.userList[jid] = {
					jid: jid,
					groups: [],
					status: 'off',
					color: self.getColorUser(),
					lastTimeMessage: '',
					lastMessage: '',
					cntmessage: 0,
					yes_close: false,
					write: {
						status: 'inactive',
						text: '',
						time: 0
					},
					thread: {
						statusDialog: '',
						client_name: '',
						threadId: 0,
						site: '',
						page: '',
						source: '',
						location: '',
						provider: '',
						organization: '',
						address: '',
						browser: '',
						visits: '',
						dialogs: '',
						scan_pages: ''
					},
					subscription: '',
					resources: {},
					name: jid,
					history: [],
				};
			}


			if(data) {

				if(typeof data.name != 'undefined') {
					self.userList[jid].name = data.name;
				}

				if(typeof data.groups != 'undefined') {
					self.userList[jid].groups = data.groups;
				}
				if(typeof data.status != 'undefined') {
					self.userList[jid].status = data.status;
				}
				if(typeof data.lastTimeMessage != 'undefined') {
					self.userList[jid].lastTimeMessage = data.lastTimeMessage;
				}
				if(typeof data.lastMessage != 'undefined') {
					self.userList[jid].lastMessage = data.lastMessage;
				}
				if(typeof data.cntmessage != 'undefined') {
					self.userList[jid].cntmessage = data.cntmessage;
				}
				if(typeof data.yes_close != 'undefined') {
					self.userList[jid].yes_close = data.yes_close;
				}
				if(typeof data.subscription != 'undefined') {
					self.userList[jid].subscription = data.subscription;
				}
				if(typeof data.resources != 'undefined') {
					self.userList[jid].resources = data.resources;
				}

				if(typeof data.write != 'undefined') {
					if(typeof data.write.status != 'undefined') {
						self.userList[jid].write.status = data.write.status;
					}
					if(typeof data.write.text != 'undefined') {
						self.userList[jid].write.text = data.write.text;
					}
					if(typeof data.write.time != 'undefined') {
						self.userList[jid].write.time = data.write.time;
					}
				}

				if(typeof data.thread != 'undefined') {
					if(typeof data.thread.statusDialog != 'undefined') {
						self.userList[jid].thread.statusDialog = data.thread.statusDialog;
					}
					if(typeof data.thread.client_name != 'undefined') {
						self.userList[jid].thread.client_name = data.thread.client_name;
					}
					if(typeof data.thread.threadId != 'undefined') {
						self.userList[jid].thread.threadId = data.thread.threadId;
					}
					if(typeof data.thread.site != 'undefined') {
						self.userList[jid].thread.site = data.thread.site;
					}
					if(typeof data.thread.page != 'undefined') {
						self.userList[jid].thread.page = data.thread.page;
					}
					if(typeof data.thread.source != 'undefined') {
						self.userList[jid].thread.source = data.thread.source;
					}
					if(typeof data.thread.location != 'undefined') {
						self.userList[jid].thread.location = data.thread.location;
					}
					if(typeof data.thread.provider != 'undefined') {
						self.userList[jid].thread.provider = data.thread.provider;
					}
					if(typeof data.thread.organization != 'undefined') {
						self.userList[jid].thread.organization = data.thread.organization;
					}
					if(typeof data.thread.address != 'undefined') {
						self.userList[jid].thread.address = data.thread.address;
					}
					if(typeof data.thread.browser != 'undefined') {
						self.userList[jid].thread.browser = data.thread.browser;
					}
					if(typeof data.thread.visits != 'undefined') {
						self.userList[jid].thread.visits = data.thread.visits;
					}
					if(typeof data.thread.dialogs != 'undefined') {
						self.userList[jid].thread.dialogs = data.thread.dialogs;
					}
					if(typeof data.thread.scan_pages != 'undefined') {
						self.userList[jid].thread.scan_pages = data.thread.scan_pages;
					}
				}
			}

		}





		this.leftItem = function(jid) {


				var user = self.userList[jid];



				var block = '';
				if($.inArray('operators', user.groups) != -1) {
					block = 'operators';
				} else if($.inArray('clients', user.groups) != -1) {
					block = 'clients';
				}

				if(block == 'operators' || (block == 'clients' && user.thread.statusDialog == 'open' && user.subscription == 'both')) {

				if(!$('.left_list_line[jid="'+jid+'"]').size()) {

					$('.content_left_block[data="'+block+'"]').append('<div class="left_list_line" jid="'+jid+'">'+
																		'<div class="user_block clr">'+
																			'<div class="left">'+
																				'<div class="avatar '+user.color+'"></div>'+
																				'<div class="status off"></div>'+
																			'</div>'+
																			'<div class="center">'+
																				'<div class="name">'+ user.name +'</div>'+
																				'<div class="text"></div>'+
																				'<div class="write hide">'+window.langClever.lang[window.configApp.local].write+'</div>'+
																			'</div>'+
																			'<div class="right">'+
																				'<div class="date"></div>'+
																				'<div class="message '+ ( (user.cntmessage==0) ? 'hide' : '' ) +'">'+ user.cntmessage +'</div>'+
																				'<div class="close '+ ( (!user.yes_close || user.cntmessage!=0) ? 'hide' : '' ) +'"></div>'+
																			'</div>'+
																		'</div>'+
																	'</div>'
																	);


					self.delayFunc.removeLeftItem[jid] != 'undefined' ? clearTimeout(self.delayFunc.removeLeftItem[jid]) : '';

				} else {

					//так же, если при передачи открыт список, там тоже надо статус менять
					if(user.status == 'on') {
						$('.left_list_line[jid="'+jid+'"]').find('.status').addClass('on').removeClass('off away');
						$('.dialog_window').find('.operator_give_list').find('.operator_give_list_line[data="'+jid+'"]').find('operator_give_list_status').addClass('on').removeClass('off away');
					} else if(user.status == 'off') {
						$('.left_list_line[jid="'+jid+'"]').find('.status').addClass('off').removeClass('on away');
						$('.dialog_window').find('.operator_give_list').find('.operator_give_list_line[data="'+jid+'"]').find('operator_give_list_status').addClass('off').removeClass('on away');
					} else if(user.status == 'away') {
						$('.left_list_line[jid="'+jid+'"]').find('.status').addClass('away').removeClass('on off');
						$('.dialog_window').find('.operator_give_list').find('.operator_give_list_line[data="'+jid+'"]').find('operator_give_list_status').addClass('away').removeClass('on off');
					}






					if(!user.yes_close) {
						$('.left_list_line[jid="'+jid+'"]').find('.close').addClass('hide');
					}
					if(user.cntmessage == 0) {
						$('.left_list_line[jid="'+jid+'"]').find('.message').addClass('hide').html(0);
						if(user.yes_close) {
							$('.left_list_line[jid="'+jid+'"]').find('.close').removeClass('hide');
						}
					} else {
						$('.left_list_line[jid="'+jid+'"]').find('.message').removeClass('hide').html(user.cntmessage);
						$('.left_list_line[jid="'+jid+'"]').find('.close').addClass('hide');
					}

					$('.left_list_line[jid="'+jid+'"]').find('.date').html(user.lastTimeMessage);

					if(user.write.status == 'active') {
						$('.left_list_line[jid="'+jid+'"]').find('.write').addClass('hide').removeClass('composing paused inactive').addClass('active');
						$('.left_list_line[jid="'+jid+'"]').find('.text').removeClass('hide').html(user.lastMessage);
					} else if(user.write.status == 'composing') {
						$('.left_list_line[jid="'+jid+'"]').find('.write').removeClass('hide inactive active paused').addClass('composing');
						$('.left_list_line[jid="'+jid+'"]').find('.text').addClass('hide');
					} else if(user.write.status == 'paused') {
						$('.left_list_line[jid="'+jid+'"]').find('.write').removeClass('hide inactive active composing').addClass('paused');
						$('.left_list_line[jid="'+jid+'"]').find('.text').addClass('hide');
					} else if(user.write.status == 'inactive') {
						$('.left_list_line[jid="'+jid+'"]').find('.write').addClass('hide').removeClass('active paused composing').addClass('inactive');
						$('.left_list_line[jid="'+jid+'"]').find('.text').removeClass('hide').html(user.lastMessage);
					}


				}

			}
		}





		this.loadHistory = function(jid) {
			if(jid == self.thread.jid) {

				var copy = self.userList[jid].history.slice(0);
				while(copy.length) {
					var item = copy.pop();
					if(!$('#data').find('.message_block[data="'+item.id+'"]').size()) {
						$('#data').prepend(self.convertToMessage(item));
					}
				}



				setTimeout(function() {
					$('#data').find('.message_block.notshow').not(".write").removeClass('notshow').addClass('show');
					self.scrollingTo('bottom', '#data_scroll');;
				}, 333);
			}
        };
		this.addToHistory = function(jid, item, where) {

			var doublevar = false;
			if(self.userList[jid].history == undefined) {
				self.userList[jid].history= [];
			}

			for (var i = 0; i < self.userList[jid].history.length ; i++){
				if(self.userList[jid].history[i].id == item.id) {
					doublevar = true;
				}
			}

			if(!doublevar) {

				item.message = self.convertTextForWeb(item.message);

				if(where == 'back') {//вставка в начало

					if(self.userList[jid].history.length == 0) {
						self.upgradeUser(jid, {
							lastTimeMessage: self.convertDate(item.time, 'min'),
							lastMessage: item.message
						});
						self.leftItem(jid);
					}

					self.userList[jid].history.unshift(item);

				} else if(where == 'before'){//вставка в конец


					self.upgradeUser(jid, {
						lastTimeMessage: self.convertDate(item.time, 'min'),
						lastMessage: item.message
					});
					self.leftItem(jid);

					self.userList[jid].history.push(item);

				}
			}
        };



		this.generateClientsDataForXml = function(data, threadId, statusDialog) {
			var o = {};

			if(typeof data != 'undefined') {

				o.client_name = data.find('client_name').text();
				o.site = data.find('site').text();
				o.page = data.find('page').text();
				o.source = data.find('source').text();
				o.location = data.find('location').text();
				o.provider = data.find('provider').text();
				o.organization = data.find('organization').text();
				o.address = data.find('address').text();
				o.browser = data.find('browser').text();
				o.visits = data.find('visits').text();
				o.dialogs = data.find('dialogs').text();
				o.scan_pages = data.find('scan_pages').text();

			}

			if(typeof threadId != 'undefined') {
				o.threadId = threadId;
			}

			if(typeof statusDialog != 'undefined') {
				o.statusDialog = statusDialog;
			}

			return o;
		}



		this.loadClients = function(callback) {

			$.ajax({
				type: "POST",
				url: "https://cleversite.ru/cleversite/system/send_data.php",
				data: {from: self.user.jid, xmlns: 'cleversite:data:dialogs', localTime: self.date(null, true), id: Date.now()},
				dataType: 'xml',
				success: function(data){



					$(data).find('message').find('data[xmlns="cleversite:data:dialogs:opened"]').find('message').each(function() {
						//добавляем клиента в список тех, с кем наш оператор ведёт диалог
						self.myDialogList.push($(this).attr('from'));

						self.upgradeUser($(this).attr('from'), {
							thread: self.generateClientsDataForXml($(this).find('data[xmlns="cleversite:data:client"]'), $(this).find('thread').text(), 'open'),
							yes_close: true,
							name: $(this).find('client_name').text()
						});

						self.leftItem($(this).attr('from'));

						self.loadClientsHistory(null, $(this).attr('from'), null, null, $(this).find('thread').text());




					});
					$(data).find('message').find('data[xmlns="cleversite:data:dialogs:new"]').find('message').each(function() {

						self.upgradeUser($(this).attr('from'), {
							thread: self.generateClientsDataForXml($(this).find('data[xmlns="cleversite:data:client"]'), $(this).find('thread').text(),  'open'),
							yes_close: false,
							name: $(this).find('client_name').text()
						});

						self.leftItem($(this).attr('from'));

						self.loadClientsHistory(null, $(this).attr('from'), null, null, $(this).find('thread').text());

					});

					if(callback) {
						callback();
					}
				}
			});
        };





		self.loadClientsInfo = function(jid) {

			$('.user_block_top').find('.user_block').find('.avatar');
			$('.user_block_top').find('.user_block').find('.name').html(self.userList[jid].name);


			if(self.userList[jid].thread.threadId) {

				$('.import[data="client_name"]').val(self.userList[jid].name);
				$('.import[data="site"]').html(self.filterSite(self.userList[jid].thread.site));

				$('.import[data="begin"]').html('<a target="_blank" href="'+self.userList[jid].thread.site+'">'+self.userList[jid].thread.page+'</a>');
				$('.import[data="source"]').html(self.userList[jid].thread.source);
				$('.import[data="location"]').html(self.userList[jid].thread.location);
				$('.import[data="address"]').html(self.userList[jid].thread.address);
				$('.import[data="provider"]').html(self.userList[jid].thread.provider);
				$('.import[data="browser"]').html(self.userList[jid].thread.browser);
				$('.import[data="visits"]').html(self.userList[jid].thread.visits);
				$('.import[data="dialogs"]').html(self.userList[jid].thread.dialogs);
				$('.import[data="scan_pages"]').html(self.userList[jid].thread.scan_pages);

				$('.content_middle_text_name').html(self.userList[jid].thread.client_name);

				$('.user_block_top').find('.user_info').find('.text').html(
					self.userList[jid].name + ' ' + '<b>'+self.filterSite(self.userList[jid].thread.site)+'</b>' + '<br/>' +
					window.langClever.lang[window.configApp.local].user_info_top.visits + self.userList[jid].thread.visits + window.langClever.lang[window.configApp.local].user_info_top.countPage +self.userList[jid].thread.scan_pages
				);

			}

		}





		//запрос информации об истории
		this.loadClientsHistoryInfo = function(callback, jid, begin, end, dialog_id) {
			var d = {
				from: self.user.jid,
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
				from: self.user.jid,
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
								body: self.userList[jid].thread.threadId,
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
			if(self.thread.jid == jid) {
				$('.content_bottom_dialog').removeClass('hide');
				$('.content_bottom_noopen_dialog').addClass('hide');

				$('.top_menu').find('li[data="transfer"]').removeClass('disabled');
				$('.top_menu').find('li[data="block"]').removeClass('disabled');
				$('.top_menu').find('li[data="send_email"]').removeClass('disabled');
			}


			self.upgradeUser(jid, {
				yes_close: true
			});
			self.leftItem(jid);

		}


		this.closeAllThread = function() {
			self.myDialogList.forEach(function(item, i, arr) {
				self.closeThread(item, true);
			});
		};



		this.closeThread = function(jid, send) {

			self.seewriter.writeStatus(jid, 'inactive');
			self.upgradeUser(jid, {
				yes_close: false,
				thread: {
					statusDialog: 'close'
				}
			});
			self.leftItem(jid);



			if(self.thread.jid == jid) {
				$('.content_bottom_dialog').addClass('hide');
				$('.content_bottom_noopen_dialog').removeClass('hide');

				$('.top_menu').find('li[data="transfer"]').addClass('disabled');
				$('.top_menu').find('li[data="block"]').addClass('disabled');
				$('.top_menu').find('li[data="send_email"]').addClass('disabled');

				$('.user_block_top').find('.user_block').addClass('hide');
				$('.user_block_top').find('.user_info').addClass('hide');

				self.generateDialogEvent(jid, 'closethread');
			}

			self.closeNotify(jid, ['message', 'newMessage', 'noIgnore', 'redirect', 'redirectCancel']);



			var myDialogNumber = self.myDialogList.indexOf(jid);
			if(myDialogNumber == -1) {
				self.removeClient(jid);
			} else {
				self.myDialogList.splice(self.myDialogList.indexOf(jid), 1);

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
										body: self.userList[jid].thread.threadId,
									}
								}
							}
						}
					});

				} else {


					self.delayFunc.removeLeftItem[jid] = setTimeout(function() {
						if(self.userList[jid].thread.statusDialog == 'close') {
							self.removeClient(jid);
						}
					}, 1000*60*5);

				}


			}



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
									body: self.userList[jid].thread.threadId,
								}
							}
						}
					}
				});


			if(self.thread.jid == jid) {
				$('.content_bottom_noopen_dialog').addClass('hide');
			}

			self.closeNotify(jid, ['newMessage', 'message']);

		}
		this.removeClient = function(jid) {
			if($('.left_list_line[jid="'+jid+'"]').size()) {
				$('.left_list_line[jid="'+jid+'"]').remove();
			}
			if(self.thread.jid == jid) {
				$('.content_info').removeClass('hide');
				$('.content_dialog').addClass('hide');
				self.thread.jid = false;
			}
		}




		this.generateSound = function(jid, numberSound, ignore) {
			if(!$('#sound').size()) {
				$('body').append('<div id="sound"></div>');
			}
			var filename = 'notify_1';
			var typeSound = '';
			var enableSound = true;

			if(jid) {
				if(self.userList[jid].groups.indexOf('operators') != -1) {
					typeSound = 'operator';
					filename = 'notify_'+window.configApp.prop.prop_soundOperator_file;
				}
				if(self.userList[jid].groups.indexOf('clients') != -1) {
					typeSound = 'clients';
					filename = 'notify_'+window.configApp.prop.prop_enableSound;
				}
			}
			if(numberSound) {
				if(numberSound == 1) {
					filename = 'notify_1';
				}
				if(numberSound == 2) {
					filename = 'notify_2';
				}
				if(numberSound == 3) {
					filename = 'notify_3';
				}
			}



			if(window.configApp.prop.prop_enableSound == 0) {
				enableSound = false;
			}

			if(window.configApp.prop.prop_enableSound == 0 && typeSound == 'clients') {
				enableSound = false;
			}

			if(window.configApp.prop.prop_soundOperator_file == 0 && typeSound == 'operator') {
				enableSound = false;
			}

			if(ignore) {
				enableSound = true;
			}

			if(numberSound) {
				if(numberSound == 0) {
					enableSound = false;
				}
			}


			if(enableSound) {
				$("#sound").html('<audio autoplay="autoplay"><source src="sound/'+filename+'.mp3" type="audio/mpeg" /><source src="sound/'+filename+'.ogg" type="audio/ogg" /><embed hidden="true" autostart="true" loop="false" src="sound/'+filename+'.mp3" /></audio>');
			}


		}


		this.generateNotifyHtml5 = function(jid, title, text) {
			if(typeof Notification != 'undefined') {
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


		this.closeNotify = function(jid, type) {






				if(isNodeWebkit) {

					type.forEach(function(item, i, arr) {

						if(typeof self.notifyList[item][jid] != 'undefined') {
							self.notifyList[item][jid].close(function() {
								delete self.notifyList[item][jid];
							});
						}
					});

				} else {

					type.forEach(function(item, i, arr) {

						if(typeof self.notifyList[item][jid] != 'undefined') {
							self.notifyList[item][jid].block.remove();
							delete self.notifyList[item][jid];
						}
					});

					//$('.notifylist').find('.notify[data-jid="'+jid+'"]').remove();

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
			var user = self.userList[jid];



			var showNotify = true;
			var showMainNotify = true;
			var showHtmlNotify = true;
			var showTitleNotify = true;


			if(user.thread.statusDialog == 'close') {
				showNotify = false;
			}


			if(jid == self.thread.jid && self.windowStatus == 'show') {
				showMainNotify = false;
				showHtmlNotify = false;
			}
			if(jid == self.thread.jid && self.windowStatus == 'hide') {
				//showMainNotify = false;
			}
			if(jid != self.thread.jid && self.windowStatus == 'hide') {

			}
			if(jid != self.thread.jid && self.windowStatus == 'show') {
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



			if(showNotify) {

				if(type == 'newDialog') {

					if(showMainNotify) {
						if(isNodeWebkit) {
							if(typeof self.notifyList.newMessage[jid] == 'undefined') {



									var notify = sergDesctop.add(
									{
										width:500,
										height:260,
										htmlBody: '<div id="notification" class="notifylist notifyDesctop">'+
											'<div class="notify new" data-jid="'+jid+'"><div class="name">'+window.langClever.lang[window.configApp.local].notify.newDialog+'</div><div class="text_top">'+user.name+'</div><div class="text"><textarea>'+a+'</textarea></div><div class="btns"><button class="chat btn submit" onclick="window.emit(\'chat.click\')">'+window.langClever.lang[window.configApp.local].notify.answer+'</button><button class="answer btn gray_sv" onclick="window.emit(\'answer.click\')">'+window.langClever.lang[window.configApp.local].notify.answerFast+'</button><button class="ignore btn cancel" onclick="window.emit(\'ignore.click\')">'+window.langClever.lang[window.configApp.local].notify.ignore+'</button></div></div>'+
										'</div>'
									},
									function() {
										notify.show();

										notify.on('chat.click', function() {
											if(!$(self.notifyList.newMessage[jid].win.window.document.body).find('.fastanswer_block').size()) {
												self.acceptDialogSend(jid);
												self.closeNotify(jid, ['newMessage']);
												self.actionThread(jid);
											} else {
												self.sendMessageJid(jid, $(self.notifyList.newMessage[jid].win.window.document.body).find('.fastanswer_block').find('textarea').val());
												self.closeNotify(jid, ['newMessage']);
												self.actionThread(jid);
											}
										});
										notify.on('answer.click', function() {
											self.acceptDialogSend(jid);
											self.genereteFastAnswerForm(jid, self.notifyList.newMessage[jid].win);
										});
										notify.on('ignore.click', function() {
											self.ignoreDialog(jid);
										});


										self.notifyList.newMessage[jid] = notify;

									}
								);



							} else {
								self.notifyList.newMessage[jid].addText(a);
							}




						} else {





							if(typeof self.notifyList.newMessage[jid] == 'undefined') {

								var notify = {
									block: $('<div class="notify new" data-jid="'+jid+'"><div class="name">'+window.langClever.lang[window.configApp.local].notify.newDialog+'</div><div class="text_top">'+user.name+'</div><div class="text"><textarea>'+a+'</textarea></div><div class="btns"><button class="chat btn submit">'+window.langClever.lang[window.configApp.local].notify.answer+'</button><button class="answer btn gray_sv">'+window.langClever.lang[window.configApp.local].notify.answerFast+'</button><button class="ignore btn cancel">'+window.langClever.lang[window.configApp.local].notify.ignore+'</button></div></div>')
								}

								$('.notifylist').append(notify.block);

								notify.block.find('.chat').on('click', function() {
									if(!notify.block.find('.fastanswer_block').size()) {
										self.acceptDialogSend(jid);
										self.closeNotify(jid, ['newMessage']);
										self.actionThread(jid);
									} else {
										self.sendMessageJid(jid, notify.block.find('.fastanswer_block').find('textarea').val());
										self.closeNotify(jid, ['newMessage']);
										self.actionThread(jid);
									}
								});
								notify.block.find('.answer').on('click', function() {
									self.acceptDialogSend(jid);
									self.genereteFastAnswerForm(jid, notify.block);
								});
								notify.block.find('.ignore').on('click', function() {
									self.ignoreDialog(jid);
								});

								self.notifyList.newMessage[jid] = notify;

							} else {

								self.notifyList.newMessage[jid].block.find('.text').find('textarea').append("\n\r" + a);

							}
						}
					}

					if(showHtmlNotify) {
						self.generateNotifyHtml5(jid, window.langClever.lang[window.configApp.local].notify.newDialog, a);
					}
					if(showTitleNotify) {
						self.generateNotifyTitle(jid, window.langClever.lang[window.configApp.local].notify.newDialog);
					}
				}






				if(type == 'messageDialog') {
					if(showMainNotify) {
						if(isNodeWebkit) {

							if(typeof self.notifyList.message[jid]== 'undefined') {

								var notify = sergDesctop.add(
									{
										width:500,
										height:235,
										htmlBody: '<div id="notification" class="notifylist notifyDesctop">'+
											'<div class="notify" data-jid="'+jid+'"><div class="name">'+user.name+'</div><div class="text"><textarea>'+a+'</textarea></div><div class="btns"><button onclick="window.emit(\'chat.click\')" class="chat btn submit">'+window.langClever.lang[window.configApp.local].notify.chat+'</button><button class="answer btn gray_sv" onclick="window.emit(\'answer.click\')">'+window.langClever.lang[window.configApp.local].notify.answerFast+'</button><button class="ignore btn cancel" onclick="window.emit(\'ignore.click\')">'+window.langClever.lang[window.configApp.local].notify.ignore+'</button></div></div>'+
										'</div>'
									},
									function() {
										notify.show();

										notify.on('chat.click', function() {
											if(!$(self.notifyList.message[jid].win.window.document.body).find('.fastanswer_block').size()) {
												self.closeNotify(jid, ['message']);
												self.actionThread(jid);
											} else {
												self.sendMessageJid(jid, $(self.notifyList.message[jid].win.window.document.body).find('.fastanswer_block').find('textarea').val());
												self.closeNotify(jid, ['message']);
												self.actionThread(jid);
											}
										});
										notify.on('answer.click', function() {
											self.genereteFastAnswerForm(jid, self.notifyList.message[jid].win);
										});
										notify.on('ignore.click', function() {
											self.closeNotify(jid, ['message']);
										});

									}
								);
								self.notifyList.message[jid] = notify;


							} else {
								self.notifyList.message[jid].addText(a);
							}

						} else {

							if(typeof self.notifyList.message[jid] == 'undefined') {

								var notify = {
									block: $('<div class="notify" data-jid="'+jid+'"><div class="name">'+user.name+'</div><div class="text"><textarea>'+a+'</textarea></div><div class="btns"><button class="chat btn submit">'+window.langClever.lang[window.configApp.local].notify.chat+'</button><button class="answer btn gray_sv">'+window.langClever.lang[window.configApp.local].notify.answerFast+'</button><button class="ignore btn cancel">'+window.langClever.lang[window.configApp.local].notify.ignore+'</button></div></div>')
								}

								$('.notifylist').append(notify.block);

								notify.block.find('.chat').on('click', function() {
									if(!notify.block.find('.fastanswer_block').size()) {
										self.closeNotify(jid, ['message']);
										self.actionThread(jid);
									} else {
										self.sendMessageJid(jid, notify.block.find('.fastanswer_block').find('textarea').val());
										self.closeNotify(jid, ['message']);
										self.actionThread(jid);
									}
								});
								notify.block.find('.answer').on('click', function() {
									self.genereteFastAnswerForm(jid, notify.block);
								});
								notify.block.find('.ignore').on('click', function() {
									self.closeNotify(jid, ['message']);
								});

								self.notifyList.message[jid] = notify;

							} else {
								self.notifyList.message[jid].block.find('.text').find('textarea').append("\n\r"+a);
							}
						}
					}

					if(showHtmlNotify) {
						self.generateNotifyHtml5(jid, window.langClever.lang[window.configApp.local].notify.newMessage, a);
					}
					if(showTitleNotify) {
						self.generateNotifyTitle(jid, window.langClever.lang[window.configApp.local].notify.newMessage);
					}
				}



				if(type == 'noIgnore') {
					if(showMainNotify) {
						if(isNodeWebkit) {

							if(typeof self.notifyList.noIgnore[jid] == 'undefined') {

								var notify = sergDesctop.add(
									{
										width:500,
										height:185,
										htmlBody: '<div id="notification" class="notifylist notifyDesctop">'+
											'<div class="notify noignore" data-jid="'+jid+'"><div class="name">'+user.name+'</div><div class="text">'+window.langClever.lang[window.configApp.local].notify.noIgnore+'</div><div class="btns"><button class="chat btn submit" onclick="window.emit(\'chat.click\')">'+window.langClever.lang[window.configApp.local].notify.chat+'</button><button class="answer btn gray_sv" onclick="window.emit(\'answer.click\')">'+window.langClever.lang[window.configApp.local].notify.answerFast+'</button></div></div>'+
										'</div>'
									},
									function() {
										notify.show();

										notify.on('chat.click', function() {
											if(!$(self.notifyList.noIgnore[jid].win.window.document.body).find('.fastanswer_block').size()) {
												self.acceptDialogSend(jid);
												self.closeNotify(jid, ['noIgnore']);
												self.actionThread(jid);
											} else {
												self.sendMessageJid(jid, $(self.notifyList.noIgnore[jid].win.window.document.body).find('.fastanswer_block').find('textarea').val());
												self.closeNotify(jid, ['noIgnore']);
											}
										});
										notify.on('answer.click', function() {
											self.genereteFastAnswerForm(jid, self.notifyList.noIgnore[jid].win);
										});

									}
								);
								self.notifyList.noIgnore[jid] = notify;


							} else {
								self.notifyList.noIgnore[jid].addText(a);
							}

						} else {


							if(typeof self.notifyList.noIgnore[jid] == 'undefined') {

								var notify = {
									block: $('<div class="notify noignore" data-jid="'+jid+'"><div class="name">'+user.name+'</div><div class="text">'+window.langClever.lang[window.configApp.local].notify.noIgnore+'</div><div class="btns"><button class="chat btn submit">'+window.langClever.lang[window.configApp.local].notify.chat+'</button><button class="answer btn gray_sv">'+window.langClever.lang[window.configApp.local].notify.answerFast+'</button></div></div>')
								}
								$('.notifylist').append(notify.block);

								notify.block.find('.chat').on('click', function() {
									if(!notify.block.find('.fastanswer_block').size()) {
										self.acceptDialogSend(jid);
										self.closeNotify(jid, ['noIgnore']);
										self.actionThread(jid);
									} else {
										self.sendMessageJid(jid, notify.block.find('.fastanswer_block').find('textarea').val());
										self.closeNotify(jid, ['noIgnore']);
										self.actionThread(jid);
									}
								});

								notify.block.find('.answer').on('click', function() {
									self.genereteFastAnswerForm(jid, notify.block);
								});

								self.notifyList.noIgnore[jid] = notify;

							} else {

								self.notifyList.noIgnore[jid].block.find('.text').find('textarea').append("\n\r" + a );

							}
						}
					}

					if(showHtmlNotify) {
						self.generateNotifyHtml5(jid, window.langClever.lang[window.configApp.local].notify.newMessage, a);
					}
					if(showTitleNotify) {
						self.generateNotifyTitle(jid, window.langClever.lang[window.configApp.local].notify.newMessage);
					}
				}



				if(type == 'redirect_me') {
					if(showMainNotify) {
						self.closeNotify(jid, ['redirect']);

						if(isNodeWebkit) {


									var notify = sergDesctop.add(
									{
										width:500,
										height:235,
										htmlBody: '<div id="notification" class="notifylist notifyDesctop">'+
											'<div class="notify" data-jid="'+jid+'"><div class="name">'+window.langClever.lang[window.configApp.local].notify.redirect+'</div><div class="text"><b>'+window.langClever.lang[window.configApp.local].notify.redirectOper+'</b> '+user.name+'<br/><b>'+window.langClever.lang[window.configApp.local].notify.redirectClient+'</b> '+self.userList[a.contact].name+'<br/><br/><div class="commentRedirect"><b>'+window.langClever.lang[window.configApp.local].notify.comment+'</b>:<br/>'+a.comment+'</div></div><div class="btns"><button class="chat btn submit" onclick="window.emit(\'chat.click\')">'+window.langClever.lang[window.configApp.local].notify.accept+'</button><button class="ignore btn cancel" onclick="window.emit(\'ignore.click\')">'+window.langClever.lang[window.configApp.local].notify.reject+'</button></div></div>'+
										'</div>'
									},
									function() {
										notify.show();

										notify.on('chat.click', function() {
											self.giveRedirectMeAnsver(a.contact, jid, 'ok');
											self.closeNotify(jid, ['redirect']);
										});
										notify.on('ignore.click', function() {
											self.giveRedirectMeAnsver(a.contact, jid, 'cancel');
											self.closeNotify(jid, ['redirect']);
										});

									}
								);
								self.notifyList.redirect[jid] = notify;



						} else {

							//if(typeof self.notifyList.redirect[jid] == 'undefined') {

								var notify = {
									block: $('<div class="notify" data-jid="'+jid+'"><div class="name">'+window.langClever.lang[window.configApp.local].notify.redirect+'</div><div class="text"><b>'+window.langClever.lang[window.configApp.local].notify.redirectOper+'</b> '+user.name+'<br/><b>'+window.langClever.lang[window.configApp.local].notify.redirectClient+'</b> '+self.userList[a.contact].name+'<br/><br/><div class="commentRedirect"><b>'+window.langClever.lang[window.configApp.local].notify.comment+'</b>:<br/>'+a.comment+'</div></div><div class="btns"><button class="chat btn submit">'+window.langClever.lang[window.configApp.local].notify.accept+'</button><button class="ignore btn cancel">'+window.langClever.lang[window.configApp.local].notify.reject+'</button></div></div>')
								}

								$('.notifylist').append(notify.block);

								notify.block.find('.chat').on('click', function() {
									self.giveRedirectMeAnsver(a.contact, jid, 'ok');
									self.closeNotify(jid, ['redirect']);
								});
								notify.block.find('.ignore').on('click', function() {
									self.giveRedirectMeAnsver(a.contact, jid, 'cancel');
									self.closeNotify(jid, ['redirect']);
								});

								self.notifyList.redirect[jid] = notify;

						//}

						}
					}

					if(showHtmlNotify) {
						self.generateNotifyHtml5(jid, window.langClever.lang[window.configApp.local].notify.redirect, a.comment);
					}
					if(showTitleNotify) {
						self.generateNotifyTitle(jid, window.langClever.lang[window.configApp.local].notify.redirect);
					}
				}




				if(type == 'redirect_me_cancel') {
					if(showMainNotify) {
						self.closeNotify(jid, ['redirect', 'redirectCancel']);

						if(isNodeWebkit) {


								var notify = sergDesctop.add(
									{
										width:500,
										height:205,
										htmlBody: '<div id="notification" class="notifylist notifyDesctop">'+
											'<div class="notify" data-jid="'+jid+'"><div class="name">'+window.langClever.lang[window.configApp.local].notify.redirect+'</div><div class="text"><b>'+window.langClever.lang[window.configApp.local].notify.redirectOper+'</b> '+user.name+'<br/><b>'+window.langClever.lang[window.configApp.local].notify.redirectClient+'</b> '+self.userList[a.contact].name+'<br/><br/><div class="commentRedirect">'+window.langClever.lang[window.configApp.local].notify.resirectReject+'</div></div><div class="btns"><button class="ignore btn cancel" onclick="window.emit(\'ignore.click\')">'+window.langClever.lang[window.configApp.local].notify.close+'</button></div></div>'+
										'</div>'
									},
									function() {
										notify.show();

										notify.on('ignore.click', function() {
											self.closeNotify(jid, ['redirectCancel']);
										});

									}
								);
								self.notifyList.redirectCancel[jid] = notify;


						} else {

							//if(!$('.notifylist').find('.notify[data-jid="'+jid+'"]').size()) {

								var notify = {
									block: $('<div class="notify" data-jid="'+jid+'"><div class="name">'+window.langClever.lang[window.configApp.local].notify.redirect+'</div><div class="text"><b>'+window.langClever.lang[window.configApp.local].notify.redirectOper+'</b> '+user.name+'<br/><b>'+window.langClever.lang[window.configApp.local].notify.redirectClient+'</b> '+self.userList[a.contact].name+'<br/><br/><div class="commentRedirect">'+window.langClever.lang[window.configApp.local].notify.resirectReject+'</div></div><div class="btns"><button class="ignore btn cancel">'+window.langClever.lang[window.configApp.local].notify.close+'</button></div></div>')
								}

								$('.notifylist').append(notify.block);

								notify.block.find('.ignore').on('click', function() {
									self.closeNotify(jid, ['redirectCancel']);
								});

								self.notifyList.redirectCancel[jid] = notify;
							//}
						}
					}

					if(showHtmlNotify) {
						self.generateNotifyHtml5(jid, window.langClever.lang[window.configApp.local].notify.redirect, a.comment);
					}
					if(showTitleNotify) {
						self.generateNotifyTitle(jid, window.langClever.lang[window.configApp.local].notify.redirect);
					}
				}



				self.generateSound(jid);
			}
		}




		this.genereteFastAnswerForm = function(jid, block) {
			if(isNodeWebkit) {

				$(block.window.document.body).find('.btns').before('<div class="fastanswer_block"><textarea></textarea></div>');
				$(block.window.document.body).find('.btns').find('.answer').remove();
				$(block.window.document.body).find('.btns').find('.ignore').remove();
				block.height = block.height + 120;
				$(block.window.document.body).find('.notify').addClass('answer');

			} else {
					block.find('.btns').before('<div class="fastanswer_block"><textarea></textarea></div>');
					block.find('.btns').find('.answer').remove();
					block.find('.btns').find('.ignore').remove();
					block.height(block.height() + 120);
					//block.addClass('answer');
			}
		}










	this.generateDialogWindow = function(jid, type, attr1, attr2) {

		var user = self.userList[jid];

		//нужно обновить
		if(type == 'versionUpdate') {

			if(!$('.dialog_window.update').size()){

				var b = $('<div class="dialog_window update">'+
					'<div class="dialog_window_h">'+window.langClever.lang[window.configApp.local].notify.versionOld+'</div>'+
					'<div class="dialog_window_t">'+window.langClever.lang[window.configApp.local].notify.versionOld_text+'</div>'+
					'<div class="dialog_window_btns">'+
						'<div class="dialog_window_btn btn submit">'+window.langClever.lang[window.configApp.local].notify.restart+'</div>'+
						'<div class="dialog_window_btn btn gray_sv">'+window.langClever.lang[window.configApp.local].notify.close+'</div>'+
					'</div>'+
				'</div>');
				b.find('.submit').on('click', function() {
					location.reload();
				});
				b.find('.gray_sv').on('click', function() {
					b.remove();
					self.wall.hide();
				});

				self.wall.show();
				$('body').append(b);

			}

		}



		//предложение закрыть все диалоги, перед уходом в авай
		if(type == 'closeAllDialogs') {

			if(!$('.dialog_window.closeAll[data="'+jid+'"]').size()){

				var b = $('<div class="dialog_window closeAll" data="'+jid+'">'+
					'<div class="dialog_window_h">'+window.langClever.lang[window.configApp.local].notify.goAway+'</div>'+
					'<div class="dialog_window_t">'+window.langClever.lang[window.configApp.local].notify.goAwayText+'</div>'+
					'<div class="dialog_window_btns">'+
						'<div class="dialog_window_btn btn submit">'+window.langClever.lang[window.configApp.local].notify.close+'</div>'+
						'<div class="dialog_window_btn btn gray_sv">'+window.langClever.lang[window.configApp.local].notify.cancel+'</div>'+
					'</div>'+
				'</div>');

				b.find('.submit').on('click', function() {

					self.closeAllThread();

					self.setStatus('away');
					self.user.autoAway = false;

					b.remove();
					self.wall.hide();
				});

				b.find('.gray_sv').on('click', function() {
					b.remove();
					self.wall.hide();
				});

				self.wall.show();
				$('body').append(b);

			}

		}






		//список операторов для редиректа
		if(type == 'redirectList') {

			if(!$('.dialog_window.redirectList[data="'+jid+'"]').size()){

				//var redirectDialogAct = false;
				var to = '';
				var b = $('<div class="dialog_window redirectList" data="'+jid+'">'+
					'<div class="dialog_window_h">'+window.langClever.lang[window.configApp.local].notify.redirect+'</div>'+
					'<div class="dialog_window_t">'+window.langClever.lang[window.configApp.local].notify.redirectSelect+'</div>'+
					'<div class="operator_give_list"></div>'+
					'<div class="dialog_window_btns">'+
						'<div class="dialog_window_btn btn submit disabled_submit">'+window.langClever.lang[window.configApp.local].notify.redirecting+'</div>'+
						'<div class="dialog_window_btn btn gray_sv">'+window.langClever.lang[window.configApp.local].notify.cancel+'</div>'+
					'</div>'+
				'</div>');

				for(var key in self.userList) {
					if(self.userList[key].status == 'on' && $.inArray('operators', self.userList[key].groups) != -1) {
						b.find('.operator_give_list').append('<div class="operator_give_list_line" data="'+key+'"><div class="operator_give_list_status on"><div class="ico"></div></div><div class="operator_give_list_name">'+self.userList[key].name+'</div></div>');
					}
				}
				if($('.operator_give_list').html()==''){
					b.find('.operator_give_list').append('<div class="empty">'+window.langClever.lang[window.configApp.local].notify.noOper+'</div>');
				}

				b.find('.operator_give_list').find('.operator_give_list_line').on('click', function() {
					if(!$(this).parent().hasClass('disabled')) {
						$(this).addClass('act');
						to = $(this).attr('data');
						b.find('.submit').removeClass('disabled_submit');
					}
				});

				b.find('.submit').on('click', function() {
					if(!$(this).hasClass('disabled_submit')) {
						self.giveRedirect(jid, to, '');
						b.find('.submit').addClass('disabled_submit');
						b.find('.operator_give_list').addClass('disabled');
						//redirectDialogAct = true;
						var i = 10;
						b.find('.gray_sv').addClass('cancel').append('<span>(<span class="number">'+i+'</span>)</span>');
						self.delayFunc.redirect[jid] = setInterval(function() {
							var v = +b.find('.gray_sv').find('.number').html() - 1;
							b.find('.gray_sv').find('.number').html(v);
							if(v == 0) {
								self.redirectCancel(jid, to);
								b.find('.gray_sv').removeClass('cancel');
								b.find('.gray_sv').find('span').remove();
								b.find('.submit').removeClass('disabled_submit');
								b.find('.operator_give_list').removeClass('disabled');
								b.find('.operator_give_list').find('.operator_give_list_line.act').removeClass('act');
								to = '';
								//redirectDialogAct = false;
							}
						}, 1000);
					}
				});

				b.find('.gray_sv').on('click', function() {
					if($(this).hasClass('cancel')) {
						self.redirectCancel(jid, to);
						b.remove();
						self.wall.hide();
					} else {
						b.remove();
						self.wall.hide();
					}
				});

				self.wall.show();
				$('body').append(b);
				self.scrollingTo('top', '.operator_give_list');


			}

		}







		//успешный перевод
		if(type == 'redirectOk') {

				if(typeof self.delayFunc.redirect[jid] != 'undefined') {
					clearInterval(self.delayFunc.redirect[jid]);
				}
				if($('.dialog_window.redirectList[data="'+jid+'"]').size()) {
					$('.dialog_window.redirectList[data="'+jid+'"]').remove();
				}

				if(!$('.dialog_window.redirectAnswer[data="'+jid+'"]').size()){

					var b = $('<div class="dialog_window redirectAnswer" data="'+jid+'">'+
						'<div class="dialog_window_h">'+window.langClever.lang[window.configApp.local].notify.redirect+'</div>'+
						'<div class="dialog_window_t"><b>'+window.langClever.lang[window.configApp.local].notify.sait+'</b> '+self.filterSite(user.thread.site)+'<br/><b>'+window.langClever.lang[window.configApp.local].notify.client+'</b> '+user.name+'</div>'+
						'<div class="dialog_window_inform">'+window.langClever.lang[window.configApp.local].notify.redirectSuccess+'</div>'+
						'<div class="dialog_window_btns">'+
							'<div class="dialog_window_btn btn gray_sv">'+window.langClever.lang[window.configApp.local].notify.close+'</div>'+
						'</div>'+
					'</div>');

					b.find('.gray_sv').on('click', function() {
						b.remove();
						self.wall.hide();
					});

					self.wall.show();
					$('body').append(b);

				}
		}



			//отклоненный перевод
			if(type == 'redirectCancel') {

				if(typeof self.delayFunc.redirect[jid] != undefined) {
					clearInterval(self.delayFunc.redirect[jid]);
				}
				if($('.dialog_window.redirectList[data="'+jid+'"]').size()) {
					$('.dialog_window.redirectList[data="'+jid+'"]').remove();
				}

				if(!$('.dialog_window.redirectAnswer[data="'+jid+'"]').size()){

					var b = $('<div class="dialog_window redirectAnswer" data="'+jid+'">'+
						'<div class="dialog_window_h">'+window.langClever.lang[window.configApp.local].notify.redirect+'</div>'+
						'<div class="dialog_window_t"><b>'+window.langClever.lang[window.configApp.local].notify.sait+'</b> '+self.filterSite(user.thread.site)+'<br/><b>'+window.langClever.lang[window.configApp.local].notify.client+'</b> '+user.name+'</div>'+
						'<div class="dialog_window_inform">'+window.langClever.lang[window.configApp.local].notify.redirectReject+'</div>'+
						'<div class="dialog_window_btns">'+
							'<div class="dialog_window_btn btn gray_sv">'+window.langClever.lang[window.configApp.local].notify.close+'</div>'+
						'</div>'+
					'</div>');

					b.find('.gray_sv').on('click', function() {
						b.remove();
						self.wall.hide();
					});

					self.wall.show();
					$('body').append(b);

				}

			}





			//блокировка
			if(type == 'block') {

				if(!$('.dialog_window.block[data="'+jid+'"]').size()){

					var b = $('<div class="dialog_window block" data="'+jid+'">'+
						'<div class="dialog_window_h">'+window.langClever.lang[window.configApp.local].notify.block+'</div>'+
						'<div class="dialog_window_t"><b>'+window.langClever.lang[window.configApp.local].notify.sait+'</b> '+self.filterSite(user.thread.site)+'<br/><b>'+window.langClever.lang[window.configApp.local].notify.client+'</b> '+user.name+'</div>'+
						'<div class="dialog_window_area"><textarea></textarea></div>'+
						'<div class="dialog_window_btns">'+
							'<div class="dialog_window_btn btn submit">'+window.langClever.lang[window.configApp.local].notify.send+'</div>'+
							'<div class="dialog_window_btn btn gray_sv">'+window.langClever.lang[window.configApp.local].notify.cancel+'</div>'+
						'</div>'+
					'</div>');

					var trea = b.find('.dialog_window_area').find('textarea');

					trea.on('keyup', function() {
						if($(this).val() == '') {
							$(this).addClass('error');
						} else {
							$(this).removeClass('error');
						}
					});

					b.find('.submit').on('click', function() {
						var t = trea.val();
						var send = true;
						if(t == '') {
							send = false;
							trea.addClass('error');
						} else {
							trea.removeClass('error');
						}
						if(send) {
							self.blockClient(jid, b.find('.dialog_window_area').find('textarea').val());
							b.remove();
							self.wall.hide();
						}
					});
					b.find('.gray_sv').on('click', function() {
						b.remove();
						self.wall.hide();
					});

					self.wall.show();
					$('body').append(b);

				}


			}

			//блокировка успешна
			if(type == 'blockOk') {

				if(!$('.dialog_window.blockAnswer[data="'+jid+'"]').size()){

					var b = $('<div class="dialog_window blockAnswer" data="'+jid+'">'+
						'<div class="dialog_window_h">'+window.langClever.lang[window.configApp.local].notify.block+'</div>'+
						'<div class="dialog_window_t"><b>'+window.langClever.lang[window.configApp.local].notify.sait+'</b> '+self.filterSite(user.thread.site)+'<br/><b>'+window.langClever.lang[window.configApp.local].notify.client+'</b> '+user.name+'</div>'+
						'<div class="dialog_window_inform">'+window.langClever.lang[window.configApp.local].notify.blockSuccess+'</div>'+
						'<div class="dialog_window_btns">'+
							'<div class="dialog_window_btn btn gray_sv">'+window.langClever.lang[window.configApp.local].notify.close+'</div>'+
						'</div>'+
					'</div>');

					b.find('.gray_sv').on('click', function() {
						b.remove();
						self.wall.hide();
					});

					self.wall.show();
					$('body').append(b);

				}

			}


			//послать историю
			if(type == 'sendHistory') {

				if(!$('.dialog_window.hystory[data="'+jid+'"]').size()){

					var b = $('<div class="dialog_window hystory" data="'+jid+'">'+
						'<div class="dialog_window_h">'+window.langClever.lang[window.configApp.local].notify.sendEmail+'</div>'+
						'<div class="dialog_window_t"><b>'+window.langClever.lang[window.configApp.local].notify.client+'</b> '+user.name+'</div>'+
						'<div class="dialog_window_area"><b>'+window.langClever.lang[window.configApp.local].notify.email+'</b><br/><input type="text" value="" name="email"></input></div>'+
						'<div class="dialog_window_area"><b>'+window.langClever.lang[window.configApp.local].notify.note+'</b><br/><textarea name="comment"></textarea></div>'+
						'<div class="dialog_window_btns">'+
							'<div class="dialog_window_btn btn submit">'+window.langClever.lang[window.configApp.local].notify.send+'</div>'+
							'<div class="dialog_window_btn btn gray_sv">'+window.langClever.lang[window.configApp.local].notify.cancel+'</div>'+
						'</div>'+
					'</div>');

					var email = b.find('input[name="email"]');
					email.on('keyup', function() {
						if($(this).val() == '') {
							$(this).addClass('error');
						} else {
							$(this).removeClass('error');
						}
					});

					var comment = b.find('textarea[name="comment"]');
					comment.on('keyup', function() {
						if($(this).val() == '') {
							$(this).addClass('error');
						} else {
							$(this).removeClass('error');
						}
					});


					b.find('.submit').on('click', function() {
						var e = email.val();
						var c = comment.val();
						var send = true;
						if(e == '') {
							send = false;
							email.addClass('error');
						} else {
							email.removeClass('error');
						}
						if(c == '') {
							send = false;
							comment.addClass('error');
						} else {
							comment.removeClass('error');
						}
						if(send) {
							self.sendHistoryToEmail(null, jid, e, c, user.thread.threadId);
							b.remove();
						}
					});

					b.find('.gray_sv').on('click', function() {
						b.remove();
						self.wall.hide();
					});

					self.wall.show();
					$('body').append(b);

				}
			}


			//успешно послал историю
			if(type == 'sendHistoryOk') {


				if(!$('.dialog_window.hystoryAnswer[data="'+jid+'"]').size()){

					var b = $('<div class="dialog_window hystoryAnswer" data="'+jid+'">'+
						'<div class="dialog_window_h">'+window.langClever.lang[window.configApp.local].notify.sendEmail+'</div>'+
						'<div class="dialog_window_t"><b>'+window.langClever.lang[window.configApp.local].notify.sait+'</b> '+self.filterSite(user.thread.site)+'<br/><b>'+window.langClever.lang[window.configApp.local].notify.client+'</b> '+user.name+'</div>'+
						'<div class="dialog_window_inform">'+window.langClever.lang[window.configApp.local].notify.sendSuccess+'</div>'+
						'<div class="dialog_window_btns">'+
							'<div class="dialog_window_btn btn gray_sv">'+window.langClever.lang[window.configApp.local].notify.close+'</div>'+
						'</div>'+
						'</div>'+
					'</div>');

					b.find('.gray_sv').on('click', function() {
						b.remove();
						self.wall.hide();
					});

					self.wall.show();
					$('body').append(b);

				}

			}




			//успешно послал историю
			if(type == 'uploadError') {

				if(!$('.dialog_window.error[data="'+jid+'"]').size()){

					var b = $('<div class="dialog_window error" data="'+jid+'">'+
						'<div class="dialog_window_h">'+window.langClever.lang[window.configApp.local].notify.errorUpload+'</div>'+
						'<div class="dialog_window_inform">'+attr1+'</div>'+
						'<div class="dialog_window_btns">'+
							'<div class="dialog_window_btn btn gray_sv">'+window.langClever.lang[window.configApp.local].notify.close+'</div>'+
						'</div>'+
					'</div>');

					b.find('.gray_sv').on('click', function() {
						b.remove();
						self.wall.hide();
					});

					self.wall.show();
					$('body').append(b);

				}


			}




	}











		this.generateDialogEvent = function(jid, type, attr1, attr2) {

			if(self.thread.jid == jid) {
				if(type == 'noopen') {

						$('.content_bottom_noopen_dialog').html(
							'<div class="content_bottom_noopen_dialog_text">'+window.langClever.lang[window.configApp.local].notify.whatAct+'</div>'+
							'<div class="content_bottom_noopen_dialog_btnlist">'+
								'<div class="content_bottom_noopen_dialog_no btn gray_sv">'+window.langClever.lang[window.configApp.local].notify.ignore+'</div>'+
								'<div class="content_bottom_noopen_dialog_my btn submit">'+window.langClever.lang[window.configApp.local].notify.accept+'</div>'+
							'</div>'+
							'<div class="clear"></div>'
						);

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

					if(self.thread.jid == jid) {

						$('.content_bottom_noopen_dialog').html(
							'<div class="content_bottom_noopen_dialog_text">'+window.langClever.lang[window.configApp.local].notify.noIgnore+'</div>'+
							'<div class="content_bottom_noopen_dialog_btnlist">'+
								'<div class="content_bottom_noopen_dialog_my btn submit">'+window.langClever.lang[window.configApp.local].notify.accept+'</div>'+
							'</div>'+
							'<div class="clear"></div>'
						);

						//кнопка принятия из окна
						$('.content_bottom_noopen_dialog_my').click(function() {
							self.acceptDialogSend(jid);
						});

						$('.content_bottom_dialog').addClass('hide');
						$('.content_bottom_noopen_dialog').removeClass('hide');

					}
				}

				if(type == 'closethread') {

					$('.content_bottom_noopen_dialog').html('<div class="content_bottom_noopen_dialog_text">'+window.langClever.lang[window.configApp.local].notify.threadClose+'</div><div class="clear"></div>')

				}
			}

		}








		this.wall = {
			hide: function() {
				if($('.wall').size() && !$('.dialog_window').size() && $('.property').hasClass('hide')) {
					$('.wall').remove();
				}
			},
			show:  function() {
				if(!$('.wall').size()) {
					$('body').append('<div class="wall"></div>');
				}
			}
		}



		this.fastPhrase = {
				open: function() {
					$('.phrase_list').find('.phrase_list_cont').find('.block').html('');
					for (var key in window.configApp.fastPhrase[window.configApp.local]) {
						$('.phrase_list').find('.phrase_list_cont').find('.block').append('<div class="phrase" data="'+key+'"><div class="text">'+window.configApp.fastPhrase[window.configApp.local][key].text+'</div></div><div class="clr"></div>')
					};
					$('.phrase_list').removeClass('hide');
				},
				close: function() {
					$('.phrase_list').addClass('hide');
				},
				change: function(id) {
					$('#msgwnd').html(window.configApp.fastPhrase[window.configApp.local][id].text);
					$('.content_bottom_dialog').find('.send').removeClass('disabled');
					self.fastPhrase.close();
					self.caretAtEnd($('.content_bottom_dialog').find('#msgwnd'));
				},
				del: function(id){
					 $('.property').find('.property_phraseList').find('.block').find('.phrase[data="'+id+'"]').remove();
				},
				add: function() {
					var textarea = $('.property').find('textarea[name="phrase_text"]');
					var text = textarea.val();
					var send = true;
					var id = $('.property').find('.property_phraseList').find('.block').find('.phrase').size() ?  (+$('.property').find('.property_phraseList').find('.block').find('.phrase').last().attr('data') + 1) : 1;

					if(text == '') {
						send = false;
						textarea.addClass('error');
					} else {
						textarea.removeClass('error');
					}

					if(send) {
						textarea.val('');
						$('.property').find('.property_phraseEnter_submit').addClass('disabled');
						$('.property').find('.property_phraseList').find('.block').append('<div class="phrase" data="'+id+'"><div class="text">'+text+'</div><div class="delete"></div></div><div class="clr"></div>');
					}
				}
		};





		this.sendHistoryToEmail = function(callback, jid, email, comment, threadId) {
			var d = {
				send_history: 1,
				from: self.user.jid,
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

					self.generateDialogWindow(jid, 'sendHistoryOk');

					if(callback) {
						callback();
					}
				}
			});
		}



		this.blockClient = function(jid, comment) {


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
									body: self.userList[jid].thread.threadId
								}
							}
						}
					}
				});



			if(status=='ok') {

				self.upgradeUser(jid, {
					yes_close: false,
					cntmessage: 0,
				});

				self.leftItem(jid);

			}
		}



		//попытка передачи диалога
		this.giveRedirect = function(jid, jidOperator, comment) {


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
												client_name: {body: self.userList[jid].thread.client_name},
												site: {body: self.userList[jid].thread.site},
												page: {body: self.userList[jid].thread.page},
												source: {body: self.userList[jid].thread.source},
												location: {body: self.userList[jid].thread.location},
												provider: {body: self.userList[jid].thread.provider},
												organization: {body: self.userList[jid].thread.organization},
												address: {body: self.userList[jid].thread.address},
												browser: {body: self.userList[jid].thread.browser},
												visits: {body: self.userList[jid].thread.visits},
												dialogs: {body: self.userList[jid].thread.dialogs},
												scan_pages: {body: self.userList[jid].thread.scan_pages},
											},
										},
									},
								},
								thread: {
									body: self.userList[jid].thread.threadId
								}
							}
						}
					}
				});


		}


		this.redirectCancel = function(jid, to) {

			clearTimeout(self.delayFunc.redirect[jid]);

			self.socket.emit('message', {type: 'message', data: {
						message: {
							attr: {
								to: to,
								type: 'headline',
							},
							child: {
								notification: {
									attr: {
										xmlns: 'cleversite:notification',
										contact: jid,
										event: 'cancel_redirect',
									},
								},
								thread: {
									body: self.userList[jid].thread.threadId
								}
							}
						}
					}
			});
		}








		this.giveRedirectToUser = function(jid, jidOperator) {


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
									body: self.userList[jid].thread.threadId
								}
							}
						}
					}
				});

			self.myDialogList.splice(self.myDialogList.indexOf(jid), 1);
			self.generateDialogWindow(jid, 'redirectOk');
		}





		//наблюдение за печатью
		this.seewriter = {
			delay: {},
			writeStatus: function(jid, type) {

				self.upgradeUser(jid, {
					write: {
						status: type
					}
				});
				self.leftItem(jid);

				if(self.thread.jid == jid) {
					if(type == 'composing') {
						$('#data').find('.write').removeClass('paused').addClass('composing').removeClass('notshow');
					} else if(type == 'paused') {
						$('#data').find('.write').removeClass('composing').addClass('paused').removeClass('notshow');
					} else if(type == 'active') {
						$('#data').find('.write').removeClass('paused').removeClass('composing').addClass('notshow');
					} else if(type == 'inactive') {
						$('#data').find('.write').removeClass('paused').removeClass('composing').addClass('notshow');
					} else if(type == 'gone') {
						$('#data').find('.write').removeClass('paused').removeClass('composing').addClass('notshow');
					}

					self.scrollingTo('bottom', '#data_scroll');;
				}


			},
			writeText: function(jid, text) {

				self.upgradeUser(jid, {
					write: {
						text: text
					}
				});
				self.leftItem(jid);
				if(self.thread.jid == jid) {
					$('#data').find('.write').find('.message_block_text_t').html(text);
					self.scrollingTo('bottom', '#data_scroll');;
				}
			},
			send: function(jid, type) {

				self.upgradeUser(self.user.jid, {
					write: {
						status: type,
						time: Date.now()
					}
				});
				//self.leftItem(jid);
				var data = {
						message: {
							attr: {
								to: jid,
								type: 'headline',
							},
							child: {
								thread: {
									body: self.userList[jid].thread.threadId
								}
							}
						}
				};
				data.message.child[type] = {
					attr: {
						xmlns: 'http://jabber.org/protocol/chatstates'
					}
				}
				self.socket.emit('message', {type: 'message', data: data});


			}
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







		this.setDefaultProp = function() {



			window.configApp.prop = localStorage.getItem('prop_'+ self.user.jid) ? JSON.parse(localStorage.getItem('prop_'+ self.user.jid)) : ({
				prop_awayTime: 0,
				prop_closeThreadChangeStatus: 1,
				prop_enableSound: 1,
				prop_soundClient_file: 1,
				prop_soundOperator_file: 1,

				prop_theme: 1,
			});

			window.configApp.fastPhrase = localStorage.getItem('fastPhrase_'+ self.user.jid) ? JSON.parse(localStorage.getItem('fastPhrase_'+ self.user.jid)) : (
					{
						'ru': [
							{id:1 , text: window.langClever.lang.ru.property.prop_phrase.def[0]},
							{id:2 , text: window.langClever.lang.ru.property.prop_phrase.def[1]},
							{id:3 , text: window.langClever.lang.ru.property.prop_phrase.def[2]}
						],
						'en': [
							{id:1 , text: window.langClever.lang.en.property.prop_phrase.def[0]},
							{id:2 , text: window.langClever.lang.en.property.prop_phrase.def[1]},
							{id:3 , text: window.langClever.lang.en.property.prop_phrase.def[2]}
						]
					}
			);

			self.loadProp();

			self.validators('.property');


			$('.property_left').find('li[data="spelling"]').addClass('hide');

			if(!isNodeWebkit) {
				$('.property_left').find('li[data="autostart"]').addClass('hide');
				$('.property_left').find('li[data="report"]').addClass('hide');
			}

			$('.top_menu').find('li[data="property"]').click(function() {
				$('.property').removeClass('hide');
				self.wall.show();
			});
			$('.property_bottom').find('.gray_sv').click(function() {
				$('.property').addClass('hide');
				self.loadProp();
				self.wall.hide();
			});
			$('.property_bottom').find('.submit').click(function() {
				$('.property').addClass('hide');
				self.saveProp();
				self.wall.hide();
			});
			$('.property').find('.property_left').find('li').on('click', function() {
				if(!$(this).hasClass('act')) {
					$('.property').find('.property_left').find('li').removeClass('act');
					$(this).addClass('act');

					$('.property').find('.property_right').find('.property_block').addClass('hide');
					$('.property').find('.property_right').find('.property_block[data="'+ $(this).attr('data') +'"]').removeClass('hide');
				}
			});

			$('.property').find('.property_line_update').find('.btn').on('click', function() {
				var updater = require('./components/updater');
				//updater.checkAndPrompt(gui.App.manifest, win);
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
			});



			$('.property').find('textarea[name="phrase_text"]').on('keyup', function(e) {
				var t = $(this).val();
				if(t != '') {
					$('.property').find('.property_phraseEnter_submit').removeClass('disabled');
					$(this).removeClass('error');
				} else {
					$('.property').find('.property_phraseEnter_submit').addClass('disabled');
				}
				if (e.ctrlKey && e.keyCode == 13) {
					self.fastPhrase.add();
					return false;
				} else if(!e.ctrlKey && e.keyCode == 13) {
					self.fastPhrase.add();
					return false;
				}
			});

			$('.property').find('.property_phraseEnter_submit').on('click', function() {
				if(!$(this).hasClass('disabled')) {
					self.fastPhrase.add();
				}
			});

			$(document).on("click", ".property_phraseList .delete", function() {
				self.fastPhrase.del($(this).parent().attr('data'));
			});

			self.scrollingTo('top', '.property_phraseList_scroll');



			$('.property_block[data="about"]').find('.version').find('span[data="version"]').html(version);

			$('.property').find('.property_sv_play').on('click', function() {
				self.generateSound(null, $(this).parent().find('select option:selected').val(), true);
			});








			$('.property_line_visual').find('.el').on('click', function() {
				$(this).parent().find('.el').removeClass('act');
				$(this).addClass('act');
				$('.property').find('input[name="prop_theme"]').val($(this).attr('data'));

				$('.property_line_visual').find('.el').each(function() {
					$('body').removeClass('theme_' + $(this).attr('data'));
				});
				$('body').addClass('theme_' + $(this).attr('data'));

			});




		}













		this.loadProp = function() {

			$('.property').find('select[name="prop_awayTime"]').find('option').removeAttr('selected');
			$('.property').find('select[name="prop_awayTime"]').find('option[value="'+window.configApp.prop.prop_awayTime+'"]').attr('selected', 'selected');




			if(window.configApp.prop.prop_closeThreadChangeStatus == 1) {
				$('.property').find('input[name="prop_closeThreadChangeStatus"]').prop('checked', true).attr('checked', 'checked');
			} else {
				$('.property').find('input[name="prop_closeThreadChangeStatus"]').prop('checked', false).removeAttr('checked');
			}


			$('.property').find('.property_phraseList').find('.block').html('');
			for (var key in window.configApp.fastPhrase[window.configApp.local]) {
				$('.property').find('.property_phraseList').find('.block').append('<div class="phrase" data="'+key+'"><div class="text">'+window.configApp.fastPhrase[window.configApp.local][key].text+'</div><div class="delete"></div></div><div class="clr"></div>');
			};

			$('.property').find('input[name="prop_lang"]').prop('checked', false).removeAttr('checked');
			$('.property').find('input[name="prop_lang"][value="'+window.configApp.local+'"]').prop('checked', true).attr('checked', 'checked');



			if(window.configApp.prop.prop_enableSound == 1) {
				$('.property').find('input[name="prop_enableSound"]').prop('checked', true).attr('checked', 'checked');
			} else {
				$('.property').find('input[name="prop_enableSound"]').prop('checked', false).removeAttr('checked');
			}

			$('.property').find('select[name="prop_soundClient_file"]').find('option').removeAttr('selected');
			$('.property').find('select[name="prop_soundClient_file"]').find('option[value="'+window.configApp.prop.prop_soundClient_file+'"]').attr('selected', 'selected');

			$('.property').find('select[name="prop_soundOperator_file"]').find('option').removeAttr('selected');
			$('.property').find('select[name="prop_soundOperator_file"]').find('option[value="'+window.configApp.prop.prop_soundOperator_file+'"]').attr('selected', 'selected');



			if(window.configApp.desktop.prop_autoStart == 1) {
				$('.property').find('input[name="prop_autoStart"]').prop('checked', true).attr('checked', 'checked');
			} else {
				$('.property').find('input[name="prop_autoStart"]').prop('checked', false).removeAttr('checked');
			}
			if(window.configApp.desktop.prop_autoIn == 1) {
				$('.property').find('input[name="prop_autoIn"]').prop('checked', true).attr('checked', 'checked');
			} else {
				$('.property').find('input[name="prop_autoIn"]').prop('checked', false).removeAttr('checked');
			}

			if(window.configApp.desktop.prop_sendReport == 1) {
				$('.property').find('input[name="prop_sendReport"]').prop('checked', true).attr('checked', 'checked');
			} else {
				$('.property').find('input[name="prop_sendReport"]').prop('checked', false).removeAttr('checked');
			}


			$('.property_line_visual').find('.el').removeClass('act');
			$('.property_line_visual').find('.el[data="'+window.configApp.prop.prop_theme+'"]').addClass('act');
			$('.property_line_visual').find('.el').each(function() {
				$('body').removeClass('theme_' + $(this).attr('data'));
			});
			$('body').addClass('theme_' + window.configApp.prop.prop_theme);


		};


		this.saveProp = function() {

			var prop = {};

			prop.prop_awayTime = (window.configApp.prop.prop_awayTime = $('.property').find('select[name="prop_awayTime"]').find('option:selected').val());
			prop.prop_closeThreadChangeStatus = (window.configApp.prop.prop_closeThreadChangeStatus = $('.property').find('input[name="prop_closeThreadChangeStatus"]').prop('checked') ? 1 : 0);
			prop.prop_enableSound = (window.configApp.prop.prop_enableSound = $('.property').find('input[name="prop_enableSound"]').prop('checked') ? 1 : 0);
			prop.prop_soundClient_file = (window.configApp.prop.prop_soundClient_file = $('.property').find('select[name="prop_soundClient_file"]').find('option:selected').val());
			prop.prop_soundOperator_file = (window.configApp.prop.prop_soundOperator_file = $('.property').find('select[name="prop_soundOperator_file"]').find('option:selected').val());
			prop.prop_theme = (window.configApp.prop.prop_theme = $('.property').find('input[name="prop_theme"]').val());

			localStorage.setItem('prop_'+ self.user.jid, JSON.stringify(prop));





			window.configApp.fastPhrase[window.configApp.local] = {};
			$('.property').find('.property_phraseList').find('.block').find('.phrase').each(function() {
				window.configApp.fastPhrase[window.configApp.local][$(this).attr('data')] = {id: $(this).attr('data'), text: $(this).find('.text').html()};
			});
			localStorage.setItem('fastPhrase_'+ self.user.jid, JSON.stringify(window.configApp.fastPhrase));


			var l = $('.property').find('input[name="prop_lang"]:checked').val();
			if(window.configApp.local != l) {
				window.configApp.local = l;

				self.loadLocalize();


				$('select').selectmenu("destroy");
				$('input[type="checkbox"]').checkboxradio("destroy");
				$('input[type="radio"]').checkboxradio("destroy");

				$('select').selectmenu();
				$('input[type="checkbox"]').checkboxradio();
				$('input[type="radio"]').checkboxradio();

				localStorage.setItem("locale", window.configApp.local);
			}



			var desktop = {};

			desktop.prop_autoStart = (window.configApp.desktop.prop_autoStart = $('.property').find('input[name="prop_autoStart"]').prop('checked') ? 1 : 0);
			if(isNodeWebkit) {

				launcher.isEnabled(function(enabled) {
					if(window.configApp.desktop.prop_autoStart == 1 && !enabled) {
						launcher.enable(function(error) {
							if (error) {
								console.error(error);
							}
							console.log('auto_launch start');
						});
					} else if (window.configApp.desktop.prop_autoStart == 0 && enabled){
						launcher.disable(function(error) {
							if (error) {
								console.error(error);
							}
							console.log('auto_launch stop');
						});
					}
				});
			}
			desktop.prop_autoIn = (window.configApp.desktop.prop_autoIn = $('.property').find('input[name="prop_autoIn"]').prop('checked') ? 1 : 0);
			desktop.prop_sendReport = (window.configApp.desktop.prop_sendReport = $('.property').find('input[name="prop_sendReport"]').prop('checked') ? 1 : 0);

			localStorage.setItem('desktop', JSON.stringify(desktop));



			self.loadProp();
		};
















		this.resizeThread = function() {}


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





		this.loadLocalize = function (l) {
			document.title = window.langClever.lang[window.configApp.local].title;

			$('.auth_form_parent').find('.auth_form_form_f_1').find('.submit').html(window.langClever.lang[window.configApp.local].enter);
			$('.auth_form_parent').find('.auth_form_form_f_2').find('.auth_form_form_f_2_t').html(window.langClever.lang[window.configApp.local].loadintEnter);
			$('.auth_form_parent').find('.auth_form_form_f_2').find('.submit').html(window.langClever.lang[window.configApp.local].cancel);

			$('.user_info').find('.extended').find('span[data="begin-text"]').html(window.langClever.lang[window.configApp.local].user_info.begin);
			$('.user_info').find('.extended').find('span[data="source-text"]').html(window.langClever.lang[window.configApp.local].user_info.source);
			$('.user_info').find('.extended').find('span[data="location-text"]').html(window.langClever.lang[window.configApp.local].user_info.location);
			$('.user_info').find('.extended').find('span[data="address-text"]').html(window.langClever.lang[window.configApp.local].user_info.address);
			$('.user_info').find('.extended').find('span[data="provider-text"]').html(window.langClever.lang[window.configApp.local].user_info.provider);
			$('.user_info').find('.extended').find('span[data="browser-text"]').html(window.langClever.lang[window.configApp.local].user_info.browser);
			$('.user_info').find('.extended').find('span[data="visits-text"]').html(window.langClever.lang[window.configApp.local].user_info.visits);
			$('.user_info').find('.extended').find('span[data="dialogs-text"]').html(window.langClever.lang[window.configApp.local].user_info.dialogs);
			$('.user_info').find('.extended').find('span[data="scan_pages-text"]').html(window.langClever.lang[window.configApp.local].user_info.scan_pages);


			$('.top_menu').find('li[data="transfer"]').html(window.langClever.lang[window.configApp.local].top_menu.transfer);
			$('.top_menu').find('li[data="block"]').html(window.langClever.lang[window.configApp.local].top_menu.block);
			$('.top_menu').find('li[data="send_email"]').html(window.langClever.lang[window.configApp.local].top_menu.send_email);
			$('.top_menu').find('li[data="operators"]').html(window.langClever.lang[window.configApp.local].top_menu.operators);
			$('.top_menu').find('li[data="clients"]').html(window.langClever.lang[window.configApp.local].top_menu.clients);
			$('.top_menu').find('li[data="property"]').html(window.langClever.lang[window.configApp.local].top_menu.property);
			$('.top_menu').find('li[data="exit"]').html(window.langClever.lang[window.configApp.local].top_menu.exit);


			$('.content_info').html(window.langClever.lang[window.configApp.local].content_info);

			$('.show_history').find('span').html(window.langClever.lang[window.configApp.local].history);

			$('#msgwnd').attr('placeholder', window.langClever.lang[window.configApp.local].msgwnd_placeholder);


			$('.property').find('.property_left').find('li[data="status"]').find('span').html(window.langClever.lang[window.configApp.local].property.menu.status);
			$('.property').find('.property_left').find('li[data="phrases"]').find('span').html(window.langClever.lang[window.configApp.local].property.menu.phrases);
			$('.property').find('.property_left').find('li[data="lang"]').find('span').html(window.langClever.lang[window.configApp.local].property.menu.lang);
			$('.property').find('.property_left').find('li[data="notify"]').find('span').html(window.langClever.lang[window.configApp.local].property.menu.notify);
			$('.property').find('.property_left').find('li[data="autostart"]').find('span').html(window.langClever.lang[window.configApp.local].property.menu.autostart);
			$('.property').find('.property_left').find('li[data="spelling"]').find('span').html(window.langClever.lang[window.configApp.local].property.menu.spelling);
			$('.property').find('.property_left').find('li[data="visual"]').find('span').html(window.langClever.lang[window.configApp.local].property.menu.visual);
			$('.property').find('.property_left').find('li[data="report"]').find('span').html(window.langClever.lang[window.configApp.local].property.menu.report);
			$('.property').find('.property_left').find('li[data="about"]').find('span').html(window.langClever.lang[window.configApp.local].property.menu.about);


			$('.property').find('.property_right').find('.property_sv_l').html(window.langClever.lang[window.configApp.local].property.prop_status.text);
			$('.property').find('.property_right').find('select[name="prop_awayTime"]').find('option[value="0"]').html(window.langClever.lang[window.configApp.local].property.prop_status.never);
			$('.property').find('.property_right').find('label[for="prop_closeThreadChangeStatus"]').html(window.langClever.lang[window.configApp.local].property.prop_status.closetext);

			$('.property').find('.property_right').find('textarea[name="phrase_text"]').attr('placeholder', window.langClever.lang[window.configApp.local].property.prop_phrase.placeholder);


			$('.property').find('.property_right').find('label[for="prop_lang_rus"]').html(window.langClever.lang[window.configApp.local].property.prop_lang.prop_lang_rus);
			$('.property').find('.property_right').find('label[for="prop_lang_en"]').html(window.langClever.lang[window.configApp.local].property.prop_lang.prop_lang_en);


			$('.property').find('.property_right').find('label[for="prop_enableSound"]').html(window.langClever.lang[window.configApp.local].property.prop_sound.enable);
			$('.property').find('.property_right').find('.property_line_file_sound').find('.property_sv_text[data="clients"]').html(window.langClever.lang[window.configApp.local].property.prop_sound.textForClient);
			$('.property').find('.property_right').find('.property_line_file_sound').find('.property_sv_text[data="operators"]').html(window.langClever.lang[window.configApp.local].property.prop_sound.textForOperator);
			$('.property').find('.property_right').find('select[name="prop_soundClient_file"]').find('option[value="0"]').html(window.langClever.lang[window.configApp.local].property.prop_sound.no);
			$('.property').find('.property_right').find('select[name="prop_soundOperator_file"]').find('option[value="0"]').html(window.langClever.lang[window.configApp.local].property.prop_sound.no);
			$('.property').find('.property_right').find('select[name="prop_soundClient_file"]').find('option[value="1"]').html(window.langClever.lang[window.configApp.local].property.prop_sound.noty1);
			$('.property').find('.property_right').find('select[name="prop_soundOperator_file"]').find('option[value="1"]').html(window.langClever.lang[window.configApp.local].property.prop_sound.noty1);
			$('.property').find('.property_right').find('select[name="prop_soundClient_file"]').find('option[value="2"]').html(window.langClever.lang[window.configApp.local].property.prop_sound.noty2);
			$('.property').find('.property_right').find('select[name="prop_soundOperator_file"]').find('option[value="2"]').html(window.langClever.lang[window.configApp.local].property.prop_sound.noty2);

			$('.property').find('.property_right').find('label[for="prop_autoStart"]').html(window.langClever.lang[window.configApp.local].property.prop_autostart.prop_autoStart);
			$('.property').find('.property_right').find('label[for="prop_autoIn"]').html(window.langClever.lang[window.configApp.local].property.prop_autostart.prop_autoIn);

			$('.property').find('.property_right').find('label[for="prop_sendReport"]').html(window.langClever.lang[window.configApp.local].property.prop_report.prop_sendReport);
			$('.property').find('.property_right').find('.property_block[data="report"]').find('.property_line_checkbox_info').html(window.langClever.lang[window.configApp.local].property.prop_report.text);

			$('.property').find('.property_right').find('.property_block[data="about"]').find('span[data="text"]').html(window.langClever.lang[window.configApp.local].property.prop_about.text);

			$('.property').find('.property_bottom').find('.submit').html(window.langClever.lang[window.configApp.local].save);
			$('.property').find('.property_bottom').find('.gray_sv').html(window.langClever.lang[window.configApp.local].cancel);


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
					self.generateDialogWindow(self.thread.jid, 'uploadError', window.langClever.lang[window.configApp.local].write.notify.uploadErrorType+' ' + file.type);
				} else if(!isValidSize) {
					self.generateDialogWindow(self.thread.jid, 'uploadError', window.langClever.lang[window.configApp.local].write.notify.uploadErrorSize+' - ' + Math.floor(file.size / 1024 / 1024) + window.langClever.lang[window.configApp.local].write.notify.uploadErrorSizeLimit);
				} else {
					self.uploadFile(temp);
				}

			});
		};

		this.uploadFile =  function(file) {
			//var file = baseClass.allFiles[index];

			//Создаем объек FormData
			var data = new FormData();


			data.append('HTTP_TO', self.user.jid);
			data.append('HTTP_THREADID', self.userList[self.thread.jid].thread.threadId);
			data.append('HTTP_USERID', self.thread.jid);

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

						self.sendMessageJid(self.thread.jid, response);

					} else {

						self.generateDialogWindow(self.thread.jid, 'uploadError', response);

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





		self.validators = function (where) {
			$(where).find(".validatertext").keypress(function(e) {
				var verified = (e.which == 8 || e.which == undefined || e.which == 0 || e.which == 13) ? null : String.fromCharCode(e.which).match(validatertext);
				if (verified) {
					e.preventDefault();
				}
			});
			$(where).find(".validateremailtext").keypress(function(e) {
				var verified = (e.which == 8 || e.which == undefined || e.which == 0) ? null : String.fromCharCode(e.which).match(validateremailtext);
				if (verified) {
					e.preventDefault();
				}
			});

			$(where).find(".validaterchisla").keypress(function(e) {
				var verified = (e.which == 8 || e.which == undefined || e.which == 0) ? null : String.fromCharCode(e.which).match(validaterchisla);
				if (verified) {
					e.preventDefault();
				}
			});

			//$('.timepicker').timepicker();

			$(where).find('.select').selectmenu();

			/*$.widget( "custom.iconselectmenu", $.ui.selectmenu, {
			  _renderItem: function( ul, item ) {
				var li = $( "<li>", { text: item.label } );

				if ( item.disabled ) {
				  li.addClass( "ui-state-disabled" );
				}

				$( "<span>", {
				  style: item.element.attr( "data-style" ),
				  "class": "ui-icon " + item.element.attr( "data-class" )
				})
				  .appendTo( li );

				return li.appendTo( ul );
			  }
			});*/
			//$(where).find(".select_icon").iconselectmenu().iconselectmenu("menuWidget").addClass("ui-menu-icons");

			$(where).find(".checklist").find('input').checkboxradio();
			$(where).find(".checkbox").find('input').checkboxradio();

			$(where).find('input').on('focus', function() {
				$(this).addClass('focus');
			}).on('blur', function() {
				$(this).removeClass('focus');
			});

			$(where).find('textarea').on('focus', function() {
				$(this).addClass('focus');
			}).on('blur', function() {
				$(this).removeClass('focus');
			});

			/*
			$(where).find('.inform_icon').on('mouseenter', function() {
				$(this).parent().find('.inform_text').addClass('act');
			}.on('mouseleave', function() {
				$(this).parent().find('.inform_text').removeClass('act');
			});
			*/


		}


		self.caretAtEnd = function(el) {
			el.focus();
			if (typeof window.getSelection != "undefined"
					&& typeof document.createRange != "undefined") {
				var range = document.createRange();
				range.selectNodeContents(el[0]);
				range.collapse(false);
				var sel = window.getSelection();
				sel.removeAllRanges();
				sel.addRange(range);
			} else if (typeof document.body.createTextRange != "undefined") {
				var textRange = document.body.createTextRange();
				textRange.moveToElementText(el[0]);
				textRange.collapse(false);
				textRange.select();
			}
		}


		this.reconvert_link = function(text) {
			if(isNodeWebkit) {
				return text.replace(/(https?|ftp):\/\/\S*/, '<a href="$&" onclick="require(\'nw.gui\').Shell.openExternal("$&");">$&</a>');
			} else {
				return text.replace(/(https?|ftp):\/\/\S*/, '<a href="$&" target="_blank">$&</a>');
			}
		}




		this.mainInterval = setInterval(function() {
			var t = Date.now() - self.lastActive;
			if(window.configApp.prop.prop_awayTime != 0) {
				if(t/1000/60 > window.configApp.prop.prop_awayTime) {
					self.setStatus('away', true);
					self.user.autoAway = true;
				}
			}
		}, 1000);






		//генерация номера сообщения
		this.messageId = function() {

			function s4() {
				return Math.floor((1 + Math.random()) * 0x10000)
				  .toString(16)
				  .substring(1);
			}
			return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
			//return Date.now() + '-' + Math.floor(Math.random() * (10000 - 1 + 1)) + 1;
		}

		$('a[target=_blank]').on('click', function(){

		   return false;
		});

		this.socket.on('connect', function () {

			self.init();

		});
		this.socket.on('connect_error', function () {

			self.closePult(1, window.langClever.lang[window.configApp.local].xmpp_error.noServer);

		});


    };
    window.chat = new Chat();



});
