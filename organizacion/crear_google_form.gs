/**
 * SYNTH ARGENTINA ⚡🎛️🇦🇷
 * Script de Google Apps Script para generar automáticamente la Encuesta en Google Forms
 * 
 * INSTRUCCIONES RÁPIDAS:
 * 1. Abrí en tu navegador: https://script.new (con tu cuenta de Google)
 * 2. Borrá el código que aparezca y pegá todo este script.
 * 3. Hacé clic en el botón "Ejecutar" (Run).
 * 4. Autorizá los permisos que te pida Google (un estándar para que tu cuenta cree el form).
 * 5. ¡Listo! En el panel "Registro de ejecución" verás el LINK PÚBLICO para compartir
 *    y el formulario quedará guardado en tu Google Drive.
 */

function crearEncuestaSynthArgentina() {
  var form = FormApp.create('Encuesta Comunitaria - SYNTH ARGENTINA ⚡🎛️🇦🇷');
  form.setDescription('Consulta comunitaria abierta sobre visión, escala, comisiones de trabajo y prioridades urgentes para la primera edición de Synth Argentina.\n\nEl punto de encuentro para fabricantes, músicos, técnicos, desarrolladores, coleccionistas y apasionados de las máquinas de sonido en el país.');
  form.setConfirmationMessage('¡Muchas gracias por participar y sumar tu voz para construir Synth Argentina ⚡🎛️! Estaremos compartiendo los resultados consolidados con la comunidad.');
  form.setAllowResponseEdits(true);
  form.setPublishingSummary(true);

  // --- SECCIÓN 0: DATOS DE CONTACTO ---
  form.addSectionHeaderItem()
    .setTitle('👤 Datos de Contacto y Vínculo')
    .setHelpText('Para poder coordinar comisiones y convocatorias.');
    
  form.addTextItem().setTitle('Nombre y Apellido').setRequired(true);
  form.addTextItem().setTitle('Correo Electrónico (Email)').setRequired(true);
  form.addTextItem().setTitle('Teléfono / WhatsApp').setHelpText('Opcional, para sumarte al grupo de coordinación operativa.');
  form.addTextItem().setTitle('Instagram / Web / Proyecto sonoro').setHelpText('Opcional');

  var roleItem = form.addCheckboxItem();
  roleItem.setTitle('¿Cuál es tu vínculo o rol principal en la comunidad? (Podés marcar más de uno)')
    .setChoiceValues([
      'Músico / Productor / Artista en vivo',
      'Fabricante de sintetizadores o efectos / Luthería electrónica',
      'Desarrollador de software / DSP / Plugins',
      'Técnico de audio / Reparador / Modder',
      'Coleccionista / Entusiasta / Aficionado',
      'Docente / Formador en síntesis y producción',
      'Prensa / Difusión / Creador de contenido',
      'Organizador de eventos / Gestor cultural'
    ])
    .showOtherOption(true)
    .setRequired(true);

  // --- BLOQUE 1: VISIÓN E IDENTIDAD ---
  form.addPageBreakItem()
    .setTitle('1. ¿Qué queremos que sea SYNTH ARGENTINA?')
    .setHelpText('Definición de identidad, valores y periodicidad del encuentro.');

  var visionItem = form.addCheckboxItem();
  visionItem.setTitle('1.1. Pilares fundamentales del evento (Marcá los que consideres indispensables)')
    .setChoiceValues([
      'Feria de fabricantes nacionales e importadores (Stands y testeos de equipos)',
      'Espacio educativo (Clínicas, masterclasses, talleres de síntesis y soldadura DIY)',
      'Escenario de música en vivo (Live sets, jams de modulares, performances)',
      'Espacio de networking y comunidad (Charlas de luthería, debate técnico)',
      'Feria de compra/venta y canje de equipamiento usado entre particulares'
    ]);

  var accessItem = form.addMultipleChoiceItem();
  accessItem.setTitle('1.2. Modelo de acceso al evento')
    .setChoiceValues([
      'Entrada libre y gratuita (financiado por stands, sponsors y donaciones)',
      'Bono contribución accesible o gorra sugerida',
      'Entrada general arancelada para cubrir locación y sonido profesional'
    ])
    .showOtherOption(true);

  var freqItem = form.addMultipleChoiceItem();
  freqItem.setTitle('1.3. Periodicidad del encuentro')
    .setChoiceValues([
      '1 vez al año (Mega evento anual)',
      '2 veces al año (Semestral)',
      'Encuentros menores bimestrales + 1 evento principal anual'
    ]);

  // --- BLOQUE 2: ESCALA ---
  form.addPageBreakItem()
    .setTitle('2. ¿Qué escala debería tener la primera edición?')
    .setHelpText('Dimensionamiento para el puntapié inicial.');

  var durItem = form.addMultipleChoiceItem();
  durItem.setTitle('2.1. Duración ideal del evento')
    .setChoiceValues([
      '1 día intensivo (Sábado o Domingo de 12:00 a 22:00)',
      '2 días (Sábado y Domingo)'
    ]);

  var attItem = form.addMultipleChoiceItem();
  attItem.setTitle('2.2. Convocatoria estimada para la edición debut')
    .setChoiceValues([
      'Íntima y cuidada: 100 a 200 personas',
      'Mediana: 200 a 500 personas',
      'Masiva: Más de 500 personas'
    ]);

  var standsItem = form.addMultipleChoiceItem();
  standsItem.setTitle('2.3. Cantidad de stands / mesas de exposición')
    .setChoiceValues([
      '10 a 15 stands (enfocado)',
      '15 a 30 stands (intermedio)',
      'Más de 30 stands (gran feria)'
    ]);

  var venueItem = form.addCheckboxItem();
  venueItem.setTitle('2.4. Tipo de espacio o locación sugerida')
    .setChoiceValues([
      'Centro cultural público o municipal',
      'Club de música o sala de conciertos con escenario y barra',
      'Galpón o espacio industrial amplio y modulable',
      'Espacio al aire libre con sector techado'
    ]);

  // --- BLOQUE 3: INVOLUCRAMIENTO ---
  form.addPageBreakItem()
    .setTitle('3. ¿Quiénes quieren involucrarse activamente en la organización?')
    .setHelpText('Nivel de compromiso y disponibilidad horaria.');

  var invItem = form.addMultipleChoiceItem();
  invItem.setTitle('3.1. ¿Con qué nivel de compromiso podés sumarte?')
    .setChoiceValues([
      '🔥 Núcleo Duro / Coordinación General (Reuniones semanales, toma de decisiones)',
      '🛠️ Miembro de Comisión específica (Tareas concretas de un área)',
      '⚡ Colaborador puntual día D (Montaje, desarme, acreditaciones, logística durante el evento)',
      '🎟️ Solo asistente / Difusión en mis redes'
    ])
    .setRequired(true);

  var timeItem = form.addCheckboxItem();
  timeItem.setTitle('3.2. Disponibilidad horaria y modalidad para coordinar')
    .setChoiceValues([
      'Días de semana tarde/noche (después de las 18:30)',
      'Fines de semana',
      'Reuniones virtuales (Google Meet / Discord)',
      'Encuentros presenciales en CABA'
    ]);

  // --- BLOQUE 4: APORTES Y RECURSOS ---
  form.addPageBreakItem()
    .setTitle('4. ¿Qué puede aportar cada uno?')
    .setHelpText('Habilidades profesionales, oficios y recursos materiales.');

  var skillsItem = form.addCheckboxItem();
  skillsItem.setTitle('4.1. Habilidades u oficios que podés sumar')
    .setChoiceValues([
      'Producción técnica, sonido en vivo y consolas',
      'Electricidad y distribución de potencia',
      'Diseño gráfico, cartelería y branding',
      'Fotografía, video y streaming',
      'Comunicación, prensa y manejo de redes',
      'Gestión legal, seguros y habilitaciones',
      'Finanzas, presupuesto y captación de sponsors',
      'Curaduría artística y talleres formativos',
      'Desarrollo web, sistemas y software'
    ]);

  var equipItem = form.addCheckboxItem();
  equipItem.setTitle('4.2. Equipamiento o infraestructura que podés facilitar')
    .setChoiceValues([
      'Consolas, cables, cajas directas (DIs)',
      'Sistema de sonido PA / Monitores',
      'Proyector, pantallas o luces LED',
      'Zapatillas eléctricas reforzadas / prolongadores',
      'Mesas, caballetes o sillas para stands',
      'Vehículo para fletes y traslados de equipamiento',
      'Locación o espacio físico propio/conocido'
    ]);

  form.addParagraphTextItem().setTitle('4.3. Detalle de equipamiento o recursos disponibles (Opcional)');

  // --- BLOQUE 5: COMISIONES DE TRABAJO ---
  form.addPageBreakItem()
    .setTitle('5. ¿Cómo dividimos las áreas de trabajo?')
    .setHelpText('Elección de comisiones operativas.');

  var comm1 = form.addListItem();
  comm1.setTitle('5.1. Primera comisión de trabajo a la que querés sumarte')
    .setChoiceValues([
      'Comisión 1: Técnica, Espacio y Sonido',
      'Comisión 2: Curaduría Artística y Formación',
      'Comisión 3: Comunicación, Prensa y Registro',
      'Comisión 4: Administración, Finanzas y Sponsors',
      'Comisión 5: Producción General y Día D'
    ])
    .setRequired(true);

  var comm2 = form.addListItem();
  comm2.setTitle('5.2. Segunda comisión alternativa (opcional)')
    .setChoiceValues([
      'Ninguna / Solo la primera',
      'Comisión 1: Técnica, Espacio y Sonido',
      'Comisión 2: Curaduría Artística y Formación',
      'Comisión 3: Comunicación, Prensa y Registro',
      'Comisión 4: Administración, Finanzas y Sponsors',
      'Comisión 5: Producción General y Día D'
    ]);

  var toolsItem = form.addCheckboxItem();
  toolsItem.setTitle('5.3. Herramientas sugeridas para la coordinación del equipo')
    .setChoiceValues([
      'Grupo de WhatsApp / Comunidad',
      'Servidor de Discord (canales por comisión)',
      'Google Drive compartido (documentos y planillas)',
      'Notion o Trello (tableros de tareas)',
      'Reuniones virtuales semanales o quincenales'
    ]);

  // --- BLOQUE 6: TAREAS PRIORITARIAS ---
  form.addPageBreakItem()
    .setTitle('6. ¿Qué tareas tenemos que hacer primero?')
    .setHelpText('Sprint inicial y primeros pasos.');

  var prioItem = form.addCheckboxItem();
  prioItem.setTitle('6.1. ¿Cuáles deberían ser las 3 primeras tareas urgentes a resolver?')
    .setChoiceValues([
      'Definir y reservar la locación física y fecha tentativa',
      'Conformar los coordinadores de cada una de las 5 comisiones',
      'Armar presupuesto estimado de costos fijos (locación, sonido, seguro)',
      'Lanzar la convocatoria abierta a fabricantes y marcas expositoras',
      'Abrir convocatoria artística a músicos, live sets y talleristas',
      'Diseñar identidad gráfica oficial y afiche de lanzamiento',
      'Redactar reglamento y condiciones para stands y feria de usados'
    ]);

  form.addParagraphTextItem().setTitle('6.2. Ideas, sugerencias de locaciones o comentarios adicionales');

  var editUrl = form.getEditUrl();
  var publicUrl = form.getPublishedUrl();

  Logger.log('====================================================');
  Logger.log('🎉 ¡ENCUESTA CREADA CON ÉXITO EN TU GOOGLE DRIVE!');
  Logger.log('👉 LINK PARA EDITAR: ' + editUrl);
  Logger.log('🔗 LINK PÚBLICO PARA COMPARTIR: ' + publicUrl);
  Logger.log('====================================================');
}
