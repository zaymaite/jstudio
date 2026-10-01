/* ===== Abanico de cartas: en pantallas táctiles se abre/cierra con un toque ===== */
(function () {
    var cartas = document.getElementById('cartas');
    if (!cartas) return;

    var sinHover = window.matchMedia('(hover: none)').matches;
    if (sinHover) {
        cartas.addEventListener('click', function () {
            cartas.classList.toggle('is-open');
        });
    }
})();

/* ===== Acordeón: el panel activo se abre con hover, foco o toque ===== */
(function () {
    var acordeon = document.getElementById('acordeon');
    if (!acordeon) return;

    var paneles = Array.prototype.slice.call(acordeon.querySelectorAll('.acordeon__panel'));

    function activar(panel) {
        paneles.forEach(function (p) { p.classList.toggle('is-active', p === panel); });
    }

    paneles.forEach(function (panel) {
        panel.addEventListener('mouseenter', function () { activar(panel); });
        panel.addEventListener('focus', function () { activar(panel); });
        panel.addEventListener('click', function () { activar(panel); });
    });
})();

/* ===== Efecto "Magic Bento" (glow, spotlight, tilt, imán, estrellas y onda al click) =====
   Se aplica a toda lista con la clase "bento" (Nosotros y Contacto). */
(function () {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    var RADIO = 300;          // alcance del brillo (px)
    var CANT_ESTRELLAS = 12;  // partículas por tarjeta
    var INCLINACION = 6;      // grados máximos de tilt
    var IMAN = 0.04;          // cuánto "sigue" la tarjeta al mouse
    var conMouse = window.matchMedia('(hover: hover)').matches;

    function activarBento(lista) {
        var tarjetas = Array.prototype.slice.call(lista.querySelectorAll('li'));

        /* --- Brillo del borde + spotlight: las tarjetas cercanas al mouse se iluminan --- */
        if (conMouse) {
            lista.addEventListener('mousemove', function (e) {
                tarjetas.forEach(function (t) {
                    var r = t.getBoundingClientRect();
                    var dx = Math.max(r.left - e.clientX, 0, e.clientX - r.right);
                    var dy = Math.max(r.top - e.clientY, 0, e.clientY - r.bottom);
                    var dist = Math.hypot(dx, dy);
                    t.style.setProperty('--glow-x', (e.clientX - r.left) + 'px');
                    t.style.setProperty('--glow-y', (e.clientY - r.top) + 'px');
                    t.style.setProperty('--glow-intensity', Math.max(0, 1 - dist / RADIO).toFixed(3));
                });
            });
            lista.addEventListener('mouseleave', function () {
                tarjetas.forEach(function (t) { t.style.setProperty('--glow-intensity', 0); });
            });
        }

        tarjetas.forEach(function (t) {
            var estrellas = [];

            /* --- Estrellas: aparecen al entrar y se van al salir --- */
            function crearEstrellas() {
                var r = t.getBoundingClientRect();
                for (var i = 0; i < CANT_ESTRELLAS; i++) {
                    var el = document.createElement('span');
                    el.className = 'estrella';
                    el.style.left = Math.random() * r.width + 'px';
                    el.style.top = Math.random() * r.height + 'px';
                    t.appendChild(el);
                    el.animate([
                        { transform: 'translate(0,0)', opacity: 0 },
                        { opacity: 1, offset: 0.3 },
                        { transform: 'translate(' + (Math.random() * 60 - 30) + 'px,' + (Math.random() * 60 - 30) + 'px)', opacity: 0.2 }
                    ], { duration: 2000 + Math.random() * 2000, iterations: Infinity, direction: 'alternate', delay: Math.random() * 600 });
                    estrellas.push(el);
                }
            }
            function quitarEstrellas() {
                estrellas.forEach(function (el) { el.remove(); });
                estrellas = [];
            }

            if (conMouse) {
                t.addEventListener('mouseenter', crearEstrellas);

                /* --- Tilt + imán --- */
                t.addEventListener('mousemove', function (e) {
                    var r = t.getBoundingClientRect();
                    var x = e.clientX - r.left - r.width / 2;
                    var y = e.clientY - r.top - r.height / 2;
                    var rotX = (-y / (r.height / 2)) * INCLINACION;
                    var rotY = (x / (r.width / 2)) * INCLINACION;
                    t.style.transform = 'perspective(800px) rotateX(' + rotX + 'deg) rotateY(' + rotY + 'deg) translate(' + (x * IMAN) + 'px,' + (y * IMAN) + 'px)';
                });

                t.addEventListener('mouseleave', function () {
                    t.style.transform = '';
                    quitarEstrellas();
                });
            }

            /* --- Onda al hacer click --- */
            t.addEventListener('click', function (e) {
                var r = t.getBoundingClientRect();
                var x = e.clientX - r.left;
                var y = e.clientY - r.top;
                var max = Math.max(
                    Math.hypot(x, y), Math.hypot(x - r.width, y),
                    Math.hypot(x, y - r.height), Math.hypot(x - r.width, y - r.height)
                );
                var onda = document.createElement('span');
                onda.className = 'onda';
                onda.style.cssText = 'width:' + max * 2 + 'px;height:' + max * 2 + 'px;left:' + (x - max) + 'px;top:' + (y - max) + 'px;';
                t.appendChild(onda);
                onda.animate(
                    [{ transform: 'scale(0)', opacity: 1 }, { transform: 'scale(1)', opacity: 0 }],
                    { duration: 800, easing: 'ease-out' }
                ).onfinish = function () { onda.remove(); };
            });
        });
    }

    Array.prototype.forEach.call(document.querySelectorAll('.bento'), activarBento);
})();

(function () {
    var contenedor = document.getElementById('marca');
    if (!contenedor) return;
    var canvas = contenedor.querySelector('canvas');
    if (!canvas || !canvas.getContext) return;
    var ctx = canvas.getContext('2d');
 
    /* ---------- Opciones ---------- */
    var TEXTO = contenedor.dataset.texto || 'JSTUDIO';
    var PESO = parseInt(contenedor.dataset.peso, 10) || 700;
    var TAMANO_MAX = parseInt(contenedor.dataset.tamano, 10) || 150;
    var REVELAR = contenedor.dataset.revelar || 'letra';
    var LARGO_RAYA = parseFloat(contenedor.dataset.largoRaya) || 4;
    var HUECO_RAYA = parseFloat(contenedor.dataset.huecoRaya) || 2;
    var CANT_SPECKS = parseInt(contenedor.dataset.specks, 10);
    if (isNaN(CANT_SPECKS)) CANT_SPECKS = 15;
 
    /* Colores: se toman de las variables de style.css para que siempre combinen con la página */
    var estilos = getComputedStyle(document.documentElement);
    var COLOR_TEXTO = estilos.getPropertyValue('--texto').trim() || '#f4f4f4';
    var COLOR_ACENTO = estilos.getPropertyValue('--acento').trim() || '#c81e5a';
    var FAMILIA = '"Poppins", system-ui, sans-serif';
    var FUENTE_MONO = '500 10px ui-monospace, Menlo, Consolas, monospace';
 
    var quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 
    /* ---------- Estado ---------- */
    var letras = [];          // { c, idx, x, w, ox, oy, vx, vy, hover }
    var specks = [];          // { idx, rx, ry, s, f, ph, claro }
    var marco = { x: 0, y: 0, w: 0, h: 0, a: 0, listo: false };
    var puntero = { x: -999, y: -999, dentro: false };
    var arrastrando = null;   // { i, gx, gy }
    var ancho = 0, alto = 0, dpr = 1;
    var tam = 100, baseY = 0, altoLetra = 0, espaciado = 0;
    var t0 = null, tPrev = null;
    var ultimoMov = performance.now();
    var barrido = 0, barridoT = 0;
    var visible = true, corriendo = false;
 
    /* ---------- Utilidades ---------- */
    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
    function aleatorio(a, b) { return a + Math.random() * (b - a); }
 
    /* ---------- Medidas y posiciones ---------- */
    function medir() {
        var r = contenedor.getBoundingClientRect();
        ancho = Math.max(1, r.width);
        alto = Math.max(1, r.height);
        dpr = Math.min(window.devicePixelRatio || 1, 2);
        canvas.width = Math.round(ancho * dpr);
        canvas.height = Math.round(alto * dpr);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
 
        var n = TEXTO.length;
        var margenSup = 24;   // aire arriba para la lectura del marco
        var margenInf = 8;
 
        // Medimos todo a 100px y escalamos: así el texto siempre entra en el ancho disponible
        ctx.font = PESO + ' 100px ' + FAMILIA;
        var anchos100 = [];
        var suma100 = 0;
        for (var i = 0; i < n; i++) {
            var w = ctx.measureText(TEXTO[i]).width;
            anchos100.push(w);
            suma100 += w;
        }
        var seguimiento100 = 4;  // separación extra entre letras (4% del tamaño)
        var total100 = suma100 + seguimiento100 * (n - 1);
        var alto100 = ctx.measureText('H').actualBoundingBoxAscent || 70;
 
        tam = Math.min(
            TAMANO_MAX,
            100 * (ancho - 4) / total100,
            100 * (alto - margenSup - margenInf) / alto100
        );
        var k = tam / 100;
        altoLetra = alto100 * k;
        espaciado = seguimiento100 * k;
        baseY = margenSup + altoLetra + Math.max(0, (alto - margenSup - margenInf - altoLetra) / 2);
 
        var x = 2;
        for (var j = 0; j < n; j++) {
            var L = letras[j] || { ox: 0, oy: 0, vx: 0, vy: 0, hover: 0 };
            L.c = TEXTO[j];
            L.idx = j;
            L.x = x;
            L.w = anchos100[j] * k;
            letras[j] = L;
            x += L.w + espaciado;
        }
        letras.length = n;
 
        crearSpecks();
        if (quieto) dibujar(99);   // sin animación: se dibuja una vez, ya completo
    }
 
    /* Puntitos que titilan cerca de las letras */
    function crearSpecks() {
        specks = [];
        for (var i = 0; i < CANT_SPECKS; i++) {
            specks.push({
                idx: Math.floor(Math.random() * letras.length),
                rx: aleatorio(-0.15, 1.15),     // posición horizontal (fracción del ancho de la letra)
                ry: aleatorio(-0.25, 1.25),     // posición vertical (fracción del alto de la letra)
                s: aleatorio(1.4, 2.8),
                f: aleatorio(1.2, 3.2),
                ph: aleatorio(0, 6.28),
                claro: Math.random() < 0.5
            });
        }
    }
 
    /* ---------- Caja de cada letra (con su desplazamiento actual) ---------- */
    function caja(L, relleno) {
        relleno = relleno || 0;
        return {
            x: L.x + L.ox - relleno,
            y: baseY - altoLetra + L.oy - relleno,
            w: L.w + relleno * 2,
            h: altoLetra + relleno * 2
        };
    }
 
    function letraEn(px, py) {
        for (var i = letras.length - 1; i >= 0; i--) {
            var L = letras[i];
            var x = L.x + L.ox, y = baseY - altoLetra + L.oy;
            if (px >= x - espaciado / 2 && px <= x + L.w + espaciado / 2 &&
                py >= y - 12 && py <= y + altoLetra + 10) return i;
        }
        return -1;
    }
 
    /* ---------- Revelado: cada letra tiene su propio "progreso" 0 -> 1 ---------- */
    function fase(i, t) {
        if (quieto) return 1;
        var inicio = 0.25 + (REVELAR === 'letra' ? i * 0.13 : 0);
        return clamp((t - inicio) / 0.8, 0, 1);
    }
 
    function revelado(t) {
        return quieto || t > 0.25 + (REVELAR === 'letra' ? letras.length * 0.13 : 0) + 1.2;
    }
 
    /* ---------- Qué letra está "activa" (la que lleva el marco) ---------- */
    function letraActiva(t) {
        if (arrastrando) return arrastrando.i;
        if (puntero.dentro) {
            var i = letraEn(puntero.x, puntero.y);
            if (i >= 0) return i;
            return -1;
        }
        // Barrido automático: si nadie toca nada por un rato
        if (revelado(t) && performance.now() - ultimoMov > 1800) return barrido;
        return -1;
    }
 
    /* ---------- Física: resorte para las letras soltadas ---------- */
    function fisica(dt) {
        var K = 170, C = 12;   // rigidez y amortiguación (C más bajo = rebota más)
        for (var i = 0; i < letras.length; i++) {
            var L = letras[i];
            if (arrastrando && arrastrando.i === i) continue;
            L.vx += (-K * L.ox - C * L.vx) * dt;
            L.vy += (-K * L.oy - C * L.vy) * dt;
            L.ox += L.vx * dt;
            L.oy += L.vy * dt;
            if (Math.abs(L.ox) < 0.01 && Math.abs(L.vx) < 0.05) { L.ox = 0; L.vx = 0; }
            if (Math.abs(L.oy) < 0.01 && Math.abs(L.vy) < 0.05) { L.oy = 0; L.vy = 0; }
        }
    }
 
    function seguirPuntero(dt) {
        if (!arrastrando) return;
        var L = letras[arrastrando.i];
        // límites: la letra no puede salirse del recuadro
        var minX = -L.x + 1, maxX = ancho - L.w - L.x - 1;
        var minY = -(baseY - altoLetra) + 2, maxY = alto - baseY - 2;
        var nx = clamp(puntero.x - arrastrando.gx, minX, maxX);
        var ny = clamp(puntero.y - arrastrando.gy, minY, maxY);
        // guardamos la velocidad para que al soltar salga "lanzada"
        L.vx = L.vx * 0.5 + ((nx - L.ox) / Math.max(dt, 0.001)) * 0.5;
        L.vy = L.vy * 0.5 + ((ny - L.oy) / Math.max(dt, 0.001)) * 0.5;
        L.ox = nx;
        L.oy = ny;
    }
 
    /* ---------- Dibujo ---------- */
    function dibujarLetra(L, t) {
        var p = fase(L.idx, t);
        if (p <= 0) return;
        var e = p * p * (3 - 2 * p);                       // suavizado
        ctx.save();
        ctx.translate(L.ox, L.oy + (1 - e) * 10);          // entra deslizándose 10px
        ctx.font = PESO + ' ' + tam + 'px ' + FAMILIA;
        ctx.textBaseline = 'alphabetic';
 
        // Relleno: aparece al final de la revelación y se apaga cuando la letra está activa
        var aRelleno = clamp((e - 0.35) / 0.65, 0, 1) * (1 - 0.88 * L.hover);
        if (aRelleno > 0.01) {
            ctx.globalAlpha = aRelleno;
            ctx.fillStyle = COLOR_TEXTO;
            ctx.fillText(L.c, L.x, baseY);
        }
 
        // Contorno punteado: se ve a mitad de la revelación y cuando la letra está activa
        var aContorno = Math.max(Math.sin(Math.PI * e), L.hover);
        if (aContorno > 0.01) {
            ctx.globalAlpha = aContorno;
            ctx.strokeStyle = COLOR_ACENTO;
            ctx.lineWidth = 1.6;
            ctx.lineJoin = 'round';
            ctx.setLineDash([LARGO_RAYA, HUECO_RAYA]);
            ctx.lineDashOffset = -t * 14;                  // las rayas "caminan"
            ctx.strokeText(L.c, L.x, baseY);
        }
        ctx.restore();
    }
 
    function dibujarSpecks(t) {
        for (var i = 0; i < specks.length; i++) {
            var s = specks[i];
            var L = letras[s.idx];
            if (!L || fase(L.idx, t) < 0.4) continue;
            var brillo = 0.5 + 0.5 * Math.sin(t * s.f + s.ph);
            ctx.globalAlpha = 0.12 + 0.55 * brillo;
            ctx.fillStyle = s.claro ? COLOR_TEXTO : COLOR_ACENTO;
            var x = L.x + L.ox + s.rx * L.w;
            var y = baseY - altoLetra + L.oy + s.ry * altoLetra;
            ctx.fillRect(x, y, s.s, s.s);
        }
        ctx.globalAlpha = 1;
    }
 
    function dibujarMarco(t, dt, activa) {
        var k = 1 - Math.exp(-dt * 14);
        if (activa >= 0) {
            var o = caja(letras[activa], 6);
            if (!marco.listo) { marco.x = o.x; marco.y = o.y; marco.w = o.w; marco.h = o.h; marco.listo = true; }
            marco.x += (o.x - marco.x) * k;
            marco.y += (o.y - marco.y) * k;
            marco.w += (o.w - marco.w) * k;
            marco.h += (o.h - marco.h) * k;
            marco.a += (1 - marco.a) * k;
        } else {
            marco.a += (0 - marco.a) * k;
        }
        if (marco.a < 0.02) return;
 
        ctx.save();
        ctx.lineWidth = 1;
        ctx.strokeStyle = COLOR_TEXTO;
 
        // Línea fina completa + esquinas marcadas
        ctx.globalAlpha = marco.a * 0.25;
        ctx.strokeRect(marco.x + 0.5, marco.y + 0.5, marco.w, marco.h);
 
        ctx.globalAlpha = marco.a;
        var x1 = marco.x + 0.5, y1 = marco.y + 0.5, x2 = x1 + marco.w, y2 = y1 + marco.h, l = 7;
        ctx.beginPath();
        ctx.moveTo(x1, y1 + l); ctx.lineTo(x1, y1); ctx.lineTo(x1 + l, y1);
        ctx.moveTo(x2 - l, y1); ctx.lineTo(x2, y1); ctx.lineTo(x2, y1 + l);
        ctx.moveTo(x2, y2 - l); ctx.lineTo(x2, y2); ctx.lineTo(x2 - l, y2);
        ctx.moveTo(x1 + l, y2); ctx.lineTo(x1, y2); ctx.lineTo(x1, y2 - l);
        ctx.stroke();
 
        // Lectura técnica arriba del marco
        var L = letras[activa >= 0 ? activa : clamp(barrido, 0, letras.length - 1)];
        var codigo = 'U+' + ('0000' + L.c.charCodeAt(0).toString(16).toUpperCase()).slice(-4);
        var texto = '[' + L.c + '] ' + codigo;
        if (arrastrando) {
            texto = '[' + L.c + '] dx ' + Math.round(L.ox) + ' dy ' + Math.round(L.oy);
        } else {
            texto += '  ' + ('0' + (L.idx + 1)).slice(-2) + '/' + ('0' + letras.length).slice(-2);
        }
        ctx.font = FUENTE_MONO;
        ctx.fillStyle = COLOR_ACENTO;
        var anchoTexto = ctx.measureText(texto).width;
        var tx = marco.x;
        if (tx + anchoTexto > ancho - 2) tx = ancho - 2 - anchoTexto;   // que no se corte en el borde derecho
        ctx.fillText(texto, Math.max(2, tx), Math.max(10, marco.y - 5));
        ctx.restore();
    }
 
    function dibujar(t, dt, activa) {
        ctx.clearRect(0, 0, ancho, alto);
        ctx.setLineDash([]);
        // Primero las letras quietas; la que se arrastra se dibuja al final (queda arriba)
        for (var i = 0; i < letras.length; i++) {
            if (!(arrastrando && arrastrando.i === i)) dibujarLetra(letras[i], t);
        }
        if (arrastrando) dibujarLetra(letras[arrastrando.i], t);
        if (!quieto) {
            dibujarSpecks(t);
            dibujarMarco(t, dt || 0.016, activa === undefined ? -1 : activa);
        }
    }
 
    /* ---------- Bucle de animación ---------- */
    function cuadro(ahora) {
        if (!visible) { corriendo = false; tPrev = null; return; }
        if (t0 === null) t0 = ahora;
        var t = (ahora - t0) / 1000;
        var dt = tPrev === null ? 0.016 : Math.min((ahora - tPrev) / 1000, 1 / 30);
        tPrev = ahora;
 
        // Barrido: avanza a la siguiente letra cada ~0.9 s mientras nadie toca nada
        var activa = letraActiva(t);
        if (!puntero.dentro && !arrastrando && revelado(t) && performance.now() - ultimoMov > 1800) {
            barridoT += dt;
            if (barridoT > 0.9) { barrido = (barrido + 1) % letras.length; barridoT = 0; }
        } else {
            barridoT = 0;
        }
 
        seguirPuntero(dt);
        fisica(dt);
 
        // Cada letra se acerca suavemente a "activa" (1) o "normal" (0)
        var suavizado = 1 - Math.exp(-dt * 12);
        for (var i = 0; i < letras.length; i++) {
            letras[i].hover += ((i === activa ? 1 : 0) - letras[i].hover) * suavizado;
        }
 
        dibujar(t, dt, activa);
        requestAnimationFrame(cuadro);
    }
 
    function arrancar() {
        if (corriendo || quieto) return;
        corriendo = true;
        requestAnimationFrame(cuadro);
    }
 
    /* ---------- Mouse / dedo ---------- */
    function posicion(e) {
        var r = canvas.getBoundingClientRect();
        return { x: e.clientX - r.left, y: e.clientY - r.top };
    }
 
    if (!quieto) {
        canvas.addEventListener('pointermove', function (e) {
            var p = posicion(e);
            puntero.x = p.x; puntero.y = p.y; puntero.dentro = true;
            ultimoMov = performance.now();
            if (!arrastrando) canvas.style.cursor = letraEn(p.x, p.y) >= 0 ? 'grab' : 'default';
        });
 
        canvas.addEventListener('pointerleave', function () {
            if (arrastrando) return;
            puntero.dentro = false;
            ultimoMov = performance.now();
            canvas.style.cursor = 'default';
        });
 
        canvas.addEventListener('pointerdown', function (e) {
            var p = posicion(e);
            var i = letraEn(p.x, p.y);
            if (i < 0) return;
            puntero.x = p.x; puntero.y = p.y; puntero.dentro = true;
            arrastrando = { i: i, gx: p.x - letras[i].ox, gy: p.y - letras[i].oy };
            canvas.setPointerCapture(e.pointerId);
            canvas.style.cursor = 'grabbing';
        });
 
        function soltar(e) {
            if (!arrastrando) return;
            arrastrando = null;
            ultimoMov = performance.now();
            var p = posicion(e);
            canvas.style.cursor = letraEn(p.x, p.y) >= 0 ? 'grab' : 'default';
        }
        canvas.addEventListener('pointerup', soltar);
        canvas.addEventListener('pointercancel', soltar);
    }
 
    /* ---------- Arranque: esperamos a que cargue la tipografía ---------- */
    function iniciar() {
        medir();
        if ('ResizeObserver' in window) {
            new ResizeObserver(function () { medir(); }).observe(contenedor);
        } else {
            window.addEventListener('resize', medir);
        }
        // Pausamos la animación cuando el nombre no se ve en pantalla (ahorra batería)
        if ('IntersectionObserver' in window) {
            new IntersectionObserver(function (entradas) {
                visible = entradas[0].isIntersecting;
                if (visible) arrancar();
            }).observe(contenedor);
        }
        arrancar();
    }
 
    var cargaFuente = (document.fonts && document.fonts.load)
        ? document.fonts.load(PESO + ' 100px Poppins')
        : Promise.resolve();
    cargaFuente.then(iniciar, iniciar);
})();

/* ===== Menú hamburguesa (celular) ===== */
(function () {
    var cabecera = document.querySelector('.cabecera');
    var boton = cabecera && cabecera.querySelector('.cabecera__boton');
    var menu = document.getElementById('menu-principal');
    if (!cabecera || !boton || !menu) return;

    cabecera.classList.add('tiene-js');
    boton.hidden = false;

    function abrir(si) {
        menu.classList.toggle('is-abierto', si);
        boton.setAttribute('aria-expanded', si ? 'true' : 'false');
        boton.setAttribute('aria-label', si ? 'Cerrar menú' : 'Abrir menú');
    }

    boton.addEventListener('click', function () {
        abrir(!menu.classList.contains('is-abierto'));
    });

    menu.addEventListener('click', function (e) {
        if (e.target.closest('a')) abrir(false);
    });

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && menu.classList.contains('is-abierto')) {
            abrir(false);
            boton.focus();
        }
    });

    document.addEventListener('click', function (e) {
        if (menu.classList.contains('is-abierto') && !cabecera.contains(e.target)) abrir(false);
    });

    window.matchMedia('(min-width: 801px)').addEventListener('change', function (e) {
        if (e.matches) abrir(false);
    });
})();