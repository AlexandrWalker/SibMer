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
		'icon-danger': '&#xe90e;',
		'icon-down': '&#xe90f;',
		'icon-download': '&#xe910;',
		'icon-eaeu': '&#xe911;',
		'icon-ground': '&#xe912;',
		'icon-kuda': '&#xe913;',
		'icon-max': '&#xe914;',
		'icon-minus': '&#xe915;',
		'icon-otkuda': '&#xe916;',
		'icon-person': '&#xe917;',
		'icon-phone': '&#xe918;',
		'icon-plus': '&#xe919;',
		'icon-pochta': '&#xe91a;',
		'icon-presentation': '&#xe91b;',
		'icon-refrigerated': '&#xe91c;',
		'icon-rf': '&#xe91d;',
		'icon-tg': '&#xe91e;',
		'icon-unofficial': '&#xe91f;',
		'icon-wa': '&#xe920;',
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
