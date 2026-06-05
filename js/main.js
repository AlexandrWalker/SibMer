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

    gsap.ticker.add((time) => lenis.raf(time * 1000));

    gsap.ticker.lagSmoothing(0);

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
      animateHeight: false,                // true = менять высоту, false = не менять
      heightMultiplier: 1,              // во сколько раз уменьшить (0.7 = 63.53%)
      // heightMultiplier: 0.342,

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
    const headerHeight = header.offsetHeight;

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
      height: headerHeight,
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

      tlScrub.to(header, animateTo);
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
          const currentIsMobile = isMobile();

          // Реагируем только если реально пересекли брейкпоинт
          // Иначе при каждом мини-ресайзе будем без нужды пересобирать анимацию
          if (currentIsMobile === lastIsMobile) return;
          lastIsMobile = currentIsMobile;

          // Находим scrub-таймлайн нашего хедера и обновляем целевую высоту
          // ScrollTrigger.getAll() возвращает все триггеры на странице -
          // фильтруем по trigger === document.documentElement
          const newHeight = headerHeight * getHeightMultiplier();

          ScrollTrigger.getAll().forEach(st => {
            // Ищем именно scrub-триггер хедера
            if (st.trigger === document.documentElement && st.animation) {
              // Меняем целевое значение height в текущем твине
              const tween = st.animation.getChildren()[0];
              if (tween && tween.vars) {
                tween.vars.height = newHeight;
                // Инвалидируем чтобы GSAP перечитал from/to значения
                tween.invalidate();
                st.refresh();
              }
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

  (function () {
    const svgBlocks = document.querySelectorAll('.svg-block');
    if (svgBlocks.length) {
      svgBlocks.forEach(svgBlock => {
        gsap.from(svgBlock, {
          ease: "none",
          scrollTrigger: {
            trigger: svgBlock,
            start: `top 90%`,
            end: `top top`,
            scrub: true,
          },
          onStart: function () {
            svgBlock.classList.add('svg-active');
          },
        });
      });
    }
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
   * Инициализация Fancybox
   */
  Fancybox.bind('[data-fancybox]', {
    // Отключаем закрытие свайпом вниз
    // Это главный виновник конфликта со скроллом внутри попапа
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
  (function () {
    let resizeTimer = null;
    let lastWidth = window.innerWidth;

    // Единственный надёжный триггер для refresh - смена ширины.
    // Высоту игнорируем полностью: на iOS она "прыгает" при скролле
    // из-за адресной строки и вызывает ложные refresh.
    function safeRefresh() {
      // Читаем ширину через visualViewport если доступен - точнее на iOS
      const currentWidth = window.visualViewport
        ? Math.round(window.visualViewport.width)
        : window.innerWidth;

      if (Math.abs(currentWidth - lastWidth) < 50) return;

      lastWidth = currentWidth;

      clearTimeout(resizeTimer);
      // 400ms - даём iOS время завершить layout после поворота
      resizeTimer = setTimeout(() => {
        ScrollTrigger.refresh();
      }, 400);
    }

    // orientationchange - основной триггер поворота на мобильных
    window.addEventListener('orientationchange', () => {
      // Дополнительная задержка: браузер применяет новые размеры
      // не сразу после события а через ~300-500ms
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => {
        lastWidth = window.visualViewport
          ? Math.round(window.visualViewport.width)
          : window.innerWidth;
        ScrollTrigger.refresh();
      }, 500);
    });

    // window.resize - для десктопа и Android
    window.addEventListener('resize', safeRefresh);

    // visualViewport.resize - для iOS Safari (надёжнее чем window.resize)
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', safeRefresh);
    }
  })();

});