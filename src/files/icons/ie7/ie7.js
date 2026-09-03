/* To avoid CSS expressions while still supporting IE 7 and IE 6, use this script */
/* The script tag referencing this file must be placed before the ending body tag. */

/* Use conditional comments in order to target IE 7 and older:
	<!--[if lt IE 8]><!-->
	<script src="ie7/ie7.js"></script>
	<!--<![endif]-->
*/

(function() {
	function addIcon(el, entity) {
		var html = el.innerHTML;
		el.innerHTML = '<span style="font-family: \'SibMerIconFont\'">' + entity + '</span>' + html;
	}
	var icons = {
		'icon-gis-maps': '&#xe900;',
		'icon-advan-1': '&#xe901;',
		'icon-advan-1-1': '&#xe903;',
		'icon-advan-2': '&#xe904;',
		'icon-advan-3': '&#xe905;',
		'icon-advan-4': '&#xe906;',
		'icon-advan-5': '&#xe907;',
		'icon-air': '&#xe908;',
		'icon-arrow-left-big': '&#xe909;',
		'icon-arrow-left-long': '&#xe90a;',
		'icon-arrow-right-big': '&#xe90b;',
		'icon-arrow-right-long': '&#xe90c;',
		'icon-arrow-right-thin': '&#xe90d;',
		'icon-auto-icon-1': '&#xe90e;',
		'icon-auto-icon-2': '&#xe90f;',
		'icon-auto-icon-3': '&#xe910;',
		'icon-auto-icon-4': '&#xe911;',
		'icon-auto-icon-5': '&#xe912;',
		'icon-auto-icon-6': '&#xe913;',
		'icon-avia-icon-1': '&#xe914;',
		'icon-avia-icon-2': '&#xe915;',
		'icon-avia-icon-3': '&#xe916;',
		'icon-avia-icon-4': '&#xe917;',
		'icon-avia-icon-5': '&#xe918;',
		'icon-avia-icon-6': '&#xe919;',
		'icon-cases': '&#xe91a;',
		'icon-close': '&#xe91b;',
		'icon-close-circle-inside': '&#xe91c;',
		'icon-contacts': '&#xe91d;',
		'icon-contacts-icon-1': '&#xe91e;',
		'icon-contacts-icon-2': '&#xe91f;',
		'icon-contacts-icon-3': '&#xe920;',
		'icon-copy': '&#xe921;',
		'icon-danger': '&#xe922;',
		'icon-down': '&#xe923;',
		'icon-download': '&#xe924;',
		'icon-eaeu': '&#xe925;',
		'icon-exit': '&#xe926;',
		'icon-ground': '&#xe929;',
		'icon-gruz': '&#xe92a;',
		'icon-inter-icon-1': '&#xe92b;',
		'icon-inter-icon-2': '&#xe92c;',
		'icon-inter-icon-3': '&#xe92d;',
		'icon-inter-icon-4': '&#xe92e;',
		'icon-inter-icon-5': '&#xe92f;',
		'icon-kuda': '&#xe930;',
		'icon-lightning': '&#xe931;',
		'icon-max': '&#xe932;',
		'icon-max-glass': '&#xe933;',
		'icon-minus': '&#xe934;',
		'icon-otkuda': '&#xe935;',
		'icon-person': '&#xe936;',
		'icon-phone': '&#xe937;',
		'icon-plus': '&#xe938;',
		'icon-pochta': '&#xe939;',
		'icon-presentation': '&#xe93a;',
		'icon-raketa': '&#xe93b;',
		'icon-refrigerated': '&#xe93c;',
		'icon-requisite': '&#xe93d;',
		'icon-rf': '&#xe93e;',
		'icon-services-icon-air': '&#xe93f;',
		'icon-services-icon-country': '&#xe940;',
		'icon-services-icon-ground': '&#xe941;',
		'icon-tg': '&#xe942;',
		'icon-tg-glass': '&#xe943;',
		'icon-triangle': '&#xe944;',
		'icon-unofficial': '&#xe945;',
		'icon-wa': '&#xe946;',
		'icon-wa-glass': '&#xe947;',
		'icon-yandex-maps': '&#xe948;',
		'0': 0
		},
		els = document.getElementsByTagName('*'),
		i, c, el;
	for (i = 0; ; i += 1) {
		el = els[i];
		if(!el) {
			break;
		}
		c = el.className;
		c = c.match(/icon-[^\s'"]+/);
		if (c && icons[c[0]]) {
			addIcon(el, icons[c[0]]);
		}
	}
}());
