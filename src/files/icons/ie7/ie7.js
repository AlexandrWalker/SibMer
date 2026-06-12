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
		'icon-contacts': '&#xe90d;',
		'icon-contacts-icon-1': '&#xe90e;',
		'icon-contacts-icon-2': '&#xe90f;',
		'icon-contacts-icon-3': '&#xe910;',
		'icon-copy': '&#xe911;',
		'icon-danger': '&#xe912;',
		'icon-down': '&#xe913;',
		'icon-download': '&#xe914;',
		'icon-eaeu': '&#xe915;',
		'icon-exit': '&#xe916;',
		'icon-ground': '&#xe917;',
		'icon-kuda': '&#xe918;',
		'icon-max': '&#xe919;',
		'icon-max-glass': '&#xe91a;',
		'icon-minus': '&#xe91b;',
		'icon-otkuda': '&#xe91c;',
		'icon-person': '&#xe91d;',
		'icon-phone': '&#xe91e;',
		'icon-plus': '&#xe91f;',
		'icon-pochta': '&#xe920;',
		'icon-presentation': '&#xe921;',
		'icon-refrigerated': '&#xe922;',
		'icon-rf': '&#xe923;',
		'icon-services-icon-air': '&#xe924;',
		'icon-services-icon-country': '&#xe925;',
		'icon-services-icon-ground': '&#xe926;',
		'icon-tg': '&#xe927;',
		'icon-tg-glass': '&#xe928;',
		'icon-triangle': '&#xe929;',
		'icon-unofficial': '&#xe92a;',
		'icon-wa': '&#xe92b;',
		'icon-wa-glass': '&#xe92c;',
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
