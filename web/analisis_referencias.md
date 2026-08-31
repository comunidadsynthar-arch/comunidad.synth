# Análisis de Páginas de Referencia: Superbooth vs. Dutch Modular Fest 🌐

Para diseñar la web de **SYNTH ARGENTINA**, analizamos las estructuras de dos de los eventos más influyentes del mundo en la cultura de sintetizadores: **Superbooth** (Berlín) y **Dutch Modular Fest** (Rotterdam). 

Ambas webs reflejan el modelo de negocio, escala e identidad de sus respectivos encuentros.

---

## 🇩🇪 1. Superbooth (El Gigante de la Industria)
* **Escala**: Evento de 3 días con carácter de feria comercial industrial internacional (B2B y B2C) y festival de música.
* **Modelo web**: Sitio corporativo-cultural completo, masivo, con un fuerte enfoque en reservas comerciales de stands y cobertura de prensa.

### Estructura de la Web:
1. **News (Novedades)**: Listado de noticias, lanzamientos de videos oficiales del festival y anuncios de fechas.
2. **Messe & Exhibitors (Feria y Expositores)**:
   * Portal de login y contratación de stands para marcas internacionales (tarifas, planos, términos).
   * Directorio de marcas participantes.
3. **Events (Programa)**: Grilla interactiva y muy densa de conciertos, clínicas cortas de marcas (*Gesprächskonzerte*) y talleres.
4. **Floorplan (Plano)**: Un mapa interactivo (usando plugins vectoriales) que permite ver el predio y dónde está ubicado exactamente cada stand.
5. **Tickets**: Pasarela de pago de entradas con diferentes categorías (pases de 1 día, 3 días, tickets con descuento para estudiantes).
6. **Gallery (Galería/Videos)**: Sección multimedia muy fuerte que embebe videos de YouTubers de la escena (Sonicstate, BoBeats, etc.) cubriendo el evento, además de las grabaciones de conciertos propios.
7. **Press (Prensa)**: Acreditaciones para periodistas, comunicados de prensa oficiales y kits de prensa con fotos de alta resolución.

### Lecciones para Synth Argentina:
* **Filtros en el programa**: Su agenda es tan grande que requiere filtros por día y por tipo de evento (charla, workshop, concierto).
* **El valor de la comunidad de prensa**: Embeber videos de YouTubers y creadores de contenido que asistieron potencia la difusión orgánica del evento.

---

## 🇳🇱 2. Dutch Modular Fest (La Comunidad y el DIY)
* **Escala**: Evento más íntimo, hiper-comunitario, centrado en la síntesis modular, el desarrollo independiente y los talleres prácticos.
* **Modelo web**: Sitio dinámico pero compacto, con especial protagonismo de los talleres de soldadura (DIY) y artistas de la escena local.

### Estructura de la Web:
1. **Home (Inicio)**: Resumen rápido de fechas, locación (ej. el club cultural WORM en Rotterdam) e información directa para comprar tickets.
2. **Artists (Artistas)**: Grilla visual con fotos y links a redes de los músicos nacionales e internacionales que realizan presentaciones en vivo.
3. **Workshops & Talks (Talleres y Charlas)**: Foco educativo. Dividen las charlas teóricas/demostraciones de los talleres prácticos.
4. **DIY (Soldadura)**: **Es una de las secciones más importantes.** Describe qué módulos o sintes se van a armar, el nivel de dificultad y el costo del kit de componentes.
5. **Market (Mercado de Fabricantes)**: Información sobre las marcas independientes que tendrán mesas de exposición.
6. **Media (Galería)**: Archivo histórico de fotos y videos de ediciones pasadas.
7. **About / Contact (Sobre Nosotros y Contacto)**: Datos sobre la organización horizontal, cómo llegar al lugar en transporte público y redes de contacto.

### Lecciones para Synth Argentina:
* **Entradas dobles para Talleres DIY**: Los talleres de armado de circuitos tienen cupos ultra limitados. DMF vende un ticket general de entrada al evento y, de forma separada, tickets individuales para cada taller DIY que incluye el costo del kit de componentes.
* **Estética comunitaria**: Un diseño más descontracturado, experimental y oscuro (osciloscopios, colores de neón) conecta mejor con la cultura modular.

---

## 🗺️ Propuesta de Estructura Web para SYNTH ARGENTINA

Teniendo en cuenta que estamos ante una **primera edición**, la web debería ir evolucionando por fases para optimizar costos de desarrollo y no sobrecargar al equipo organizador.

### 📅 Fase 1: Landing Page de Lanzamiento (Foco en Captación)
* **Objetivo**: Medir interés, conseguir correos de posibles asistentes y pre-registrar marcas/fabricantes interesados.
* **Secciones**:
  * **Hero**: Nombre, logo, fechas tentativas y concepto ("El primer gran encuentro de sintetizadores en Argentina").
  * **Manifiesto/Propuesta**: Breve texto con el espíritu comunitario (sacado de la propuesta inicial).
  * **Formulario de Suscripción (Newsletter)**: Caja simple ("Enterate de las novedades y preventa de entradas").
  * **Formulario de Convocatoria Abierta**:
    * Botón 1: "Quiero exponer mi marca/tienda" (redirige a un formulario con preguntas de espacio, electricidad y tipo de productos).
    * Botón 2: "Quiero dar una charla, taller o live set" (formulario para artistas y técnicos).
  * **Redes Sociales**: Enlaces de contacto (Instagram, Mail).

### 📅 Fase 2: Sitio Web del Evento Completo (A un par de meses del evento)
* **Secciones**:
  * **Feria**: Directorio de marcas nacionales participantes con links a sus tiendas.
  * **Programa**: Cronograma del día (Charlas, Jams, Clínicas y Live Sets).
  * **Sección DIY**: Detalle de los talleres de soldadura (kits, costos, nivel técnico requerido).
  * **Mercado de Usados**: Reglas para participar en el sector de compra/venta/canje.
  * **Tickets**: Enlace o widget integrado a una ticketera local (Passline, Eventbrite, Alpogo, etc.).
  * **Locación**: Mapa interactivo de cómo llegar, horarios y accesibilidad.

---

## 🛠️ Recomendaciones Tecnológicas

1. **Framework**: Proponemos usar **Astro** o **HTML/CSS/Tailwind básico** para la Fase 1. Astro es rápido, genera sitios estáticos muy livianos (excelente para SEO y carga móvil lenta) y es fácil de escalar hacia la Fase 2 sumando componentes interactivos de React o Vue si hicieran falta.
2. **Formularios**: Integraciones sencillas sin backend complejo:
   * **Tally.so** o **Google Forms** estilizados para los formularios de expositores y propuestas de artistas.
   * **Brevo (ex Sendinblue)** o **MailerLite** para la lista de suscriptores/newsletter (tienen tiers gratuitos generosos).
3. **Plataforma de Tickets**: Integrar un widget de **Alpogo** o **Passline**, que son muy conocidos en la escena musical argentina y manejan pagos en pesos con tarjetas locales fácilmente.
