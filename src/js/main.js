document.addEventListener('DOMContentLoaded', () => {

  const checkEditMode = document.querySelector('.bx-panel-toggle-on') ?? null;

  /**
   * Подключение ScrollTrigger
   * Подключение SplitText
   */
  gsap.registerPlugin(ScrollTrigger, SplitText);

  // Блокируем браузерное восстановление скролла до того как браузер успеет прыгнуть к якорю
  if (history.scrollRestoration) {
    history.scrollRestoration = 'manual';
  }

  /**
   * Прелоадер + якорь + инициализация Lenis
   */
  (function () {

    // Длительность анимации закрытия мобильного меню в миллисекундах
    const MENU_CLOSE_DURATION = 400;

    // Конфигурация прелоадера
    const PRELOADER_CONFIG = {
      mode: 'overlay',
      assets: {
        logoWhiteSrc: './images/logo/logo-bez-podpisi.svg',
        logoCyanSrc: './images/logo/logo-bez-podpisi-2.svg',
      },
      logoWidth: 71,
      logoHeight: 70,
      safetyTimeoutMs: 8000,
      overlayHideDelayMs: 600,
    };

    // Инициализация Lenis и привязка к GSAP ticker
    const lenis = new Lenis();
    window.lenis = lenis;

    gsap.ticker.lagSmoothing(0);

    gsap.ticker.add((time) => lenis.raf(time * 1000));

    // Синхронизируем Lenis со ScrollTrigger
    // Без этого ScrollTrigger читает нативный scrollY а Lenis работает со своим
    lenis.on('scroll', ScrollTrigger.update);

    // Плавный скролл к целевому элементу через Lenis
    function scrollToTarget(target) {
      lenis.scrollTo(target, {
        offset: -60,
        duration: 1.5,
      });
    }

    // Возвращает промис который резолвится когда прелоадер скрыт
    // Используем MutationObserver чтобы отследить удаление класса preloader--active
    function waitForPreloader() {
      return new Promise((resolve) => {
        if (!document.documentElement.classList.contains('preloader--active')) {
          resolve();
          return;
        }

        const observer = new MutationObserver(() => {
          if (!document.documentElement.classList.contains('preloader--active')) {
            observer.disconnect();
            resolve();
          }
        });

        observer.observe(document.documentElement, {
          attributes: true,
          attributeFilter: ['class'],
        });
      });
    }

    // Обработчик кликов по якорным ссылкам
    // capture: true позволяет перехватить событие раньше stopPropagation в меню
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[href]');
      if (!link) return;

      // Не мешаем Fancybox - пропускаем ссылки с data-fancybox
      if (link.hasAttribute('data-fancybox')) return;

      const href = link.getAttribute('href');
      if (!href || !href.includes('#')) return;

      const hash = href.split('#')[1];
      if (!hash) return;

      // Ищем элемент на текущей странице
      // Если его нет - браузер сам перейдёт на нужную страницу
      // После загрузки сработает обработчик load ниже
      const target = document.getElementById(hash);
      if (!target) return;

      e.preventDefault();
      history.pushState(null, null, `#${hash}`);

      const isMenuOpen = document.documentElement.classList.contains('menu--open');

      if (isMenuOpen) {
        // Останавливаем Lenis пока меню закрывается анимацией
        lenis.stop();
        setTimeout(() => {
          lenis.start();
          scrollToTarget(target);
        }, MENU_CLOSE_DURATION);
      } else {
        scrollToTarget(target);
      }

    }, true);

    // При загрузке страницы с якорем в URL
    // Сначала сбрасываем позицию чтобы браузер не прыгал сам
    // Потом ждём конца прелоадера и плавно скроллим
    window.addEventListener('load', () => {
      const hash = window.location.hash.slice(1);
      if (!hash) return;

      const target = document.getElementById(hash);
      if (!target) return;

      window.scrollTo(0, 0);

      waitForPreloader().then(() => scrollToTarget(target));
    });

    // Инициализация прелоадера
    const preloaderEl = document.querySelector('.preloader');
    if (!preloaderEl) return;

    // Блокируем скролл страницы пока прелоадер активен
    document.body.classList.add('no-scroll');
    document.documentElement.classList.add('preloader--active');

    // Страховочный таймер на случай если что-то пошло не так
    // Принудительно скрывает прелоадер через safetyTimeoutMs миллисекунд
    const safetyTimer = setTimeout(() => {
      if (preloaderEl.style.display !== 'none') {
        preloaderEl.style.display = 'none';
        restoreScroll();
      }
    }, PRELOADER_CONFIG.safetyTimeoutMs);

    function restoreScroll() {
      document.body.classList.remove('no-scroll');
    }

    function clearSafety() {
      try { clearTimeout(safetyTimer); } catch (e) { }
    }

    const canvas = document.getElementById('logo-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    // Настраиваем canvas с учётом плотности пикселей экрана
    function initCanvas() {
      const { logoWidth, logoHeight } = PRELOADER_CONFIG;
      const dpr = window.devicePixelRatio || 1;

      canvas.width = logoWidth * dpr;
      canvas.height = logoHeight * dpr;

      if (ctx.setTransform) ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.scale(dpr, dpr);

      return { logoWidth, logoHeight };
    }

    // Скрываем прелоадер с анимацией схлопывания
    // После завершения анимации удаляем класс preloader--active с html
    function hidePreloader() {
      gsap.set(canvas, { opacity: 0 });

      gsap.to(preloaderEl, {
        scaleY: 0,
        duration: 0.7,
        ease: 'power2.inOut',
        transformOrigin: 'top center',
        onComplete() {
          preloaderEl.style.display = 'none';
          restoreScroll();
          clearSafety();
          document.documentElement.classList.remove('preloader--active');
        },
      });

      gsap.to(canvas, {
        scaleY: 2,
        duration: 0.7,
        ease: 'power2.inOut',
        transformOrigin: 'bottom center',
      });
    }

    // Режим overlay - два логотипа с анимацией заливки снизу вверх
    function startOverlayPreloader() {
      const { logoWidth, logoHeight } = initCanvas();
      let fillHeight = 0;

      const logoWhite = new Image();
      const logoCyan = new Image();
      let loadedCount = 0;

      function draw() {
        ctx.clearRect(0, 0, logoWidth, logoHeight);
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(logoWhite, 0, 0, logoWidth, logoHeight);
        ctx.globalCompositeOperation = 'source-atop';
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, logoHeight - fillHeight, logoWidth, fillHeight);
        ctx.globalCompositeOperation = 'source-over';
      }

      function onImageLoaded() {
        loadedCount++;
        if (loadedCount === 2) startAnimation();
      }

      logoWhite.onload = logoWhite.onerror = onImageLoaded;
      logoCyan.onload = logoCyan.onerror = onImageLoaded;
      logoWhite.src = PRELOADER_CONFIG.assets.logoWhiteSrc;
      logoCyan.src = PRELOADER_CONFIG.assets.logoCyanSrc;

      function startAnimation() {
        draw();

        const progress = { val: 0 };

        // Быстрый старт до 30%
        gsap.to(progress, {
          val: 30,
          duration: 0.4,
          ease: 'power2.out',
          onUpdate() {
            fillHeight = (progress.val / 100) * logoHeight;
            draw();
          },
        });

        // Медленное движение до 85% пока грузится страница
        gsap.to(progress, {
          val: 85,
          duration: 2.5,
          ease: 'power1.out',
          delay: 0.4,
          onUpdate() {
            fillHeight = (progress.val / 100) * logoHeight;
            draw();
          },
        });

        // После полной загрузки страницы добиваем до 100% и скрываем
        window.addEventListener('load', function onLoad() {
          window.removeEventListener('load', onLoad);
          gsap.killTweensOf(progress);

          gsap.to(progress, {
            val: 100,
            duration: 0.4,
            ease: 'power2.out',
            onUpdate() {
              fillHeight = (progress.val / 100) * logoHeight;
              draw();
            },
            onComplete() {
              setTimeout(hidePreloader, PRELOADER_CONFIG.overlayHideDelayMs);
            },
          });
        });
      }
    }

    // Режим singleLogo - одно лого без заливки, скрывается после загрузки
    function startSingleLogoPreloader() {
      const { logoWidth, logoHeight } = initCanvas();
      const logo = new Image();

      function showAndWait() {
        window.addEventListener('load', function onLoad() {
          window.removeEventListener('load', onLoad);
          hidePreloader();
        });
      }

      logo.onload = () => {
        ctx.clearRect(0, 0, logoWidth, logoHeight);
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(logo, 0, 0, logoWidth, logoHeight);

        gsap.fromTo(canvas,
          { opacity: 0.2, scaleY: 0.98 },
          { opacity: 1, scaleY: 1, duration: 0.4, ease: 'power2.out' }
        );

        showAndWait();
      };

      logo.onerror = showAndWait;
      logo.src = PRELOADER_CONFIG.assets.logoWhiteSrc;
    }

    // Запускаем нужный режим прелоадера
    if (PRELOADER_CONFIG.mode === 'singleLogo') {
      startSingleLogoPreloader();
    } else {
      startOverlayPreloader();
    }

  })();

  /**
   * Код для индикатора навигации
   */
  (function () {
    const nav = document.querySelector('.nav');
    const items = document.querySelectorAll('.nav li');
    const indicator = document.querySelector('.nav__indicator');

    // Функция установки индикатора под элементом
    function setIndicator(item) {
      const link = item.querySelector('a');
      const navRect = nav.getBoundingClientRect();
      const linkRect = link.getBoundingClientRect();

      // Вычисляем позицию относительно nav
      const left = linkRect.left - navRect.left;
      const width = linkRect.width;

      indicator.style.left = `${left}px`;
      indicator.style.width = `${width}px`;
    }

    // Инициализация: ставим индикатор под активным пунктом
    const activeItem = document.querySelector('.nav__active');
    if (activeItem) {
      setIndicator(activeItem);
    }

    // Обработчик наведения на пункты меню
    items.forEach(item => {
      item.addEventListener('mouseenter', () => {
        setIndicator(item);
      });

      // Обработчик клика: переключаем активный класс
      item.addEventListener('click', (e) => {
        // Убираем активный класс со всех пунктов
        items.forEach(i => i.classList.remove('nav__active'));

        // Добавляем активный класс на кликнутый пункт
        item.classList.add('nav__active');

        setIndicator(item);
      });
    });

    // При уходе курсора возвращаем к активному пункту
    // nav.addEventListener('mouseleave', () => {
    //   const currentActive = document.querySelector('.nav__active');
    //   if (currentActive) {
    //     setIndicator(currentActive);
    //   }
    // });
  })();

  /**
   * Функция управления поведением меню-бургера.
   */
  (function () {
    const burgerBtn = document.getElementById('burger-btn');
    const burgerMenu = document.getElementById('burger-menu');
    const menuNav = document.querySelector('#burger-menu .menu__nav');

    const openMenu = () => {
      burgerBtn.classList.add('burger--open');
      document.documentElement.classList.add('menu--open');
      lenis.stop();
    };

    const closeMenu = () => {
      burgerBtn.classList.remove('burger--open');
      document.documentElement.classList.remove('menu--open');
      lenis.start();
      document.dispatchEvent(new CustomEvent('menu:close'));
    };

    const toggleMenu = (e) => {
      e.preventDefault();
      const isMenuOpen = document.documentElement.classList.contains('menu--open');

      if (isMenuOpen) {
        closeMenu();
      } else {
        openMenu();
      }
    };

    burgerBtn.addEventListener('click', toggleMenu);

    window.addEventListener('keydown', (e) => {
      if (e.key === "Escape" && document.documentElement.classList.contains('menu--open')) {
        closeMenu();
      }
    });

    document.addEventListener('click', (event) => {
      const isMenuOpen = document.documentElement.classList.contains('menu--open');
      const clickInsideMenu = burgerMenu.contains(event.target);
      const clickOnButton = burgerBtn.contains(event.target);

      // Проверяем, кликнули ли по ссылке внутри menu__list
      const clickOnMenuLink = menuNav && menuNav.contains(event.target) && event.target.tagName === 'A';

      if (isMenuOpen && !clickInsideMenu && !clickOnButton) {
        closeMenu();
      }

      // Дополнительно: закрываем меню при клике по ссылке внутри меню
      if (isMenuOpen && clickOnMenuLink) {
        closeMenu();
      }
    });
  })();

  /**
   * Функция для поведения шапки
   */
  (function () {

    // 
    // НАСТРОЙКИ
    // 
    const CONFIG = {

      // 
      // СЕЛЕКТОРЫ
      // 
      headerSelector: '.header',
      sectionsSelector: 'section',
      firstSectionSelector: null,      // null = используем высоту хедера
      footerSelector: '.footer',
      innerBlockSelector: '.header__top',

      // 
      // ТЕМА (светлая / тёмная секция под хедером)
      // Атрибут на секции: data-header-theme="dark" или "light"
      // Добавляет класс на <html>: header-theme-dark / header-theme-light
      // 
      themeAttribute: 'data-header-theme',
      classThemeDark: 'header-theme-dark',
      classThemeLight: 'header-theme-light',

      // 
      // КЛАССЫ НА <html> ДЛЯ СОСТОЯНИЙ СКРОЛЛА
      // 
      classFixed: 'header-fixed',         // прошли 1px скролла
      classOffTop: 'header-off-top',      // прошли первую секцию
      classAtFooter: 'header-at-footer',  // хедер у футера
      classHidden: 'header-hidden',       // хедер скрыт

      // 
      // СКРЫТИЕ ХЕДЕРА ПРИ СКРОЛЛЕ ВНИЗ
      // 
      hideOnScroll: false,                // true = скрывать, false = всегда видим

      hideFixed: true,

      // Настройки скрытия (работают только если hideOnScroll: true)
      hideDuration: 0.4,
      showDuration: 0.4,
      hideEase: 'power2.in',
      showEase: 'power2.out',
      scrollThreshold: 5,                 // минимальный скролл для реакции (px)

      // 
      // АНИМАЦИЯ ФОНА ХЕДЕРА ПРИ СКРОЛЛЕ
      // 
      animateBg: false,                    // true = менять фон, false = не менять
      bgInitial: 'transparent',
      bgScrolled: 'rgba(20, 38, 55, 1)',

      // 
      // АНИМАЦИЯ ТЕНИ ХЕДЕРА ПРИ СКРОЛЛЕ
      // 
      animateShadow: false,                // true = менять тень, false = не менять
      shadowInitial: '0px 0px 0px rgba(0, 0, 0, 0)',
      shadowScrolled: '0px 0px 20px rgba(0, 0, 0, 0.3)',

      // 
      // АНИМАЦИЯ ВЫСОТЫ ХЕДЕРА ПРИ СКРОЛЛЕ
      // 
      animateHeight: true,                // true = менять высоту, false = не менять
      // heightMultiplier: 1,              // во сколько раз уменьшить (0.7 = 63.53%)
      heightMultiplier: 0.342,

      // Множитель высоты для мобильной версии
      // Используется когда ширина окна меньше mobileBreakpoint
      // Если null - используется heightMultiplier (общее значение)
      heightMultiplierMobile: 1,

      // Брейкпоинт мобильной версии в px
      // При window.innerWidth < mobileBreakpoint применяется heightMultiplierMobile
      mobileBreakpoint: 600,

      // Классы попапов на <html> при которых нужно принудительно показывать шапку
      // Если шапка скрыта (header-hidden) и появляется один из этих классов -
      // шапка опускается обратно чтобы пользователь мог по ней кликнуть
      // (например закрыть попап через кнопку в шапке)
      forceShowOnClasses: [],
      // forceShowOnClasses: ['callback--open', 'tender--open'],
    };

    // 
    // ЭЛЕМЕНТЫ
    // 
    const header = document.querySelector(CONFIG.headerSelector);
    if (!header) return;

    const footer = document.querySelector(CONFIG.footerSelector);
    const htmlEl = document.documentElement;
    let headerHeight = header.offsetHeight;

    const firstSection = CONFIG.firstSectionSelector
      ? document.querySelector(CONFIG.firstSectionSelector)
      : null;

    // Проверка мобильной версии по ширине окна
    // Вызывается каждый раз при инициализации scrub-анимации
    // и при resize чтобы пересобрать анимацию с актуальным множителем
    const isMobile = () => window.innerWidth < CONFIG.mobileBreakpoint;

    // Возвращает актуальный множитель высоты в зависимости от ширины экрана
    // Если для мобильной версии множитель не задан (null) - возвращает общий
    const getHeightMultiplier = () => {
      if (isMobile() && CONFIG.heightMultiplierMobile !== null) {
        return CONFIG.heightMultiplierMobile;
      }
      return CONFIG.heightMultiplier;
    };

    // Зона скролла для scrub-анимации
    const scrollZone = firstSection
      ? firstSection.offsetHeight
      : headerHeight;

    // 
    // ОПРЕДЕЛЕНИЕ ТЕМЫ ПОД ХЕДЕРОМ
    // Проходим по секциям, находим ту что пересекается с хедером,
    // берём её data-header-theme и ставим класс на <html>
    // 
    const updateTheme = () => {
      const sections = document.querySelectorAll(CONFIG.sectionsSelector);
      const headerBottom = header.getBoundingClientRect().bottom;
      let foundTheme = null;

      for (const section of sections) {
        const rect = section.getBoundingClientRect();

        // Секция пересекается с хедером:
        // верх секции выше нижней границы хедера И низ секции ниже верха viewport
        const intersects = rect.top <= headerBottom && rect.bottom >= 0;

        if (intersects) {
          const theme = section.getAttribute(CONFIG.themeAttribute);
          if (theme) {
            foundTheme = theme;
            break;
          }
        }
      }

      // Сбрасываем оба класса и ставим нужный
      htmlEl.classList.remove(CONFIG.classThemeDark, CONFIG.classThemeLight);

      if (foundTheme === 'dark') {
        htmlEl.classList.add(CONFIG.classThemeDark);
      } else if (foundTheme === 'light') {
        htmlEl.classList.add(CONFIG.classThemeLight);
      }
    };

    // 
    // НАЧАЛЬНЫЕ СТИЛИ ХЕДЕРА
    // Устанавливаем только те свойства которые включены в CONFIG
    // 
    const initialStyles = {
      yPercent: 0,
      // Высоту всегда устанавливаем чтобы GSAP знал начальное значение
      // height: headerHeight,
      height: () => `${header.offsetHeight}px`,
    };

    if (CONFIG.animateBg) {
      initialStyles.backgroundColor = CONFIG.bgInitial;
    }

    if (CONFIG.animateShadow) {
      initialStyles.boxShadow = CONFIG.shadowInitial;
    }

    gsap.set(header, initialStyles);

    // 
    // GSAP SCRUB - анимация хедера при скролле
    // Собираем объект анимации только из включённых свойств
    // 

    // Объект с целевыми значениями для scrub-анимации
    const animateTo = {
      ease: 'none',
      duration: 1,
    };

    if (CONFIG.animateBg) {
      animateTo.backgroundColor = CONFIG.bgScrolled;
    }

    if (CONFIG.animateShadow) {
      animateTo.boxShadow = CONFIG.shadowScrolled;
    }

    if (CONFIG.animateHeight) {
      // Берём множитель через функцию - она сама решает мобильный или десктопный
      animateTo.height = headerHeight * getHeightMultiplier();
    }

    // Запускаем scrub только если есть хотя бы одно включённое свойство
    const hasScrubAnimation = CONFIG.animateBg || CONFIG.animateShadow || CONFIG.animateHeight || CONFIG.hideFixed;

    // if (hasScrubAnimation) {
    //   const tlScrub = gsap.timeline({
    //     scrollTrigger: {
    //       trigger: document.documentElement,
    //       start: 'top top',
    //       end: `+=${scrollZone}`,
    //       scrub: true,
    //       onEnter: () => htmlEl.classList.add(CONFIG.classFixed),
    //       onLeaveBack: () => {
    //         htmlEl.classList.remove(CONFIG.classFixed);
    //         htmlEl.classList.remove(CONFIG.classOffTop);
    //       },
    //     }
    //   });

    //   tlScrub.to(header, animateTo);
    // }

    // Находим внутренний блок
    const innerBlock = header.querySelector(CONFIG.innerBlockSelector);

    // Рассчитываем начальную высоту внутреннего блока
    const innerHeight = innerBlock ? innerBlock.offsetHeight : 0;

    if (hasScrubAnimation) {
      const tlScrub = gsap.timeline({
        scrollTrigger: {
          trigger: document.documentElement,
          start: 'top top',
          end: `+=${scrollZone}`,
          scrub: true,

          onEnter: () => htmlEl.classList.add(CONFIG.classFixed),
          onLeaveBack: () => {
            htmlEl.classList.remove(CONFIG.classFixed);
            htmlEl.classList.remove(CONFIG.classOffTop);
          },
        }
      });

      // Анимируем основной хедер
      tlScrub.to(header, animateTo, 0); // Параметр 0 значит "начать в начале таймлайна"

      // Анимируем внутренний блок, если он найден
      if (innerBlock && CONFIG.animateHeight && !isMobile()) {
        tlScrub.to(innerBlock, {
          // height: innerHeight * getHeightMultiplier(),
          // height: () => `${(innerBlock.offsetHeight * getHeightMultiplier())}px`,
          height: '0px',
          opacity: 0,
          filter: "blur(10px)",
          ease: 'none'
        }, 0); // 0 — чтобы анимация шла одновременно с хедером
      }
    }

    // 
    // КЛАСС header-off-top - прошли зону анимации
    // 
    ScrollTrigger.create({
      trigger: document.documentElement,
      start: `top+=${scrollZone} top`,

      onEnter: () => htmlEl.classList.add(CONFIG.classOffTop),
      onLeaveBack: () => htmlEl.classList.remove(CONFIG.classOffTop),
    });

    // 
    // КЛАСС header-at-footer - хедер достиг футера
    // 
    if (footer) {
      ScrollTrigger.create({
        trigger: footer,
        start: 'top bottom',

        onEnter: () => htmlEl.classList.add(CONFIG.classAtFooter),
        onLeaveBack: () => htmlEl.classList.remove(CONFIG.classAtFooter),
      });
    }

    // 
    // HIDE / SHOW ХЕДЕРА
    // Работает только если CONFIG.hideOnScroll: true
    // 
    let lastScrollY = window.scrollY || window.pageYOffset;
    let isHidden = false;
    let ticking = false;

    // Нижняя граница первой секции в координатах страницы
    const getFirstSectionBottom = () => {
      if (!firstSection) return scrollZone;
      return firstSection.getBoundingClientRect().bottom + window.scrollY;
    };

    const hideHeader = () => {
      if (isHidden) return;
      isHidden = true;
      htmlEl.classList.add(CONFIG.classHidden);
      gsap.to(header, {
        yPercent: -100,
        duration: CONFIG.hideDuration,
        ease: CONFIG.hideEase,
        overwrite: 'auto',
      });
    };

    const showHeader = () => {
      if (!isHidden) return;
      isHidden = false;
      htmlEl.classList.remove(CONFIG.classHidden);
      gsap.to(header, {
        yPercent: 0,
        duration: CONFIG.showDuration,
        ease: CONFIG.showEase,
        overwrite: 'auto',
      });
    };

    // 
    // ОСНОВНОЙ ОБРАБОТЧИК СКРОЛЛА
    // 
    const handleScroll = () => {
      const currentScrollY = window.scrollY || window.pageYOffset;
      const delta = currentScrollY - lastScrollY;
      const absDelta = Math.abs(delta);

      // Тему обновляем всегда - не зависит от threshold
      updateTheme();

      // Дальше - только если включено скрытие хедера
      if (CONFIG.hideOnScroll) {

        // Микро-скроллы игнорируем
        if (absDelta >= CONFIG.scrollThreshold) {
          const scrollingDown = delta > 0;
          const firstSectionBottom = getFirstSectionBottom();

          // Скролл вниз после первой секции - прячем
          // if (scrollingDown && currentScrollY > firstSectionBottom) {
          if (scrollingDown && currentScrollY > 0) {
            hideHeader();
          }

          // Скролл вверх - показываем
          if (!scrollingDown) {
            showHeader();
          }

          // Самый верх - всегда показываем
          if (currentScrollY <= 0) {
            showHeader();
          }

          lastScrollY = currentScrollY;
        }
      } else {
        // Скрытие выключено - просто обновляем lastScrollY
        lastScrollY = currentScrollY;
      }

      ticking = false;
    };

    // rAF обёртка - не чаще одного раза за кадр
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(handleScroll);
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });

    // iOS Safari
    if (window.visualViewport) {
      window.visualViewport.addEventListener('scroll', onScroll, { passive: true });
      window.visualViewport.addEventListener('resize', () => {
        lastScrollY = window.scrollY || window.pageYOffset;
      });
    }

    // Пересчёт высоты при ресайзе окна
    // Когда пользователь переходит через брейкпоинт (например, поворот телефона
    // или ресайз окна разработчиком), множитель высоты должен пересчитаться
    // Используем дебаунс чтобы не дёргать пересборку на каждый пиксель ресайза
    if (CONFIG.animateHeight) {
      let resizeTimer = null;
      let lastIsMobile = isMobile();

      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);

        resizeTimer = setTimeout(() => {
          // 1. Рассчитываем множитель
          const multiplier = getHeightMultiplier();

          ScrollTrigger.getAll().forEach(st => {
            // Ищем именно scrub-триггер хедера
            if (st.trigger === document.documentElement && st.animation) {

              // Очищаем инлайновые стили перед пересчетом, 
              // чтобы замерить реальную высоту из CSS
              header.style.height = '';
              if (innerBlock) innerBlock.style.height = '';

              // 2. Обновляем основной хедер (первый элемент в таймлайне)
              const tween = st.animation.getChildren()[0];
              if (tween && tween.vars) {
                // Рассчитываем целевую высоту в rem (ваша формула / 10)
                const h = header.offsetHeight * multiplier;
                tween.vars.height = `${h}px`;

                // Заставляем GSAP забыть старые значения и подхватить новые
                tween.invalidate();
              }

              // 3. Обновляем внутренний блок (второй элемент в таймлайне)
              const innerTween = st.animation.getChildren()[1];
              if (innerTween && innerTween.vars) {
                if (isMobile()) {
                  // На мобилке возвращаем всё как было в CSS
                  innerTween.vars.height = "auto";
                  innerTween.vars.opacity = 1;
                } else {
                  // На десктопе принудительно ставим жесткий ноль
                  innerTween.vars.height = "0px";
                  innerTween.vars.paddingTop = "0px";
                  innerTween.vars.paddingBottom = "0px";
                  innerTween.vars.opacity = 0;
                }
                innerTween.invalidate();
              }

              // Пересчитываем позиции всех триггеров на странице
              // st.refresh();
            }
          });

        }, 200);
      }, { passive: true });
    }

    // 
    // ПРИНУДИТЕЛЬНЫЙ ПОКАЗ ШАПКИ ПРИ ОТКРЫТИИ ПОПАПОВ
    // 
    // Когда на <html> появляется класс из forceShowOnClasses (callback--open,
    // tender--open и т.д.) - принудительно показываем шапку если она скрыта
    // Это нужно чтобы пользователь мог взаимодействовать с шапкой при открытом попапе
    // Используем MutationObserver - он реагирует только на изменения класса
    // и не дёргается при скролле, в отличие от глобальных слушателей
    // 
    if (CONFIG.forceShowOnClasses && CONFIG.forceShowOnClasses.length > 0) {

      // Проверяет есть ли на <html> хотя бы один из "форсирующих" классов
      const hasForceClass = () => {
        return CONFIG.forceShowOnClasses.some(cls => htmlEl.classList.contains(cls));
      };

      // Запоминаем предыдущее состояние - чтобы реагировать только на переход
      // false -> true (попап открылся), а не на каждое изменение класса
      let wasForced = hasForceClass();

      // Если попап уже открыт при инициализации скрипта - сразу показываем шапку
      if (wasForced && isHidden) {
        showHeader();
      }

      const popupObserver = new MutationObserver(() => {
        const isForced = hasForceClass();

        // Реагируем только в момент когда попап ОТКРЫЛСЯ
        // (раньше форс-классов не было, теперь появился)
        // На закрытие попапа не реагируем - дальше работает обычная логика hide/show
        if (isForced && !wasForced) {
          // Если шапка скрыта - принудительно показываем её
          // Если уже видна - ничего не делаем (условие внутри showHeader)
          if (isHidden) {
            showHeader();
          }
        }

        wasForced = isForced;
      });

      popupObserver.observe(htmlEl, {
        attributes: true,
        attributeFilter: ['class'],
      });
    }

    // 
    // ИНИЦИАЛИЗАЦИЯ - определяем тему сразу при загрузке страницы
    // 
    updateTheme();

  })();

  /**
   * Функция для фикс. кнопки связи
   */
  (function () {
    const social = document.querySelector('.social');
    const btn = document.querySelector('.social__item-btn');

    btn.addEventListener('mouseenter', () => {
      social.classList.add('active');
    })

    social.addEventListener('mouseleave', () => {
      social.classList.remove('active');
    })
  })();

  /**
   * Функция для присвоения класса filled для заполненных форм
   */
  (function () {

    const form = document.querySelector('form');

    if (form) {
      const inputElements = document.querySelectorAll('.form-input');
      const textareaElements = document.querySelectorAll('.form-textarea');
      const className = 'filled';

      inputElements.forEach(element => {
        element.addEventListener('input', function () {
          if (this.value.trim() !== '') {
            element.classList.add(className);
          } else {
            element.classList.remove(className);
          }
        });
      });

      textareaElements.forEach(element => {
        element.addEventListener('input', function () {
          if (this.value.trim() !== '') {
            element.classList.add(className);
          } else {
            element.classList.remove(className);
          }
        });
      });
    }

  })();

  /**
   * Функция для проигрывания видео-иконки при наведении у блока advan
   */
  (function () {
    const advanItems = document.querySelectorAll('.advan__item');

    if (!advanItems.length) return;

    advanItems.forEach(advanItem => {
      const icon = advanItem.querySelector('.icon-video');

      if (!icon) return;

      // Запуск при наведении
      advanItem.addEventListener('mouseenter', () => {
        icon.play();
      });
    });
  })();

  /**
   * Функция для блока кейсов
   */
  (function () {
    const mobileBreakpoint = 600;
    const casesJs = document.querySelector('.cases--js');
    if (!casesJs) return;

    const casesTabsJs = document.querySelector('.cases-tabs--js');
    const casesTabsItemsJs = casesTabsJs.querySelectorAll('.general__tabs-item');
    const casesItemsJs = document.querySelectorAll('.cases-item--js');

    if (casesTabsItemsJs.length) {
      casesTabsItemsJs.forEach(tab => {
        tab.addEventListener('click', () => {
          casesTabsItemsJs.forEach(i => i.classList.remove('tabs--active'));
          tab.classList.add('tabs--active');

          const data = tab.dataset.value;
          const casesItem = document.querySelector(`[data-cases="${data}"]`);

          casesItemsJs.forEach(i => i.classList.remove('cases-item--active'));
          casesItem.classList.add('cases-item--active');

          ScrollTrigger.update();
        });
      });
    }

    if (casesItemsJs.length) {
      casesItemsJs.forEach((item, index) => {
        item.style.zIndex = 100 - index;
      });

      const isMobile = () => window.innerWidth < mobileBreakpoint;

      if (isMobile()) {
        casesItemsJs.forEach(item => {
          item.addEventListener('click', () => {
            // Проверяем, активен ли этот элемент уже
            const isActive = item.classList.contains('cases-item--active');

            // 1. Сначала убираем активный класс у ВСЕХ кейсов
            casesItemsJs.forEach(i => i.classList.remove('cases-item--active'));

            // 2. Если элемент не был активен до клика — открываем его
            // Если был активен — он останется закрытым (так работает логика закрытия)
            if (!isActive) {
              item.classList.add('cases-item--active');
            }

            // Обновляем ScrollTrigger, так как высота контента могла измениться
            ScrollTrigger.update();
          });
        });
      }

    }
  })();

  /**
   * Sticky функция
   */
  function stickyReveal() {
    let scrollHandler = null;
    let resizeHandler = null;
    let ticking = false;
    let destroyed = false;
    let items = [];
    let offsets = [];

    const removeOffset = 31;
    const MOBILE_BREAKPOINT = 600;

    function cacheOffsets() {
      offsets = items.map(item => item.getBoundingClientRect().top + window.scrollY);
    }

    function init() {
      if (window.innerWidth > MOBILE_BREAKPOINT) return;

      items = Array.from(document.querySelectorAll('.sticky__item'));
      if (!items.length) return;

      cacheOffsets();

      // const checkItems = () => {
      //   if (destroyed || window.innerWidth > MOBILE_BREAKPOINT) return;

      //   const scrollY = window.scrollY;

      //   try {
      //     items.forEach((item, index) => {
      //       if (index === items.length - 1) return;

      //       const top = offsets[index] - scrollY;
      //       const isActive = item.classList.contains('sticky__item-active');

      //       if (!isActive && top <= 0) {
      //         item.classList.add('sticky__item-active');
      //         item.style.top = `calc(var(--header-height) + 2rem + ${index * 2}rem)`;
      //       }

      //       if (isActive && top > removeOffset) {
      //         item.classList.remove('sticky__item-active');
      //         item.style.top = '';
      //       }
      //     });
      //   } catch (e) {
      //     console.warn('stickyReveal checkItems error:', e);
      //   } finally {
      //     ticking = false;
      //   }
      // };

      const checkItems = () => {
        if (destroyed || window.innerWidth > MOBILE_BREAKPOINT) return;

        const scrollY = window.scrollY;
        // Получаем текущую высоту хедера из CSS переменной (в пикселях)
        const headerHeight = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) || 0;
        // Базовый отступ (2rem = 20px)
        const baseOffset = 20;

        items.forEach((item, index) => {
          // Рассчитываем "точку прилипания" для текущего индекса
          // header + 2rem + (index * 2rem)
          const stickyThreshold = headerHeight + baseOffset + (index * 20);

          // Смотрим, где сейчас находится сам элемент относительно экрана
          const currentItemTop = offsets[index] - scrollY;
          const isActive = item.classList.contains('sticky__item-active');

          // Активация: если верх карточки дотронулся до своей будущей "липкой" позиции
          if (!isActive && currentItemTop <= stickyThreshold) {
            item.classList.add('sticky__item-active');
            item.style.top = `calc(var(--header-height) + 2rem + ${index * 2}rem)`;
          }

          // Деактивация: возвращаем в поток, если прокрутили обратно
          // Добавляем небольшой запас (removeOffset), чтобы избежать мерцания
          if (isActive && currentItemTop > stickyThreshold + removeOffset) {
            item.classList.remove('sticky__item-active');
            item.style.top = '';
          }
        });

        ticking = false;
      };

      scrollHandler = () => {
        if (!ticking) {
          requestAnimationFrame(checkItems);
          ticking = true;
        }
      };

      resizeHandler = () => {
        clearTimeout(resizeHandler._timer);
        resizeHandler._timer = setTimeout(() => {
          if (window.innerWidth > MOBILE_BREAKPOINT) {
            destroy();
          } else if (destroyed) {
            destroyed = false;
            init();
          } else {
            cacheOffsets();
            checkItems();
          }
        }, 100);
      };

      window.addEventListener('scroll', scrollHandler, { passive: true });
      window.addEventListener('resize', resizeHandler, { passive: true });

      checkItems();
    }

    function destroy() {
      destroyed = true;
      if (scrollHandler) {
        window.removeEventListener('scroll', scrollHandler);
        scrollHandler = null;
      }

      document.querySelectorAll('.sticky__item-active').forEach(el => {
        el.classList.remove('sticky__item-active');
        el.style.top = '';
      });
    }

    init();

    return {
      destroy,
      reinit: () => { destroy(); destroyed = false; init(); }
    };
  }

  let globalStickyInstance = stickyReveal();

  /**
   * Функция аккордиона
   */
  (function accordionFunc() {
    const accordionContainers = document.querySelectorAll('.accordion-items');
    if (!accordionContainers.length) return;

    // Один глобальный обработчик для закрытия при клике вне аккордеона
    document.addEventListener('click', (e) => {
      accordionContainers.forEach(container => {
        const items = container.querySelectorAll('.accordion-item');
        const activeClass = 'accordion-item--active';
        items.forEach(item => {
          if (!e.composedPath().includes(item)) {
            item.classList.remove(activeClass);
            container.classList.remove('activated');
          }
        });
      });
      ScrollTrigger.update();
    });

    // Один глобальный обработчик Escape для всех аккордеонов
    window.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      accordionContainers.forEach(container => {
        container.querySelectorAll('.accordion-item').forEach(item => {
          item.classList.remove('accordion-item--active');
        });
        container.classList.remove('activated');
      });
      ScrollTrigger.update();
    });

    accordionContainers.forEach(accordionContainer => {
      const accordionItems = accordionContainer.querySelectorAll('.accordion-item');
      const activeClass = 'accordion-item--active';

      // Закрытие при Escape
      accordionItems.forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();

          // Закрываем другие открытые элементы
          accordionItems.forEach(i => {
            if (i !== item) i.classList.remove(activeClass);
          });

          // Переключаем текущий
          item.classList.toggle(activeClass);

          // Управляем классом контейнера
          if (item.classList.contains(activeClass)) {
            accordionContainer.classList.add('activated');
          } else {
            accordionContainer.classList.remove('activated');
          }

          ScrollTrigger.update();
        });
      });
    });

  })();

  /**
   *  Copyboard
   */
  (function () {
    const copyItems = document.querySelectorAll(".contacts__item");

    copyItems.forEach(item => {
      const copyButton = item.querySelector(".contacts__item-copy");
      if (!copyButton) return;

      copyButton.addEventListener("click", function () {
        let result = [];

        const mainTitle = item.querySelector('.contacts__item-title')?.innerText.trim();
        if (mainTitle) result.push(`${mainTitle}`);

        const contentBlocks = item.querySelectorAll('.contacts__item-wrap, .contacts__item-address, .contacts__item-links');

        contentBlocks.forEach(block => {
          const suptitle = block.querySelector('.contacts__item-suptitle')?.innerText.trim() || "";
          const textNode = block.querySelector('.contacts__item-text')?.innerText.trim() || "";
          const links = block.querySelectorAll('a');

          if (textNode) {
            result.push(`${suptitle} ${textNode}`.trim());
          }

          links.forEach(link => {
            const href = link.getAttribute('href') || "";
            const linkText = link.innerText.trim();

            if (href.startsWith('tel:') || href.startsWith('mailto:')) {
              result.push(`${suptitle} ${linkText}`.trim());
            }
            else if (href !== "/" && href !== "#" && href !== "") {
              const displayValue = linkText ? `${linkText} (${href})` : href;
              result.push(`${suptitle} ${displayValue}`.trim());
            }
            else if (linkText) {
              result.push(linkText);
            }
          });
        });

        const textToCopy = result.join('\n').replace(/\n{2,}/g, '\n'); // убираем лишние пустые строки

        if (textToCopy) {
          navigator.clipboard.writeText(textToCopy).then(() => {
            setTimeout(() => copyButton.style.color = "", 1000);
            console.log('Скопировано:\n', textToCopy);
          }).catch(err => console.error('Ошибка:', err));
        }
      });
    });
  })();

  /**
   * Функция для фильтра
   */
  (function () {
    const filter = document.querySelector('.general__filter');
    if (!filter) return;

    const span = filter.querySelector('.general__filter-text span');
    const icon = filter.querySelector('.general__filter-icon');

    const states = [
      { text: 'по умолчанию', class: 'icon--down' },
      { text: 'по убыванию', class: 'icon--down' },
      { text: 'по возрастанию', class: 'icon--up' }
    ];

    let currentStateIndex = 0;

    filter.addEventListener('click', function () {
      currentStateIndex = (currentStateIndex + 1) % states.length;

      const state = states[currentStateIndex];

      if (span) {
        span.innerText = state.text;
      }

      icon.classList.remove('icon--up', 'icon--down');
      icon.classList.add(state.class);
    });
  })();

  /**
   * Анимация текста
   */
  // function scrollTriggerPlayer(triggerElement, timeline, onEnterStart = "top 95%") {
  //   ScrollTrigger.create({ trigger: triggerElement, start: "top bottom", onLeaveBack: () => { timeline.progress(1); timeline.pause(); } });
  //   ScrollTrigger.create({ trigger: triggerElement, start: onEnterStart, scrub: true, onEnter: () => timeline.play() });
  // }

  gsap.utils.toArray('[data-split="lines"]').forEach(dataSplitLines => {
    const textSplits = dataSplitLines.querySelectorAll('h1, h2, p');

    const isMobile = window.innerWidth < 600;
    const animSettings = {
      duration: isMobile ? 0.2 : 0.3, // на мобилке дольше
      stagger: isMobile ? 0.1 : 0.1  // на мобилке задержка больше
    };

    textSplits.forEach(textSplit => {

      if (isMobile) {
        const brs = textSplit.querySelectorAll('br');
        brs.forEach(br => br.remove());
      }

      if (textSplit && !isMobile) SplitText.create(textSplit, {
        type: "words,lines",
        mask: "lines",
        linesClass: "line",
        autoSplit: true,
        onSplit: inst => gsap.from(inst.lines, {
          yPercent: 120,
          duration: animSettings.duration,
          stagger: animSettings.stagger,
          scrollTrigger: {
            trigger: dataSplitLines,
            start: "top 95%",
            end: "bottom top",
          }
        })
      });

    });
  });

  gsap.utils.toArray('[data-split="text"]').forEach(dataSplitText => {
    const isMobile = window.innerWidth < 600;
    const textSplit = dataSplitText.querySelectorAll('*');
    if (textSplit && !isMobile) SplitText.create(textSplit, {
      type: "words",
      aria: "hidden",
      onSplit: split => gsap.from(split.words, {
        opacity: 0,
        // duration: 0.3,
        duration: isMobile ? 0.2 : 0.3,
        // stagger: 0.05,
        stagger: isMobile ? 0.03 : 0.05,
        ease: "sine.out",
        scrollTrigger: {
          trigger: dataSplitText,
          start: "top 95%",
          end: "bottom top",
        }
      })
    });
  });

  /**
   * Функция для запуска svg анимации
   */
  (function () {
    const isMobile = window.innerWidth < 600;
    const svgBlocks = document.querySelectorAll('.svg-block');
    if (svgBlocks.length && !isMobile) {
      svgBlocks.forEach(svgBlock => {
        gsap.from(svgBlock, {
          ease: "none",
          scrollTrigger: {
            trigger: svgBlock,
            start: `top 90%`,
            end: `top top`,
          },
          onStart: function () {
            svgBlock.classList.add('svg-active');
          },
        });
      });
    }
  })();

  /**
   * Анимация чисел
   */
  (function initNumberRolls(selector = ".number-roll") {

    const isMobile = window.innerWidth < 600;

    if (!isMobile) {
      document.querySelectorAll(selector).forEach(el => {
        const digits = el.dataset.number.split("");
        el.innerHTML = digits.map(ch => {
          if (ch === ".") return `<span class="digit-container"><span class="digit"><span>.</span></span></span>`;
          if (ch === " " || ch === "\u00A0") return `<span class="digit-container digit-space"><span class="digit"><span>&nbsp;</span></span></span>`;
          let numSpan = "";
          for (let j = 0; j < 2; j++) for (let i = 0; i <= 9; i++) numSpan += `<span>${i}</span>`;
          return `<span class="digit-container"><span class="digit">${numSpan}</span></span>`;
        }).join("");

        ScrollTrigger.create({
          trigger: el, start: "top 100%", once: true, invalidateOnRefresh: true,
          onEnter: () => el.querySelectorAll(".digit-container").forEach((container, i) => {
            const target = digits[i]; if (target === ".") return;
            const digitEl = container.querySelector(".digit");
            const t = gsap.to(digitEl, { y: "-10em", duration: 0.2 + Math.random() * 0.4, ease: "linear", repeat: -1 });
            gsap.delayedCall(1 + i * 0.3, () => {
              t.kill();
              const loops = Math.floor(digitEl.querySelectorAll("span").length / 10) - 1;
              gsap.to(digitEl, { y: -(loops * 10 + parseInt(target)) + "em", duration: 0.2 + i * 0.2, ease: "power3.out" });
            });
          })
        });
      });
    }

  })();

  /**
   * Анимация блоков
   */
  (function () {
    const isMobile = window.innerWidth < 600;

    if (!isMobile) {
      const animItems = document.querySelectorAll('.anim-items')
      animItems.forEach(items => {
        const item = items.querySelectorAll('.anim-item')
        gsap.from(item, {

          // Начальное состояние: уменьшены и прозрачны
          scale: 0.8,
          opacity: 0,

          // Настройки появления по очереди
          stagger: {
            each: 0.2, // задержка 0.2 сек между каждым айтемом
            from: "start" // начинаем с первого в DOM
          },

          duration: 0.8,
          ease: "back.out(1.7)", // пружинистый эффект в конце увеличения

          // Настройка скролла
          scrollTrigger: {
            trigger: items, // Родитель всей сетки (замените на ваш класс)
            start: "top 90%", // Анимация начнется, когда верх блока достигнет 85% высоты экрана
            // toggleActions: "play none none none" // Проигрывать при скролле вниз, откатывать при скролле вверх

            onEnter: () => items.classList.add('anim-animated'),
          }
        });
      });
    }
  })();

  /**
   * Глобальный обработчик анимаций
   */
  // (function () {
  //   const isMobile = () => window.innerWidth < 600;

  //   // 1. АВТО-ОБНОВЛЕНИЕ ПРИ ИЗМЕНЕНИИ ВЫСОТЫ (для аккордеонов)
  //   // Это гарантирует, что триггеры не собьются, когда открываются блоки
  //   const ro = new ResizeObserver(() => {
  //     ScrollTrigger.refresh();
  //   });
  //   ro.observe(document.body);

  //   // 2. АНИМАЦИЯ СТРОК (data-split="lines")
  //   gsap.utils.toArray('[data-split="lines"]').forEach(container => {
  //     const textElements = container.querySelectorAll('h1, h2, p');

  //     textElements.forEach(el => {
  //       // Удаляем <br> на мобилках перед сплитом
  //       if (isMobile()) {
  //         el.querySelectorAll('br').forEach(br => br.remove());
  //       }

  //       const split = new SplitText(el, {
  //         type: "lines",
  //         linesClass: "line-child",
  //       });

  //       // Обертка для маски (overflow: hidden)
  //       new SplitText(el, {
  //         type: "lines",
  //         linesClass: "line-mask",
  //       });

  //       if (split.lines.length) {
  //         gsap.from(split.lines, {
  //           yPercent: 120,
  //           duration: isMobile() ? 0.4 : 0.6,
  //           stagger: 0.1,
  //           ease: "power2.out",
  //           scrollTrigger: {
  //             trigger: container,
  //             start: "top 92%",
  //             // invalidateOnRefresh: true
  //           }
  //         });
  //       }
  //     });
  //   });

  //   // 3. АНИМАЦИЯ СЛОВ (data-split="text")
  //   gsap.utils.toArray('[data-split="text"]').forEach(container => {
  //     const split = new SplitText(container, { type: "words" });

  //     if (split.words.length) {
  //       gsap.from(split.words, {
  //         opacity: 0,
  //         duration: isMobile() ? 0.3 : 0.5,
  //         stagger: 0.05,
  //         ease: "sine.out",
  //         scrollTrigger: {
  //           trigger: container,
  //           start: "top 92%",
  //         }
  //       });
  //     }
  //   });

  //   // 4. SVG АНИМАЦИЯ
  //   document.querySelectorAll('.svg-block').forEach(svg => {
  //     gsap.from(svg, {
  //       scrollTrigger: {
  //         trigger: svg,
  //         start: "top 90%",
  //         end: "top 20%",
  //         scrub: true,
  //         onEnter: () => svg.classList.add('svg-active'),
  //       }
  //     });
  //   });

  //   // 5. АНИМАЦИЯ ЧИСЕЛ
  //   document.querySelectorAll('.number-roll').forEach(el => {
  //     const digits = el.dataset.number.split("");
  //     el.innerHTML = digits.map(ch => {
  //       if (ch === "." || ch === ",") return `<span class="digit-container"><span>${ch}</span></span>`;
  //       if (ch === " " || ch === "00A0") return `<span class="digit-container">&nbsp;</span>`;
  //       let numSpan = "";
  //       for (let j = 0; j < 2; j++) for (let i = 0; i <= 9; i++) numSpan += `<span>${i}</span>`;
  //       return `<span class="digit-container"><span class="digit">${numSpan}</span></span>`;
  //     }).join("");

  //     ScrollTrigger.create({
  //       trigger: el,
  //       start: "top 95%",
  //       once: true,
  //       onEnter: () => {
  //         el.querySelectorAll(".digit").forEach((digitEl, i) => {
  //           const target = digits[i];
  //           if (isNaN(target)) return;

  //           gsap.to(digitEl, {
  //             y: -(10 + parseInt(target)) + "em",
  //             duration: 1 + i * 0.2,
  //             ease: "power3.out"
  //           });
  //         });
  //       }
  //     });
  //   });

  //   // 6. АНИМАЦИЯ БЛОКОВ (СЕТКИ)
  //   document.querySelectorAll('.anim-items').forEach(wrapper => {
  //     const items = wrapper.querySelectorAll('.anim-item');

  //     gsap.from(items, {
  //       scale: 0.8,
  //       opacity: 0,
  //       stagger: 0.15,
  //       duration: 0.8,
  //       ease: "back.out(1.6)",
  //       scrollTrigger: {
  //         trigger: wrapper,
  //         start: "top 85%",
  //         onEnter: () => wrapper.classList.add('anim-animated'),
  //       }
  //     });
  //   });

  //   // 7. ИСПРАВЛЕНИЕ ДЛЯ CSS MASK И ТЕНЕЙ (если нужно)
  //   // Если у вас блоки режутся маской, добавьте этот класс родителю
  //   // gsap.set(".line-mask", { overflow: "hidden" });
  // })();

  /**
   * Инициализация слайдера
   */
  (function swiperWrapper() {

    if (!document.querySelector('.swiper')) return;

    const globalImpulseOptions = {
      // Максимальный интервал между кликами в мс который считается быстрым
      fastClickDelay: 200,

      // Насколько сильно каждый быстрый клик увеличивает импульс
      // Формула: impulse += (fastClickDelay - delta) * accelerationFactor
      accelerationFactor: 0.23,

      // Коэффициент затухания импульса (0-1), теряет 15% каждые 40мс
      friction: 0.85,

      // Верхняя граница импульса, итоговый шаг = 1 + round(impulse)
      maxExtraSteps: 2,

      // Как часто пересчитывается затухание в мс, ~2-3 кадра при 60fps
      decayInterval: 40,
    };

    const slidersConfig = [
      // {
      //   sliderSelector: '.produce__slider',
      //   highlight: false,
      //   swiperOptions: {
      //     slidesPerGroup: 1,
      //     slidesPerView: 1,
      //     spaceBetween: 10,
      //     speed: 500,
      //     grabCursor: true,
      //     loop: false,
      //     touchRatio: 1.6,
      //     resistance: true,
      //     resistanceRatio: 0.4,
      //     centeredSlides: false,
      //     centeredSlidesBounds: true,
      //     simulateTouch: true,
      //     direction: 'horizontal',
      //     touchStartPreventDefault: true,
      //     touchMoveStopPropagation: true,
      //     threshold: 8,
      //     touchAngle: 25,
      //     watchOverflow: true,
      //     freeMode: {
      //       enabled: true,
      //       momentum: true,
      //       momentumRatio: 0.85,
      //       momentumVelocityRatio: 1,
      //       momentumBounce: false,
      //       sticky: true,
      //     },
      //     mousewheel: {
      //       forceToAxis: true,
      //       sensitivity: 1,
      //       releaseOnEdges: true,
      //     },
      //     navigation: false,
      //     breakpoints: {
      //       0: {
      //         slidesPerGroup: 1,
      //         slidesPerView: 1,
      //         spaceBetween: 20,
      //       },
      //       601: {
      //         slidesPerGroup: 1,
      //         slidesPerView: 2,
      //         spaceBetween: 20,
      //       },
      //       835: {
      //         slidesPerGroup: 1,
      //         slidesPerView: 3,
      //         spaceBetween: 80,
      //       },
      //     },
      //   },
      // },
      {
        sliderSelector: '.partners__slider',
        prevSelector: '.partners-button-prev',
        nextSelector: '.partners-button-next',
        highlight: false,
        swiperOptions: {
          slidesPerGroup: 1,
          slidesPerView: 1.02,
          spaceBetween: 8,
          speed: 500,
          grabCursor: true,
          loop: false,
          touchRatio: 1.6,
          resistance: true,
          resistanceRatio: 0.4,
          centeredSlides: false,
          centeredSlidesBounds: true,
          simulateTouch: true,
          direction: 'horizontal',
          touchStartPreventDefault: true,
          touchMoveStopPropagation: true,
          threshold: 8,
          touchAngle: 25,
          watchOverflow: true,
          freeMode: {
            enabled: true,
            momentum: true,
            momentumRatio: 0.85,
            momentumVelocityRatio: 1,
            momentumBounce: false,
            sticky: true,
          },
          mousewheel: {
            forceToAxis: true,
            sensitivity: 1,
            releaseOnEdges: true,
          },
          navigation: false,
          breakpoints: {
            0: {
              slidesPerGroup: 1,
              slidesPerView: 1.02,
              spaceBetween: 8,
            },
            835: {
              slidesPerGroup: 1,
              slidesPerView: 3,
              spaceBetween: 20,
            },
          },
        },
      },
      {
        sliderSelector: '.opinions__slider',
        prevSelector: '.opinions-button-prev',
        nextSelector: '.opinions-button-next',
        highlight: false,
        swiperOptions: {
          slidesPerGroup: 1,
          slidesPerView: 1,
          spaceBetween: 8,
          speed: 500,
          grabCursor: true,
          loop: false,
          touchRatio: 1.6,
          resistance: true,
          resistanceRatio: 0.4,
          centeredSlides: false,
          centeredSlidesBounds: true,
          simulateTouch: true,
          direction: 'horizontal',
          touchStartPreventDefault: true,
          touchMoveStopPropagation: true,
          threshold: 8,
          touchAngle: 25,
          watchOverflow: true,

          watchSlidesProgress: true,

          freeMode: {
            enabled: true,
            momentum: true,
            momentumRatio: 0.85,
            momentumVelocityRatio: 1,
            momentumBounce: false,
            sticky: true,
          },
          mousewheel: {
            forceToAxis: true,
            sensitivity: 1,
            releaseOnEdges: true,
          },
          navigation: false,
          breakpoints: {
            380: {
              slidesPerGroup: 1,
              slidesPerView: 2,
              spaceBetween: 8,
            },
            835: {
              slidesPerGroup: 1,
              slidesPerView: 3,
              spaceBetween: 20,
            },
          },
        },
      },
    ];


    // Инициализируем каждый слайдер из конфига
    slidersConfig.forEach(({ sliderSelector, prevSelector, nextSelector, highlight, swiperOptions }) => {

      if (!document.querySelector(sliderSelector)) return;

      // Ищем кнопки только если селекторы заданы в конфиге
      // Если prevSelector/nextSelector не указаны - слайдер без кнопок навигации
      const prevEl = prevSelector ? document.querySelector(prevSelector) : null;
      const nextEl = nextSelector ? document.querySelector(nextSelector) : null;

      // ищем highlight-элементы только если в конфиге явно указано highlight: true
      // если false или не указано - передаём null и createHighlight вернёт заглушку
      const fromEl = highlight ? document.querySelector(`${sliderSelector} .slider-highlight--from`) : null;
      const toEl = highlight ? document.querySelector(`${sliderSelector} .slider-highlight--to`) : null;

      const swiper = new Swiper(sliderSelector, swiperOptions);

      // Управление пагинацией через кастомный флаг hidePagination в брейкпоинтах
      initPaginationBreakpoint(swiper);

      // highlight создаём всегда - если элементов нет, вернётся заглушка
      // edgeTracker и navigation получат корректный объект в любом случае
      const highlightInstance = createHighlight(swiper, fromEl, toEl);

      // EdgeTracker подключаем только если slidesPerView больше 1 хотя бы
      // в одном брейкпоинте или в базовых настройках - иначе смысла нет
      const needsEdgeTracker = shouldUseEdgeTracker(swiperOptions);
      const edgeTracker = needsEdgeTracker
        ? createEdgeTracker(swiper, highlightInstance)
        : createEdgeTrackerStub();

      // Навигацию подключаем только если обе кнопки реально найдены в DOM
      if (prevEl || nextEl) {
        createNavigation(swiper, prevEl, nextEl, highlightInstance, edgeTracker);
      }
    });


    // Проверяет нужен ли edgeTracker для данного слайдера.
    // Смотрим на базовый slidesPerView и на все брейкпоинты -
    // если хоть где-то больше 1 (и не 'auto') то tracker нужен
    function shouldUseEdgeTracker(swiperOptions) {
      const base = swiperOptions.slidesPerView;
      if (typeof base === 'number' && base > 1) return true;

      const breakpoints = swiperOptions.breakpoints ?? {};
      return Object.values(breakpoints).some(bp => {
        return typeof bp.slidesPerView === 'number' && bp.slidesPerView > 1;
      });
    }


    // Заглушка edgeTracker для слайдеров где он не нужен (slidesPerView = 1).
    // Возвращает тот же API что и настоящий edgeTracker - navigation не знает разницы
    function createEdgeTrackerStub() {
      return {
        handleEdgeNext: () => false,
        handleEdgePrev: () => false,
        clearVirtual: () => { },
        getVirtualIndex: () => null,
      };
    }


    // Управление видимостью пагинации через кастомный флаг hidePagination.
    // Swiper не умеет включать/выключать пагинацию через breakpoints нативно,
    // поэтому слушаем событие breakpoint и управляем display вручную
    function initPaginationBreakpoint(swiper) {
      const paginationEl = swiper.pagination?.el;
      if (!paginationEl) return;

      function applyVisibility() {
        // currentBreakpointParams содержит параметры активного брейкпоинта
        const params = swiper.currentBreakpointParams ?? {};
        paginationEl.style.display = params.hidePagination === true ? 'none' : '';
      }

      swiper.on('breakpoint', applyVisibility);

      // Проверяем сразу после инициализации - брейкпоинт уже мог сработать
      applyVisibility();
    }


    // Highlight - анимированный фон резинка между слайдами.
    // Если элементов --from и --to нет в DOM - возвращаем заглушку.
    // Заглушка имеет тот же API поэтому edgeTracker работает без изменений
    function createHighlight(swiper, fromEl, toEl) {

      // Нет элементов - возвращаем заглушку с рабочим getGeometry
      // edgeTracker использует getGeometry для расчётов даже без визуала
      if (!fromEl || !toEl) {
        return {
          animateTo: () => { },
          snapInstant: () => { },
          getGeometry: (index) => {
            const slide = swiper.slides[index];
            if (!slide) return null;
            return {
              x: slide.offsetLeft + (swiper.translate ?? 0),
              width: slide.offsetWidth,
            };
          },
          getCurrentX: () => 0,
          getCurrentW: () => 0,
        };
      }

      const DURATION = 320;
      const EASE_OUT = 'cubic-bezier(0.4, 0, 0.2, 1)';
      const EASE_SNAP = 'cubic-bezier(0.34, 1.4, 0.64, 1)';

      let currentX = 0;
      let currentWidth = 0;
      let rafId = null;

      function getGeometry(index) {
        const slide = swiper.slides[index];
        if (!slide) return null;
        return {
          x: slide.offsetLeft + (swiper.translate ?? 0),
          width: slide.offsetWidth,
        };
      }

      function setInstant(el, x, width, visible) {
        el.style.transition = 'none';
        el.style.transform = `translateX(${x}px)`;
        el.style.width = `${width}px`;
        el.classList.toggle('is-visible', visible);
      }

      function setAnimated(el, x, width, duration, easing, visible) {
        el.style.transition = [
          `transform ${duration}ms ${easing}`,
          `width ${duration}ms ${easing}`,
          `opacity ${duration * 0.6}ms ease`,
        ].join(', ');
        el.style.transform = `translateX(${x}px)`;
        el.style.width = `${width}px`;
        el.classList.toggle('is-visible', visible);
      }

      function animateTo(toX, toWidth, dir) {
        if (rafId) cancelAnimationFrame(rafId);

        const fromX = currentX;
        const fromWidth = currentWidth;
        const collapseX = dir === 'next' ? fromX + fromWidth : fromX;
        const startX = dir === 'next' ? toX : toX + toWidth;

        setInstant(fromEl, fromX, fromWidth, true);
        setInstant(toEl, startX, 0, true);

        // Двойной RAF гарантирует что стили шага 1 применены до старта анимации
        rafId = requestAnimationFrame(() => {
          rafId = requestAnimationFrame(() => {
            rafId = null;
            setAnimated(fromEl, collapseX, 0, DURATION, EASE_OUT, false);
            setAnimated(toEl, toX, toWidth, DURATION, EASE_SNAP, true);
          });
        });

        // Фиксируем целевую геометрию сразу - не ждём конца анимации
        // Следующий вызов animateTo возьмёт правильную стартовую точку
        currentX = toX;
        currentWidth = toWidth;
      }

      function snapInstant(index) {
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        const geo = getGeometry(index);
        if (!geo) return;
        setInstant(fromEl, geo.x, geo.width, true);
        setInstant(toEl, geo.x, 0, false);
        currentX = geo.x;
        currentWidth = geo.width;
      }

      swiper.on('slideChange', () => {
        const curr = swiper.activeIndex;
        const prev = swiper.previousIndex ?? curr;
        const dir = curr >= prev ? 'next' : 'prev';
        const geo = getGeometry(curr);
        if (geo) animateTo(geo.x, geo.width, dir);
      });

      swiper.on('transitionEnd', () => {
        setInstant(fromEl, currentX, currentWidth, true);
        setInstant(toEl, currentX, 0, false);
      });

      swiper.on('setTranslate', () => {
        if (swiper.animating) return;
        const geo = getGeometry(swiper.activeIndex);
        if (!geo) return;
        if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
        setInstant(fromEl, geo.x, geo.width, true);
        setInstant(toEl, geo.x, 0, false);
        currentX = geo.x;
        currentWidth = geo.width;
      });

      swiper.on('resize', () => snapInstant(swiper.activeIndex));

      snapInstant(swiper.activeIndex ?? 0);

      return {
        animateTo,
        snapInstant,
        getGeometry,
        getCurrentX: () => currentX,
        getCurrentW: () => currentWidth,
      };
    }


    // EdgeTracker - виртуальный активный слайд когда wrapper упёрся в край.
    // Проблема: при slidesPerView > 1 последние слайды никогда не получают
    // swiper-slide-active потому что wrapper уже не может сдвинуться.
    // Решение: вручную двигаем виртуальный активный по оставшимся слайдам
    function createEdgeTracker(swiper, highlight) {

      const VIRTUAL_CLASS = 'is-virtual-active';
      const BEFORE_EDGE_CLASS = 'is-before-edge';

      let virtualIndex = null;

      function getVisibleIndices() {
        const containerWidth = swiper.width;
        const offset = Math.abs(swiper.translate ?? 0);
        const visible = [];
        swiper.slides.forEach((slide, i) => {
          const left = slide.offsetLeft;
          const right = left + slide.offsetWidth;
          if (right > offset && left < offset + containerWidth) visible.push(i);
        });
        return visible;
      }

      function clearBeforeEdge() {
        swiper.slides.forEach(s => s.classList.remove(BEFORE_EDGE_CLASS));
      }

      function markBeforeEdge() {
        clearBeforeEdge();
        swiper.slides.forEach(s => {
          if (s.classList.contains('swiper-slide-active')) {
            s.classList.add(BEFORE_EDGE_CLASS);
          }
        });
      }

      function clearVirtual() {
        swiper.slides.forEach(s => s.classList.remove(VIRTUAL_CLASS));
        clearBeforeEdge();
        virtualIndex = null;
      }

      function setVirtualActive(index, dir) {
        if (virtualIndex === null) markBeforeEdge();
        swiper.slides.forEach(s => s.classList.remove(VIRTUAL_CLASS));
        virtualIndex = index;
        swiper.slides[index]?.classList.add(VIRTUAL_CLASS);

        // highlight может быть заглушкой - вызываем в любом случае
        const geo = highlight.getGeometry(index);
        if (geo) highlight.animateTo(geo.x, geo.width, dir);
      }

      function handleEdgeNext() {
        if (!swiper.isEnd) return false;
        const visible = getVisibleIndices();
        if (!visible.length) return false;
        const lastVisible = visible[visible.length - 1];
        const current = virtualIndex ?? swiper.activeIndex;
        if (current >= lastVisible) return true;
        setVirtualActive(current + 1, 'next');
        return true;
      }

      function handleEdgePrev() {
        if (virtualIndex === null) return false;
        const current = virtualIndex;
        const realActive = swiper.activeIndex;
        if (current <= realActive) {
          clearVirtual();
          highlight.snapInstant(realActive);
          return false;
        }
        setVirtualActive(current - 1, 'prev');
        return true;
      }

      swiper.on('slideChange', () => {
        if (virtualIndex !== null) clearVirtual();
      });

      swiper.on('fromEdge', () => {
        clearVirtual();
      });

      return {
        handleEdgeNext,
        handleEdgePrev,
        clearVirtual,
        getVirtualIndex: () => virtualIndex,
      };
    }


    // Navigation - кнопки + импульс + disabled состояние.
    // Вызывается только если у слайдера есть обе кнопки навигации.
    // Получает edgeTracker который может быть настоящим или заглушкой
    function createNavigation(swiper, prevEl, nextEl, highlight, edgeTracker) {

      const {
        fastClickDelay = 200,
        accelerationFactor = 0.23,
        friction = 0.85,
        maxExtraSteps = 2,
        decayInterval = 40,
      } = globalImpulseOptions;

      let lastClickTime = 0;
      let lastDirection = null;
      let extraImpulse = 0;
      let decayTimer = null;

      function resetImpulse() {
        extraImpulse = 0;
        lastDirection = null;
        if (decayTimer) clearInterval(decayTimer);
        decayTimer = null;
      }

      function accumulateImpulse(direction) {
        const now = Date.now();
        const delta = now - lastClickTime;

        if (lastDirection !== null && lastDirection !== direction) {
          extraImpulse = 0;
        }

        extraImpulse = delta < fastClickDelay
          ? Math.min(extraImpulse + (fastClickDelay - delta) * accelerationFactor, maxExtraSteps)
          : 0;

        lastClickTime = now;
        lastDirection = direction;

        if (decayTimer) clearInterval(decayTimer);
        decayTimer = setInterval(() => {
          extraImpulse *= friction;
          if (extraImpulse < 0.2) {
            extraImpulse = 0;
            clearInterval(decayTimer);
            decayTimer = null;
          }
        }, decayInterval);
      }

      function getVisibleIndicesForNav() {
        const containerWidth = swiper.width;
        const offset = Math.abs(swiper.translate ?? 0);
        const visible = [];
        swiper.slides.forEach((slide, i) => {
          const left = slide.offsetLeft;
          const right = left + slide.offsetWidth;
          if (right > offset && left < offset + containerWidth) visible.push(i);
        });
        return visible;
      }

      function updateDisabled() {
        if (swiper.params.loop) return;

        const isStart = swiper.isBeginning && edgeTracker.getVirtualIndex() === null;

        let nextBlocked = false;
        if (swiper.isEnd) {
          const visible = getVisibleIndicesForNav();
          const lastVisible = visible[visible.length - 1] ?? swiper.activeIndex;
          const currentVirt = edgeTracker.getVirtualIndex() ?? swiper.activeIndex;
          nextBlocked = currentVirt >= lastVisible;
        }

        // disabled как свойство а не атрибут - клик всё равно доходит
        // до нашего обработчика даже когда кнопка визуально заблокирована
        if (prevEl) { prevEl.classList.toggle('swiper-button-disabled', isStart); prevEl.disabled = isStart; }
        if (nextEl) { nextEl.classList.toggle('swiper-button-disabled', nextBlocked); nextEl.disabled = nextBlocked; }
      }

      function handle(direction) {
        if (direction === 'next' && edgeTracker.handleEdgeNext()) {
          updateDisabled();
          return;
        }
        if (direction === 'prev' && edgeTracker.handleEdgePrev()) {
          updateDisabled();
          return;
        }

        accumulateImpulse(direction);
        const steps = 1 + Math.round(extraImpulse);

        // if (swiper.params.loop) {
        //   const total = swiper.slides.length - (swiper.loopedSlides ?? 0) * 2;
        //   const curr = swiper.realIndex;
        //   const target = direction === 'next'
        //     ? (curr + steps) % total
        //     : (curr - steps + total) % total;
        //   swiper.slideToLoop(target);
        // }
        if (swiper.params.loop) {
          if (direction === 'next') {
            swiper.slideNext();
          } else {
            swiper.slidePrev();
          }
          return;
        } else {
          const base = swiper.activeIndex;
          const target = direction === 'next'
            ? Math.min(base + steps, swiper.slides.length - 1)
            : Math.max(base - steps, 0);
          swiper.slideTo(target);
        }

        // if (nextEl) nextEl.addEventListener('click', (e) => {
        //   e.preventDefault();
        //   console.log('next clicked', swiper.realIndex);
        //   handle('next');
        // });

        // console.log('loopedSlides:', swiper.loopedSlides);
        // console.log('slides.length:', swiper.slides.length);

        updateDisabled();
      }

      if (nextEl) nextEl.addEventListener('click', (e) => { e.preventDefault(); handle('next'); });
      if (prevEl) prevEl.addEventListener('click', (e) => { e.preventDefault(); handle('prev'); });

      swiper.on('touchStart', resetImpulse);
      swiper.on('slideChange', updateDisabled);
      swiper.on('resize', updateDisabled);
      swiper.on('touchEnd', () => {
        const dir = swiper.swipeDirection;
        if (dir === 'next') edgeTracker.handleEdgeNext();
        else if (dir === 'prev') edgeTracker.handleEdgePrev();
        updateDisabled();
      });

      swiper.on('destroy', () => {
        if (decayTimer) clearInterval(decayTimer);
        decayTimer = null;
      });

      updateDisabled();
    }

    // Добавьте этот код один раз в проект
    // Он будет следить за изменением высоты BODY и обновлять GSAP
    // const ro = new ResizeObserver(() => {
    //   ScrollTrigger.refresh();
    // });
    // ro.observe(document.body);

  })();

  /**
   * Инициализация Fancybox
   */
  Fancybox.bind('[data-fancybox]', {
    // Отключаем закрытие свайпом вниз
    dragToClose: false,
    // Отключаем жесты карусели (свайп влево/вправо)
    Carousel: {
      Panzoom: {
        // Отключаем pan (перетаскивание контента)
        panMode: 'mousemove',
        // или полностью:
        // touch: false,
      },
    },
    on: {
      init: () => lenis.stop(),
      destroy: () => lenis.start(),
    },
  });

  /**
   * iOS-safe ScrollTrigger refresh handler
   */
  // (function () {
  //   let resizeTimer = null;
  //   let lastWidth = window.innerWidth;

  //   // Единственный надёжный триггер для refresh - смена ширины.
  //   // Высоту игнорируем полностью: на iOS она "прыгает" при скролле
  //   // из-за адресной строки и вызывает ложные refresh.
  //   function safeRefresh() {
  //     // Читаем ширину через visualViewport если доступен - точнее на iOS
  //     const currentWidth = window.visualViewport
  //       ? Math.round(window.visualViewport.width)
  //       : window.innerWidth;

  //     if (Math.abs(currentWidth - lastWidth) < 50) return;

  //     lastWidth = currentWidth;

  //     clearTimeout(resizeTimer);
  //     // 400ms - даём iOS время завершить layout после поворота
  //     resizeTimer = setTimeout(() => {
  //       ScrollTrigger.refresh();
  //     }, 400);
  //   }

  //   // orientationchange - основной триггер поворота на мобильных
  //   window.addEventListener('orientationchange', () => {
  //     // Дополнительная задержка: браузер применяет новые размеры
  //     // не сразу после события а через ~300-500ms
  //     clearTimeout(resizeTimer);
  //     resizeTimer = setTimeout(() => {
  //       lastWidth = window.visualViewport
  //         ? Math.round(window.visualViewport.width)
  //         : window.innerWidth;
  //       ScrollTrigger.refresh();
  //     }, 500);
  //   });

  //   // window.resize - для десктопа и Android
  //   window.addEventListener('resize', safeRefresh);

  //   // visualViewport.resize - для iOS Safari (надёжнее чем window.resize)
  //   if (window.visualViewport) {
  //     window.visualViewport.addEventListener('resize', safeRefresh);
  //   }
  // })();

  // Следим за любыми изменениями высоты документа (аккордеоны, табы, загрузка картинок)
  // const globalResizeObserver = new ResizeObserver(() => {
  //   ScrollTrigger.refresh();
  // });
  // globalResizeObserver.observe(document.body);

  window.addEventListener('resize', function () { ScrollTrigger.update() });

  /**
   * УВЕДОМЛЕНИЕ О COOKIE                     
   *    
   * Показывает плашку если cookie COOKIE_ACCEPT ≠ '1'.            
   * checkCookies() вызывается из HTML при клике на кнопку.         
   */
  const cookieAccepted =
    ('; ' + document.cookie).split(`; COOKIE_ACCEPT=`).pop().split(';')[0] === '1';

  if (!cookieAccepted) {
    const cookiesNotify = document.getElementById('plate_cookie');
    if (cookiesNotify) {
      cookiesNotify.style.opacity = '1';
      cookiesNotify.style.visibility = 'visible';
      cookiesNotify.style.pointerEvents = 'all';
    }
  }

});

/**
 * Принимает cookie и скрывает плашку уведомления.
 *
 * Устанавливает COOKIE_ACCEPT=1 сроком на 1 год.
 */
function checkCookies() {
  const expires = new Date(Date.now() + 86400e3 * 365).toUTCString();
  document.cookie = `COOKIE_ACCEPT=1;path=/;expires=${expires}`;

  const plate = document.getElementById('plate_cookie');
  if (!plate) return;

  plate.style.opacity = '0';
  plate.style.visibility = 'hidden';
  plate.style.pointerEvents = 'none';

  setTimeout(() => plate.remove(), 5000);
}