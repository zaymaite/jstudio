/* =====================================================
   PeekRating (versión JS puro)
   Mismas opciones que el componente de React:

   var rating = PeekRating.mount(document.getElementById('puntaje'), {
       defaultValue: 3,
       count: 5,
       shape: 'star',            // 'star' | 'heart' | 'circle'
       labels: ['Malo', 'Regular', 'Bueno', 'Muy bueno', 'Excelente'],
       activeColor: '#f5b400',
       idleColor: '#52525b',
       tipColor: '#27272a',
       tipTextColor: '#f5f5f5',
       size: 32,
       lift: 7,                  // px que sube la estrella señalada
       magnify: 1.15,            // zoom de la estrella señalada
       riseDuration: 320,        // ms de la subida y del tooltip
       popScale: 1.3,            // rebote al elegir
       showTip: true,
       allowClear: true,         // volver a tocar el mismo valor lo borra
       onChange: function (valor) { console.log('rated', valor); }
   });

   rating.getValue(); rating.setValue(4); rating.reset();
   ===================================================== */
(function (global) {
    var NS = 'http://www.w3.org/2000/svg';

    var FORMAS = {
        star: 'M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z',
        heart: 'M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z',
        circle: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z'
    };

    var PREDETERMINADAS = {
        defaultValue: 0,
        count: 5,
        shape: 'star',
        labels: [],
        activeColor: '#f5b400',
        idleColor: '#52525b',
        tipColor: '#27272a',
        tipTextColor: '#f5f5f5',
        size: 32,
        lift: 7,
        magnify: 1.15,
        riseDuration: 320,
        popScale: 1.3,
        showTip: true,
        allowClear: false,
        ariaLabel: 'Puntuación',
        onChange: null
    };

    function crearSvg(forma) {
        var svg = document.createElementNS(NS, 'svg');
        svg.setAttribute('viewBox', '0 0 24 24');
        svg.setAttribute('aria-hidden', 'true');
        svg.setAttribute('focusable', 'false');
        var path = document.createElementNS(NS, 'path');
        path.setAttribute('d', FORMAS[forma] || FORMAS.star);
        svg.appendChild(path);
        return svg;
    }

    function mount(host, opciones) {
        var o = {};
        var k;
        for (k in PREDETERMINADAS) o[k] = PREDETERMINADAS[k];
        for (k in (opciones || {})) o[k] = opciones[k];

        var reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        var valor = Math.max(0, Math.min(o.count, Math.round(o.defaultValue) || 0));
        var hover = 0;
        var celdas = [];

        host.innerHTML = '';
        var raiz = document.createElement('div');
        raiz.className = 'peek';
        raiz.setAttribute('role', 'radiogroup');
        raiz.setAttribute('aria-label', o.ariaLabel);
        raiz.style.setProperty('--peek-size', o.size + 'px');
        raiz.style.setProperty('--peek-lift', o.lift + 'px');
        raiz.style.setProperty('--peek-mag', o.magnify);
        raiz.style.setProperty('--peek-dur', (reducir ? 0 : o.riseDuration) + 'ms');
        raiz.style.setProperty('--peek-tip-bg', o.tipColor);
        raiz.style.setProperty('--peek-tip-fg', o.tipTextColor);

        function etiqueta(i) {
            return o.labels[i - 1] || (i + ' de ' + o.count);
        }

        for (var n = 1; n <= o.count; n++) {
            (function (i) {
                var celda = document.createElement('span');
                celda.className = 'peek__celda';

                var boton = document.createElement('button');
                boton.type = 'button';
                boton.className = 'peek__item';
                boton.setAttribute('role', 'radio');
                boton.setAttribute('aria-label', etiqueta(i));
                boton.appendChild(crearSvg(o.shape));
                celda.appendChild(boton);

                var tip = null;
                if (o.showTip && o.labels[i - 1]) {
                    tip = document.createElement('span');
                    tip.className = 'peek__tip';
                    tip.setAttribute('aria-hidden', 'true');
                    tip.textContent = o.labels[i - 1];
                    celda.appendChild(tip);
                }

                /* Hover solo con mouse/lápiz: en el celular no queda "pegado" tras tocar */
                boton.addEventListener('pointerenter', function (e) {
                    if (e.pointerType === 'touch') return;
                    hover = i; pintar();
                });
                boton.addEventListener('focus', function () {
                    if (boton.matches(':focus-visible')) { hover = i; pintar(); }
                });
                boton.addEventListener('blur', function () { hover = 0; pintar(); });
                boton.addEventListener('click', function () { elegir(i); });
                boton.addEventListener('keydown', function (e) { teclado(e, i); });

                raiz.appendChild(celda);
                celdas.push({ celda: celda, boton: boton, svg: boton.firstChild });
            })(n);
        }

        raiz.addEventListener('pointerleave', function () { hover = 0; pintar(); });
        host.appendChild(raiz);

        function pintar() {
            var mostrado = hover || valor;
            var enfocable = valor || 1;
            celdas.forEach(function (c, idx) {
                var i = idx + 1;
                var lleno = i <= mostrado;
                c.svg.style.fill = lleno ? o.activeColor : o.idleColor;
                c.celda.classList.toggle('is-hover', i === hover);
                c.boton.setAttribute('aria-checked', i === valor ? 'true' : 'false');
                c.boton.tabIndex = i === enfocable ? 0 : -1;
            });
        }

        function rebote(hasta) {
            if (reducir || !celdas[0].svg.animate) return;
            celdas.forEach(function (c, idx) {
                if (idx + 1 > hasta) return;
                c.svg.animate(
                    [
                        { transform: 'scale(1)' },
                        { transform: 'scale(' + o.popScale + ')', offset: 0.4 },
                        { transform: 'scale(1)' }
                    ],
                    { duration: o.riseDuration * 1.2, delay: idx * 35, easing: 'ease-out' }
                );
            });
        }

        function cambiar(nuevo, avisar) {
            if (nuevo === valor) return;
            valor = nuevo;
            pintar();
            if (avisar && typeof o.onChange === 'function') o.onChange(valor);
        }

        function elegir(i) {
            if (o.allowClear && i === valor) {
                cambiar(0, true);
            } else {
                cambiar(i, true);
                rebote(i);
            }
        }

        function teclado(e, i) {
            var destino = null;
            if (e.key === 'ArrowRight' || e.key === 'ArrowUp') destino = Math.min(o.count, (valor || i) + 1);
            else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') destino = Math.max(1, (valor || i) - 1);
            else if (e.key === 'Home') destino = 1;
            else if (e.key === 'End') destino = o.count;
            else if ((e.key === 'Delete' || e.key === 'Backspace') && o.allowClear) {
                e.preventDefault();
                cambiar(0, true);
                return;
            }
            if (destino === null) return;
            e.preventDefault();
            cambiar(destino, true);
            rebote(destino);
            celdas[destino - 1].boton.focus();
        }

        pintar();

        return {
            element: raiz,
            getValue: function () { return valor; },
            setValue: function (v) { cambiar(Math.max(0, Math.min(o.count, Math.round(v) || 0)), false); },
            reset: function () { cambiar(Math.max(0, Math.min(o.count, Math.round(o.defaultValue) || 0)), false); },
            destroy: function () { host.innerHTML = ''; }
        };
    }

    global.PeekRating = { mount: mount, formas: FORMAS };
})(window);
