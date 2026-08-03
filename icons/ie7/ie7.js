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
		'icon-advan-1': '&#xe900;',
		'icon-advan-2': '&#xe901;',
		'icon-advan-3': '&#xe902;',
		'icon-advan-4': '&#xe903;',
		'icon-advan-5': '&#xe904;',
		'icon-air': '&#xe905;',
		'icon-arrow-left-big': '&#xe906;',
		'icon-arrow-left-long': '&#xe907;',
		'icon-arrow-right-big': '&#xe908;',
		'icon-arrow-right-long': '&#xe909;',
		'icon-arrow-right-thin': '&#xe90a;',
		'icon-cases': '&#xe90b;',
		'icon-close': '&#xe90c;',
		'icon-close-circle-inside': '&#xe90d;',
		'icon-contacts': '&#xe90e;',
		'icon-contacts-icon-1': '&#xe90f;',
		'icon-contacts-icon-2': '&#xe910;',
		'icon-contacts-icon-3': '&#xe911;',
		'icon-copy': '&#xe912;',
		'icon-danger': '&#xe913;',
		'icon-down': '&#xe914;',
		'icon-download': '&#xe915;',
		'icon-eaeu': '&#xe916;',
		'icon-exit': '&#xe917;',
		'icon-ground': '&#xe918;',
		'icon-gruz': '&#xe919;',
		'icon-kuda': '&#xe91a;',
		'icon-lightning': '&#xe91b;',
		'icon-max': '&#xe91c;',
		'icon-max-glass': '&#xe91d;',
		'icon-minus': '&#xe91e;',
		'icon-otkuda': '&#xe91f;',
		'icon-person': '&#xe920;',
		'icon-phone': '&#xe921;',
		'icon-plus': '&#xe922;',
		'icon-pochta': '&#xe923;',
		'icon-presentation': '&#xe924;',
		'icon-raketa': '&#xe925;',
		'icon-refrigerated': '&#xe926;',
		'icon-requisite': '&#xe927;',
		'icon-rf': '&#xe928;',
		'icon-services-icon-air': '&#xe929;',
		'icon-services-icon-country': '&#xe92a;',
		'icon-services-icon-ground': '&#xe92b;',
		'icon-tg': '&#xe92c;',
		'icon-tg-glass': '&#xe92d;',
		'icon-triangle': '&#xe92e;',
		'icon-unofficial': '&#xe92f;',
		'icon-wa': '&#xe930;',
		'icon-wa-glass': '&#xe931;',
		'icon-yandex-maps': '&#xe932;',
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
