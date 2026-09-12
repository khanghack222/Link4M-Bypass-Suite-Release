(function() {
	var traffic_key = "\x6C\x31\x44\x57\x6F";
	var traffic_id = "\x62\x62\x66\x35\x34\x31\x35\x61\x32\x65\x34\x62\x33\x32\x66\x65\x38\x61\x38\x34\x66\x63\x30\x32\x66\x32\x38\x39\x63\x65\x64\x35";
	var traffic_domain = 's1.what-on.com';
	var vcfbdd = '6aa499899c3669be2105c55e';
	var uuid_name = '\x74\x72\x61\x66\x66\x69\x63\x5F\x70\x67\x45\x5A\x74\x6C\x31\x44\x57\x6F';
	var check_script_hash = '\x23\x63\x68\x65\x63\x6B\x5F\x73\x63\x72\x69\x70\x74';
	
	var initTrafficScript = initTrafficScript || {};
	var traffic_wait_time = 60;
	var traffic_step_2_wait_time = 15;
	var traffic_click = false;
	var traffic_blurred = !1;
	var mouse_scroll = !1;
	var mouse_offset = 0;
	var mouse_scroll_time = Date.now() / 1000;
	var hidden = "hidden";
	var total_step = 2;

	var google_domain_list = ["google.com","google.ad","google.ae","google.com.af","google.com.ag","google.com.ai","google.al","google.am","google.co.ao","google.com.ar","google.as","google.at","google.com.au","google.az","google.ba","google.com.bd","google.be","google.bf","google.bg","google.com.bh","google.bi","google.bj","google.com.bn","google.com.bo","google.com.br","google.bs","google.bt","google.co.bw","google.by","google.com.bz","google.ca","google.cd","google.cf","google.cg","google.ch","google.ci","google.co.ck","google.cl","google.cm","google.cn","google.com.co","google.co.cr","google.com.cu","google.cv","google.com.cy","google.cz","google.de","google.dj","google.dk","google.dm","google.com.do","google.dz","google.com.ec","google.ee","google.com.eg","google.es","google.com.et","google.fi","google.com.fj","google.fm","google.fr","google.ga","google.ge","google.gg","google.com.gh","google.com.gi","google.gl","google.gm","google.gr","google.com.gt","google.gy","google.com.hk","google.hn","google.hr","google.ht","google.hu","google.co.id","google.ie","google.co.il","google.im","google.co.in","google.iq","google.is","google.it","google.je","google.com.jm","google.jo","google.co.jp","google.co.ke","google.com.kh","google.ki","google.kg","google.co.kr","google.com.kw","google.kz","google.la","google.com.lb","google.li","google.lk","google.co.ls","google.lt","google.lu","google.lv","google.com.ly","google.co.ma","google.md","google.me","google.mg","google.mk","google.ml","google.com.mm","google.mn","google.ms","google.com.mt","google.mu","google.mv","google.mw","google.com.mx","google.com.my","google.co.mz","google.com.na","google.com.ng","google.com.ni","google.ne","google.nl","google.no","google.com.np","google.nr","google.nu","google.co.nz","google.com.om","google.com.pa","google.com.pe","google.com.pg","google.com.ph","google.com.pk","google.pl","google.pn","google.com.pr","google.ps","google.pt","google.com.py","google.com.qa","google.ro","google.ru","google.rw","google.com.sa","google.com.sb","google.sc","google.se","google.com.sg","google.sh","google.si","google.sk","google.com.sl","google.sn","google.so","google.sm","google.sr","google.st","google.com.sv","google.td","google.tg","google.co.th","google.com.tj","google.tl","google.tm","google.tn","google.to","google.com.tr","google.tt","google.com.tw","google.co.tz","google.com.ua","google.co.ug","google.co.uk","google.com.uy","google.co.uz","google.com.vc","google.co.ve","google.vg","google.co.vi","google.com.vn","google.vu","google.ws","google.rs","google.co.za","google.co.zm","google.co.zw","google.cat"];
	var ref_domain_list = ["www.google.com","google.com","google.ad","google.ae","google.com.af","google.com.ag","google.com.ai","google.al","google.am","google.co.ao","google.com.ar","google.as","google.at","google.com.au","google.az","google.ba","google.com.bd","google.be","google.bf","google.bg","google.com.bh","google.bi","google.bj","google.com.bn","google.com.bo","google.com.br","google.bs","google.bt","google.co.bw","google.by","google.com.bz","google.ca","google.cd","google.cf","google.cg","google.ch","google.ci","google.co.ck","google.cl","google.cm","google.cn","google.com.co","google.co.cr","google.com.cu","google.cv","google.com.cy","google.cz","google.de","google.dj","google.dk","google.dm","google.com.do","google.dz","google.com.ec","google.ee","google.com.eg","google.es","google.com.et","google.fi","google.com.fj","google.fm","google.fr","google.ga","google.ge","google.gg","google.com.gh","google.com.gi","google.gl","google.gm","google.gr","google.com.gt","google.gy","google.com.hk","google.hn","google.hr","google.ht","google.hu","google.co.id","google.ie","google.co.il","google.im","google.co.in","google.iq","google.is","google.it","google.je","google.com.jm","google.jo","google.co.jp","google.co.ke","google.com.kh","google.ki","google.kg","google.co.kr","google.com.kw","google.kz","google.la","google.com.lb","google.li","google.lk","google.co.ls","google.lt","google.lu","google.lv","google.com.ly","google.co.ma","google.md","google.me","google.mg","google.mk","google.ml","google.com.mm","google.mn","google.ms","google.com.mt","google.mu","google.mv","google.mw","google.com.mx","google.com.my","google.co.mz","google.com.na","google.com.ng","google.com.ni","google.ne","google.nl","google.no","google.com.np","google.nr","google.nu","google.co.nz","google.com.om","google.com.pa","google.com.pe","google.com.pg","google.com.ph","google.com.pk","google.pl","google.pn","google.com.pr","google.ps","google.pt","google.com.py","google.com.qa","google.ro","google.ru","google.rw","google.com.sa","google.com.sb","google.sc","google.se","google.com.sg","google.sh","google.si","google.sk","google.com.sl","google.sn","google.so","google.sm","google.sr","google.st","google.com.sv","google.td","google.tg","google.co.th","google.com.tj","google.tl","google.tm","google.tn","google.to","google.com.tr","google.tt","google.com.tw","google.co.tz","google.com.ua","google.co.ug","google.co.uk","google.com.uy","google.co.uz","google.com.vc","google.co.ve","google.vg","google.co.vi","google.com.vn","google.vu","google.ws","google.rs","google.co.za","google.co.zm","google.co.zw","google.cat"];
	var check_ref = false;
	var get_code = true;
	
	var get_code_string = 'LẤY MÃ';
	var get_code_after_string = 'Lấy mã sau';
	var get_code_after_string_step_1 = 'Vui lòng chờ';
	var get_code_after_string_step_2 = 'Lấy mã sau';
	var code_string = 'Mã KM';
	var copied_notify = 'Đã sao chép mã';
	var mouse_scroll_stop_message = 'Kéo xuống chậm chậm để đếm ngược.';
	var mouse_scroll_continuous_message = 'Rất tốt, hãy kéo xuống thật chậm.';
	var mouse_scroll_up_stop_message = 'Kéo lên chậm chậm để đếm ngược.';
	var mouse_scroll_up_continuous_message = 'Rất tốt, hãy kéo lên  thật chậm.';
	var mouse_scroll_down_stop_message = 'Kéo xuống chậm chậm để đếm ngược.';
	var mouse_scroll_down_continuous_message = 'Rất tốt, hãy kéo xuống thật chậm.';
	var close_private_mode_message = 'Vui lòng tắt chế độ Ẩn danh để tiếp tục. Xin cảm ơn.';
	var get_code_error_message = 'Chưa cập nhật được mã , vui lòng thử lại sau';
	var jscd = {};
	var delay_time = 3 + Math.random() * 2;
	var loaded_script = false;
	var show_code_button = false;
	var retry = false;
	var button_click = false;

	if (hidden in document)
		document.addEventListener("visibilitychange", onchange);
	else if ((hidden = "mozHidden") in document)
		document.addEventListener("mozvisibilitychange", onchange);
	else if ((hidden = "webkitHidden") in document)
		document.addEventListener("webkitvisibilitychange", onchange);
	else if ((hidden = "msHidden") in document)
		document.addEventListener("msvisibilitychange", onchange);
	// IE 9 and lower:
	else if ("onfocusin" in document)
		document.onfocusin = document.onfocusout = onchange;
	// All others:
	else
		window.onpageshow = window.onpagehide = window.onfocus = window.onblur = onchange;

	document.addEventListener("mousewheel", mouseScroll);
	document.body.addEventListener("touchmove", mouseScroll);
	window.addEventListener("scroll", mouseScroll);

	// Localize jQuery variable
	var jQuery;

	if (!isFirstLoad(initTrafficScript)) {
		return;
	}
	/******** Load jQuery if not present *********/

	if (window.jQuery === undefined || window.jQuery.fn === undefined || window.jQuery.fn.jquery !== '3.6.0') {
		
		// traffic_main();
		// return;
		
	    var script_tag = document.createElement('script');
	    script_tag.setAttribute("type","text/javascript");
	    script_tag.setAttribute("src",
	        "https://ajax.googleapis.com/ajax/libs/jquery/3.6.0/jquery.min.js");

	    if (script_tag.readyState) {
	      script_tag.onreadystatechange = function () {
	          if (this.readyState == 'complete' || this.readyState == 'loaded') {
	          	scriptTrafficLoadHandler();
	          }
	      };
	    } else {
	      script_tag.onload = scriptTrafficLoadHandler;
	    }
	    // Try to find the head, otherwise default to the documentElement
	    (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(script_tag);
	} else {
	    // The jQuery version on the window is the one we want to use
	    jQuery = window.jQuery;
	    traffic_main();
	}

	/******** Called once jQuery has loaded ******/
	function scriptTrafficLoadHandler() {
	    jQuery = window.jQuery.noConflict(true);
	    traffic_main(); 
	}

	/******** Our traffic_main function ********/
	function traffic_main() {
		var initScript = function(){
			
			if(loaded_script){
				return;
			}
			getClientInfo();    	

			/******* Load HTML *******/
			
			if(typeof(Storage) !== "undefined") {
				var uuid = localStorage.getItem(uuid_name);
				if(uuid === null){
					var uuid = generateUUID();
					localStorage.setItem(uuid_name, uuid);
				}
			}else{
				var uuid = generateUUID();
			}
			
			jscd.client_id = uuid;
			jscd.pathname = window.location.pathname;
			jscd.href = window.location.href;
			jscd.hostname = window.location.hostname;

			if(ref_domain_list.length){
				for(var x = 0; x < ref_domain_list.length; x++){
					// var replace = "^https?:\/\/" + ref_domain_list[x] + "(\/|\.|$)";
					var replace = "^https?:\/\/([^\/]+\.)?" + ref_domain_list[x] + "(\/|\.|$)";
					var re = new RegExp(replace,"i");

					if(document.referrer.match(re)){
						check_ref =true;
						break;
					}
				}
			}else if(document.referrer == ''
				|| document.referrer == location.href
			){
				check_ref =true;
			}

			var quest_info = null;
			if(typeof(Storage) !== "undefined") {
				var uuid = localStorage.getItem(uuid_name);
				var quest_info = localStorage.getItem(uuid_name + '_quest');
				if(quest_info !== null){
					check_ref = true;
				}else{
					for (var key in localStorage){
						if(key.match(/traffic_(.*?)_quest/)){
							var quest_info = localStorage.getItem(key);
							if(quest_info !== null){
								quest_info = JSON.parse(quest_info);
								if(quest_info.hasOwnProperty('timestamp')
									&& quest_info.timestamp > Date.now() - 5 * 60 * 1000
								){
									check_ref = false;
									break;
								}else{
									quest_info = null;
								}
							}
						}
					}
				}
			}


			if(checkAdsClick()){
				return false;
			}
			forceShowButton();
			var element = document.getElementById(traffic_key);


			if(element
				&& check_ref
				&& get_code
			){
				loaded_script = true;
				// element.style.background = '#fff';
				element.style.padding = '5px';
				element.style.color = '#000';
				element.style.position = 'relative';

				var button = document.createElement("button");
				button.innerHTML = '<img src = "https://' + traffic_domain + '/images/icons/icon-x64.png" height="" style="padding:0;vertical-align:middle;padding-right:5px !important;width:auto !important;height:15px !important;display:inline-block !important;margin: 0!important;border: none!important;border-radius: unset!important;float: unset!important;background:none !important;"/> <span style="display:inline-block;vertical-align:middle;color:#fff">LẤY MÃ</span>';
				button.style.background = '#ed1c24';
				button.style.border = '1px solid #fff';
				button.style.color = '#fff';
				button.style.fontWeight = '700';
				button.style.fontSize = '14px';
				button.style.borderRadius = '7px';
				button.style.padding = '5px 10px';
				button.style.margin = '5px';
				button.style.minHeight = 'auto';
				button.style.minWidth = '150px';
				button.style.lineHeight = '20px';
				button.style.verticalAlign = 'middle';
				button.style.width = 'auto';
				button.style.zIndex = '2147483648';
				button.style.position = 'relative';

				show_code_button = document.createElement("div");
				show_code_button.classList.add("whatoncode");
				show_code_button.innerHTML = '';
				// show_code_button.style.background = '#ed1c24';
				// show_code_button.style.border = '1px solid #fff';
				// show_code_button.style.color = '#fff';
				// show_code_button.style.fontWeight = '700';
				// show_code_button.style.fontSize = '14px';
				// show_code_button.style.borderRadius = '7px';
				// show_code_button.style.padding = '10px 10px';
				// show_code_button.style.margin = '5px';
				// show_code_button.style.display = 'inline-block';
				// show_code_button.style.minHeight = 'auto';
				// show_code_button.style.minWidth = '150px';
				// show_code_button.style.lineHeight = '20px';
				// show_code_button.style.verticalAlign = 'middle';
				// show_code_button.style.width = 'auto';
				// show_code_button.style.zIndex = '2147483648';
				// show_code_button.style.position = 'fixed';
				// show_code_button.style.bottom = '150px';
				// show_code_button.style.right = '10px';
				// show_code_button.style.minWidth = '300px';

				show_code_button_wrapper = document.createElement("div");
				show_code_button_wrapper.classList.add("whatoncode-wrapper");
				show_code_button_wrapper.appendChild(show_code_button);

				const styleElem = document.head.appendChild(document.createElement("style"));
				styleElem.innerHTML = ".whatoncode-wrapper{z-index:2147483648;min-width:300px;right: 10px;bottom: 150px;position: fixed;}.whatoncode {z-index:2147483648;background: linear-gradient(90deg, #ff0000, #a70000);min-height:auto;display:inline-block;box-sizing:border-box;padding:10px 10px;border-radius:7px;font-size:14px;font-weight:700;color:#fff;width:100%;}.whatoncode:before, .whatoncode:after {content: '';position: absolute;border-radius: 10px;left: -2px;top: -2px;background: linear-gradient(45deg, #fb0094, #0000ff, #00ff00,#ffff00, #ff0000, #fb0094,#0000ff, #00ff00,#ffff00, #ff0000);background-size: 400%;width: calc(100% + 4px);height: calc(100% + 4px);z-index: -1;animation: steam 15s linear infinite,blink 1s linear infinite;}@keyframes steam {0% {background-position: 0 0;}33.33% {background-position: 400% 0;}100% {background-position: 400% 0;}}@keyframes blink {0%, 100% {opacity: 1;}50% {opacity: 0.5;}}.whatoncode:after {filter: blur(10px);}";


				element.innerHTML = '';
				element.appendChild(button);

				var nsec=1000*traffic_wait_time;
				var n_init=1000*traffic_wait_time;

				var ttt;
				if(quest_info !== null){
					nsec = 1000*traffic_step_2_wait_time;
					n_init = 1000*traffic_step_2_wait_time;
				}
				var clickHandler = ('ontouchstart' in document.documentElement ? "touchstart" : "click");
				

				button.addEventListener('mouseenter', e => {
					button.style.background = '#c40b11';
				});

				button.addEventListener('mouseleave', e => {
					button.style.background = '#ed1c24';
				});

				button.addEventListener('mousedown', e => {
					button.style.background = '#9a070d';
				});

				button.addEventListener('mouseup', e => {
					button.style.background = '#ed1c24';
				});

				button.addEventListener(clickHandler, function(){
					event.preventDefault();
					if(button_click){
						return;
					}
					button_click = true;
					detectIncognito().then((result) => {
						if(result.isPrivate){
							show_code_button.innerHTML= close_private_mode_message;
							element.innerHTML='';
							// document.body.appendChild(show_code_button);
							document.body.appendChild(show_code_button_wrapper);
						}else{
							var step = 1;
							get_code_after_string = get_code_after_string_step_1;
							if(typeof(Storage) !== "undefined") {
								var uuid = localStorage.getItem(uuid_name);
								var quest_info = localStorage.getItem(uuid_name + '_quest');
								if(quest_info !== null){
									quest_info = JSON.parse(quest_info);
									step = 2;
									total_step = 2;
									get_code_after_string = get_code_after_string_step_2;
								}
							}

							show_code_button.innerHTML= get_code_after_string + ' ' + nsec/1000 + 's (' + step + '/' + total_step + ')';
							element.innerHTML='';
							// document.body.appendChild(show_code_button);
							document.body.appendChild(show_code_button_wrapper);
							element.dataset.time = traffic_wait_time;
							element.dataset.click = 'true';

							if(ttt == undefined){

								window.setTimeout(function(){
									
									ttt=setInterval(function(){

										if(!mouse_scroll){
											show_code_button.innerHTML = get_code_after_string + ' ' + Math.ceil(nsec/1000) + 's (' + step + '/' + total_step + ')<br /><span style = "color:#ffff00">' + mouse_scroll_stop_message + '</span>';
											// show_code_button.style.opacity = 1;
											return;
										}

										// console.debug(nsec);

										traffic_blurred
										|| !mouse_scroll
										||(nsec-=100,
											(mouse_scroll_time + delay_time < Date.now() / 1000 && (mouse_scroll=0)),
											(element.dataset.click=='true'&&(show_code_button.innerHTML= get_code_after_string + ' ' + Math.ceil(nsec/1000) + 's (' + step + '/' + total_step + ')<br />' + mouse_scroll_continuous_message,element.innerHTML='')),
											element.dataset.time = nsec/1000,
											nsec<=0&&(clearInterval(ttt),checkButtonClick())
										);
										if( (n_init - nsec >= 900 && n_init - nsec <= 1000)
											|| (n_init - nsec >= 1100 && n_init - nsec <= 1200)
											|| (n_init - nsec >= 2500 && n_init - nsec <= 2600)
											|| (n_init - nsec >= 2700 && n_init - nsec <= 2800)
										){
											// show_code_button.style.opacity = 0;
										}else{
											// show_code_button.style.opacity = 1;
										}
									},100)
								},100);
							}
							
							var xmlhttp = new XMLHttpRequest();
							xmlhttp.withCredentials = true;
							xmlhttp.open("POST", "https://" + traffic_domain + "/widget/client.js", true);
							xmlhttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
							xmlhttp.onload = function() {if (xmlhttp.status === 200) {eval(xmlhttp.responseText);}};
							var jscd_param =  new URLSearchParams(jscd).toString();
							var params = 'traffic_session=' + vcfbdd + '&key=' + traffic_key + '&' + jscd_param;
							xmlhttp.send(params);
							
						}
					});

					return false;
				});
				
			}
		};

		if(jQuery != undefined){
			jQuery.fn.scrollParent = function(includeHidden) {
				try{
					var position = this.css("position"),
						excludeStaticParent = position === "absolute",
						overflowRegex = /(auto|scroll)/;

					var scrollParent = this.parents().filter(function() {
						var parent = jQuery(this);
						if (excludeStaticParent && parent.css("position") === "static") {
							return false;
						}
						return overflowRegex.test(parent.css("overflow") + parent.css("overflow-y"));
					}).eq(0);

					return position === "fixed" || !scrollParent.length ? jQuery(this[0].ownerDocument || document) : scrollParent;
				}catch(e){
				}
				return false;
			};
			jQuery(document).ready(initScript);
		}
		window.onload = initScript;
		if(document.readyState == 'complete'){
			initScript()
		}
		
	}
	function getClientInfo(){
		var unknown = '-';
		
	//	screen
		
		var screenSize = '';
		if (screen.width) {
			var width = (screen.width) ? screen.width : '';
			var height = (screen.height) ? screen.height : '';
			screenSize += '' + width + " x " + height;
		}
		
	//	browser
		
		var nVer = navigator.appVersion;
		var nAgt = navigator.userAgent;
		var browser = navigator.appName;
		var version = '' + parseFloat(navigator.appVersion);
		var majorVersion = parseInt(navigator.appVersion, 10);
		var nameOffset, verOffset, ix;
		
	//	Opera
	
		if ((verOffset = nAgt.indexOf('Opera')) != -1) {
			browser = 'Opera';
			version = nAgt.substring(verOffset + 6);
			if ((verOffset = nAgt.indexOf('Version')) != -1) {
				version = nAgt.substring(verOffset + 8);
			}
		}
		
	//	Opera Next
		
		if ((verOffset = nAgt.indexOf('OPR')) != -1) {
			browser = 'Opera';
			version = nAgt.substring(verOffset + 4);
		}
		
	//	MSIE
		
		else if ((verOffset = nAgt.indexOf('MSIE')) != -1) {
			browser = 'Microsoft Internet Explorer';
			version = nAgt.substring(verOffset + 5);
		}
		
	//	Chrome
		
		else if ((verOffset = nAgt.indexOf('Chrome')) != -1) {
			browser = 'Chrome';
			version = nAgt.substring(verOffset + 7);
		}
		
	//	Safari
		else if ((verOffset = nAgt.indexOf('Safari')) != -1) {
			browser = 'Safari';
			version = nAgt.substring(verOffset + 7);
			if ((verOffset = nAgt.indexOf('Version')) != -1) {
				version = nAgt.substring(verOffset + 8);
			}
		}
		
	//	Firefox
		else if ((verOffset = nAgt.indexOf('Firefox')) != -1) {
			browser = 'Firefox';
			version = nAgt.substring(verOffset + 8);
		}
	//	MSIE 11+
		else if (nAgt.indexOf('Trident/') != -1) {
			browser = 'Microsoft Internet Explorer';
			version = nAgt.substring(nAgt.indexOf('rv:') + 3);
		}
	//	Other browsers
		else if ((nameOffset = nAgt.lastIndexOf(' ') + 1) < (verOffset = nAgt.lastIndexOf('/'))) {
			browser = nAgt.substring(nameOffset, verOffset);
			version = nAgt.substring(verOffset + 1);
			if (browser.toLowerCase() == browser.toUpperCase()) {
				browser = navigator.appName;
			}
		}
	//	trim the version string
		
		if ((ix = version.indexOf(';')) != -1) version = version.substring(0, ix);
		if ((ix = version.indexOf(' ')) != -1) version = version.substring(0, ix);
		if ((ix = version.indexOf(')')) != -1) version = version.substring(0, ix);
		
		majorVersion = parseInt('' + version, 10);
		if (isNaN(majorVersion)) {
			version = '' + parseFloat(navigator.appVersion);
			majorVersion = parseInt(navigator.appVersion, 10);
		}
		
	//	mobile version
		
		var mobile = /Mobile|mini|Fennec|Android|iP(ad|od|hone)/.test(nVer);
		
	//	cookie
		
		var cookieEnabled = (navigator.cookieEnabled) ? true : false;
	
		if (typeof navigator.cookieEnabled == 'undefined' && !cookieEnabled) {
			document.cookie = 'testcookie';
			cookieEnabled = (document.cookie.indexOf('testcookie') != -1) ? true : false;
		}
	
	//	system
		
		var os = unknown;
		var clientStrings = 
		[{s:'Windows 10', r:/(Windows 10.0|Windows NT 10.0)/},
		 {s:'Windows 8.1', r:/(Windows 8.1|Windows NT 6.3)/},
		 {s:'Windows 8', r:/(Windows 8|Windows NT 6.2)/},
		 {s:'Windows 7', r:/(Windows 7|Windows NT 6.1)/},
		 {s:'Windows Vista', r:/Windows NT 6.0/},
		 {s:'Windows Server 2003', r:/Windows NT 5.2/},
		 {s:'Windows XP', r:/(Windows NT 5.1|Windows XP)/},
		 {s:'Windows 2000', r:/(Windows NT 5.0|Windows 2000)/},
		 {s:'Windows ME', r:/(Win 9x 4.90|Windows ME)/},
		 {s:'Windows 98', r:/(Windows 98|Win98)/},
		 {s:'Windows 95', r:/(Windows 95|Win95|Windows_95)/},
		 {s:'Windows NT 4.0', r:/(Windows NT 4.0|WinNT4.0|WinNT|Windows NT)/},
		 {s:'Windows CE', r:/Windows CE/},
		 {s:'Windows 3.11', r:/Win16/},
		 {s:'Android', r:/Android/},
		 {s:'Open BSD', r:/OpenBSD/},
		 {s:'Sun OS', r:/SunOS/},
		 {s:'Linux', r:/(Linux|X11)/},
		 {s:'iOS', r:/(iPhone|iPad|iPod)/},
		 {s:'Mac OS X', r:/Mac OS X/},
		 {s:'Mac OS', r:/(MacPPC|MacIntel|Mac_PowerPC|Macintosh)/},
		 {s:'QNX', r:/QNX/},
		 {s:'UNIX', r:/UNIX/},
		 {s:'BeOS', r:/BeOS/},
		 {s:'OS/2', r:/OS\/2/},
		 {s:'Search Bot', r:/(nuhk|Googlebot|Yammybot|Openbot|Slurp|MSNBot|Ask Jeeves\/Teoma|ia_archiver)/}
		];
		for (var id in clientStrings) {
			var cs = clientStrings[id];
			if (cs.r.test(nAgt)) {
				os = cs.s;
				break;
			}
		}
		
		var osVersion = unknown;
	
		if (/Windows/.test(os)) {
			osVersion = /Windows (.*)/.exec(os)[1];
			os = 'Windows';
		}
	
		switch (os) {
			case 'Mac OS X':
				osVersion = /Mac OS X (10[\.\_\d]+)/.exec(nAgt)[1];
				break;
				
			case 'Android':
				osVersion = /Android ([\.\_\d]+)/.exec(nAgt)[1];
				break;
				
			case 'iOS':
				osVersion = /OS (\d+)_(\d+)_?(\d+)?/.exec(nVer);
				osVersion = osVersion[1] + '.' + osVersion[2] + '.' + (osVersion[3] | 0);
				break;
				
		}
		
	//	flash (you'll need to include swfobject)
		/* script src="//ajax.googleapis.com/ajax/libs/swfobject/2.2/swfobject.js" */
		var flashVersion = 'no check';
		if (typeof swfobject != 'undefined') {
			var fv = swfobject.getFlashPlayerVersion();
			if (fv.major > 0) {
				flashVersion = fv.major + '.' + fv.minor + ' r' + fv.release;
			}else{
				flashVersion = unknown;
			}
		}
		jscd.screen = screenSize;
		jscd.browser = browser;
		jscd.browserVersion = version;
		jscd.browserMajorVersion = majorVersion;
		jscd.mobile = mobile;
		jscd.os = os;
		jscd.osVersion = osVersion;
		jscd.cookies = cookieEnabled;
		jscd.flashVersion = flashVersion;
		jscd.lang = navigator.language;
	}
	function generateUUID(){
		var d = new Date().getTime();
		if(window.performance && typeof window.performance.now === "function"){
			d += performance.now(); //use high-precision timer if available
		}
		
		var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
			var r = (d + Math.random()*16)%16 | 0;
			d = Math.floor(d/16);
			return (c=='x' ? r : (r&0x3|0x8)).toString(16);
		});
		return uuid;
	}
	function isFirstLoad(namesp){
		var isFirst = namesp.firstLoad === undefined;
		namesp.firstLoad = false;
		return isFirst;
	};
	function checkButtonClick(){
		var element = document.getElementById(traffic_key);
		if((element.dataset.loading == undefined || element.dataset.loading == 'false')
			&& element.dataset.click == 'true'
			&& element.dataset.loaded == undefined 
			&& element.dataset.time <= 0
		){

			var step = 1;
			if(typeof(Storage) !== "undefined") {
				var uuid = localStorage.getItem(uuid_name);
				var quest_info = localStorage.getItem(uuid_name + '_quest');
				if(quest_info !== null){
					quest_info = JSON.parse(quest_info);
					step = 2;
					total_step = 2;
				}
			}
			// console.log(step);
			element.dataset.loading = 'true';

			switch(step){
				case 2 :
					var xmlhttp = new XMLHttpRequest();
					xmlhttp.withCredentials = true;


					xmlhttp.onreadystatechange = function() {
						if (xmlhttp.readyState == XMLHttpRequest.DONE) {   // XMLHttpRequest.DONE == 4
							if (xmlhttp.status == 200) {
								var result = JSON.parse(xmlhttp.responseText)
								if(result.success == true){
									show_code_button.style.minWidth = '';
									show_code_button.innerHTML = 'Mã KM: ' + result.html + '<img src="https://' + traffic_domain + '/images/icons/icon-copy.png" style="height: 14px;margin-left: 3px;vertical-align: middle;display: inline-block;margin-top: -5px;width:auto;">';

									show_code_button.addEventListener("click", function(){
										if(copyTextToClipboard(result.html)){
											var tooltip = createTooltip('Đã sao chép mã');
											element.appendChild(tooltip);

											window.setTimeout(function(){
												tooltip.remove();
											},3000);
										}
										return false;
									});
									window.removeEventListener('scroll',checkScroll,false);
									localStorage.removeItem(uuid_name + '_quest');
									element.dataset.loaded = true;
								}else{
									if(!retry){
										retry = true;
										// element.dataset.loading = 'false';
										// checkButtonClick();
									}else{
									}
									localStorage.removeItem(uuid_name + '_quest');
									show_code_button.innerHTML = get_code_error_message;
								}
							}else{
								if(!retry){
									retry = true;
									element.dataset.loading = 'false';
									checkButtonClick();
								}else{
									localStorage.removeItem(uuid_name + '_quest');
									show_code_button.innerHTML = get_code_error_message;
								}
							}
						}
					};
					xmlhttp.addEventListener("loadend", function(){
						element.dataset.loading = 'false';
					});
					var jscd_param =  new URLSearchParams(jscd).toString();
					xmlhttp.open("GET", "https://" + traffic_domain + "/widget/get_quest_code.html?id=" + quest_info.id + "&code=" + traffic_id + '&traffic_session=' + vcfbdd + '&key=' + traffic_key + '&' + jscd_param, true);
					xmlhttp.send();
					break;
				case 1:
				default:
					var code = element.dataset.code;
					var xmlhttp = new XMLHttpRequest();
					xmlhttp.withCredentials = true;

					element.dataset.loading = 'true';

					xmlhttp.onreadystatechange = function() {
						if (xmlhttp.readyState == XMLHttpRequest.DONE) {   // XMLHttpRequest.DONE == 4
							if (xmlhttp.status == 200) {
								var result = JSON.parse(xmlhttp.responseText)
								if(result.success == true){
									if(result.hasOwnProperty('id')){
										show_code_button.innerHTML = result.html;
										window.removeEventListener('scroll',checkScroll,false);
										
										localStorage.setItem(uuid_name + '_quest', JSON.stringify({
											href : window.location.href,
											'traffic_session' : vcfbdd,
											'id' : result.id,
											timestamp: Date.now()
										}));
										element.dataset.loaded = true;
									}else{
										show_code_button.style.minWidth = '';
										show_code_button.innerHTML = 'Mã KM: ' + result.html + '<img src="https://' + traffic_domain + '/images/icons/icon-copy.png" style="height: 14px;margin-left: 3px;vertical-align: middle;display: inline-block;margin-top: -5px;width:auto;">';

										show_code_button.addEventListener("click", function(){
											if(copyTextToClipboard(result.html)){
												var tooltip = createTooltip('Đã sao chép mã');
												element.appendChild(tooltip);

												window.setTimeout(function(){
													tooltip.remove();
												},3000);
											}
											return false;
										});
										window.removeEventListener('scroll',checkScroll,false);
										localStorage.removeItem(uuid_name + '_quest');
										element.dataset.loaded = true;
									}
								}else{
									if(!retry){
										retry = true;
										// element.dataset.loading = 'false';
										// checkButtonClick();
									}else{
									}
									show_code_button.innerHTML = get_code_error_message;
								}
							}else{
								if(!retry){
									retry = true;
									element.dataset.loading = 'false';
									checkButtonClick();
								}else{
									show_code_button.innerHTML = get_code_error_message;
								}
							}
						}
					};
					xmlhttp.addEventListener("loadend", function(){
						element.dataset.loading = 'false';
					});
					var jscd_param =  new URLSearchParams(jscd).toString();
					xmlhttp.open("GET", "https://" + traffic_domain + "/widget/get_quest_code.html?code=" + traffic_id + '&traffic_session=' + vcfbdd + '&key=' + traffic_key + '&' + jscd_param, true);
					xmlhttp.send();
					break;

			}

		}
	}


	function checkScroll(){
		return false;
		var element = document.getElementById(traffic_key);
		var rect = element.getBoundingClientRect();
		if(rect.top <= (window.innerHeight || document.documentElement.clientHeight)
			&& (element.dataset.loading == undefined || element.dataset.loading == 'false')
			&& element.dataset.loaded == undefined 
			&& element.dataset.time <= 0
		){
			var xmlhttp = new XMLHttpRequest();
			xmlhttp.withCredentials = true;

			element.dataset.loading = 'true';

			xmlhttp.onreadystatechange = function() {
				if (xmlhttp.readyState == XMLHttpRequest.DONE) {   // XMLHttpRequest.DONE == 4
					if (xmlhttp.status == 200) {
						var result = JSON.parse(xmlhttp.responseText)
						if(result.success == true){
							show_code_button.innerHTML = 'Mã KM: ' + result.html;
							window.removeEventListener('scroll',checkScroll,false);
							element.dataset.loaded = true;
						}else{
							// element.remove();
							element.getElementsByTagName("div")[0].innerHTML = get_code_error_message;
						}
					}else{
						if(element.dataset.retry == undefined){
							// checkButtonClick();
						}else{
							// element.remove();
						}
						element.getElementsByTagName("div")[0].innerHTML = get_code_error_message;
					}
				}else{
					if(element.dataset.retry == undefined){
						// checkButtonClick();
					}else{
						
						// element.remove();
					}
					element.getElementsByTagName("div")[0].innerHTML = get_code_error_message;
				}
			};
			xmlhttp.addEventListener("loadend", function(){
				element.dataset.loading = 'false';
			});
			var jscd_param =  new URLSearchParams(jscd).toString();
			xmlhttp.open("GET", "https://" + traffic_domain + "/widget/get_quest_code.html?code=" + traffic_id + '&traffic_session=' + vcfbdd + '&key=' + traffic_key + '&' + jscd_param, true);
			xmlhttp.send();
		}
	}
	function onchange (evt) {
		var v = "visible", h = "hidden",
		evtMap = {
			focus:v, focusin:v, pageshow:v, blur:h, focusout:h, pagehide:h
		};
		evt = evt || window.event;
		if (evt.type in evtMap)
			traffic_blurred = evtMap[evt.type] == 'hidden';
		else
			traffic_blurred = this[hidden] ? 1 : 0;
	}

	function mouseScroll(evt){

		var tmp = getOffset();
		var scroll_element;
		if(jQuery != undefined){
			var scroll_element = jQuery(evt.target).scrollParent();
		}
		if(scroll_element){
			tmp += scroll_element.scrollTop();
		}
		if(mouse_offset != tmp){
			mouse_scroll = 1;
			mouse_offset = tmp;
			mouse_scroll_time = Date.now() / 1000;
	
			var page_height = Math.max( document.body.scrollHeight, 
				document.body.offsetHeight, 
				document.documentElement.clientHeight, 
				document.documentElement.scrollHeight, 
				document.documentElement.offsetHeight 
			);
			if(tmp < page_height * 10 / 100){
				mouse_scroll_stop_message = mouse_scroll_down_stop_message;
				mouse_scroll_continuous_message = mouse_scroll_down_continuous_message;
			}else if(tmp + screen.height > page_height * 90 / 100){
				mouse_scroll_stop_message = mouse_scroll_up_stop_message;
				mouse_scroll_continuous_message = mouse_scroll_up_continuous_message;
			}
		}
	}
	function getOffset(){
		if (window.pageYOffset != undefined) {
			return pageYOffset;
		} else {
			var sx, sy, d = document,
				r = d.documentElement,
				b = d.body;
				sy = r.scrollTop || b.scrollTop || 0;
			return sy;
		}
	}

	function copyTextToClipboard(text){
		var textArea = document.createElement("textarea");
	
		textArea.style.position = 'fixed';
		textArea.style.top = 0;
		textArea.style.left = 0;
			
		textArea.style.width = '2em';
		textArea.style.height = '2em';
			
		textArea.style.padding = 0;
			
		textArea.style.border = 'none';
		textArea.style.outline = 'none';
		textArea.style.boxShadow = 'none';
			
		textArea.style.background = 'transparent';
		textArea.value = text;
		document.body.appendChild(textArea);
		
		textArea.select();
		
		var successful = false;
		try {
			var tmp = document.oncopy;
			document.oncopy = function(){};
			successful = document.execCommand('copy');
			document.oncopy = tmp;
		} catch (err) {
		}
		document.body.removeChild(textArea);
		return successful;
	}

	function createTooltip(text){

		var tooltip = document.createElement("div");
		tooltip.style.right = '100px';
		tooltip.style.display = 'block';
		tooltip.style.padding = '5px 0';
		tooltip.style.opacity = '0.9';
		tooltip.style.position = 'fixed';
		tooltip.style.bottom = '200px';

		var arrow = document.createElement("div");
		arrow.style.left = '50%';
		arrow.style.bottom = '0';
		arrow.style.marginLeft = '-5px';
		arrow.style.borderWidth = '5px 5px 0';
		arrow.style.position = 'absolute';
		arrow.style.width = '0';
		arrow.style.height = '0';
		arrow.style.borderColor = 'transparent';
		arrow.style.borderStyle = 'solid';
		arrow.style.borderTopColor = '#000';

		var inner = document.createElement("div");
		inner.style.padding = '3px 8px';
		inner.style.color = '#fff';
		inner.style.textAlign = 'center';
		inner.style.backgroundColor = '#000';
		inner.style.borderRadius = '4px';
		inner.innerHTML = text;

		tooltip.appendChild(arrow);
		tooltip.appendChild(inner);

		return tooltip;
	}
	function checkAdsClick(){
		var ads_click = false;
		var url_string = window.location.href; // www.test.com?filename=test
		var url = new URL(url_string);

		if(url.searchParams.get('gclid') != null){
			ads_click = true;
		}
		return ads_click;
	}
	function forceShowButton(){
		if(window.location.hash != ''){
			var hash = window.location.hash.split('-');
			if(hash[0] == '#ss'){
				check_ref = false;
				if(hash[1] == traffic_key){
					check_ref = true;
					get_code = true;
					return true;
				}
			}
		}
		return false;
	}
	async function detectIncognito() {
		return new Promise(function (resolve, reject) {
			var browserName = "Unknown";
			function __callback(isPrivate) {
				resolve({
					isPrivate: isPrivate,
					browserName: browserName
				});
			}
			function identifyChromium() {
				var ua = navigator.userAgent;
				if (ua.match(/Chrome/)) {
					if (navigator.brave !== undefined) {
						return "Brave";
					}
					else if (ua.match(/Edg/)) {
						return "Edge";
					}
					else if (ua.match(/OPR/)) {
						return "Opera";
					}
					return "Chrome";
				}
				else {
					return "Chromium";
				}
			}
			function assertEvalToString(value) {
				return value === eval.toString().length;
			}
			function feid(){
				let toFixedEngineID = 0;
				let neg = parseInt("-1");
				try {
					neg.toFixed(neg);
				} catch (e) {
					toFixedEngineID = e.message.length;
				}
				return toFixedEngineID;
			}

			function isSafari() {
				// var v = navigator.vendor;
				// return (v !== undefined && v.indexOf("Apple") === 0 && assertEvalToString(37));
				return feid() === 44 || feid() === 43;
			}
			function isChrome() {
				// var v = navigator.vendor;
				// return (v !== undefined && v.indexOf("Google") === 0 && assertEvalToString(33));
				return feid() === 51;
			}
			function isFirefox() {
				// return (document.documentElement !== undefined &&
				// 	document.documentElement.style.MozAppearance !== undefined &&
				// 	assertEvalToString(37));
				return feid() === 25;
			}
			function isMSIE() {
				return (navigator.msSaveBlob !== undefined && assertEvalToString(39));
				// return navigator.msSaveBlob !== undefined;
			}
			async function currentSafariTest() {
				try {
					await navigator.storage.getDirectory();
					__callback(false)
				} catch (e) {
					let message = (e instanceof Error && typeof e.message === 'string') ? e.message : String(e);
					const matchesExpectedError = message.includes('unknown transient reason');
					__callback(matchesExpectedError);
				}
			}

			/**
			 * Safari (Safari for iOS & macOS)
			 **/
			function newSafariTest() {
				var tmp_name = String(Math.random());
				try {
					var db = window.indexedDB.open(tmp_name, 1);
					db.onupgradeneeded = function (i) {
						var _a, _b;
						var res = (_a = i.target) === null || _a === void 0 ? void 0 : _a.result;
						try {
							res.createObjectStore("test", {
								autoIncrement: true
							}).put(new Blob);
							__callback(false);
						}
						catch (e) {
							var message = e;
							if (e instanceof Error) {
							    message = (_b = e.message) !== null && _b !== void 0 ? _b : e;
							}
							if (typeof message !== 'string') {
							    return __callback(false);
							}
							var matchesExpectedError = /BlobURLs are not yet supported/.test(message);
							return __callback(matchesExpectedError);
						}
						finally {
							res.close();
							window.indexedDB.deleteDatabase(tmp_name);
						}
					};
				}
				catch (e) {
					return __callback(false);
				}
			}
			function oldSafariTest() {
				var openDB = window.openDatabase;
				var storage = window.localStorage;
				try {
					openDB(null, null, null, null);
				}
				catch (e) {
					return __callback(true);
				}
				try {
					storage.setItem("test", "1");
					storage.removeItem("test");
				}
				catch (e) {
					return __callback(true);
				}
				return __callback(false);
			}
			async function safariPrivateTest() {
				if (typeof navigator.storage?.getDirectory === 'function') {
					await currentSafariTest();
				} else if (navigator.maxTouchPoints !== undefined) {
					newSafariTest();
				}
				else {
					oldSafariTest();
				}
			}
			/**
			 * Chrome
			 **/
			function getQuotaLimit() {
				var w = window;
				if (w.performance !== undefined &&
					w.performance.memory !== undefined &&
					w.performance.memory.jsHeapSizeLimit !== undefined) {
				return performance.memory.jsHeapSizeLimit;
				}
				return 1073741824;
			}
			// >= 76
			function storageQuotaChromePrivateTest() {
				navigator.webkitTemporaryStorage.queryUsageAndQuota(function (_, quota) {
					var quotaInMib = Math.round(quota / (1024 * 1024));
					var quotaLimitInMib = Math.round(getQuotaLimit() / (1024 * 1024)) * 2;
					__callback(quotaInMib < quotaLimitInMib);
				}, function (e) {
					reject(new Error("detectIncognito somehow failed to query storage quota: " + e.message));
				});
			}
			// 50 to 75
			function oldChromePrivateTest() {
				var fs = window.webkitRequestFileSystem;
				var success = function () {
					__callback(false);
				};
				var error = function () {
					__callback(true);
				};
				fs(0, 1, success, error);
			}
			function chromePrivateTest() {
				if (self.Promise !== undefined && self.Promise.allSettled !== undefined) {
					storageQuotaChromePrivateTest();
				}
				else {
					oldChromePrivateTest();
				}
			}
			/**
			 * Firefox
			 **/
			async function firefoxPrivateTest() {
				if (typeof navigator.storage?.getDirectory === 'function') {
					try {
						await navigator.storage.getDirectory()
						__callback(false)
					} catch (e) {
						let message = (e instanceof Error && typeof e.message === 'string') ? e.message : String(e)

						const matchesExpectedError = message.includes('Security error')

						__callback(matchesExpectedError); return
					}
				}else {
					const request = indexedDB.open('inPrivate');

					request.onerror = (event) => {
						if (request.error && request.error.name === 'InvalidStateError') {
							event.preventDefault();
						}
						__callback(true);
					};

					request.onsuccess = () => {
						indexedDB.deleteDatabase('inPrivate');
						__callback(false);
					};
				}
			}
			/**
			 * MSIE
			 **/
			function msiePrivateTest() {
				__callback(window.indexedDB === undefined);
			}
			async function main() {
				if (isSafari()) {
					browserName = 'Safari';
					await safariPrivateTest();
				}
				else if (isChrome()) {
					browserName = identifyChromium();
					chromePrivateTest();
				}
				else if (isFirefox()) {
					browserName = "Firefox";
					await firefoxPrivateTest();
				}
				else if (isMSIE()) {
					browserName = "Internet Explorer";
					msiePrivateTest();
				}
				else {
					reject(new Error("detectIncognito cannot determine the browser"));
				}
			}
			main();
		});
	};
	
})();

