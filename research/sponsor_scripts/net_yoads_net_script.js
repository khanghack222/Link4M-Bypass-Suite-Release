var initYoAdsNetworkScript = initYoAdsNetworkScript || {};
const yoAdsNetworkModule = (function() {
// Localize jQuery variable
var jQuery;
var home_page = 'https://net.yoads.net';

if (!isFirstLoad(initYoAdsNetworkScript)) {
	return;
}
/******** Load jQuery if not present *********/
if (window.jQuery === undefined || window.jQuery.fn.jquery !== '1.12.4') {
	
    var script_tag = document.createElement('script');
    script_tag.setAttribute("type","text/javascript");
    script_tag.setAttribute("src",
        "https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.min.js");
    if (script_tag.readyState) {
      script_tag.onreadystatechange = function () {
          if (this.readyState == 'complete' || this.readyState == 'loaded') {
              scriptYoadsNetworkLoadHandler();
          }
      };
    } else {
      script_tag.onload = scriptYoadsNetworkLoadHandler;
    }
    // Try to find the head, otherwise default to the documentElement
    (document.getElementsByTagName("head")[0] || document.documentElement).appendChild(script_tag);
} else {
    // The jQuery version on the window is the one we want to use
    jQuery = window.jQuery;
    yoads_network_main();
}

/******** Called once jQuery has loaded ******/
function scriptYoadsNetworkLoadHandler() {
    jQuery = window.jQuery.noConflict(true);
    yoads_network_main(); 
}

/******** Our yoads_network_main function ********/
function yoads_network_main() {
    jQuery(document).ready(function($) {
    	var width = $('#example-widget-container').width();
    	getClientInfo();    	
    	
        /******* Load HTML *******/
    	
    	if(typeof(Storage) !== "undefined") {
    		var uuid = localStorage.getItem("yoadsnetword_uuid");
    		if(uuid === null){
    			var uuid = generateUUID();
    			localStorage.setItem("yoadsnetword_uuid", uuid);
    		}
    	}else{
    		var uuid = generateUUID();
    	}
    	
    	window.jscd.client_id = uuid;
    	window.jscd.pathname = window.location.pathname;
    	window.jscd.href = window.location.href;
    	window.jscd.hostname = window.location.hostname;
    	
    	loadAds();
    	
    	
    });
}
function loadAds(){
	jQuery( "div.yoads_network_widget" ).each(function( index ) {
		var _this = jQuery(this);
		var loadads = false;
		if(_this.data('loadads') == 'true'){
			loadads = true;
		}
		if( 
			jQuery( this ).data('adClient')
			&& jQuery( this ).data('adSlot')
			&& !loadads
		){
			window.jscd.publisher_id = jQuery( this ).data('adClient');
			window.jscd.slot_id = jQuery( this ).data('adSlot');
			
			var jsonp_url = home_page + "/widget/get_link.js?callback=?&" + jQuery.param( jscd );
			_this.data('loadads','true');
			jQuery.getJSON(jsonp_url, function(data) {
				if(data.success == true ){   
					var iframe = document.createElement('iframe');
					iframe.frameBorder=0;
					if(data.width != 0){
						iframe.width=data.width + "px";
					}else{
						iframe.style.width='100%';
						iframe.width='100%';
					}
					if(data.height != 0){
						iframe.height=data.height + "px";
					}
					iframe.id="randomid";
					iframe.scrolling="no";
					iframe.style="overflow:hidden;left";
					iframe.setAttribute("src", data.link);
					_this[0].appendChild(iframe);
					if(data.width != 0){
						_this.width(data.width);
					}else{
						_this.width('100%');
					}
				}
			});
		};
	});
}
function getClientInfo(){
	var unknown = '-';
	
//	screen
	
	var screenSize = '';
	if (screen.width) {
		width = (screen.width) ? screen.width : '';
		height = (screen.height) ? screen.height : '';
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
	window.jscd = {
			screen: screenSize,
			browser: browser,
			browserVersion: version,
			browserMajorVersion: majorVersion,
			mobile: mobile,
			os: os,
			osVersion: osVersion,
			cookies: cookieEnabled,
			flashVersion: flashVersion
	};
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
return {
	loadAds : loadAds
}
})();