/* ============================================
   main.js — Shaydefy Studio v4
   ============================================ */
(function () {
  'use strict';

  /* ----------------------------------------
     YEAR
  ---------------------------------------- */
  var yr = document.getElementById('year');
  if (yr) yr.textContent = new Date().getFullYear();

  var lenis = null;

  /* ----------------------------------------
     PRELOADER — dismiss then kick off hero
  ---------------------------------------- */
  var preloader = document.getElementById('preloader');

  function dismissPreloader() {
    if (preloader) {
      preloader.style.transition = 'none';
      preloader.classList.add('out');
    }
    document.body.style.overflow = '';
  }

  var ready = false;
  function tryDismiss() {
    if (ready) return;
    ready = true;
    setTimeout(dismissPreloader, 1700);
  }

  window.addEventListener('load', tryDismiss);
  setTimeout(tryDismiss, 2200);

  /* ----------------------------------------
     INTRO — old site fullscreen, glitch out
  ---------------------------------------- */
  (function () {
    var overlay  = document.getElementById('introOverlay');
    var skipBtn  = document.getElementById('introSkip');
    if (!overlay) { revealHero(); return; }

    var fired = false;

    function glitchOut() {
      if (fired) return;
      fired = true;
      if (skipBtn) gsap.to(skipBtn, { opacity: 0, duration: 0.15 });

      /* Character scramble — exact from component GlitchText */
      var glitchChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';
      var glitchIntensity = 0.9;
      var textEls  = Array.from(overlay.querySelectorAll('.era-h1,.era-h2,.era-logo,.era-blink,.era-location,.era-counter,.era-btn'));
      var originals = textEls.map(function (el) { return el.textContent; });

      var scrambleId = setInterval(function () {
        textEls.forEach(function (el, i) {
          if (Math.random() > 1 - glitchIntensity * 0.05) {
            var orig = originals[i];
            var glitched = orig.split('').map(function (c) {
              return Math.random() > 1 - glitchIntensity * 0.2
                ? glitchChars[Math.floor(Math.random() * glitchChars.length)]
                : c;
            }).join('');
            el.textContent = glitched;
            setTimeout(function () { el.textContent = orig; }, 50 + Math.random() * (100 * glitchIntensity));
          }
        });
      }, 80);

      /* Text shadow — exact from component GlitchText */
      gsap.to(textEls, {
        textShadow: (2 * glitchIntensity) + 'px 0 #ff0000, ' + (-2 * glitchIntensity) + 'px 0 #00ffff',
        duration: 0.1,
        repeat: -1,
        yoyo: true,
        ease: 'power2.inOut'
      });

      /* Glitch timeline — exact from component */
      var glitchTl = gsap.timeline({ repeat: -1, repeatDelay: 2 });
      glitchTl
        .to(overlay, { filter: 'hue-rotate(180deg) saturate(2)', duration: 0.1 })
        .to(overlay, { filter: 'none', duration: 0.1 })
        .to(overlay, { x:  5, duration: 0.05 })
        .to(overlay, { x: -5, duration: 0.05 })
        .to(overlay, { x:  0, duration: 0.05 });

      /* Canvas: thick white VHS tracking bars build up and take over */
      var cvs = document.createElement('canvas');
      cvs.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:200000;';
      cvs.width  = window.innerWidth;
      cvs.height = window.innerHeight;
      document.body.appendChild(cvs);
      var ctx = cvs.getContext('2d');

      /* 8 bars evenly spaced — GSAP-driven so timing is exact */
      var NUM_BARS   = 8;
      var barCentres = [];
      for (var b = 0; b < NUM_BARS; b++) {
        barCentres.push((b + 0.5) / NUM_BARS * cvs.height);
      }
      var maxBarH = (cvs.height / NUM_BARS) * 2.6;

      var growObj = { p: 0 };

      gsap.to(growObj, {
        p: 1,
        duration: 1.8,
        ease: 'power2.inOut',
        onUpdate: function () {
          var p = growObj.p;
          ctx.clearRect(0, 0, cvs.width, cvs.height);
          overlay.style.opacity = String(Math.max(1 - p * 1.6, 0));
          ctx.fillStyle = 'white';
          barCentres.forEach(function (cy) {
            ctx.fillRect(0, cy - (maxBarH * p) / 2, cvs.width, maxBarH * p);
          });
        },
        onComplete: function () {
          /* Screen fully white — hold briefly */
          ctx.fillStyle = 'white';
          ctx.fillRect(0, 0, cvs.width, cvs.height);

          setTimeout(function () {
            /* Fire hero behind the white */
            glitchTl.kill();
            gsap.killTweensOf(textEls);
            clearInterval(scrambleId);
            gsap.set(overlay, { clearProps: 'all' });
            overlay.style.display = 'none';
            window.dispatchEvent(new CustomEvent('introComplete'));
            revealHero();

            /* Dissolve white off real site */
            var outObj = { a: 1 };
            gsap.to(outObj, {
              a: 0,
              duration: 0.7,
              ease: 'power2.out',
              onUpdate: function () {
                ctx.clearRect(0, 0, cvs.width, cvs.height);
                ctx.fillStyle = 'rgba(255,255,255,' + outObj.a.toFixed(3) + ')';
                ctx.fillRect(0, 0, cvs.width, cvs.height);
              },
              onComplete: function () { cvs.remove(); }
            });
          }, 300);
        }
      });
    }

    var timer = setTimeout(glitchOut, 900);
    if (skipBtn) skipBtn.addEventListener('click', function () {
      clearTimeout(timer);
      glitchOut();
    });
  })();

  /* ----------------------------------------
     HERO REVEAL — word clip animation
  ---------------------------------------- */
  function revealHero() {
    /* Safety: force-remove intro overlay regardless of intro.js state */
    var introEl = document.getElementById('introOverlay');
    if (introEl) introEl.style.display = 'none';

    var words   = document.querySelectorAll('.hero-title .word');
    var eyebrow = document.querySelector('.hero-eyebrow');
    var rule    = document.querySelector('.hero-rule');
    var sub     = document.querySelector('.hero-sub');
    var actions = document.querySelector('.hero-actions');
    var aside   = document.querySelector('.hero-aside');
    var scroll  = document.querySelector('.hero-scroll-hint');

    if (typeof gsap !== 'undefined') {
      /* Brief glitch on site reveal — normalizes as hero animates in */
      var heroEl = document.querySelector('.hero');
      if (heroEl) {
        gsap.set(heroEl, { filter: 'hue-rotate(25deg) saturate(3) brightness(1.3)' });
        gsap.to(heroEl, { filter: 'hue-rotate(0deg) saturate(1) brightness(1)', duration: 0.7, ease: 'power3.out', delay: 0.1 });
      }

      var tl = gsap.timeline({ onComplete: function() { initScrollFeatures(); startSubTypewriter(); } });

      tl.to(eyebrow, { opacity:1, y:0, duration:0.7, ease:'power2.out' }, 0);
      tl.to(rule,    { opacity:1, duration:0.6, ease:'power2.out' }, 0.2);
      tl.to(words,   { y:'0%', duration:1.0, stagger:0.12, ease:'power4.out' }, 0.15);
      tl.to(sub,     { opacity:1, y:0, duration:0.8, ease:'power2.out' }, 0.55);
      tl.to(actions, { opacity:1, y:0, duration:0.7, ease:'power2.out' }, 0.72);
      tl.to(aside,   { opacity:1, y:0, duration:0.8, ease:'power2.out' }, 0.6);
      tl.to(scroll,  { opacity:1, duration:0.6, ease:'power2.out' }, 1.1);

    } else {
      [eyebrow, rule, sub, actions, aside, scroll].forEach(function (el) {
        if (el) el.style.opacity = '1';
      });
      words.forEach(function (w) { w.style.transform = 'translateY(0)'; });
      initScrollFeatures();
    }
  }

  /* ----------------------------------------
     HERO SUB — cycling typewriter
     The site demonstrates its own copywriting
     in real time. Each phrase targets a different
     client type — the pitch writes itself.
  ---------------------------------------- */
  function startSubTypewriter() {
    var el = document.getElementById('heroSub');
    if (!el || typeof gsap === 'undefined') return;

    var phrases = [
      'Premium web experiences for\nbusinesses that refuse to be ordinary.',
      'For law firms that mean business.',
      'For brands that deserve to be seen.',
      'For restaurants that demand perfection.',
      'For studios that take craft seriously.',
      'For anyone tired of looking average.'
    ];

    var index = 0;

    function typePhrase(phrase) {
      el.innerHTML = '';
      var chars = phrase.split('');
      var obj   = { n: 0 };

      gsap.to(obj, {
        n: chars.length,
        duration: chars.length * 0.032,
        ease: 'none',
        onUpdate: function () {
          var n    = Math.round(obj.n);
          var text = chars.slice(0, n).join('').replace('\n', '<br>');
          el.innerHTML = text;
        },
        onComplete: function () {
          /* Hold, then erase */
          gsap.delayedCall(2.2, function () {
            gsap.to(obj, {
              n: 0,
              duration: chars.length * 0.018,
              ease: 'power2.in',
              onUpdate: function () {
                var n    = Math.round(obj.n);
                var text = chars.slice(0, n).join('').replace('\n', '<br>');
                el.innerHTML = text;
              },
              onComplete: function () {
                index = (index + 1) % phrases.length;
                gsap.delayedCall(0.3, function () { typePhrase(phrases[index]); });
              }
            });
          });
        }
      });
    }

    typePhrase(phrases[0]);
  }

  /* ----------------------------------------
     SCROLL PROGRESS
  ---------------------------------------- */
  var bar = document.getElementById('scrollProgress');
  function updateBar() {
    if (!bar) return;
    var total = document.documentElement.scrollHeight - window.innerHeight;
    if (total > 0) bar.style.width = (window.scrollY / total * 100) + '%';
  }
  window.addEventListener('scroll', updateBar, { passive: true });

  /* ----------------------------------------
     NAVBAR scroll state
  ---------------------------------------- */
  var navbar = document.getElementById('navbar');
  window.addEventListener('scroll', function () {
    if (navbar) navbar.classList.toggle('scrolled', window.scrollY > 50);
    updateBar();
  }, { passive: true });

  /* ----------------------------------------
     MOBILE NAV TOGGLE
  ---------------------------------------- */
  var navMenu   = document.getElementById('navMenu');
  var navToggle = document.getElementById('navToggle');
  var isOpen    = false;

  function setMenu(open) {
    isOpen = open;
    if (navMenu)   navMenu.classList.toggle('open', open);
    if (navToggle) navToggle.parentElement.classList.toggle('nav-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
  }

  if (navToggle) navToggle.addEventListener('click', function () { setMenu(!isOpen); });
  if (navMenu) navMenu.querySelectorAll('a').forEach(function (a) {
    a.addEventListener('click', function () { setMenu(false); });
  });

  /* ----------------------------------------
     ACTIVE NAV LINK + SECTION INDICATOR
  ---------------------------------------- */
  var sectionIndicator = document.getElementById('sectionIndicator');
  var sectionNum       = document.getElementById('sectionNum');
  var sectionLabel     = document.getElementById('sectionLabel');
  var trackedSections  = document.querySelectorAll('[data-section-label]');
  var navLinks         = document.querySelectorAll('.nav-menu a[href^="#"]');

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (!e.isIntersecting) return;

      // Nav active state
      navLinks.forEach(function (a) {
        a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id);
      });

      // Section indicator
      var label = e.target.getAttribute('data-section-label');
      var num   = e.target.getAttribute('data-section-num');
      if (label && sectionNum && sectionLabel) {
        sectionNum.textContent   = num;
        sectionLabel.textContent = label;
        if (sectionIndicator) sectionIndicator.classList.add('visible');
      }
    });
  }, { threshold: 0.3 });

  document.querySelectorAll('[id]').forEach(function (s) { io.observe(s); });

  /* ----------------------------------------
     SCROLL REVEAL — data-reveal elements
     Work cards stagger left-to-right in grid
  ---------------------------------------- */
  var reveals = document.querySelectorAll('[data-reveal]');
  var ro = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('visible');
        ro.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  // Work cards in grid get staggered delay
  var workCards = document.querySelectorAll('.work-grid .work-card');
  workCards.forEach(function (card, i) {
    card.style.transitionDelay = (i % 3) * 0.1 + 's';
  });

  reveals.forEach(function (el) { ro.observe(el); });

  /* ----------------------------------------
     SPOTLIGHT GLOW — work cards
  ---------------------------------------- */
  document.querySelectorAll('.work-card').forEach(function (card) {
    var img = card.querySelector('.work-card-img');
    card.addEventListener('mousemove', function (e) {
      if (!img) return;
      var r = img.getBoundingClientRect();
      img.style.setProperty('--mx', ((e.clientX - r.left) / r.width  * 100) + '%');
      img.style.setProperty('--my', ((e.clientY - r.top)  / r.height * 100) + '%');
    });
  });

  /* ----------------------------------------
     WORK CARD GLITCH — hover reveals the "before"
     Image briefly flickers to a desaturated,
     contrasty "before" state then snaps to the
     polished version. Shows the transformation.
  ---------------------------------------- */
  if (window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
    document.querySelectorAll('.work-card').forEach(function (card) {
      var img = card.querySelector('.work-card-img');
      if (!img) return;
      card.addEventListener('mouseenter', function () {
        gsap.timeline()
          .to(img, {
            filter: 'saturate(0) brightness(0.45) contrast(1.5)',
            skewX: 0.8,
            duration: 0.1,
            ease: 'power3.in'
          })
          .to(img, {
            filter: 'saturate(0.8) brightness(0.95) contrast(1)',
            skewX: 0,
            duration: 0.28,
            ease: 'power3.out'
          });
      });
    });
  }

  /* ----------------------------------------
     CURSOR PREVIEW — gsap.quickTo + velocity skew
  ---------------------------------------- */
  (function () {
    if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;
    if (typeof gsap === 'undefined') return;
    var preview = document.getElementById('cursorPreview');
    var previewImg = document.getElementById('cursorPreviewImg');
    if (!preview || !previewImg) return;

    var mx = 0, my = 0, prevMx = 0, prevMy = 0;

    var xTo = gsap.quickTo(preview, 'x', { duration: 0.6, ease: 'power3.out' });
    var yTo = gsap.quickTo(preview, 'y', { duration: 0.6, ease: 'power3.out' });

    document.addEventListener('mousemove', function (e) {
      var dx = e.clientX - prevMx;
      var dy = e.clientY - prevMy;
      prevMx = mx; prevMy = my;
      mx = e.clientX; my = e.clientY;

      xTo(mx + 20);
      yTo(my - 80);

      gsap.to(previewImg, {
        skewX: dx * 0.25, skewY: dy * 0.08,
        duration: 0.3, ease: 'power2.out', overwrite: true
      });
      gsap.to(previewImg, {
        skewX: 0, skewY: 0,
        duration: 0.7, ease: 'power3.out', delay: 0.1, overwrite: false
      });
    }, { passive: true });

    document.querySelectorAll('[data-preview]').forEach(function (card) {
      card.addEventListener('mouseenter', function () {
        previewImg.style.backgroundImage = "url('" + card.getAttribute('data-preview') + "')";
        preview.classList.add('active');
      });
      card.addEventListener('mouseleave', function () {
        preview.classList.remove('active');
      });
    });
  })();

  /* ----------------------------------------
     LIQUID CURSOR BLOB
  ---------------------------------------- */
  (function () {
    if (!window.matchMedia('(hover:hover) and (pointer:fine)').matches) return;

    var el = document.createElement('div');
    el.className = 'cursor';
    el.innerHTML = '<div class="cursor-dot"></div>';
    document.body.appendChild(el);
    var dot = el.querySelector('.cursor-dot');
    document.documentElement.classList.add('cursor-on');

    var mx=0,my=0,cx=0,cy=0,px=0,py=0;
    var hovering = false;
    el.style.opacity = '0';

    document.addEventListener('mousemove', function (e) {
      mx = e.clientX; my = e.clientY;
      el.style.opacity = '1';
    }, { passive: true });
    document.addEventListener('mouseleave', function () { el.style.opacity = '0'; });
    document.addEventListener('mouseover', function (e) {
      hovering = !!e.target.closest('a,button,[role="button"]');
      dot.classList.toggle('big', hovering);
    });

    // VIEW label on work card hover
    document.querySelectorAll('.work-card').forEach(function (card) {
      card.addEventListener('mouseenter', function () {
        dot.classList.remove('big');
        dot.classList.add('view');
        dot.textContent = 'VIEW';
      });
      card.addEventListener('mouseleave', function () {
        dot.classList.remove('view');
        dot.textContent = '';
      });
    });

    (function loop() {
      requestAnimationFrame(loop);
      px = cx; py = cy;
      cx += (mx - cx) * 0.13;
      cy += (my - cy) * 0.13;
      var vx = cx - px, vy = cy - py;
      var spd = Math.sqrt(vx*vx + vy*vy);
      var str = Math.min(spd * 0.18, 1.6);
      var sx  = hovering ? 1 : 1 + str;
      var sy  = hovering ? 1 : Math.max(0.5, 1/(1 + str*0.55));
      var ang = (!hovering && spd > 0.3) ? Math.atan2(vy,vx)*(180/Math.PI) : 0;
      el.style.transform  = 'translate(' + cx + 'px,' + cy + 'px)';
      dot.style.transform = 'translate(-50%,-50%) rotate(' + ang + 'deg) scaleX(' + sx + ') scaleY(' + sy + ')';
    })();
  })();

  /* ----------------------------------------
     CLICK SHOCKWAVE
  ---------------------------------------- */
  document.addEventListener('click', function (e) {
    var r = document.createElement('span');
    r.style.cssText = 'position:fixed;left:' + e.clientX + 'px;top:' + e.clientY + 'px;' +
      'width:0;height:0;border-radius:50%;border:1px solid rgba(201,168,76,0.6);' +
      'transform:translate(-50%,-50%);pointer-events:none;z-index:9997;' +
      'transition:width 0.55s ease,height 0.55s ease,opacity 0.55s ease;opacity:1;';
    document.body.appendChild(r);
    requestAnimationFrame(function () {
      requestAnimationFrame(function () {
        r.style.width = '72px'; r.style.height = '72px'; r.style.opacity = '0';
      });
    });
    setTimeout(function () { r.remove(); }, 600);
  });

  /* ----------------------------------------
     PAGE TRANSITION CURTAIN — stair panels
  ---------------------------------------- */
  (function () {
    var curtain = document.getElementById('pageCurtain');
    if (!curtain || typeof gsap === 'undefined') return;

    var panels = curtain.querySelectorAll('.curtain-panel');
    if (!panels.length) return;

    function coverScreen(cb) {
      curtain.style.pointerEvents = 'all';
      gsap.fromTo(panels,
        { yPercent: 100 },
        {
          yPercent: 0,
          duration: 0.6,
          stagger: 0.07,
          ease: 'power4.inOut',
          onComplete: cb
        }
      );
    }

    function revealScreen() {
      gsap.to(panels, {
        yPercent: -100,
        duration: 0.6,
        stagger: { each: 0.07, from: 'end' },
        ease: 'power4.inOut',
        onComplete: function () {
          curtain.style.pointerEvents = 'none';
          gsap.set(panels, { yPercent: 100 });
        }
      });
    }

    if (sessionStorage.getItem('curtainEntry')) {
      sessionStorage.removeItem('curtainEntry');
      gsap.set(panels, { yPercent: 0 });
      curtain.style.pointerEvents = 'all';
      setTimeout(revealScreen, 100);
    }

    document.querySelectorAll('a[href]').forEach(function (a) {
      var h = a.getAttribute('href');
      if (!h || h.startsWith('#') || h.startsWith('http') ||
          h.startsWith('//') || h.startsWith('mailto') || h.startsWith('tel')) return;
      a.addEventListener('click', function (e) {
        e.preventDefault();
        sessionStorage.setItem('curtainEntry', '1');
        coverScreen(function () { window.location.href = h; });
      });
    });

  })();

  /* ----------------------------------------
     SMOOTH ANCHOR SCROLL
  ---------------------------------------- */
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var t = document.querySelector(this.getAttribute('href'));
      if (!t) return;
      e.preventDefault();
      if (lenis) {
        lenis.scrollTo(t, { offset: -72, duration: 1.2 });
      } else {
        window.scrollTo({ top: t.getBoundingClientRect().top + window.scrollY - 72, behavior: 'smooth' });
      }
    });
  });

  /* ----------------------------------------
     SCROLL-DRIVEN FEATURES (GSAP ScrollTrigger)
  ---------------------------------------- */
  function initScrollFeatures() {
    if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') return;

    gsap.registerPlugin(ScrollTrigger);

    /* -- SplitText heading reveals -- */
    function splitHeading(el) {
      var nodes = Array.from(el.childNodes);
      el.innerHTML = '';
      nodes.forEach(function (node) {
        if (node.nodeType === 3) {
          node.textContent.split(/(\s+)/).forEach(function (chunk) {
            if (/^\s+$/.test(chunk)) {
              el.appendChild(document.createTextNode(chunk));
            } else if (chunk) {
              var wrap  = document.createElement('span');
              wrap.className = 'split-wrap';
              var inner = document.createElement('span');
              inner.className = 'split-word';
              inner.textContent = chunk;
              wrap.appendChild(inner);
              el.appendChild(wrap);
            }
          });
        } else if (node.nodeType === 1) {
          if (node.tagName === 'BR') {
            el.appendChild(node.cloneNode());
          } else if (node.tagName === 'EM') {
            node.textContent.split(/(\s+)/).forEach(function (chunk) {
              if (/^\s+$/.test(chunk)) {
                el.appendChild(document.createTextNode(chunk));
              } else if (chunk) {
                var wrap  = document.createElement('span');
                wrap.className = 'split-wrap';
                var em    = document.createElement('em');
                var inner = document.createElement('span');
                inner.className = 'split-word';
                inner.textContent = chunk;
                em.appendChild(inner);
                wrap.appendChild(em);
                el.appendChild(wrap);
              }
            });
          } else {
            el.appendChild(node.cloneNode(true));
          }
        }
      });
    }

    document.querySelectorAll('h2').forEach(function (h2) {
      // Skip if inside hero (has its own animation) or closing section (typewriter handles it)
      if (h2.closest('.hero') || h2.closest('.closing-section')) return;
      // Remove data-reveal on the h2 itself to avoid conflict
      h2.removeAttribute('data-reveal');
      h2.style.opacity = '1';
      h2.style.transform = 'none';

      splitHeading(h2);

      gsap.fromTo(h2.querySelectorAll('.split-word'),
        { y: '105%' },
        {
          y: '0%',
          duration: 1.0,
          stagger: 0.07,
          ease: 'power4.out',
          scrollTrigger: { trigger: h2, start: 'top 88%', once: true }
        }
      );
    });

    /* -- Hero title parallax on scroll -- */
    var heroTitle = document.querySelector('.hero-title');
    if (heroTitle) {
      gsap.to(heroTitle, {
        yPercent: -20,
        ease: 'none',
        scrollTrigger: {
          trigger: '.hero',
          start: 'top top',
          end: 'bottom top',
          scrub: true
        }
      });
    }

    /* -- Process line scrub -- */
    var processLine    = document.getElementById('processLineFill');
    var processSection = document.querySelector('.process-section');
    if (processLine && processSection) {
      gsap.to(processLine, {
        scaleX: 1, ease: 'none',
        scrollTrigger: {
          trigger: processSection,
          start: 'top 65%',
          end: 'top 15%',
          scrub: 0.8
        }
      });
    }

    /* -- Featured card parallax -- */
    var featuredImg = document.querySelector('.work-featured-img');
    if (featuredImg) {
      gsap.to(featuredImg, {
        yPercent: 18, ease: 'none',
        scrollTrigger: {
          trigger: '.work-featured',
          start: 'top bottom',
          end: 'bottom top',
          scrub: true
        }
      });
    }

    /* -- Direction-aware scroll reveals -- */
    document.querySelectorAll('[data-reveal]').forEach(function (el) {
      if (el.closest('.hero') || el.closest('.closing-section')) return;
      var delay = parseInt(el.getAttribute('data-reveal-delay') || '0', 10) * 0.12;
      // Take over from the IO observer
      ro.unobserve(el);
      el.classList.remove('visible');
      el.style.transition = 'none';
      gsap.set(el, { opacity: 0, y: 36 });

      ScrollTrigger.create({
        trigger: el,
        start: 'top 88%',
        onEnter: function () {
          gsap.to(el, { opacity: 1, y: 0, duration: 0.8, delay: delay, ease: 'power3.out' });
        },
        onLeaveBack: function () {
          gsap.set(el, { opacity: 0, y: -30 });
        },
        onEnterBack: function () {
          gsap.to(el, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' });
        }
      });
    });

    /* -- Scroll typewriter — closing statement h2 -- */
    var closingH2 = document.querySelector('.closing-section h2');
    if (closingH2) {
      ro.unobserve(closingH2);
      closingH2.removeAttribute('data-reveal');
      closingH2.style.opacity = '1';
      closingH2.style.transform = 'none';

      var twBefore = "Let\u2019s build something\nthe world ";
      var twAfter  = 'remembers.';
      var twFull   = twBefore + twAfter;

      closingH2.innerHTML = '<span class="tw-typed"></span>';
      var twTyped = closingH2.querySelector('.tw-typed');
      var twObj   = { n: 0 };

      gsap.to(twObj, {
        n: twFull.length,
        ease: 'none',
        scrollTrigger: {
          trigger: '#footerRevealClip',
          start: 'top 60%',
          end: 'bottom bottom',
          scrub: 1.5
        },
        onUpdate: function () {
          var n   = Math.round(twObj.n);
          var pre = twBefore.slice(0, Math.min(n, twBefore.length)).replace('\n', '<br>');
          var em  = n > twBefore.length ? twAfter.slice(0, n - twBefore.length) : '';
          twTyped.innerHTML = pre +
            (em ? '<em style="color:var(--gold);font-style:italic">' + em + '</em>' : '') +
            '<span class="tw-cursor">|</span>';
        }
      });
    }

    /* -- Counter animations -- */
    document.querySelectorAll('[data-count]').forEach(function (el) {
      var target = parseInt(el.getAttribute('data-count'), 10);
      var suffix = el.getAttribute('data-suffix') || '';
      var obj    = { val: 0 };

      ScrollTrigger.create({
        trigger: el, start: 'top 85%', once: true,
        onEnter: function () {
          gsap.to(obj, {
            val: target, duration: 1.6, ease: 'power2.out',
            snap: { val: 1 },
            onUpdate: function () {
              el.textContent = Math.round(obj.val) + suffix;
            }
          });
        }
      });
    });

    /* -- Magnetic buttons -- */
    if (window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
      document.querySelectorAll('[data-magnetic]').forEach(function (el) {
        el.addEventListener('mousemove', function (e) {
          var r = el.getBoundingClientRect();
          var x = (e.clientX - r.left - r.width  / 2) * 0.28;
          var y = (e.clientY - r.top  - r.height / 2) * 0.28;
          gsap.to(el, { x: x, y: y, duration: 0.45, ease: 'power2.out', overwrite: true });
        });
        el.addEventListener('mouseleave', function () {
          gsap.to(el, { x: 0, y: 0, duration: 0.7, ease: 'elastic.out(1, 0.5)', overwrite: true });
        });
      });
    }

    /* -- 3D card tilt -- */
    if (window.matchMedia('(hover:hover) and (pointer:fine)').matches) {
      document.querySelectorAll('.work-card, .service-card').forEach(function (card) {
        card.addEventListener('mousemove', function (e) {
          var r  = card.getBoundingClientRect();
          var nx = (e.clientX - r.left) / r.width  - 0.5;
          var ny = (e.clientY - r.top)  / r.height - 0.5;
          gsap.to(card, {
            rotateY: nx * 14, rotateX: -ny * 10,
            transformPerspective: 900,
            duration: 0.4, ease: 'power2.out', overwrite: 'auto'
          });
        });
        card.addEventListener('mouseleave', function () {
          gsap.to(card, {
            rotateY: 0, rotateX: 0,
            duration: 0.7, ease: 'power3.out', overwrite: 'auto'
          });
        });
      });
    }
  }

  /* ----------------------------------------
     ORBITAL TIMELINE — How It Works section
     5 nodes orbit a central dot. Auto-rotates
     when section is in view. Click a node to
     expand its card and pulse related nodes.
  ---------------------------------------- */
  (function () {
    var stage = document.getElementById('orbitalStage');
    if (!stage) return;

    var NODES_DATA = [
      {
        id: 0, label: 'Discovery', step: '01', status: 'completed',
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
        body: 'We learn your business, your audience, and your goals before a single pixel is placed.',
        related: [1]
      },
      {
        id: 1, label: 'Design', step: '02', status: 'completed',
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 013 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>',
        body: 'Every layout, colour, and typeface is chosen with intent. No templates. No shortcuts.',
        related: [0, 2]
      },
      {
        id: 2, label: 'Development', step: '03', status: 'completed',
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/></svg>',
        body: 'Clean, performant code built from scratch. Fast load times and smooth interactions throughout.',
        related: [1, 3]
      },
      {
        id: 3, label: 'Testing', step: '04', status: 'completed',
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
        body: 'Every device, every screen size, every browser. Nothing ships until everything works.',
        related: [2, 4]
      },
      {
        id: 4, label: 'Delivery', step: '05', status: 'in-progress',
        icon: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2L11 13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>',
        body: 'Launched, optimised, and ready to perform. Full handover so you own it completely.',
        related: [3]
      }
    ];

    var RADIUS      = window.innerWidth < 640 ? 145 : 200;
    var TOTAL       = NODES_DATA.length;
    var rotObj      = { deg: 0 };
    var autoInterval = null;
    var activeIdx   = -1;

    /* Inject node elements */
    var nodeEls = [];
    NODES_DATA.forEach(function (d, i) {
      var el = document.createElement('div');
      el.className = 'orbital-node';
      el.setAttribute('data-idx', i);
      el.innerHTML =
        '<div class="orbital-node-aura" style="width:80px;height:80px;top:-19px;left:-19px;"></div>' +
        '<div class="orbital-node-icon">' + d.icon + '</div>' +
        '<div class="orbital-node-label">' + d.label + '</div>';
      el.style.left = '50%';
      el.style.top  = '50%';
      stage.appendChild(el);
      nodeEls.push(el);

      el.addEventListener('click', function (e) {
        e.stopPropagation();
        if (activeIdx === i) { closeCard(); } else { openCard(i); }
      });
    });

    function getAngle(idx) {
      return (rotObj.deg * Math.PI / 180) + (idx / TOTAL) * 2 * Math.PI - Math.PI / 2;
    }

    function positionNodes() {
      nodeEls.forEach(function (el, i) {
        var angle = getAngle(i);
        var x = RADIUS * Math.cos(angle);
        var y = RADIUS * Math.sin(angle);
        el.style.transform = 'translate(calc(-50% + ' + x.toFixed(2) + 'px), calc(-50% + ' + y.toFixed(2) + 'px))';
        /* Depth sort: bottom-half nodes (positive y) come forward, top-half go back */
        el.style.zIndex = Math.round(15 + (y / RADIUS) * 5);
      });
    }

    /* RAF position loop */
    (function raf() {
      requestAnimationFrame(raf);
      positionNodes();
    })();

    function startAuto() {
      if (autoInterval) return;
      autoInterval = setInterval(function () {
        rotObj.deg += 0.3;
        if (rotObj.deg >= 360) rotObj.deg -= 360;
      }, 50);
    }

    function stopAuto() {
      if (autoInterval) { clearInterval(autoInterval); autoInterval = null; }
    }

    /* Start rotating only when the section enters view */
    var orbSection = document.getElementById('process');
    if (orbSection && typeof IntersectionObserver !== 'undefined') {
      var orbIO = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { startAuto(); }
          else if (activeIdx < 0)   { stopAuto();  }
        });
      }, { threshold: 0.15 });
      orbIO.observe(orbSection);
    } else {
      startAuto();
    }

    function showCard(idx) {
      var d = NODES_DATA[idx];
      var card = document.createElement('div');
      card.className = 'orbital-card';
      card.innerHTML =
        '<span class="orbital-card-status ' + d.status + '">' + d.status.replace('-', ' ') + '</span>' +
        '<div class="orbital-card-date">Step ' + d.step + ' / 05</div>' +
        '<div class="orbital-card-title">' + d.label + '</div>' +
        '<p class="orbital-card-body">' + d.body + '</p>';
      nodeEls[idx].appendChild(card);
    }

    function openCard(idx) {
      closeCard(true);
      activeIdx = idx;
      stopAuto();

      nodeEls.forEach(function (el, i) {
        el.classList.remove('active', 'related');
        if (i === idx) el.classList.add('active');
      });
      var d = NODES_DATA[idx];
      d.related.forEach(function (ri) {
        if (nodeEls[ri]) nodeEls[ri].classList.add('related');
      });

      /* Rotate clicked node to 12 o'clock (top), then show card */
      /* Target rotDeg so that node idx sits at angle = -π/2 (top) */
      var targetDeg = -(idx / TOTAL) * 360;
      /* Normalise so we take the shortest arc from current angle */
      while (targetDeg < rotObj.deg - 180) targetDeg += 360;
      while (targetDeg > rotObj.deg + 180) targetDeg -= 360;

      if (typeof gsap !== 'undefined') {
        gsap.to(rotObj, {
          deg: targetDeg,
          duration: 0.55,
          ease: 'power3.out',
          onComplete: function () { showCard(idx); }
        });
      } else {
        rotObj.deg = targetDeg;
        showCard(idx);
      }
    }

    function closeCard(silent) {
      nodeEls.forEach(function (el) {
        el.classList.remove('active', 'related');
        var c = el.querySelector('.orbital-card');
        if (c) el.removeChild(c);
      });
      activeIdx = -1;
      if (!silent) startAuto();
    }

    stage.addEventListener('click', function () {
      if (activeIdx >= 0) closeCard();
    });
  })();

  /* ----------------------------------------
     CONTACT FORM — Formspree
  ---------------------------------------- */
  var form    = document.getElementById('contactForm');
  var success = document.getElementById('contactSuccess');

  if (form && success) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn  = form.querySelector('button[type="submit"]');
      var orig = btn.textContent;
      btn.textContent = 'Sending…';
      btn.disabled = true;

      fetch(form.action, {
        method: 'POST',
        body: new FormData(form),
        headers: { 'Accept': 'application/json' }
      })
      .then(function (res) {
        if (res.ok) {
          form.style.transition = 'opacity 0.4s';
          form.style.opacity = '0';
          setTimeout(function () {
            form.style.display = 'none';
            success.classList.add('show');
          }, 400);
        } else {
          btn.textContent = orig;
          btn.disabled = false;
          alert('Something went wrong. Please email hello@shaydefy.com directly.');
        }
      })
      .catch(function () {
        btn.textContent = orig;
        btn.disabled = false;
        alert('Something went wrong. Please email hello@shaydefy.com directly.');
      });
    });
  }

})();
