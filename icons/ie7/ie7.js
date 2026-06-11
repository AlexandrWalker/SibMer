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
		'icon-exit': '&#xe929;',
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
		'icon-ground': '&#xe916;',
		'icon-kuda': '&#xe917;',
		'icon-max': '&#xe918;',
		'icon-minus': '&#xe919;',
		'icon-otkuda': '&#xe91a;',
		'icon-person': '&#xe91b;',
		'icon-phone': '&#xe91c;',
		'icon-plus': '&#xe91d;',
		'icon-pochta': '&#xe91e;',
		'icon-presentation': '&#xe91f;',
		'icon-refrigerated': '&#xe920;',
		'icon-rf': '&#xe921;',
		'icon-services-icon-air': '&#xe922;',
		'icon-services-icon-country': '&#xe923;',
		'icon-services-icon-ground': '&#xe924;',
		'icon-tg': '&#xe925;',
		'icon-triangle': '&#xe926;',
		'icon-unofficial': '&#xe927;',
		'icon-wa': '&#xe928;',
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
