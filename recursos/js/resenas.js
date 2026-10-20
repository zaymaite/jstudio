
(function () {
    var carrusel = document.getElementById('resenas-carrusel');
    var form = document.getElementById('resenas-form');
    if (!carrusel || !form || !window.PeekRating) return;

    var reducir = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var VELOCIDAD = 55;          
    var MAX_NOMBRE = 40;
    var MAX_TEXTO = 280;
    var CLAVE = 'jstudio:resenas:v1';
    var COLOR_ACTIVO = '#f5b400';
    var COLOR_APAGADO = '#d4d4d8';

    var RESENAS_INICIALES = [];


    var CFG = window.JSTUDIO_CONFIG || {};
    var usaServidor = !!(CFG.supabaseUrl && CFG.supabaseKey);
    var moderada = !!CFG.moderada;

    function encabezados(extra) {
        var h = { apikey: CFG.supabaseKey, Authorization: 'Bearer ' + CFG.supabaseKey };
        for (var k in (extra || {})) h[k] = extra[k];
        return h;
    }

    var almacenLocal = {
        cargar: function () {
            var locales = [];
            try { locales = JSON.parse(localStorage.getItem(CLAVE)) || []; } catch (e) { locales = []; }
            return Promise.resolve(locales.concat(RESENAS_INICIALES));
        },
        guardar: function (resena) {
            var locales = [];
            try { locales = JSON.parse(localStorage.getItem(CLAVE)) || []; } catch (e) { locales = []; }
            locales.push(resena);
            try { localStorage.setItem(CLAVE, JSON.stringify(locales)); } catch (e) { /* sin espacio / modo privado */ }
            return Promise.resolve();
        }
    };

    var almacenServidor = {
        cargar: function () {
            var url = CFG.supabaseUrl.replace(/\/+$/, '') +
                '/rest/v1/resenas?select=nombre,puntaje,texto,fecha&aprobada=eq.true&order=fecha.desc&limit=60';
            return fetch(url, { headers: encabezados() }).then(function (r) {
                if (!r.ok) throw new Error('HTTP ' + r.status);
                return r.json();
            }).then(function (filas) {
                return filas.concat(RESENAS_INICIALES);
            });
        },
        guardar: function (resena) {
            var url = CFG.supabaseUrl.replace(/\/+$/, '') + '/rest/v1/resenas';
            return fetch(url, {
                method: 'POST',
                headers: encabezados({ 'Content-Type': 'application/json', Prefer: 'return=minimal' }),
                body: JSON.stringify({ nombre: resena.nombre, puntaje: resena.puntaje, texto: resena.texto })
            }).then(function (r) {
                if (r.ok) return;
                    return r.json().catch(function () { return {}; }).then(function (e) {
                    var err = new Error('HTTP ' + r.status);
                    err.codigo = (e && e.message) || '';
                    throw err;
                });
            });
        }
    };

    var almacen = usaServidor ? almacenServidor : almacenLocal;

    var puntaje = PeekRating.mount(document.getElementById('resenas-puntaje'), {
        defaultValue: 3,
        count: 5,
        shape: 'star',
        labels: ['Malo', 'Regular', 'Bueno', 'Muy bueno', 'Excelente'],
        activeColor: COLOR_ACTIVO,
        idleColor: '#52525b',
        tipColor: '#27272a',
        tipTextColor: '#f5f5f5',
        size: 32,
        lift: 7,
        magnify: 1.15,
        riseDuration: 320,
        popScale: 1.3,
        showTip: true,
        allowClear: true,
        ariaLabel: 'Tu puntuación'
    });

    var NS = 'http://www.w3.org/2000/svg';

    function estrellasSolo(n) {
        var cont = document.createElement('div');
        cont.className = 'resena__estrellas';
        cont.setAttribute('role', 'img');
        cont.setAttribute('aria-label', n + ' de 5 estrellas');
        for (var i = 1; i <= 5; i++) {
            var svg = document.createElementNS(NS, 'svg');
            svg.setAttribute('viewBox', '0 0 24 24');
            svg.setAttribute('aria-hidden', 'true');
            var p = document.createElementNS(NS, 'path');
            p.setAttribute('d', PeekRating.formas.star);
            p.setAttribute('fill', i <= n ? COLOR_ACTIVO : COLOR_APAGADO);
            svg.appendChild(p);
            cont.appendChild(svg);
        }
        return cont;
    }

    function formatearFecha(iso) {
        var d = new Date(iso);
        if (isNaN(d.getTime())) return '';
        var f = d.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
        return f.charAt(0).toUpperCase() + f.slice(1);
    }

    function crearTarjeta(r) {
        var art = document.createElement('article');
        art.className = 'resena';

        art.appendChild(estrellasSolo(Math.max(1, Math.min(5, Number(r.puntaje) || 1))));

        var texto = document.createElement('p');
        texto.className = 'resena__texto';
        texto.textContent = r.texto;
        art.appendChild(texto);

        var pie = document.createElement('footer');
        pie.className = 'resena__autor';

        var avatar = document.createElement('span');
        avatar.className = 'resena__avatar';
        avatar.setAttribute('aria-hidden', 'true');
        avatar.textContent = (r.nombre || '?').trim().charAt(0).toUpperCase();
        pie.appendChild(avatar);

        var datos = document.createElement('span');
        datos.className = 'resena__datos';
        var nombre = document.createElement('strong');
        nombre.textContent = r.nombre;
        var fecha = document.createElement('small');
        fecha.textContent = formatearFecha(r.fecha);
        datos.appendChild(nombre);
        datos.appendChild(fecha);
        pie.appendChild(datos);

        art.appendChild(pie);
        return art;
    }


    var vacio = document.getElementById('resenas-vacio');
    var lista = [];

    function armarGrupo(resenas, repeticiones) {
        var g = document.createElement('div');
        g.className = 'resenas__grupo';
        for (var v = 0; v < repeticiones; v++) {
            resenas.forEach(function (r) { g.appendChild(crearTarjeta(r)); });
        }
        return g;
    }

    function dibujar() {
        carrusel.innerHTML = '';
        carrusel.style.removeProperty('--ancho-grupo');
        carrusel.style.removeProperty('--duracion');

        var hay = lista.length > 0;
        carrusel.hidden = !hay;
        if (vacio) vacio.hidden = hay;
        if (!hay) return;

        var pista = document.createElement('div');
        pista.className = 'resenas__pista';
        carrusel.appendChild(pista);

        var grupo = armarGrupo(lista, 1);
        pista.appendChild(grupo);

        if (reducir) {                      
            carrusel.classList.add('is-estatico');
            return;
        }
        carrusel.classList.remove('is-estatico');


        var veces = 1;
        while (grupo.offsetWidth < carrusel.clientWidth * 1.1 && veces < 12) {
            veces++;
            pista.replaceChild(armarGrupo(lista, veces), grupo);
            grupo = pista.firstChild;
        }

        var copia = grupo.cloneNode(true);
        copia.setAttribute('aria-hidden', 'true');
        pista.appendChild(copia);

        var ancho = grupo.offsetWidth;
        carrusel.style.setProperty('--ancho-grupo', ancho + 'px');
        carrusel.style.setProperty('--duracion', (ancho / VELOCIDAD).toFixed(1) + 's');
    }

    var TEXTO_VACIO = vacio ? vacio.textContent : '';

    function cargarYDibujar() {
        return almacen.cargar().then(function (todas) {
            if (vacio) vacio.textContent = TEXTO_VACIO;
            return todas;
        }, function () {

            if (vacio) vacio.textContent = 'No pudimos cargar las reseñas en este momento.';
            return RESENAS_INICIALES.slice();
        }).then(function (todas) {
            lista = todas.slice().sort(function (a, b) {
                return new Date(b.fecha) - new Date(a.fecha);  
            });
            dibujar();
        });
    }


    var campoNombre = document.getElementById('resenas-nombre');
    var campoTexto = document.getElementById('resenas-comentario');
    var estado = document.getElementById('resenas-estado');
    var contador = document.getElementById('resenas-contador');

    function avisar(msg, tipo) {
        estado.textContent = msg;
        estado.className = 'resenas__estado' + (tipo ? ' is-' + tipo : '');
    }

    function actualizarContador() {
        contador.textContent = campoTexto.value.length + ' / ' + MAX_TEXTO;
    }
    campoTexto.addEventListener('input', actualizarContador);
    actualizarContador();

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        var nombre = campoNombre.value.trim().slice(0, MAX_NOMBRE);
        var texto = campoTexto.value.trim().slice(0, MAX_TEXTO);
        var estrellas = puntaje.getValue();

        
        if (form.elements.web && form.elements.web.value) return avisar('¡Gracias por tu opinión!', 'ok');

        
        var ultima = 0;
        try { ultima = Number(localStorage.getItem(CLAVE + ':ultima')) || 0; } catch (err) { ultima = 0; }
        if (Date.now() - ultima < 30000) return avisar('Esperá unos segundos antes de enviar otra reseña.', 'error');

        if (!estrellas) return avisar('Elegí cuántas estrellas le das.', 'error');
        if (!nombre) { campoNombre.focus(); return avisar('Escribí tu nombre.', 'error'); }
        if (texto.length < 5) { campoTexto.focus(); return avisar('Contanos un poquito más sobre tu experiencia.', 'error'); }

        var boton = form.querySelector('button[type="submit"]');
        boton.disabled = true;

        almacen.guardar({
            nombre: nombre,
            puntaje: estrellas,
            texto: texto,
            fecha: new Date().toISOString()
        }).then(cargarYDibujar).then(function () {
            try { localStorage.setItem(CLAVE + ':ultima', String(Date.now())); } catch (err) { /* nada */ }
            form.reset();
            puntaje.reset();
            actualizarContador();
            avisar(moderada && usaServidor
                ? '¡Gracias por tu opinión! La publicaremos apenas la revisemos.'
                : '¡Gracias por tu opinión! Ya aparece en el carrusel.', 'ok');
        }).catch(function (err) {
            if (err && err.codigo === 'palabras_no_permitidas') {
                avisar('Tu reseña tiene palabras no permitidas. Reformulala y volvé a enviarla.', 'error');
            } else {
                avisar('No pudimos guardar tu reseña. Probá de nuevo en un rato.', 'error');
            }
        }).then(function () {
            boton.disabled = false;
        });
    });


    var anchoPrevio = window.innerWidth;
    var t;
    window.addEventListener('resize', function () {
        if (window.innerWidth === anchoPrevio) return;   
        anchoPrevio = window.innerWidth;
        clearTimeout(t);
        t = setTimeout(dibujar, 200);
    });

    cargarYDibujar();
})();
