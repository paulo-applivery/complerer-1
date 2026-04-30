-- ============================================================
-- ENS RD 311/2022 — full library reseed (Phase 1 of adaptation).
--
-- Replaces the lean English seed (0046) with the canonical 80-entry
-- ENS catalogue from CCN: 6 ARTICULOS + 1 ADENDA + 73 MEDIDAS, in
-- Spanish, with applicability per system category, AAPP flag,
-- reinforcements, and evaluated_aspects (audit checklist).
--
-- Depends on: 0071_ens_framework_extensions.sql.
-- ============================================================

-- ── 1. Framework + version metadata ─────────────────────────

UPDATE frameworks SET
  name = 'Esquema Nacional de Seguridad (RD 311/2022)',
  description = 'Spanish National Security Framework (Real Decreto 311/2022, de 3 de mayo). Establishes the security policy for electronic media in the Spanish public sector and its providers. Supersedes RD 3/2010.',
  source_org = 'CCN — Centro Criptológico Nacional'
WHERE id = 'ens';

UPDATE framework_versions SET
  total_controls = 80,
  changelog = 'Full ENS catalogue per CCN-STIC: 6 articles + 1 adenda + 73 measures across 16 groups (org / op.pl / op.acc / op.exp / op.ext / op.nub / op.cont / op.mon / mp.if / mp.per / mp.eq / mp.com / mp.si / mp.sw / mp.info / mp.s). Applicability tracked per system category (BÁSICA / MEDIA / ALTA). Replaces RD 3/2010.',
  authority = 'CCN — Centro Criptológico Nacional',
  jurisdiction = 'ES',
  system_categories_json = '["BASICA","MEDIA","ALTA"]',
  security_dimensions_json = '["C","I","T","A","D"]'
WHERE id = 'ens-2022';

-- ── 2. Drop measures that are not in the canonical CCN list ─

DELETE FROM versioned_controls
WHERE framework_version_id = 'ens-2022'
  AND control_id IN ('op.acc.7', 'op.exp.11');

-- ── 3. Marco Organizativo (org.*) — enrich existing rows ────

UPDATE versioned_controls SET
  control_type = 'MEDIDA',
  control_group = 'org',
  applicability_json = '{"basica":"aplica","media":"aplica","alta":"aplica"}',
  reinforcements_json = '[]',
  evaluated_aspects_json = '[
    {"id":"org.1.q1","question":"¿Existe una política de seguridad aprobada por la dirección que defina objetivos, alcance, roles, responsabilidades, gestión de riesgos y compromisos de cumplimiento?","reinforcement_ref":null},
    {"id":"org.1.q2","question":"¿Se ha comunicado la política a todo el personal afectado y se ha documentado su difusión?","reinforcement_ref":null}
  ]'
WHERE id = 'ens-2022-org-1';

UPDATE versioned_controls SET
  control_type = 'MEDIDA',
  control_group = 'org',
  applicability_json = '{"basica":"aplica","media":"aplica","alta":"aplica"}',
  reinforcements_json = '[]',
  evaluated_aspects_json = '[
    {"id":"org.2.q1","question":"¿Se dispone de normativa de seguridad que detalle requisitos obligatorios derivados de la política?","reinforcement_ref":null},
    {"id":"org.2.q2","question":"¿La normativa cubre uso aceptable, clasificación, control de acceso y respuesta a incidentes?","reinforcement_ref":null}
  ]'
WHERE id = 'ens-2022-org-2';

UPDATE versioned_controls SET
  control_type = 'MEDIDA',
  control_group = 'org',
  applicability_json = '{"basica":"aplica","media":"aplica","alta":"aplica"}',
  reinforcements_json = '[]',
  evaluated_aspects_json = '[
    {"id":"org.3.q1","question":"¿Se han documentado procedimientos de seguridad accionables y mantenidos al día?","reinforcement_ref":null},
    {"id":"org.3.q2","question":"¿Los procedimientos cubren provisión de usuarios, copias de seguridad, parches y respuesta a incidentes?","reinforcement_ref":null}
  ]'
WHERE id = 'ens-2022-org-3';

UPDATE versioned_controls SET
  control_type = 'MEDIDA',
  control_group = 'org',
  applicability_json = '{"basica":"aplica","media":"aplica","alta":"aplica"}',
  reinforcements_json = '[]',
  evaluated_aspects_json = '[
    {"id":"org.4.q1","question":"¿Existe un proceso formal de autorización para acceder a sistemas, instalar componentes y realizar cambios en producción?","reinforcement_ref":null},
    {"id":"org.4.q2","question":"¿Las autorizaciones las concede personal designado con autoridad apropiada?","reinforcement_ref":null}
  ]'
WHERE id = 'ens-2022-org-4';

-- ── 4. Marco Operacional · Planificación (op.pl.*) ──────────

UPDATE versioned_controls SET
  title = 'Análisis de Riesgos',
  control_type = 'MEDIDA',
  control_group = 'op.pl',
  applicability_json = '{"basica":"aplica","media":"+R1","alta":"+R1+R2"}',
  reinforcements_json = '[
    {"id":"R1","description":"Análisis de riesgos semiformal con metodología y catálogo básico de amenazas.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"},
    {"id":"R2","description":"Análisis formal con fundamento matemático estandarizado e internacionalmente reconocido.","required_at":["ALTA"],"mode":"ADDITIVE"}
  ]',
  evaluated_aspects_json = '[
    {"id":"op.pl.1.q1","question":"¿Se dispone de un análisis de riesgos documentado y con iteración reciente?","reinforcement_ref":null},
    {"id":"op.pl.1.q2","question":"¿Se han identificado activos esenciales y resto de activos relevantes?","reinforcement_ref":null},
    {"id":"op.pl.1.q3","question":"¿Se han identificado las amenazas más probables sobre el sistema?","reinforcement_ref":null},
    {"id":"op.pl.1.q4","question":"¿Se han determinado salvaguardas para mitigar las amenazas?","reinforcement_ref":null},
    {"id":"op.pl.1.q5","question":"¿Se han identificado y valorado los riesgos residuales?","reinforcement_ref":null},
    {"id":"op.pl.1.q6","question":"¿Se ha definido un plan de tratamiento de riesgos?","reinforcement_ref":null},
    {"id":"op.pl.1.q7","question":"¿Se ha realizado un análisis semiformal con metodología y catálogo de amenazas?","reinforcement_ref":"R1"},
    {"id":"op.pl.1.q8","question":"Para categoría ALTA, ¿se ha realizado un análisis formal con fundamento matemático estandarizado?","reinforcement_ref":"R2"}
  ]'
WHERE id = 'ens-2022-op-pl-1';

UPDATE versioned_controls SET
  title = 'Arquitectura de Seguridad',
  control_type = 'MEDIDA',
  control_group = 'op.pl',
  applicability_json = '{"basica":"aplica","media":"+R1","alta":"+R1+R2+R3"}',
  reinforcements_json = '[
    {"id":"R1","description":"Sistema de gestión de seguridad de la información (SGSI 27001) aplicado.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"},
    {"id":"R2","description":"SGSI orientado a la mejora continua.","required_at":["ALTA"],"mode":"ADDITIVE"},
    {"id":"R3","description":"Controles técnicos internos para aumentar la seguridad.","required_at":["ALTA"],"mode":"ADDITIVE"}
  ]',
  evaluated_aspects_json = '[
    {"id":"op.pl.2.q1","question":"¿Se dispone de documentación y diagramas del sistema, instalaciones, equipos, comunicaciones y líneas de defensa?","reinforcement_ref":null},
    {"id":"op.pl.2.q2","question":"¿Se documentan instalaciones, áreas y puntos de acceso?","reinforcement_ref":null},
    {"id":"op.pl.2.q3","question":"¿Se documentan equipos, redes internas, conexiones externas y consolas de administración?","reinforcement_ref":null},
    {"id":"op.pl.2.q4","question":"¿Se documentan líneas de defensa: cortafuegos, balanceadores, segmentación, etc.?","reinforcement_ref":null},
    {"id":"op.pl.2.q5","question":"¿Se identifican y valoran los riesgos residuales tras las salvaguardas?","reinforcement_ref":null},
    {"id":"op.pl.2.q6","question":"¿Se ha definido un plan de tratamiento de riesgos?","reinforcement_ref":null},
    {"id":"op.pl.2.q7","question":"¿Se dispone de un SGSI 27001 aplicado al sistema?","reinforcement_ref":"R1"},
    {"id":"op.pl.2.q8","question":"¿El SGSI está orientado a mejora continua?","reinforcement_ref":"R2"},
    {"id":"op.pl.2.q9","question":"¿Se dispone de controles técnicos internos para reforzar la seguridad?","reinforcement_ref":"R3"}
  ]'
WHERE id = 'ens-2022-op-pl-2';

UPDATE versioned_controls SET
  title = 'Adquisición de nuevos componentes',
  control_type = 'MEDIDA',
  control_group = 'op.pl',
  applicability_json = '{"basica":"aplica","media":"aplica","alta":"aplica"}',
  reinforcements_json = '[]',
  evaluated_aspects_json = '[
    {"id":"op.pl.3.q1","question":"¿Se planifica la adquisición considerando obsolescencia, contratos y cambios de contexto?","reinforcement_ref":null},
    {"id":"op.pl.3.q2","question":"¿El proceso contempla financiación, formación y aspectos técnicos conjuntamente?","reinforcement_ref":null},
    {"id":"op.pl.3.q3","question":"¿Se contemplan los riesgos asociados a los nuevos componentes?","reinforcement_ref":null},
    {"id":"op.pl.3.q4","question":"¿Se verifica la coherencia con la arquitectura del sistema?","reinforcement_ref":null}
  ]'
WHERE id = 'ens-2022-op-pl-3';

UPDATE versioned_controls SET
  title = 'Dimensionamiento / gestión de la capacidad',
  control_type = 'MEDIDA',
  control_group = 'op.pl',
  applicability_json = '{"basica":"aplica","media":"+R1","alta":"+R1"}',
  reinforcements_json = '[
    {"id":"R1","description":"Estudio de capacidad mantenido durante todo el ciclo de vida del sistema.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"}
  ]',
  evaluated_aspects_json = '[
    {"id":"op.pl.4.q1","question":"¿Se consideran las necesidades de capacidad antes de la entrada en producción?","reinforcement_ref":null},
    {"id":"op.pl.4.q2","question":"¿El estudio de capacidad se mantiene actualizado durante todo el ciclo de vida?","reinforcement_ref":"R1"}
  ]'
WHERE id = 'ens-2022-op-pl-4';

UPDATE versioned_controls SET
  title = 'Componentes Certificados',
  control_type = 'MEDIDA',
  control_group = 'op.pl',
  applicability_json = '{"basica":"n.a.","media":"aplica","alta":"aplica"}',
  reinforcements_json = '[]',
  evaluated_aspects_json = '[
    {"id":"op.pl.5.q1","question":"¿Se utiliza el catálogo CPSTIC del CCN para seleccionar productos/servicios de la arquitectura de seguridad?","reinforcement_ref":null},
    {"id":"op.pl.5.q2","question":"En ausencia de productos en CPSTIC, ¿se emplean otros productos certificados según art. 19 del RD 311/2022?","reinforcement_ref":null}
  ]'
WHERE id = 'ens-2022-op-pl-5';

-- ── 5. Marco Operacional · Control de Acceso (op.acc.*) ─────

UPDATE versioned_controls SET
  title = 'Identificación',
  control_type = 'MEDIDA',
  control_group = 'op.acc',
  applicability_json = '{"basica":"aplica","media":"+R1","alta":"+R1"}',
  reinforcements_json = '[
    {"id":"R1","description":"Identificación que permite singularizar a la persona y sus responsabilidades.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"}
  ]',
  evaluated_aspects_json = '[
    {"id":"op.acc.1.q1","question":"¿Cada entidad/usuario/proceso cuenta con un identificador singular para asignarle derechos de acceso?","reinforcement_ref":null},
    {"id":"op.acc.1.q2","question":"¿Las cuentas se deshabilitan/bloquean inmediatamente al cesar el usuario o por orden contraria?","reinforcement_ref":null},
    {"id":"op.acc.1.q3","question":"¿La identificación permite singularizar a la persona y sus responsabilidades?","reinforcement_ref":"R1"}
  ]'
WHERE id = 'ens-2022-op-acc-1';

UPDATE versioned_controls SET
  title = 'Requisitos de Acceso',
  control_type = 'MEDIDA',
  control_group = 'op.acc',
  applicability_json = '{"basica":"aplica","media":"aplica","alta":"+R1"}',
  reinforcements_json = '[
    {"id":"R1","description":"Gestión armonizada de privilegios con los recursos del sistema.","required_at":["ALTA"],"mode":"ADDITIVE"}
  ]',
  evaluated_aspects_json = '[
    {"id":"op.acc.2.q1","question":"¿Los recursos están protegidos contra usos sin derechos de acceso suficientes?","reinforcement_ref":null},
    {"id":"op.acc.2.q2","question":"¿Los derechos de acceso los establece el responsable del recurso conforme a la política?","reinforcement_ref":null},
    {"id":"op.acc.2.q3","question":"¿Se gestionan los privilegios de forma armonizada con los recursos del sistema?","reinforcement_ref":"R1"}
  ]'
WHERE id = 'ens-2022-op-acc-2';

UPDATE versioned_controls SET
  title = 'Segregación de funciones y tareas',
  control_type = 'MEDIDA',
  control_group = 'op.acc',
  applicability_json = '{"basica":"n.a.","media":"aplica","alta":"+R1"}',
  reinforcements_json = '[
    {"id":"R1","description":"Prevención adicional de conflictos como configuración vs. mantenimiento.","required_at":["ALTA"],"mode":"ADDITIVE"}
  ]',
  evaluated_aspects_json = '[
    {"id":"op.acc.3.q1","question":"¿Se segregan funciones que pueden generar conflicto de interés (p.ej. desarrollo y operación)?","reinforcement_ref":null},
    {"id":"op.acc.3.q2","question":"¿Se evita que desarrollo y operación recaigan en la misma persona/equipo?","reinforcement_ref":null},
    {"id":"op.acc.3.q3","question":"¿Se evita que quien autoriza sea quien controla el uso?","reinforcement_ref":null},
    {"id":"op.acc.3.q4","question":"¿Se evita la concurrencia de funciones de configuración y mantenimiento?","reinforcement_ref":"R1"}
  ]'
WHERE id = 'ens-2022-op-acc-3';

UPDATE versioned_controls SET
  title = 'Proceso de gestión de Derechos y Accesos',
  control_type = 'MEDIDA',
  control_group = 'op.acc',
  applicability_json = '{"basica":"aplica","media":"aplica","alta":"aplica"}',
  reinforcements_json = '[]',
  evaluated_aspects_json = '[
    {"id":"op.acc.4.q1","question":"¿Se gestionan los derechos en base al principio de mínimo privilegio?","reinforcement_ref":null},
    {"id":"op.acc.4.q2","question":"¿Cualquier acceso está prohibido salvo autorización expresa?","reinforcement_ref":null},
    {"id":"op.acc.4.q3","question":"¿Se aplica una política de mínimo privilegio reduciendo lo imprescindible?","reinforcement_ref":null},
    {"id":"op.acc.4.q4","question":"¿Cada entidad accede solo a la información requerida para sus funciones?","reinforcement_ref":null},
    {"id":"op.acc.4.q5","question":"¿Solo personal competente concede, altera o anula autorizaciones de acceso?","reinforcement_ref":null}
  ]'
WHERE id = 'ens-2022-op-acc-4';

UPDATE versioned_controls SET
  title = 'Mecanismos de autenticación (usuarios externos)',
  control_type = 'MEDIDA',
  control_group = 'op.acc',
  applicability_json = '{"basica":"+[R1 o R2 o R3 o R4]","media":"+[R1 o R2 o R3 o R4]+R5","alta":"+[R2 o R3 o R4]+R5"}',
  reinforcements_json = '[
    {"id":"R1","description":"Contraseña con normas de complejidad y robustez.","required_at":["BASICA","MEDIA"],"mode":"EXCLUSIVE_OR"},
    {"id":"R2","description":"OTP como complemento a la contraseña.","required_at":["BASICA","MEDIA","ALTA"],"mode":"EXCLUSIVE_OR"},
    {"id":"R3","description":"Certificados cualificados software con segundo factor PIN/biométrico.","required_at":["BASICA","MEDIA","ALTA"],"mode":"EXCLUSIVE_OR"},
    {"id":"R4","description":"Certificados en soporte físico con algoritmos autorizados por el CCN.","required_at":["BASICA","MEDIA","ALTA"],"mode":"EXCLUSIVE_OR"},
    {"id":"R5","description":"Registro de accesos e intentos, e información al usuario.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"}
  ]',
  evaluated_aspects_json = '[
    {"id":"op.acc.5.q1","question":"¿Se mantienen las cuentas y credenciales de usuarios externos mediante mecanismos de control de acceso?","reinforcement_ref":null},
    {"id":"op.acc.5.q2","question":"¿Se cambian las credenciales con la periodicidad marcada por la política?","reinforcement_ref":null},
    {"id":"op.acc.5.q3","question":"¿Se retiran/deshabilitan credenciales ante pérdida o falta de control exclusivo?","reinforcement_ref":null},
    {"id":"op.acc.5.q4","question":"¿Se activan credenciales solo bajo control exclusivo del usuario o se fuerza cambio al primer acceso?","reinforcement_ref":null},
    {"id":"op.acc.5.q5","question":"¿Se retiran/deshabilitan credenciales al terminar la relación con el sistema?","reinforcement_ref":null},
    {"id":"op.acc.5.q6","question":"¿Se limitan los intentos y se requiere intervención específica para reactivar la cuenta?","reinforcement_ref":null},
    {"id":"op.acc.5.q7","question":"¿Se informa al usuario de sus obligaciones tras obtener acceso?","reinforcement_ref":null},
    {"id":"op.acc.5.q8","question":"¿Se emplea contraseña con garantías razonables y normas de complejidad?","reinforcement_ref":"R1"},
    {"id":"op.acc.5.q9","question":"¿Se requiere OTP como complemento a la contraseña?","reinforcement_ref":"R2"},
    {"id":"op.acc.5.q10","question":"¿Se emplean certificados cualificados con registro previo y segundo factor PIN/biométrico?","reinforcement_ref":"R3"},
    {"id":"op.acc.5.q11","question":"¿Se emplean certificados en soporte físico con algoritmos autorizados por el CCN?","reinforcement_ref":"R4"},
    {"id":"op.acc.5.q12","question":"¿Se registran los accesos e intentos y se informa al usuario?","reinforcement_ref":"R5"}
  ]'
WHERE id = 'ens-2022-op-acc-5';

UPDATE versioned_controls SET
  title = 'Mecanismos de autenticación (usuarios de la organización)',
  control_type = 'MEDIDA',
  control_group = 'op.acc',
  applicability_json = '{"basica":"+[R1 o R2 o R3 o R4]","media":"+[R2 o R3 o R4]+R5+R6+R7+R8+R9","alta":"+[R3 o R4]+R5+R6+R7+R8+R9"}',
  reinforcements_json = '[
    {"id":"R1","description":"Contraseña como mecanismo de autenticación con normas de complejidad y robustez.","required_at":["BASICA"],"mode":"EXCLUSIVE_OR"},
    {"id":"R2","description":"Segundo factor (algo que se tiene o se es) como complemento a la contraseña.","required_at":["BASICA","MEDIA"],"mode":"EXCLUSIVE_OR"},
    {"id":"R3","description":"Certificados cualificados como mecanismo de autenticación.","required_at":["BASICA","MEDIA","ALTA"],"mode":"EXCLUSIVE_OR"},
    {"id":"R4","description":"Certificados cualificados en soporte físico (tarjeta o similar).","required_at":["BASICA","MEDIA","ALTA"],"mode":"EXCLUSIVE_OR"},
    {"id":"R5","description":"Registro de trazas de acceso e información al usuario de la última sesión.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"},
    {"id":"R6","description":"Renovación de la autenticación en puntos definidos del sistema.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"},
    {"id":"R7","description":"Suspensión de credenciales tras periodo definido sin uso.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"},
    {"id":"R8","description":"Doble factor obligatorio para accesos desde zonas no controladas.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"},
    {"id":"R9","description":"Accesos remotos autorizados, con tráfico cifrado y aspectos de seguridad.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"}
  ]',
  evaluated_aspects_json = '[
    {"id":"op.acc.6.q1","question":"¿Existen mecanismos de control de acceso alineados con el proceso de altas/bajas de personal?","reinforcement_ref":null},
    {"id":"op.acc.6.q2","question":"¿Se activan credenciales solo bajo control exclusivo o se fuerza cambio al primer acceso?","reinforcement_ref":null},
    {"id":"op.acc.6.q3","question":"¿Se cambian las credenciales con la periodicidad marcada por la política?","reinforcement_ref":null},
    {"id":"op.acc.6.q4","question":"¿Se retiran/deshabilitan credenciales al terminar la relación con el sistema?","reinforcement_ref":null},
    {"id":"op.acc.6.q5","question":"¿Se deshabilitan o regeneran credenciales ante sospecha de pérdida o revelación?","reinforcement_ref":null},
    {"id":"op.acc.6.q6","question":"¿Se limitan intentos requiriendo intervención de administradores para reactivar?","reinforcement_ref":null},
    {"id":"op.acc.6.q7","question":"¿Se emplean contraseñas con garantías razonables, complejidad mínima y robustez?","reinforcement_ref":"R1"},
    {"id":"op.acc.6.q8","question":"¿Se requiere segundo factor como OTP, dispositivo o biometría?","reinforcement_ref":"R2"},
    {"id":"op.acc.6.q9","question":"¿Se emplean certificados cualificados como mecanismo de autenticación?","reinforcement_ref":"R3"},
    {"id":"op.acc.6.q10","question":"¿Se emplean certificados cualificados en soporte físico?","reinforcement_ref":"R4"},
    {"id":"op.acc.6.q11","question":"¿Se registran las trazas de acceso y se informa de la última al usuario?","reinforcement_ref":"R5"},
    {"id":"op.acc.6.q12","question":"¿Se requiere renovación de la autenticación en puntos definidos?","reinforcement_ref":"R6"},
    {"id":"op.acc.6.q13","question":"¿Se suspenden las credenciales tras periodo definido de no uso?","reinforcement_ref":"R7"},
    {"id":"op.acc.6.q14","question":"¿Se exige doble factor para accesos desde zonas no controladas?","reinforcement_ref":"R8"},
    {"id":"op.acc.6.q15","question":"¿Los accesos remotos están autorizados, cifrados y contemplan aspectos de seguridad?","reinforcement_ref":"R9"}
  ]'
WHERE id = 'ens-2022-op-acc-6';

-- ── 6. Marco Operacional · Explotación (op.exp.*) ───────────

UPDATE versioned_controls SET
  title = 'Inventario de Activos',
  control_type = 'MEDIDA',
  control_group = 'op.exp',
  applicability_json = '{"basica":"aplica","media":"aplica","alta":"aplica"}',
  reinforcements_json = '[]',
  evaluated_aspects_json = '[
    {"id":"op.exp.1.q1","question":"¿Se dispone de un inventario de todos los elementos del sistema?","reinforcement_ref":null},
    {"id":"op.exp.1.q2","question":"¿Está actualizado y con responsabilidades claras de mantenimiento?","reinforcement_ref":null},
    {"id":"op.exp.1.q3","question":"¿Detalla la naturaleza de cada activo y su responsable?","reinforcement_ref":null}
  ]'
WHERE id = 'ens-2022-op-exp-1';

UPDATE versioned_controls SET
  title = 'Configuración de la Seguridad',
  control_type = 'MEDIDA',
  control_group = 'op.exp',
  applicability_json = '{"basica":"aplica","media":"aplica","alta":"aplica"}',
  reinforcements_json = '[]',
  evaluated_aspects_json = '[
    {"id":"op.exp.2.q1","question":"¿Se realiza configuración de seguridad (bastionado) antes de la puesta en producción?","reinforcement_ref":null},
    {"id":"op.exp.2.q2","question":"¿Se eliminan cuentas y contraseñas estándar antes de la entrada en operación?","reinforcement_ref":null},
    {"id":"op.exp.2.q3","question":"¿Se aplica la regla de mínima funcionalidad?","reinforcement_ref":null},
    {"id":"op.exp.2.q4","question":"¿Se aplica la regla de seguridad por defecto?","reinforcement_ref":null}
  ]'
WHERE id = 'ens-2022-op-exp-2';

UPDATE versioned_controls SET
  title = 'Gestión de la configuración de la Seguridad',
  control_type = 'MEDIDA',
  control_group = 'op.exp',
  applicability_json = '{"basica":"aplica","media":"+R1","alta":"+R1+R2+R3"}',
  reinforcements_json = '[
    {"id":"R1","description":"Configuraciones autorizadas, mantenidas y verificadas con servicios autorizados.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"},
    {"id":"R2","description":"Responsabilidades formalizadas sobre la configuración de seguridad.","required_at":["ALTA"],"mode":"ADDITIVE"},
    {"id":"R3","description":"Copias de seguridad de la configuración del sistema.","required_at":["ALTA"],"mode":"ADDITIVE"}
  ]',
  evaluated_aspects_json = '[
    {"id":"op.exp.3.q1","question":"¿Se gestiona de forma continua la configuración de los componentes?","reinforcement_ref":null},
    {"id":"op.exp.3.q2","question":"¿Se mantiene la regla de funcionalidad mínima?","reinforcement_ref":null},
    {"id":"op.exp.3.q3","question":"¿El sistema se adapta a nuevas necesidades autorizadas?","reinforcement_ref":null},
    {"id":"op.exp.3.q4","question":"¿El sistema reacciona ante incidentes y vulnerabilidades?","reinforcement_ref":null},
    {"id":"op.exp.3.q5","question":"¿Solo personal autorizado puede editar la configuración de seguridad?","reinforcement_ref":null},
    {"id":"op.exp.3.q6","question":"¿Existen configuraciones autorizadas, mantenidas y verificadas?","reinforcement_ref":"R1"},
    {"id":"op.exp.3.q7","question":"¿Se han establecido responsabilidades sobre la configuración de seguridad?","reinforcement_ref":"R2"},
    {"id":"op.exp.3.q8","question":"¿Se realizan copias de seguridad de la configuración?","reinforcement_ref":"R3"}
  ]'
WHERE id = 'ens-2022-op-exp-3';

UPDATE versioned_controls SET
  title = 'Mantenimiento y actualizaciones de seguridad',
  control_type = 'MEDIDA',
  control_group = 'op.exp',
  applicability_json = '{"basica":"aplica","media":"+R1","alta":"+R1+R2"}',
  reinforcements_json = '[
    {"id":"R1","description":"Pruebas en entorno controlado antes de poner en producción nuevas versiones o parches.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"},
    {"id":"R2","description":"Mecanismo de vuelta atrás para revertir efectos adversos.","required_at":["ALTA"],"mode":"ADDITIVE"}
  ]',
  evaluated_aspects_json = '[
    {"id":"op.exp.4.q1","question":"¿Se realiza mantenimiento sistemático del equipamiento físico y lógico?","reinforcement_ref":null},
    {"id":"op.exp.4.q2","question":"¿Se atienden las especificaciones de los fabricantes?","reinforcement_ref":null},
    {"id":"op.exp.4.q3","question":"¿El mantenimiento lo realiza solo personal autorizado?","reinforcement_ref":null},
    {"id":"op.exp.4.q4","question":"¿Se prueba la nueva versión/parche en un entorno controlado consistente con producción?","reinforcement_ref":"R1"},
    {"id":"op.exp.4.q5","question":"¿Se prevé un mecanismo de vuelta atrás antes de aplicar configuraciones, parches y actualizaciones?","reinforcement_ref":"R2"}
  ]'
WHERE id = 'ens-2022-op-exp-4';

UPDATE versioned_controls SET
  title = 'Gestión de Cambios',
  control_type = 'MEDIDA',
  control_group = 'op.exp',
  applicability_json = '{"basica":"n.a.","media":"aplica","alta":"+R1"}',
  reinforcements_json = '[
    {"id":"R1","description":"Mecanismo de vuelta atrás documentado y notificación de fallos al Responsable de Seguridad.","required_at":["ALTA"],"mode":"ADDITIVE"}
  ]',
  evaluated_aspects_json = '[
    {"id":"op.exp.5.q1","question":"¿Se gestionan los cambios realizados en el sistema?","reinforcement_ref":null},
    {"id":"op.exp.5.q2","question":"¿Existe mecanismo de vuelta atrás, documentación y notificación de fallos al Responsable de Seguridad?","reinforcement_ref":"R1"}
  ]'
WHERE id = 'ens-2022-op-exp-5';

UPDATE versioned_controls SET
  title = 'Protección frente al código dañino',
  control_type = 'MEDIDA',
  control_group = 'op.exp',
  applicability_json = '{"basica":"aplica","media":"+R1+R2","alta":"+R1+R2+R3+R4"}',
  reinforcements_json = '[
    {"id":"R1","description":"Análisis y escaneos regulares en busca de código dañino.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"},
    {"id":"R2","description":"Análisis de funciones críticas al arrancar para detectar modificaciones.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"},
    {"id":"R3","description":"Lista blanca que impide ejecución de aplicaciones no autorizadas.","required_at":["ALTA"],"mode":"ADDITIVE"},
    {"id":"R4","description":"Solución EDR (Endpoint Defense and Response) desplegada.","required_at":["ALTA"],"mode":"ADDITIVE"}
  ]',
  evaluated_aspects_json = '[
    {"id":"op.exp.6.q1","question":"¿Existe protección antimalware (AV/EDR) en puestos, servidores y elementos perimetrales?","reinforcement_ref":null},
    {"id":"op.exp.6.q2","question":"¿La solución antimalware está configurada con protección en tiempo real?","reinforcement_ref":null},
    {"id":"op.exp.6.q3","question":"¿Está instalada en todos los equipos: usuarios, servidores y perímetro?","reinforcement_ref":null},
    {"id":"op.exp.6.q4","question":"¿Existe contraseña de administración u otro mecanismo que impida que el usuario detenga la solución?","reinforcement_ref":null},
    {"id":"op.exp.6.q5","question":"¿La licencia cubre la totalidad de equipos operativos?","reinforcement_ref":null},
    {"id":"op.exp.6.q6","question":"¿Se ejecutan análisis y escaneos regulares?","reinforcement_ref":"R1"},
    {"id":"op.exp.6.q7","question":"¿Se analizan funciones críticas al arrancar?","reinforcement_ref":"R2"},
    {"id":"op.exp.6.q8","question":"¿Se ha implementado lista blanca de aplicaciones autorizadas?","reinforcement_ref":"R3"},
    {"id":"op.exp.6.q9","question":"¿Se ha desplegado solución EDR?","reinforcement_ref":"R4"}
  ]'
WHERE id = 'ens-2022-op-exp-6';

UPDATE versioned_controls SET
  title = 'Gestión de Incidentes',
  control_type = 'MEDIDA',
  control_group = 'op.exp',
  applicability_json = '{"basica":"aplica","media":"+R1+R2","alta":"+R1+R2+R3"}',
  reinforcements_json = '[
    {"id":"R1","description":"Soluciones de ventanilla única para notificación al CCN-CERT con distribución federada.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"},
    {"id":"R2","description":"Gestión integral completa de los incidentes.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"},
    {"id":"R3","description":"Recursos para configuración dinámica reactiva a ciberamenazas.","required_at":["ALTA"],"mode":"ADDITIVE"}
  ]',
  evaluated_aspects_json = '[
    {"id":"op.exp.7.q1","question":"¿Existe un proceso integral para tratar incidentes con impacto en seguridad?","reinforcement_ref":null},
    {"id":"op.exp.7.q2","question":"¿El proceso incluye informe de eventos, debilidades, clasificación y escalado?","reinforcement_ref":null},
    {"id":"op.exp.7.q3","question":"¿La gestión de incidentes con datos personales considera RGPD/LOPDGDD y RD 311/2022?","reinforcement_ref":null},
    {"id":"op.exp.7.q4","question":"¿Existen soluciones de ventanilla única para notificar al CCN-CERT con distribución federada?","reinforcement_ref":"R1"},
    {"id":"op.exp.7.q5","question":"¿La gestión integral de incidentes es completa?","reinforcement_ref":"R2"},
    {"id":"op.exp.7.q6","question":"¿Existen recursos para configuración dinámica frente a ciberamenazas?","reinforcement_ref":"R3"}
  ]'
WHERE id = 'ens-2022-op-exp-7';

UPDATE versioned_controls SET
  title = 'Registro de actividad',
  control_type = 'MEDIDA',
  control_group = 'op.exp',
  applicability_json = '{"basica":"aplica","media":"+R1+R2+R3+R4","alta":"+R1+R2+R3+R4+R5"}',
  reinforcements_json = '[
    {"id":"R1","description":"Gestión activa de los registros de actividad.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"},
    {"id":"R2","description":"Sincronización de relojes del sistema.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"},
    {"id":"R3","description":"Documentación de eventos auditados y tiempos de retención.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"},
    {"id":"R4","description":"Acceso, modificación y eliminación de registros únicamente por personal autorizado.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"},
    {"id":"R5","description":"Herramientas para apoyar la gestión de registros de actividad.","required_at":["ALTA"],"mode":"ADDITIVE"}
  ]',
  evaluated_aspects_json = '[
    {"id":"op.exp.8.q1","question":"¿Se registran eventos y actividades de usuarios y entidades?","reinforcement_ref":null},
    {"id":"op.exp.8.q2","question":"¿El registro incluye identificador, fecha, información, tipo y resultado del evento?","reinforcement_ref":null},
    {"id":"op.exp.8.q3","question":"¿Están activos los registros de actividad en los servidores?","reinforcement_ref":null},
    {"id":"op.exp.8.q4","question":"¿Se gestionan los registros de actividad?","reinforcement_ref":"R1"},
    {"id":"op.exp.8.q5","question":"¿Se sincronizan los relojes del sistema?","reinforcement_ref":"R2"},
    {"id":"op.exp.8.q6","question":"¿Se documentan eventos auditados y tiempos de retención?","reinforcement_ref":"R3"},
    {"id":"op.exp.8.q7","question":"¿Solo personal autorizado puede acceder, alterar o eliminar registros?","reinforcement_ref":"R4"},
    {"id":"op.exp.8.q8","question":"¿Se dispone de herramientas para apoyar la gestión de registros?","reinforcement_ref":"R5"}
  ]'
WHERE id = 'ens-2022-op-exp-8';

UPDATE versioned_controls SET
  title = 'Registro de Gestión de Incidentes',
  control_type = 'MEDIDA',
  control_group = 'op.exp',
  applicability_json = '{"basica":"aplica","media":"aplica","alta":"aplica"}',
  reinforcements_json = '[]',
  evaluated_aspects_json = '[
    {"id":"op.exp.9.q1","question":"¿Se extraen conclusiones y aprendizaje de los incidentes registrados?","reinforcement_ref":null},
    {"id":"op.exp.9.q2","question":"¿Se registran reportes iniciales, intermedios y finales, actuaciones y modificaciones derivadas?","reinforcement_ref":null},
    {"id":"op.exp.9.q3","question":"¿El aprendizaje se traduce en mejoras de seguridad?","reinforcement_ref":null},
    {"id":"op.exp.9.q4","question":"¿Se registran los incidentes indicando tipología concreta más allá de seguridad/no seguridad?","reinforcement_ref":null}
  ]'
WHERE id = 'ens-2022-op-exp-9';

UPDATE versioned_controls SET
  title = 'Protección de claves criptográficas',
  control_type = 'MEDIDA',
  control_group = 'op.exp',
  applicability_json = '{"basica":"aplica","media":"+R1","alta":"+R1"}',
  reinforcements_json = '[
    {"id":"R1","description":"Algoritmos y parámetros autorizados por el CCN para la generación de claves.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"}
  ]',
  evaluated_aspects_json = '[
    {"id":"op.exp.10.q1","question":"¿Se gestionan de forma segura las claves criptográficas?","reinforcement_ref":null},
    {"id":"op.exp.10.q2","question":"¿Se protegen durante todo su ciclo de vida?","reinforcement_ref":null},
    {"id":"op.exp.10.q3","question":"¿Se emplean algoritmos y parámetros autorizados por el CCN?","reinforcement_ref":"R1"}
  ]'
WHERE id = 'ens-2022-op-exp-10';

-- ── 7. Marco Operacional · Recursos Externos (op.ext.*) ─────

UPDATE versioned_controls SET
  title = 'Contratación y acuerdos de servicio',
  control_type = 'MEDIDA',
  control_group = 'op.ext',
  applicability_json = '{"basica":"n.a.","media":"aplica","alta":"aplica"}',
  reinforcements_json = '[]',
  evaluated_aspects_json = '[
    {"id":"op.ext.1.q1","question":"¿Se suscriben acuerdos de nivel de servicio con proveedores y se exige certificado ENS?","reinforcement_ref":null},
    {"id":"op.ext.1.q2","question":"¿Se establece contractualmente un ANS/SLA con servicio mínimo admisible y consecuencias por incumplimiento?","reinforcement_ref":null}
  ]'
WHERE id = 'ens-2022-op-ext-1';

UPDATE versioned_controls SET
  title = 'Gestión Diaria',
  control_type = 'MEDIDA',
  control_group = 'op.ext',
  applicability_json = '{"basica":"n.a.","media":"aplica","alta":"aplica"}',
  reinforcements_json = '[]',
  evaluated_aspects_json = '[
    {"id":"op.ext.2.q1","question":"¿Existen mecanismos de seguimiento, supervisión y reporte de incidencias del servicio?","reinforcement_ref":null}
  ]'
WHERE id = 'ens-2022-op-ext-2';

UPDATE versioned_controls SET
  title = 'Protección de Cadena de Suministro',
  control_type = 'MEDIDA',
  control_group = 'op.ext',
  applicability_json = '{"basica":"n.a.","media":"n.a.","alta":"aplica"}',
  reinforcements_json = '[]',
  evaluated_aspects_json = '[
    {"id":"op.ext.3.q1","question":"¿Se analizan los riesgos y se adoptan medidas frente a incidentes en la cadena de suministro?","reinforcement_ref":null}
  ]'
WHERE id = 'ens-2022-op-ext-3';

UPDATE versioned_controls SET
  title = 'Interconexión de sistemas',
  control_type = 'MEDIDA',
  control_group = 'op.ext',
  applicability_json = '{"basica":"n.a.","media":"aplica","alta":"aplica"}',
  reinforcements_json = '[]',
  evaluated_aspects_json = '[
    {"id":"op.ext.4.q1","question":"¿Se autorizan y documentan todas las interconexiones de sistemas?","reinforcement_ref":null}
  ]'
WHERE id = 'ens-2022-op-ext-4';

-- ── 8. Marco Operacional · Servicios en la Nube (op.nub.*) ──

UPDATE versioned_controls SET
  title = 'Protección de servicios en la nube',
  control_type = 'MEDIDA',
  control_group = 'op.nub',
  applicability_json = '{"basica":"aplica","media":"+R1","alta":"+R1+R2"}',
  reinforcements_json = '[
    {"id":"R1","description":"Servicios en la nube certificados.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"},
    {"id":"R2","description":"Configuración según Guía CCN-STIC específica para usuario y proveedor.","required_at":["ALTA"],"mode":"ADDITIVE"}
  ]',
  evaluated_aspects_json = '[
    {"id":"op.nub.1.q1","question":"¿Los sistemas que soportan servicios en la nube cumplen las medidas de seguridad pertinentes?","reinforcement_ref":null},
    {"id":"op.nub.1.q2","question":"¿Están certificados los servicios en la nube de terceros?","reinforcement_ref":"R1"},
    {"id":"op.nub.1.q3","question":"¿La configuración sigue la Guía CCN-STIC específica para usuario y proveedor?","reinforcement_ref":"R2"}
  ]'
WHERE id = 'ens-2022-op-nub-1';

-- ── 9. Marco Operacional · Continuidad de Servicio (op.cont.*) ─

UPDATE versioned_controls SET
  title = 'Análisis de Impacto',
  control_type = 'MEDIDA',
  control_group = 'op.cont',
  applicability_json = '{"basica":"n.a.","media":"aplica","alta":"aplica"}',
  reinforcements_json = '[]',
  evaluated_aspects_json = '[
    {"id":"op.cont.1.q1","question":"¿Se ha realizado un análisis de impacto (BIA) en los servicios en el ámbito del ENS?","reinforcement_ref":null}
  ]'
WHERE id = 'ens-2022-op-cont-1';

UPDATE versioned_controls SET
  title = 'Plan de Continuidad',
  control_type = 'MEDIDA',
  control_group = 'op.cont',
  applicability_json = '{"basica":"n.a.","media":"n.a.","alta":"aplica"}',
  reinforcements_json = '[]',
  evaluated_aspects_json = '[
    {"id":"op.cont.2.q1","question":"¿Existe un Plan de Continuidad documentado coherente con el BIA?","reinforcement_ref":null},
    {"id":"op.cont.2.q2","question":"¿El plan identifica funciones, responsabilidades y actividades a realizar?","reinforcement_ref":null}
  ]'
WHERE id = 'ens-2022-op-cont-2';

UPDATE versioned_controls SET
  title = 'Pruebas Periódicas',
  control_type = 'MEDIDA',
  control_group = 'op.cont',
  applicability_json = '{"basica":"n.a.","media":"n.a.","alta":"aplica"}',
  reinforcements_json = '[]',
  evaluated_aspects_json = '[
    {"id":"op.cont.3.q1","question":"¿Se realizan pruebas periódicas del Plan de Continuidad?","reinforcement_ref":null},
    {"id":"op.cont.3.q2","question":"¿Se elabora informe tras la prueba con aspectos a mejorar y alineamiento con BIAs?","reinforcement_ref":null}
  ]'
WHERE id = 'ens-2022-op-cont-3';

UPDATE versioned_controls SET
  title = 'Medios Alternativos',
  control_type = 'MEDIDA',
  control_group = 'op.cont',
  applicability_json = '{"basica":"n.a.","media":"n.a.","alta":"aplica"}',
  reinforcements_json = '[]',
  evaluated_aspects_json = '[
    {"id":"op.cont.4.q1","question":"¿Existen medios alternativos para mantener el servicio cuando los habituales no están disponibles?","reinforcement_ref":null}
  ]'
WHERE id = 'ens-2022-op-cont-4';

-- ── 10. Marco Operacional · Monitorización (op.mon.*) ───────

UPDATE versioned_controls SET
  title = 'Detección de Intrusión',
  control_type = 'MEDIDA',
  control_group = 'op.mon',
  applicability_json = '{"basica":"aplica","media":"+R1","alta":"+R1+R2"}',
  reinforcements_json = '[
    {"id":"R1","description":"Herramientas de detección/prevención de intrusiones basadas en reglas.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"},
    {"id":"R2","description":"Procedimientos de respuesta a alertas IDS/IPS.","required_at":["ALTA"],"mode":"ADDITIVE"}
  ]',
  evaluated_aspects_json = '[
    {"id":"op.mon.1.q1","question":"¿Existen herramientas de detección/prevención de intrusiones (IDS/IPS)?","reinforcement_ref":null},
    {"id":"op.mon.1.q2","question":"¿Se analiza el tráfico de red y se muestran eventos de seguridad ante intrusiones?","reinforcement_ref":null},
    {"id":"op.mon.1.q3","question":"¿IDS/IPS están basados en reglas?","reinforcement_ref":"R1"},
    {"id":"op.mon.1.q4","question":"¿Existen procedimientos de respuesta a las alertas?","reinforcement_ref":"R2"}
  ]'
WHERE id = 'ens-2022-op-mon-1';

UPDATE versioned_controls SET
  title = 'Sistema de Métricas',
  control_type = 'MEDIDA',
  control_group = 'op.mon',
  applicability_json = '{"basica":"aplica","media":"+R1+R2","alta":"+R1+R2"}',
  reinforcements_json = '[
    {"id":"R1","description":"Evaluación del comportamiento del sistema de gestión de incidentes.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"},
    {"id":"R2","description":"Evaluación de la eficiencia del sistema de gestión de la seguridad.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"}
  ]',
  evaluated_aspects_json = '[
    {"id":"op.mon.2.q1","question":"¿Se recopilan datos del grado de implementación de medidas para informe INES (art. 32)?","reinforcement_ref":null},
    {"id":"op.mon.2.q2","question":"¿Se evalúa el comportamiento del sistema de gestión de incidentes?","reinforcement_ref":"R1"},
    {"id":"op.mon.2.q3","question":"¿Se evalúa la eficiencia del sistema de gestión de la seguridad?","reinforcement_ref":"R2"}
  ]'
WHERE id = 'ens-2022-op-mon-2';

UPDATE versioned_controls SET
  title = 'Vigilancia',
  control_type = 'MEDIDA',
  control_group = 'op.mon',
  applicability_json = '{"basica":"aplica","media":"+R1+R2","alta":"+R1+R2+R3+R4+R5+R6"}',
  reinforcements_json = '[
    {"id":"R1","description":"Sistema de correlación de eventos.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"},
    {"id":"R2","description":"Análisis dinámico de vulnerabilidades.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"},
    {"id":"R3","description":"Sistemas de detección de amenazas avanzadas.","required_at":["ALTA"],"mode":"ADDITIVE"},
    {"id":"R4","description":"Observatorios de cibervigilancia propios o contratados.","required_at":["ALTA"],"mode":"ADDITIVE"},
    {"id":"R5","description":"Medidas frente a la minería de datos.","required_at":["ALTA"],"mode":"ADDITIVE"},
    {"id":"R6","description":"Inspecciones y auditorías técnicas periódicas o tras incidente.","required_at":["ALTA"],"mode":"ADDITIVE"}
  ]',
  evaluated_aspects_json = '[
    {"id":"op.mon.3.q1","question":"¿Existe un sistema automático de recolección de eventos de seguridad (p.ej. syslog)?","reinforcement_ref":null},
    {"id":"op.mon.3.q2","question":"¿Existe un sistema de correlación de eventos?","reinforcement_ref":"R1"},
    {"id":"op.mon.3.q3","question":"¿Existe análisis dinámico de vulnerabilidades?","reinforcement_ref":"R2"},
    {"id":"op.mon.3.q4","question":"¿Existen sistemas para detección de amenazas avanzadas?","reinforcement_ref":"R3"},
    {"id":"op.mon.3.q5","question":"¿Existen observatorios de cibervigilancia?","reinforcement_ref":"R4"},
    {"id":"op.mon.3.q6","question":"¿Existen medidas frente a la minería de datos?","reinforcement_ref":"R5"},
    {"id":"op.mon.3.q7","question":"¿Se realizan inspecciones y auditorías técnicas periódicas o tras incidente?","reinforcement_ref":"R6"}
  ]'
WHERE id = 'ens-2022-op-mon-3';

-- ── 11. Medidas de Protección · Instalaciones (mp.if.*) ─────

UPDATE versioned_controls SET
  title = 'Áreas separadas y con control de acceso',
  control_type = 'MEDIDA',
  control_group = 'mp.if',
  applicability_json = '{"basica":"aplica","media":"aplica","alta":"aplica"}',
  reinforcements_json = '[]',
  evaluated_aspects_json = '[
    {"id":"mp.if.1.q1","question":"¿El equipamiento se instala en áreas con medidas de seguridad adecuadas (CPD/sala técnica)?","reinforcement_ref":null},
    {"id":"mp.if.1.q2","question":"¿Solo se accede al CPD/sala técnica por las entradas previstas?","reinforcement_ref":null},
    {"id":"mp.if.1.q3","question":"¿Existen mecanismos para restringir el acceso solo a personal autorizado?","reinforcement_ref":null}
  ]'
WHERE id = 'ens-2022-mp-if-1';

UPDATE versioned_controls SET
  title = 'Identificación de las personas',
  control_type = 'MEDIDA',
  control_group = 'mp.if',
  applicability_json = '{"basica":"aplica","media":"aplica","alta":"aplica"}',
  reinforcements_json = '[]',
  evaluated_aspects_json = '[
    {"id":"mp.if.2.q1","question":"¿Existe sistemática de control de acceso al CPD?","reinforcement_ref":null},
    {"id":"mp.if.2.q2","question":"¿El sistema identifica a las personas y registra entradas/salidas en el CPD?","reinforcement_ref":null}
  ]'
WHERE id = 'ens-2022-mp-if-2';

UPDATE versioned_controls SET
  title = 'Acondicionamiento de los locales',
  control_type = 'MEDIDA',
  control_group = 'mp.if',
  applicability_json = '{"basica":"aplica","media":"aplica","alta":"aplica"}',
  reinforcements_json = '[]',
  evaluated_aspects_json = '[
    {"id":"mp.if.3.q1","question":"¿Se acondicionan y controlan ambientalmente los locales y el cableado?","reinforcement_ref":null},
    {"id":"mp.if.3.q2","question":"¿Se controlan temperatura y humedad para asegurar el funcionamiento del equipamiento?","reinforcement_ref":null},
    {"id":"mp.if.3.q3","question":"¿Está protegido eficazmente el cableado frente a incidentes fortuitos o deliberados?","reinforcement_ref":null}
  ]'
WHERE id = 'ens-2022-mp-if-3';

UPDATE versioned_controls SET
  title = 'Energía Eléctrica',
  control_type = 'MEDIDA',
  control_group = 'mp.if',
  applicability_json = '{"basica":"aplica","media":"+R1","alta":"+R1"}',
  reinforcements_json = '[
    {"id":"R1","description":"Garantía del suministro durante el tiempo requerido por el BIA y pruebas de carga del grupo electrógeno.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"}
  ]',
  evaluated_aspects_json = '[
    {"id":"mp.if.4.q1","question":"¿Los locales disponen de tomas eléctricas adecuadas y luces de emergencia?","reinforcement_ref":null},
    {"id":"mp.if.4.q2","question":"En caso de fallo, ¿se garantiza el abastecimiento eléctrico durante el tiempo requerido y se realizan pruebas de los grupos electrógenos?","reinforcement_ref":"R1"}
  ]'
WHERE id = 'ens-2022-mp-if-4';

UPDATE versioned_controls SET
  title = 'Protección frente a incendios',
  control_type = 'MEDIDA',
  control_group = 'mp.if',
  applicability_json = '{"basica":"aplica","media":"aplica","alta":"aplica"}',
  reinforcements_json = '[]',
  evaluated_aspects_json = '[
    {"id":"mp.if.5.q1","question":"¿Los locales están protegidos frente a incendios según normativa industrial?","reinforcement_ref":null},
    {"id":"mp.if.5.q2","question":"¿Existen sistemas de detección de incendios?","reinforcement_ref":null},
    {"id":"mp.if.5.q3","question":"¿Existen sistemas (manuales o automáticos) de extinción?","reinforcement_ref":null},
    {"id":"mp.if.5.q4","question":"¿Los sistemas de detección/extinción tienen contrato de mantenimiento con revisiones periódicas?","reinforcement_ref":null}
  ]'
WHERE id = 'ens-2022-mp-if-5';

UPDATE versioned_controls SET
  title = 'Protección frente a inundaciones',
  control_type = 'MEDIDA',
  control_group = 'mp.if',
  applicability_json = '{"basica":"n.a.","media":"aplica","alta":"aplica"}',
  reinforcements_json = '[]',
  evaluated_aspects_json = '[
    {"id":"mp.if.6.q1","question":"¿Los locales están protegidos frente a incidentes causados por agua?","reinforcement_ref":null}
  ]'
WHERE id = 'ens-2022-mp-if-6';

UPDATE versioned_controls SET
  title = 'Entrada y salida de equipamiento',
  control_type = 'MEDIDA',
  control_group = 'mp.if',
  applicability_json = '{"basica":"aplica","media":"aplica","alta":"aplica"}',
  reinforcements_json = '[]',
  evaluated_aspects_json = '[
    {"id":"mp.if.7.q1","question":"¿Existe registro pormenorizado de entrada/salida de equipamiento esencial con identificación de quien autoriza?","reinforcement_ref":null},
    {"id":"mp.if.7.q2","question":"¿El registro incluye todo hardware esencial que entra y sale del CPD/salas técnicas?","reinforcement_ref":null}
  ]'
WHERE id = 'ens-2022-mp-if-7';

-- ── 12. Medidas de Protección · Personal (mp.per.*) ─────────

UPDATE versioned_controls SET
  title = 'Caracterización del puesto de trabajo',
  control_type = 'MEDIDA',
  control_group = 'mp.per',
  applicability_json = '{"basica":"n.a.","media":"aplica","alta":"aplica"}',
  reinforcements_json = '[]',
  evaluated_aspects_json = '[
    {"id":"mp.per.1.q1","question":"¿Cada puesto de trabajo relacionado con el ENS define responsabilidades en materia de seguridad?","reinforcement_ref":null}
  ]'
WHERE id = 'ens-2022-mp-per-1';

UPDATE versioned_controls SET
  title = 'Deberes y Obligaciones',
  control_type = 'MEDIDA',
  control_group = 'mp.per',
  applicability_json = '{"basica":"aplica","media":"+R1","alta":"+R1"}',
  reinforcements_json = '[
    {"id":"R1","description":"Confirmación expresa del usuario de conocer las instrucciones de seguridad.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"}
  ]',
  evaluated_aspects_json = '[
    {"id":"mp.per.2.q1","question":"¿Se definen e informan a cada persona los deberes y responsabilidades de seguridad?","reinforcement_ref":null},
    {"id":"mp.per.2.q2","question":"¿Las obligaciones cubren el periodo durante y después del puesto?","reinforcement_ref":null},
    {"id":"mp.per.2.q3","question":"¿Se informa de las medidas disciplinarias por incumplimiento?","reinforcement_ref":null},
    {"id":"mp.per.2.q4","question":"¿Se suscriben cláusulas de confidencialidad con empleados (incluida información de clientes en sector privado)?","reinforcement_ref":null},
    {"id":"mp.per.2.q5","question":"¿Se suscriben acuerdos de confidencialidad con organizaciones que prestan servicios?","reinforcement_ref":null},
    {"id":"mp.per.2.q6","question":"¿Se obtiene confirmación expresa de que los usuarios conocen las instrucciones?","reinforcement_ref":"R1"}
  ]'
WHERE id = 'ens-2022-mp-per-2';

UPDATE versioned_controls SET
  title = 'Concienciación',
  control_type = 'MEDIDA',
  control_group = 'mp.per',
  applicability_json = '{"basica":"aplica","media":"aplica","alta":"aplica"}',
  reinforcements_json = '[]',
  evaluated_aspects_json = '[
    {"id":"mp.per.3.q1","question":"¿Se realizan acciones regulares de concienciación al personal?","reinforcement_ref":null},
    {"id":"mp.per.3.q2","question":"¿Se recuerda buen uso de equipos y técnicas de ingeniería social?","reinforcement_ref":null},
    {"id":"mp.per.3.q3","question":"¿Se recuerda la identificación y notificación de incidentes/comportamientos sospechosos?","reinforcement_ref":null},
    {"id":"mp.per.3.q4","question":"¿Se recuerda el procedimiento para informar de incidentes (reales o falsas alarmas)?","reinforcement_ref":null}
  ]'
WHERE id = 'ens-2022-mp-per-3';

UPDATE versioned_controls SET
  title = 'Formación',
  control_type = 'MEDIDA',
  control_group = 'mp.per',
  applicability_json = '{"basica":"aplica","media":"aplica","alta":"aplica"}',
  reinforcements_json = '[]',
  evaluated_aspects_json = '[
    {"id":"mp.per.4.q1","question":"¿Se forma regularmente al personal en materias de seguridad relevantes para sus funciones?","reinforcement_ref":null},
    {"id":"mp.per.4.q2","question":"¿Existe Plan de Formación general con acciones de seguridad y registro de impartidas/planificadas?","reinforcement_ref":null},
    {"id":"mp.per.4.q3","question":"¿Se diferencia formación general, directiva, técnica y de responsables de seguridad?","reinforcement_ref":null}
  ]'
WHERE id = 'ens-2022-mp-per-4';

-- ── 13. Medidas de Protección · Equipos (mp.eq.*) ───────────

UPDATE versioned_controls SET
  title = 'Puestos de trabajo despejado',
  control_type = 'MEDIDA',
  control_group = 'mp.eq',
  applicability_json = '{"basica":"aplica","media":"+R1","alta":"+R1"}',
  reinforcements_json = '[
    {"id":"R1","description":"Material almacenado en lugar cerrado tras su uso siempre que sea factible.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"}
  ]',
  evaluated_aspects_json = '[
    {"id":"mp.eq.1.q1","question":"¿Los puestos de trabajo permanecen despejados de material innecesario?","reinforcement_ref":null},
    {"id":"mp.eq.1.q2","question":"Tras su uso, ¿el material se almacena en lugar cerrado?","reinforcement_ref":"R1"}
  ]'
WHERE id = 'ens-2022-mp-eq-1';

UPDATE versioned_controls SET
  title = 'Bloqueo de puestos de trabajo',
  control_type = 'MEDIDA',
  control_group = 'mp.eq',
  applicability_json = '{"basica":"n.a.","media":"+R1","alta":"+R1+R2"}',
  reinforcements_json = '[
    {"id":"R1","description":"Bloqueo automático tras inactividad y nueva autenticación para reanudar.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"},
    {"id":"R2","description":"Cancelación de todas las sesiones abiertas tras tiempo superior al de bloqueo.","required_at":["ALTA"],"mode":"ADDITIVE"}
  ]',
  evaluated_aspects_json = '[
    {"id":"mp.eq.2.q1","question":"¿El puesto se bloquea tras inactividad y requiere reautenticación?","reinforcement_ref":"R1"},
    {"id":"mp.eq.2.q2","question":"¿Se cancelan todas las sesiones abiertas tras un tiempo superior al de bloqueo?","reinforcement_ref":"R2"}
  ]'
WHERE id = 'ens-2022-mp-eq-2';

UPDATE versioned_controls SET
  title = 'Protección de dispositivos portátiles',
  control_type = 'MEDIDA',
  control_group = 'mp.eq',
  applicability_json = '{"basica":"aplica","media":"+R1","alta":"+R1+R2"}',
  reinforcements_json = '[
    {"id":"R1","description":"Cifrado de disco para nivel MEDIO de confidencialidad.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"},
    {"id":"R2","description":"Uso restringido a entornos protegidos cuando salen de la organización.","required_at":["ALTA"],"mode":"ADDITIVE"}
  ]',
  evaluated_aspects_json = '[
    {"id":"mp.eq.3.q1","question":"¿Se adoptan medidas para proteger los portátiles, especialmente fuera del perímetro físico?","reinforcement_ref":null},
    {"id":"mp.eq.3.q2","question":"¿Se cifra el disco cuando la confidencialidad es de nivel MEDIO?","reinforcement_ref":"R1"},
    {"id":"mp.eq.3.q3","question":"¿El uso fuera de la organización se restringe a entornos protegidos?","reinforcement_ref":"R2"}
  ]'
WHERE id = 'ens-2022-mp-eq-3';

UPDATE versioned_controls SET
  title = 'Otros equipos conectados a la red',
  control_type = 'MEDIDA',
  control_group = 'mp.eq',
  applicability_json = '{"basica":"aplica","media":"+R1","alta":"+R1"}',
  reinforcements_json = '[
    {"id":"R1","description":"Productos/servicios certificados según op.pl.5.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"}
  ]',
  evaluated_aspects_json = '[
    {"id":"mp.eq.4.q1","question":"¿Se controlan los dispositivos en el sistema, en flujo de información y almacenamiento?","reinforcement_ref":null},
    {"id":"mp.eq.4.q2","question":"¿Los dispositivos tienen configuración de seguridad adecuada para controlar entrada/salida de información?","reinforcement_ref":null},
    {"id":"mp.eq.4.q3","question":"¿Se emplean productos/servicios certificados según op.pl.5?","reinforcement_ref":"R1"}
  ]'
WHERE id = 'ens-2022-mp-eq-4';

-- ── 14. Medidas de Protección · Comunicaciones (mp.com.*) ───

UPDATE versioned_controls SET
  title = 'Perímetro seguro',
  control_type = 'MEDIDA',
  control_group = 'mp.com',
  applicability_json = '{"basica":"aplica","media":"aplica","alta":"aplica"}',
  reinforcements_json = '[]',
  evaluated_aspects_json = '[
    {"id":"mp.com.1.q1","question":"¿Existe un sistema que asegure el perímetro lógico?","reinforcement_ref":null},
    {"id":"mp.com.1.q2","question":"¿Existe protección perimetral que separa la red interna del exterior?","reinforcement_ref":null},
    {"id":"mp.com.1.q3","question":"En caso de varias sedes/CPDs, ¿todas tienen protección perimetral?","reinforcement_ref":null},
    {"id":"mp.com.1.q4","question":"¿Todo el tráfico atraviesa el sistema de protección sin excepción?","reinforcement_ref":null}
  ]'
WHERE id = 'ens-2022-mp-com-1';

UPDATE versioned_controls SET
  title = 'Protección de la confidencialidad',
  control_type = 'MEDIDA',
  control_group = 'mp.com',
  applicability_json = '{"basica":"aplica","media":"+R1","alta":"+R1+R2+R3+R4"}',
  reinforcements_json = '[
    {"id":"R1","description":"Algoritmos y parámetros autorizados por el CCN para cifrar comunicaciones externas.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"},
    {"id":"R2","description":"VPN con garantías adicionales.","required_at":["ALTA"],"mode":"ADDITIVE"},
    {"id":"R3","description":"Dispositivos hardware en establecimiento y uso de la VPN.","required_at":["ALTA"],"mode":"ADDITIVE"},
    {"id":"R4","description":"Productos/servicios certificados según op.pl.5 para la VPN.","required_at":["ALTA"],"mode":"ADDITIVE"}
  ]',
  evaluated_aspects_json = '[
    {"id":"mp.com.2.q1","question":"¿Se emplean VPN cuando la comunicación discurre por redes fuera del dominio de seguridad?","reinforcement_ref":null},
    {"id":"mp.com.2.q2","question":"¿Se emplean algoritmos y parámetros autorizados por el CCN para cifrar comunicaciones externas?","reinforcement_ref":"R1"},
    {"id":"mp.com.2.q3","question":"¿La VPN cuenta con garantías adicionales?","reinforcement_ref":"R2"},
    {"id":"mp.com.2.q4","question":"¿Se emplean dispositivos hardware para la VPN?","reinforcement_ref":"R3"},
    {"id":"mp.com.2.q5","question":"¿Se utilizan productos/servicios certificados según op.pl.5 para la VPN?","reinforcement_ref":"R4"}
  ]'
WHERE id = 'ens-2022-mp-com-2';

UPDATE versioned_controls SET
  title = 'Protección de la integridad y la autenticidad',
  control_type = 'MEDIDA',
  control_group = 'mp.com',
  applicability_json = '{"basica":"aplica","media":"+R1+R2","alta":"+R1+R2+R3+R4"}',
  reinforcements_json = '[
    {"id":"R1","description":"Comunicaciones protegidas mediante VPN.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"},
    {"id":"R2","description":"Algoritmos y parámetros autorizados por el CCN.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"},
    {"id":"R3","description":"Dispositivos hardware en VPN.","required_at":["ALTA"],"mode":"ADDITIVE"},
    {"id":"R4","description":"Productos/servicios certificados según op.pl.5.","required_at":["ALTA"],"mode":"ADDITIVE"}
  ]',
  evaluated_aspects_json = '[
    {"id":"mp.com.3.q1","question":"¿Existen mecanismos para garantizar autenticidad e integridad de comunicaciones externas?","reinforcement_ref":null},
    {"id":"mp.com.3.q2","question":"¿Se asegura la autenticidad del otro extremo antes de intercambiar información?","reinforcement_ref":null},
    {"id":"mp.com.3.q3","question":"¿Se previenen ataques activos con activación de procedimientos?","reinforcement_ref":null},
    {"id":"mp.com.3.q4","question":"¿Se protegen las comunicaciones mediante VPN?","reinforcement_ref":"R1"},
    {"id":"mp.com.3.q5","question":"¿Se emplean algoritmos y parámetros autorizados por el CCN?","reinforcement_ref":"R2"},
    {"id":"mp.com.3.q6","question":"¿Se emplean dispositivos hardware en la VPN?","reinforcement_ref":"R3"},
    {"id":"mp.com.3.q7","question":"¿Se emplean productos/servicios certificados según op.pl.5?","reinforcement_ref":"R4"}
  ]'
WHERE id = 'ens-2022-mp-com-3';

UPDATE versioned_controls SET
  title = 'Separación de Flujos de información en red',
  control_type = 'MEDIDA',
  control_group = 'mp.com',
  applicability_json = '{"basica":"n.a.","media":"+[R1 o R2 o R3]","alta":"+[R2 o R3]+R4"}',
  reinforcements_json = '[
    {"id":"R1","description":"Al menos 3 segmentos de red mediante VLAN.","required_at":["MEDIA"],"mode":"EXCLUSIVE_OR"},
    {"id":"R2","description":"Segmentos de red implementados mediante VPN.","required_at":["MEDIA","ALTA"],"mode":"EXCLUSIVE_OR"},
    {"id":"R3","description":"Segmentos con medios físicos separados.","required_at":["MEDIA","ALTA"],"mode":"EXCLUSIVE_OR"},
    {"id":"R4","description":"Controles de entrada a los segmentos y monitorización.","required_at":["ALTA"],"mode":"ADDITIVE"}
  ]',
  evaluated_aspects_json = '[
    {"id":"mp.com.4.q1","question":"¿Se ha segmentado la red, segregando el tráfico?","reinforcement_ref":null},
    {"id":"mp.com.4.q2","question":"¿Existen al menos 3 segmentos de red mediante VLAN?","reinforcement_ref":"R1"},
    {"id":"mp.com.4.q3","question":"¿Los segmentos se han implementado mediante VPN?","reinforcement_ref":"R2"},
    {"id":"mp.com.4.q4","question":"¿Los segmentos se han implementado con medios físicos separados?","reinforcement_ref":"R3"},
    {"id":"mp.com.4.q5","question":"¿Existen controles de entrada a los segmentos y monitorización?","reinforcement_ref":"R4"}
  ]'
WHERE id = 'ens-2022-mp-com-4';

-- ── 15. Medidas de Protección · Soportes (mp.si.*) ──────────

UPDATE versioned_controls SET
  title = 'Marcado de soporte',
  control_type = 'MEDIDA',
  control_group = 'mp.si',
  applicability_json = '{"basica":"n.a.","media":"aplica","alta":"aplica"}',
  reinforcements_json = '[]',
  evaluated_aspects_json = '[
    {"id":"mp.si.1.q1","question":"¿Se identifican los soportes con el nivel de seguridad de la información contenida?","reinforcement_ref":null},
    {"id":"mp.si.1.q2","question":"¿Se indica en documentos y registros del SGSI el nivel de calificación?","reinforcement_ref":null},
    {"id":"mp.si.1.q3","question":"¿Existe norma o instrucciones sobre cómo valorar y calificar la información?","reinforcement_ref":null}
  ]'
WHERE id = 'ens-2022-mp-si-1';

UPDATE versioned_controls SET
  title = 'Criptografía',
  control_type = 'MEDIDA',
  control_group = 'mp.si',
  applicability_json = '{"basica":"n.a.","media":"aplica","alta":"+R1+R2"}',
  reinforcements_json = '[
    {"id":"R1","description":"Productos certificados según op.pl.5.","required_at":["ALTA"],"mode":"ADDITIVE"},
    {"id":"R2","description":"Copias de seguridad cifradas con algoritmos autorizados por el CCN.","required_at":["ALTA"],"mode":"ADDITIVE"}
  ]',
  evaluated_aspects_json = '[
    {"id":"mp.si.2.q1","question":"¿Se emplea criptografía para proteger dispositivos removibles?","reinforcement_ref":null},
    {"id":"mp.si.2.q2","question":"¿Se emplean productos certificados conforme a op.pl.5?","reinforcement_ref":"R1"},
    {"id":"mp.si.2.q3","question":"¿Las copias de seguridad se cifran con algoritmos autorizados por el CCN?","reinforcement_ref":"R2"}
  ]'
WHERE id = 'ens-2022-mp-si-2';

UPDATE versioned_controls SET
  title = 'Custodia',
  control_type = 'MEDIDA',
  control_group = 'mp.si',
  applicability_json = '{"basica":"aplica","media":"aplica","alta":"aplica"}',
  reinforcements_json = '[]',
  evaluated_aspects_json = '[
    {"id":"mp.si.3.q1","question":"¿Se garantiza la seguridad en la custodia de los soportes de información?","reinforcement_ref":null},
    {"id":"mp.si.3.q2","question":"¿Se aplica diligencia y control físico/lógico a los soportes (fijos y extraíbles)?","reinforcement_ref":null}
  ]'
WHERE id = 'ens-2022-mp-si-3';

UPDATE versioned_controls SET
  title = 'Transporte',
  control_type = 'MEDIDA',
  control_group = 'mp.si',
  applicability_json = '{"basica":"aplica","media":"aplica","alta":"aplica"}',
  reinforcements_json = '[]',
  evaluated_aspects_json = '[
    {"id":"mp.si.4.q1","question":"¿Se garantiza la seguridad en el transporte de los soportes de información?","reinforcement_ref":null},
    {"id":"mp.si.4.q2","question":"¿Existe registro de entrada/salida que identifica al transportista?","reinforcement_ref":null}
  ]'
WHERE id = 'ens-2022-mp-si-4';

UPDATE versioned_controls SET
  title = 'Borrado y Destrucción',
  control_type = 'MEDIDA',
  control_group = 'mp.si',
  applicability_json = '{"basica":"aplica","media":"+R1","alta":"+R1"}',
  reinforcements_json = '[
    {"id":"R1","description":"Productos/servicios certificados conforme a op.pl.5.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"}
  ]',
  evaluated_aspects_json = '[
    {"id":"mp.si.5.q1","question":"¿Se garantiza el borrado seguro o destrucción tras el uso?","reinforcement_ref":null},
    {"id":"mp.si.5.q2","question":"¿Los soportes reutilizados son objeto de borrado seguro irrecuperable?","reinforcement_ref":null},
    {"id":"mp.si.5.q3","question":"¿Se emplean productos/servicios certificados según op.pl.5?","reinforcement_ref":"R1"}
  ]'
WHERE id = 'ens-2022-mp-si-5';

-- ── 16. Medidas de Protección · Software (mp.sw.*) ──────────

UPDATE versioned_controls SET
  title = 'Desarrollo de aplicaciones',
  control_type = 'MEDIDA',
  control_group = 'mp.sw',
  applicability_json = '{"basica":"aplica","media":"+R1+R2+R3+R4","alta":"+R1+R2+R3+R4"}',
  reinforcements_json = '[
    {"id":"R1","description":"Principio de mínimo privilegio en aplicaciones.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"},
    {"id":"R2","description":"Metodología de desarrollo seguro reconocida.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"},
    {"id":"R3","description":"Aspectos de seguridad integrados en el diseño.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"},
    {"id":"R4","description":"Datos reales de pruebas asegurados, evitando su uso cuando sea posible.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"}
  ]',
  evaluated_aspects_json = '[
    {"id":"mp.sw.1.q1","question":"¿Está separado el entorno de desarrollo del de producción a todos los efectos?","reinforcement_ref":null},
    {"id":"mp.sw.1.q2","question":"¿Las aplicaciones se desarrollan respetando el principio de mínimo privilegio?","reinforcement_ref":"R1"},
    {"id":"mp.sw.1.q3","question":"¿Se aplica una metodología de desarrollo seguro reconocida?","reinforcement_ref":"R2"},
    {"id":"mp.sw.1.q4","question":"¿La seguridad es parte integral del diseño del sistema?","reinforcement_ref":"R3"},
    {"id":"mp.sw.1.q5","question":"¿Los datos reales de pruebas están asegurados y se evita su uso?","reinforcement_ref":"R4"}
  ]'
WHERE id = 'ens-2022-mp-sw-1';

UPDATE versioned_controls SET
  title = 'Aceptación y puesta en servicio',
  control_type = 'MEDIDA',
  control_group = 'mp.sw',
  applicability_json = '{"basica":"aplica","media":"+R1","alta":"+R1"}',
  reinforcements_json = '[
    {"id":"R1","description":"Pruebas en entorno aislado de preproducción.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"}
  ]',
  evaluated_aspects_json = '[
    {"id":"mp.sw.2.q1","question":"Antes de pasar a producción, ¿se comprueba el correcto funcionamiento y los aspectos de seguridad?","reinforcement_ref":null},
    {"id":"mp.sw.2.q2","question":"¿Se comprueban los criterios de aceptación en seguridad antes del paso a producción?","reinforcement_ref":null},
    {"id":"mp.sw.2.q3","question":"En aplicaciones externas on-premise, ¿el proveedor aporta evidencias de seguridad?","reinforcement_ref":null},
    {"id":"mp.sw.2.q4","question":"¿El proveedor entrega Guía de instalación y configuración segura para administradores?","reinforcement_ref":null},
    {"id":"mp.sw.2.q5","question":"¿El proveedor entrega Guía de uso seguro del sistema para usuarios?","reinforcement_ref":null},
    {"id":"mp.sw.2.q6","question":"¿Se realizan las pruebas en un entorno aislado de preproducción?","reinforcement_ref":"R1"}
  ]'
WHERE id = 'ens-2022-mp-sw-2';

-- ── 17. Medidas de Protección · Información (mp.info.*) ─────

UPDATE versioned_controls SET
  title = 'Datos personales',
  control_type = 'MEDIDA',
  control_group = 'mp.info',
  applicability_json = '{"basica":"aplica","media":"aplica","alta":"aplica"}',
  reinforcements_json = '[]',
  evaluated_aspects_json = '[
    {"id":"mp.info.1.q1","question":"¿El Responsable de Seguridad recoge los requisitos de protección de datos asesorado por el DPD?","reinforcement_ref":null},
    {"id":"mp.info.1.q2","question":"En su caso, ¿se ha designado un DPD y se ha notificado a la AEPD?","reinforcement_ref":null},
    {"id":"mp.info.1.q3","question":"¿Existe un registro de actividades de tratamiento (RAT) que distingue responsable/encargado?","reinforcement_ref":null},
    {"id":"mp.info.1.q4","question":"¿Los procedimientos de incidentes contemplan brechas y aviso a la AEPD/interesados?","reinforcement_ref":null}
  ]'
WHERE id = 'ens-2022-mp-info-1';

UPDATE versioned_controls SET
  title = 'Calificación de la información',
  control_type = 'MEDIDA',
  control_group = 'mp.info',
  applicability_json = '{"basica":"n.a.","media":"aplica","alta":"aplica"}',
  reinforcements_json = '[]',
  evaluated_aspects_json = '[
    {"id":"mp.info.2.q1","question":"¿Existen criterios de calificación/clasificación de la información alineados con los requisitos de seguridad?","reinforcement_ref":null},
    {"id":"mp.info.2.q2","question":"¿Existe escala de calificación (USO OFICIAL, SECRETO, RESERVADO, CONFIDENCIAL, DIFUSIÓN LIMITADA…)?","reinforcement_ref":null},
    {"id":"mp.info.2.q3","question":"¿Existe ámbito de distribución (pública, uso interno, restringida…)?","reinforcement_ref":null},
    {"id":"mp.info.2.q4","question":"¿Existen medidas específicas según nivel/calificación?","reinforcement_ref":null}
  ]'
WHERE id = 'ens-2022-mp-info-2';

UPDATE versioned_controls SET
  title = 'Firma electrónica',
  control_type = 'MEDIDA',
  control_group = 'mp.info',
  applicability_json = '{"basica":"aplica","media":"+R1+R2+R3","alta":"+R1+R2+R3+R4+R5"}',
  reinforcements_json = '[
    {"id":"R1","description":"Firma electrónica avanzada basada en certificados cualificados.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"},
    {"id":"R2","description":"Algoritmos y parámetros de cifrado autorizados por el CCN o esquema nacional/europeo.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"},
    {"id":"R3","description":"Verificación y validación de la firma durante el tiempo requerido.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"},
    {"id":"R4","description":"Firma avanzada con certificados cualificados complementada por segundo factor.","required_at":["ALTA"],"mode":"ADDITIVE"},
    {"id":"R5","description":"Firma cualificada con productos certificados según op.pl.5.","required_at":["ALTA"],"mode":"ADDITIVE"}
  ]',
  evaluated_aspects_json = '[
    {"id":"mp.info.3.q1","question":"¿Se emplea un tipo de firma electrónica previsto en el ordenamiento jurídico?","reinforcement_ref":null},
    {"id":"mp.info.3.q2","question":"En AAPP, ¿se utilizan procedimientos de Ley 39/2015, 40/2015 y Ley 6/2020?","reinforcement_ref":null},
    {"id":"mp.info.3.q3","question":"En proveedores AAPP, ¿se emplean certificados reconocidos/cualificados para los servicios prestados?","reinforcement_ref":null},
    {"id":"mp.info.3.q4","question":"¿Las firmas avanzadas basadas en certificados son cualificadas?","reinforcement_ref":"R1"},
    {"id":"mp.info.3.q5","question":"¿Los algoritmos y parámetros están autorizados por el CCN o esquema nacional/europeo?","reinforcement_ref":"R2"},
    {"id":"mp.info.3.q6","question":"¿Se garantiza verificación y validación de firma durante el tiempo requerido?","reinforcement_ref":"R3"},
    {"id":"mp.info.3.q7","question":"¿Se usa firma avanzada con certificados cualificados complementada con segundo factor?","reinforcement_ref":"R4"},
    {"id":"mp.info.3.q8","question":"¿Se usa firma cualificada con productos certificados según op.pl.5?","reinforcement_ref":"R5"}
  ]'
WHERE id = 'ens-2022-mp-info-3';

UPDATE versioned_controls SET
  title = 'Sellos del tiempo',
  control_type = 'MEDIDA',
  control_group = 'mp.info',
  applicability_json = '{"basica":"n.a.","media":"n.a.","alta":"aplica"}',
  reinforcements_json = '[]',
  evaluated_aspects_json = '[
    {"id":"mp.info.4.q1","question":"¿Se adoptan cautelas para la utilización de sellos de tiempo?","reinforcement_ref":null},
    {"id":"mp.info.4.q2","question":"¿Se aplican sellos de tiempo a información susceptible de ser evidencia electrónica?","reinforcement_ref":null}
  ]'
WHERE id = 'ens-2022-mp-info-4';

UPDATE versioned_controls SET
  title = 'Limpieza de documentos',
  control_type = 'MEDIDA',
  control_group = 'mp.info',
  applicability_json = '{"basica":"aplica","media":"aplica","alta":"aplica"}',
  reinforcements_json = '[]',
  evaluated_aspects_json = '[
    {"id":"mp.info.5.q1","question":"¿Se retira de los documentos electrónicos información oculta, metadatos, comentarios y revisiones previas?","reinforcement_ref":null},
    {"id":"mp.info.5.q2","question":"¿Existen herramientas automáticas (o documentación manual) para limpieza de metadatos?","reinforcement_ref":null}
  ]'
WHERE id = 'ens-2022-mp-info-5';

UPDATE versioned_controls SET
  title = 'Copias de seguridad',
  control_type = 'MEDIDA',
  control_group = 'mp.info',
  applicability_json = '{"basica":"n.a.","media":"+R1","alta":"+R1+R2"}',
  reinforcements_json = '[
    {"id":"R1","description":"Procedimientos formales de copia y restauración aprobados.","required_at":["MEDIA","ALTA"],"mode":"ADDITIVE"},
    {"id":"R2","description":"Preservación de copias frente a riesgos que afectan al original.","required_at":["ALTA"],"mode":"ADDITIVE"}
  ]',
  evaluated_aspects_json = '[
    {"id":"mp.info.6.q1","question":"¿Se realizan copias de seguridad que permiten recuperar datos perdidos accidental o intencionadamente?","reinforcement_ref":null},
    {"id":"mp.info.6.q2","question":"¿Las copias se hacen con periodicidad y retención requeridas por los servicios?","reinforcement_ref":null},
    {"id":"mp.info.6.q3","question":"Si se externalizan las copias, ¿se reciben informes detallados del proveedor?","reinforcement_ref":null},
    {"id":"mp.info.6.q4","question":"¿Existen procedimientos formales de copia y restauración aprobados?","reinforcement_ref":"R1"},
    {"id":"mp.info.6.q5","question":"¿Las copias se preservan frente a riesgos que también podrían afectar al original?","reinforcement_ref":"R2"}
  ]'
WHERE id = 'ens-2022-mp-info-6';

-- ── 18. Medidas de Protección · Servicios (mp.s.*) ──────────

UPDATE versioned_controls SET
  title = 'Protección del correo electrónico',
  control_type = 'MEDIDA',
  control_group = 'mp.s',
  applicability_json = '{"basica":"aplica","media":"aplica","alta":"aplica"}',
  reinforcements_json = '[]',
  evaluated_aspects_json = '[
    {"id":"mp.s.1.q1","question":"¿Se protege el correo electrónico frente a las amenazas que le son propias?","reinforcement_ref":null},
    {"id":"mp.s.1.q2","question":"¿El servidor de correo interno tiene arquitectura/configuración alineada con op.exp.2?","reinforcement_ref":null},
    {"id":"mp.s.1.q3","question":"¿Se protege a la organización frente a problemas materializados vía correo?","reinforcement_ref":null},
    {"id":"mp.s.1.q4","question":"¿Existen herramientas de filtrado de spam y protección frente a código dañino en correo?","reinforcement_ref":null},
    {"id":"mp.s.1.q5","question":"¿Existen normas para uso seguro del correo electrónico?","reinforcement_ref":null},
    {"id":"mp.s.1.q6","question":"¿Se realizan actividades de concienciación y formación sobre uso del correo?","reinforcement_ref":null}
  ]'
WHERE id = 'ens-2022-mp-s-1';

UPDATE versioned_controls SET
  title = 'Protección de servicios y aplicaciones web',
  control_type = 'MEDIDA',
  control_group = 'mp.s',
  applicability_json = '{"basica":"aplica","media":"+[R1 o R2]","alta":"+R2+R3"}',
  reinforcements_json = '[
    {"id":"R1","description":"Auditorías de seguridad de caja negra sobre las aplicaciones web.","required_at":["MEDIA"],"mode":"EXCLUSIVE_OR"},
    {"id":"R2","description":"Auditorías de seguridad de caja blanca sobre las aplicaciones web.","required_at":["MEDIA","ALTA"],"mode":"EXCLUSIVE_OR"},
    {"id":"R3","description":"Prevención de ataques sobre proxies y cachés.","required_at":["ALTA"],"mode":"ADDITIVE"}
  ]',
  evaluated_aspects_json = '[
    {"id":"mp.s.2.q1","question":"Cuando se requiere control de acceso, ¿se garantiza que no se pueda obviar la autenticación?","reinforcement_ref":null},
    {"id":"mp.s.2.q2","question":"¿Se evita el acceso a documentos por vías alternativas al protocolo determinado?","reinforcement_ref":null},
    {"id":"mp.s.2.q3","question":"¿Se previenen ataques de manipulación de URL?","reinforcement_ref":null},
    {"id":"mp.s.2.q4","question":"¿Se previenen ataques de manipulación de cookies?","reinforcement_ref":null},
    {"id":"mp.s.2.q5","question":"¿Se previenen ataques de inyección de código?","reinforcement_ref":null},
    {"id":"mp.s.2.q6","question":"¿Se previenen intentos de escalado de privilegios?","reinforcement_ref":null},
    {"id":"mp.s.2.q7","question":"¿Se previenen ataques de cross-site scripting?","reinforcement_ref":null},
    {"id":"mp.s.2.q8","question":"¿Se realizan auditorías de seguridad de caja negra sobre aplicaciones web?","reinforcement_ref":"R1"},
    {"id":"mp.s.2.q9","question":"¿Se realizan auditorías de seguridad de caja blanca sobre aplicaciones web?","reinforcement_ref":"R2"},
    {"id":"mp.s.2.q10","question":"¿Se previenen ataques sobre proxies y cachés?","reinforcement_ref":"R3"}
  ]'
WHERE id = 'ens-2022-mp-s-2';

UPDATE versioned_controls SET
  title = 'Protección de la navegación web',
  control_type = 'MEDIDA',
  control_group = 'mp.s',
  applicability_json = '{"basica":"aplica","media":"aplica","alta":"+R1"}',
  reinforcements_json = '[
    {"id":"R1","description":"Restricciones a la navegación y monitorización.","required_at":["ALTA"],"mode":"ADDITIVE"}
  ]',
  evaluated_aspects_json = '[
    {"id":"mp.s.3.q1","question":"¿Se protege el acceso interno a internet frente a las amenazas que le son propias?","reinforcement_ref":null},
    {"id":"mp.s.3.q2","question":"¿Existe normativa de uso autorizado y limitaciones, incluyendo conexiones cifradas?","reinforcement_ref":null},
    {"id":"mp.s.3.q3","question":"¿Se realizan actividades de concienciación sobre higiene en la navegación web?","reinforcement_ref":null},
    {"id":"mp.s.3.q4","question":"¿Se protege la organización y el puesto de trabajo frente a problemas vía navegación web?","reinforcement_ref":null},
    {"id":"mp.s.3.q5","question":"¿Existen restricciones a la navegación y monitorización?","reinforcement_ref":"R1"}
  ]'
WHERE id = 'ens-2022-mp-s-3';

UPDATE versioned_controls SET
  title = 'Protección frente a denegación de servicio',
  control_type = 'MEDIDA',
  control_group = 'mp.s',
  applicability_json = '{"basica":"n.a.","media":"aplica","alta":"+R1"}',
  reinforcements_json = '[
    {"id":"R1","description":"Sistemas de detección, notificación y tratamiento de DoS/DDoS.","required_at":["ALTA"],"mode":"ADDITIVE"}
  ]',
  evaluated_aspects_json = '[
    {"id":"mp.s.4.q1","question":"¿Existen medidas preventivas frente a DoS/DDoS?","reinforcement_ref":null},
    {"id":"mp.s.4.q2","question":"¿Existen sistemas de detección, notificación y tratamiento de DoS/DDoS?","reinforcement_ref":"R1"}
  ]'
WHERE id = 'ens-2022-mp-s-4';

-- ── 19. Articles & Adenda (new ARTICULO/ADENDA entries) ─────

INSERT OR REPLACE INTO versioned_controls (id, framework_version_id, control_id, domain, subdomain, title, requirement_text, guidance, evidence_requirements, risk_weight, implementation_group, control_type, control_group, applicability_json, reinforcements_json, evaluated_aspects_json, aapp_only, created_at)
VALUES
  ('ens-2022-art-5', 'ens-2022', 'art.5', 'Disposiciones del RD 311/2022', 'Articles', 'Instrucciones Técnicas de Seguridad (ITS) y guías de seguridad',
   'La organización demuestra cómo utiliza las Instrucciones Técnicas de Seguridad y las guías CCN-STIC (p.ej. 803 para categorización, 140 para medidas compensatorias).',
   'Artículo 5 y disposición adicional segunda del ENS.',
   '["Documentación de ITS aplicadas","Referencias a guías CCN-STIC empleadas"]',
   0.5, 'basic', 'ARTICULO', 'art', NULL, '[]',
   '[{"id":"art.5.q1","question":"¿La organización muestra cómo utiliza las ITS y guías CCN-STIC (p.ej. 803, 140)?","reinforcement_ref":null}]',
   0, datetime('now')),

  ('ens-2022-art-28', 'ens-2022', 'art.28', 'Disposiciones del RD 311/2022', 'Articles', 'Declaración de Aplicabilidad',
   'La Declaración de Aplicabilidad (SoA) recoge todas las medidas que aplican y justifica las que no aplican; está suscrita por el Responsable de Seguridad.',
   'Artículo 28 del RD 311/2022.',
   '["SoA firmada por el Responsable de Seguridad","Justificación de no aplicabilidad","Trazabilidad de medidas compensatorias con riesgos"]',
   0.7, 'basic', 'ARTICULO', 'art', NULL, '[]',
   '[
     {"id":"art.28.q1","question":"¿Se dispone de una declaración de aplicabilidad?","reinforcement_ref":null},
     {"id":"art.28.q2","question":"¿Están todas las medidas que aplican?","reinforcement_ref":null},
     {"id":"art.28.q3","question":"¿Está suscrita por el Responsable de Seguridad?","reinforcement_ref":null},
     {"id":"art.28.q4","question":"¿Están justificadas todas las medidas que no aplican (no existe activo o riesgo)?","reinforcement_ref":null},
     {"id":"art.28.q5","question":"¿Las medidas compensatorias son trazables con los riesgos y medidas a las que aplican?","reinforcement_ref":null}
   ]',
   0, datetime('now')),

  ('ens-2022-art-30', 'ens-2022', 'art.30', 'Disposiciones del RD 311/2022', 'Articles', 'Perfiles de Cumplimiento',
   'La organización define y documenta los Perfiles de Cumplimiento aplicables, recogidos en la declaración de aplicabilidad.',
   'Artículo 30 del RD 311/2022.',
   '["Perfiles de cumplimiento documentados","Inclusión en la SoA"]',
   0.5, 'basic', 'ARTICULO', 'art', NULL, '[]',
   '[{"id":"art.30.q1","question":"¿Se han recogido los perfiles de cumplimiento en la declaración de aplicabilidad?","reinforcement_ref":null}]',
   0, datetime('now')),

  ('ens-2022-art-32', 'ens-2022', 'art.32', 'Disposiciones del RD 311/2022', 'Articles', 'Informe de Estado de Seguridad (INES)',
   'La organización mantiene actualizada la información en INES, que CCN consolida para elaborar un perfil general del estado de la seguridad y propiciar mejora continua.',
   'Artículo 32 del RD 311/2022. Vinculado a op.mon.2 (sistema de métricas).',
   '["Acceso a INES","Información actualizada","Métricas de op.mon.2 reflejadas en INES"]',
   0.6, 'basic', 'ARTICULO', 'art', NULL, '[]',
   '[
     {"id":"art.32.q1","question":"¿Se accede con la persona responsable a INES y la información está actualizada?","reinforcement_ref":null},
     {"id":"art.32.q2","question":"¿Las métricas de seguridad de op.mon.2 se reflejan en INES?","reinforcement_ref":null}
   ]',
   1, datetime('now')),

  ('ens-2022-art-38', 'ens-2022', 'art.38', 'Disposiciones del RD 311/2022', 'Articles', 'Procedimientos de determinación de la conformidad con el ENS',
   'Procedimientos de determinación de la conformidad con el ENS, incluyendo publicidad del Distintivo de Conformidad y enlace al documento correspondiente.',
   'Artículo 38 del RD 311/2022.',
   '["Distintivo de Conformidad publicado","Enlace al documento de conformidad"]',
   0.5, 'basic', 'ARTICULO', 'art', NULL, '[]',
   '[{"id":"art.38.q1","question":"¿Se incluye un enlace en el Distintivo de Conformidad al documento correspondiente?","reinforcement_ref":null}]',
   0, datetime('now')),

  ('ens-2022-art-40', 'ens-2022', 'art.40', 'Disposiciones del RD 311/2022', 'Articles', 'Categorización de los sistemas de información',
   'Categorización del sistema basada en la valoración CITAD por parte de los responsables, firmada por el Responsable de Seguridad y documentada.',
   'Artículos 40 y 41 del RD 311/2022.',
   '["Documento de categorización firmado","Valoración CITAD de servicios e información","Coherencia entre CITAD y categoría del sistema"]',
   0.7, 'basic', 'ARTICULO', 'art', NULL, '[]',
   '[
     {"id":"art.40.q1","question":"¿Están los servicios y su información dentro del alcance de la auditoría?","reinforcement_ref":null},
     {"id":"art.40.q2","question":"¿Se ha valorado por el responsable la valoración CITAD del impacto?","reinforcement_ref":null},
     {"id":"art.40.q3","question":"¿La categorización del sistema la ha realizado y firmado el Responsable de Seguridad?","reinforcement_ref":null},
     {"id":"art.40.q4","question":"¿Es coherente la categorización con la valoración CITAD de los servicios?","reinforcement_ref":null},
     {"id":"art.40.q5","question":"¿Está toda la información recogida en un documento?","reinforcement_ref":null}
   ]',
   0, datetime('now')),

  ('ens-2022-adenda-auditoria-interna', 'ens-2022', 'adenda.auditoria-interna', 'Adendas', 'Adendas', 'Auditoría Interna',
   'Realización de auditoría interna del cumplimiento del ENS, verificando objetividad e independencia del equipo, cualificación del auditor, ausencia de conflicto consultor/auditor y cobertura del 100% de las medidas.',
   'Adenda complementaria al ENS RD 311/2022.',
   '["Informe de auditoría interna","CV/cualificación del auditor","Evidencia de independencia auditor/consultor"]',
   0.7, 'basic', 'ADENDA', 'adenda', NULL, '[]',
   '[
     {"id":"adenda.ai.q1","question":"¿Se ha realizado una auditoría interna de cumplimiento del ENS?","reinforcement_ref":null},
     {"id":"adenda.ai.q2","question":"¿Se ha verificado la objetividad e independencia del equipo auditor?","reinforcement_ref":null},
     {"id":"adenda.ai.q3","question":"¿Se ha mostrado la cualificación de la persona auditora (CV, experiencia)?","reinforcement_ref":null},
     {"id":"adenda.ai.q4","question":"¿Se ha verificado que la auditoría no la realiza la misma persona que la consultoría?","reinforcement_ref":null},
     {"id":"adenda.ai.q5","question":"¿Se ha comprobado el 100% de las medidas en la auditoría interna?","reinforcement_ref":null}
   ]',
   0, datetime('now'));
