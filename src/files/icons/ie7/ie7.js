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
		'icon-included-icon-5': '&#xe900;',
		'icon-included-icon-6': '&#xe901;',
		'icon-included-icon-4': '&#xe902;',
		'icon-included-icon-3': '&#xe903;',
		'icon-included-icon-2': '&#xe904;',
		'icon-included-icon-1': '&#xe905;',
		'icon-inter-icon-2': '&#xe906;',
		'icon-inter-icon-3': '&#xe907;',
		'icon-inter-icon-4': '&#xe908;',
		'icon-inter-icon-5': '&#xe909;',
		'icon-inter-icon-1': '&#xe90a;',
		'icon-auto-icon-1': '&#xe90b;',
		'icon-auto-icon-2': '&#xe90c;',
		'icon-auto-icon-3': '&#xe90d;',
		'icon-auto-icon-4': '&#xe90e;',
		'icon-auto-icon-5': '&#xe90f;',
		'icon-auto-icon-6': '&#xe910;',
		'icon-avia-icon-2': '&#xe911;',
		'icon-avia-icon-3': '&#xe912;',
		'icon-avia-icon-4': '&#xe913;',
		'icon-avia-icon-5': '&#xe914;',
		'icon-avia-icon-6': '&#xe915;',
		'icon-avia-icon-1': '&#xe916;',
		'icon-advan-1-1': '&#xe917;',
		'icon-advan-4': '&#xe918;',
		'icon-advan-1': '&#xe919;',
		'icon-close-circle-inside': '&#xe91b;',
		'icon-requisite': '&#xe91c;',
		'icon-raketa': '&#xe91d;',
		'icon-lightning': '&#xe91e;',
		'icon-gruz': '&#xe91f;',
		'icon-wa-glass': '&#xe920;',
		'icon-tg-glass': '&#xe921;',
		'icon-max-glass': '&#xe922;',
		'icon-exit': '&#xe923;',
		'icon-services-icon-ground': '&#xe924;',
		'icon-services-icon-air': '&#xe925;',
		'icon-services-icon-country': '&#xe926;',
		'icon-triangle': '&#xe927;',
		'icon-copy': '&#xe928;',
		'icon-contacts-icon-3': '&#xe929;',
		'icon-contacts-icon-2': '&#xe92a;',
		'icon-contacts-icon-1': '&#xe92b;',
		'icon-arrow-right-thin': '&#xe938;',
		'icon-presentation': '&#xe939;',
		'icon-cases': '&#xe93a;',
		'icon-advan-5': '&#xe93b;',
		'icon-advan-3': '&#xe93c;',
		'icon-advan-2': '&#xe93d;',
		'icon-unofficial': '&#xe93e;',
		'icon-rf': '&#xe93f;',
		'icon-eaeu': '&#xe940;',
		'icon-refrigerated': '&#xe941;',
		'icon-danger': '&#xe942;',
		'icon-ground': '&#xe943;',
		'icon-air': '&#xe944;',
		'icon-arrow-left-big': '&#xe945;',
		'icon-arrow-right-big': '&#xe946;',
		'icon-arrow-left-long': '&#xe947;',
		'icon-arrow-right-long': '&#xe948;',
		'icon-down': '&#xe949;',
		'icon-download': '&#xe94a;',
		'icon-kuda': '&#xe94b;',
		'icon-otkuda': '&#xe94c;',
		'icon-phone': '&#xe94d;',
		'icon-person': '&#xe94e;',
		'icon-close': '&#xe94f;',
		'icon-plus': '&#xe950;',
		'icon-minus': '&#xe951;',
		'icon-contacts': '&#xe952;',
		'icon-pochta': '&#xe953;',
		'icon-max': '&#xe954;',
		'icon-tg': '&#xe955;',
		'icon-wa': '&#xe956;',
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
