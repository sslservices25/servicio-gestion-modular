import { pgTable, uuid, varchar, text, timestamp, boolean, numeric, pgEnum, customType } from 'drizzle-orm/pg-core';
import { relations, sql } from 'drizzle-orm';

// Enums
export const rolEnum = pgEnum('rol', ['admin', 'tecnico']);
export const prioridadEnum = pgEnum('prioridad', ['baja', 'media', 'alta', 'critica']);
export const estadoEnum = pgEnum('estado', ['pendiente', 'prediagnostico', 'asignado', 'visita', 'aprobacion', 'reparacion', 'facturacion', 'finalizado']);
export const notificacionTipoEnum = pgEnum('notificacion_tipo', ['whatsapp', 'email', 'admin_alert']);
export const archivoTipoEnum = pgEnum('archivo_tipo', ['foto_falla', 'video_operacion', 'reporte_pdf', 'manual_plano', 'registro_mantenimiento', 'otro']);

// Tipo BYTEA para campos cifrados
export const bytea = customType<{ data: Buffer; driverData: Buffer }>({
    dataType() { return 'bytea'; },
    toDriver(value: Buffer): Buffer { return value; },
    fromDriver(value: Buffer): Buffer { return value; },
});

// 1. USUARIO (Técnicos y Admins)
export const usuario = pgTable('usuario', {
    usuarioId: uuid('usuario_id').primaryKey().default(sql`uuid_generate_v4()`),
    email: varchar('email', { length: 255 }).unique().notNull(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    rol: rolEnum('rol').notNull(),
    nombreCompleto: varchar('nombre_completo', { length: 150 }).notNull(),
    activo: boolean('activo').default(true),
    fechaRegistro: timestamp('fecha_registro', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`),
});

// 2. CLIENTE (Datos cifrados)
export const cliente = pgTable('cliente', {
    clienteId: uuid('cliente_id').primaryKey().default(sql`uuid_generate_v4()`),
    nombreContacto: varchar('nombre_contacto', { length: 150 }).notNull(),
    emailCifrado: bytea('email_cifrado').notNull(),
    telefonoCifrado: bytea('telefono_cifrado'),
    direccion: text('direccion'),
    tokenAcceso: varchar('token_acceso', { length: 64 }).unique(),
    fechaRegistro: timestamp('fecha_registro', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`),
});

// 3. EQUIPO
export const equipo = pgTable('equipo', {
    equipoId: uuid('equipo_id').primaryKey().default(sql`uuid_generate_v4()`),
    clienteId: uuid('cliente_id').notNull().references(() => cliente.clienteId, { onDelete: 'cascade' }),
    tipo: varchar('tipo', { length: 100 }).notNull(),
    marca: varchar('marca', { length: 100 }),
    modelo: varchar('modelo', { length: 100 }),
    numeroSerie: varchar('numero_serie', { length: 100 }),
    anioFabricacion: varchar('anio_fabricacion', { length: 4 }),
});

// 4. DIAGNOSTICO (Núcleo del sistema)
export const diagnostico = pgTable('diagnostico', {
    diagnosticoId: uuid('diagnostico_id').primaryKey().default(sql`uuid_generate_v4()`),
    equipoId: uuid('equipo_id').notNull().references(() => equipo.equipoId, { onDelete: 'restrict' }),
    tecnicoAsignadoId: uuid('tecnico_asignado_id').references(() => usuario.usuarioId),
    prioridad: prioridadEnum('prioridad').notNull(),
    estado: estadoEnum('estado').notNull().default('pendiente'),
    descripcionFalla: text('descripcion_falla').notNull(),
    prediagnosticoIa: text('prediagnostico_ia'),
    diagnosticoTecnico: text('diagnostico_tecnico'),
    presupuestoEstimado: numeric('presupuesto_estimado', { precision: 10, scale: 2 }),
    aprobacionCliente: boolean('aprobacion_cliente').default(false),
    fechaCreacion: timestamp('fecha_creacion', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`),
    fechaActualizacion: timestamp('fecha_actualizacion', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`),
});

// 5. ARCHIVO_ADJUNTO
export const archivoAdjunto = pgTable('archivo_adjunto', {
    archivoId: uuid('archivo_id').primaryKey().default(sql`uuid_generate_v4()`),
    diagnosticoId: uuid('diagnostico_id').notNull().references(() => diagnostico.diagnosticoId, { onDelete: 'cascade' }),
    urlStorage: text('url_storage').notNull(),
    nombreOriginal: varchar('nombre_original', { length: 255 }).notNull(),
    tipoMime: varchar('tipo_mime', { length: 100 }),
    tipoArchivo: archivoTipoEnum('tipo_archivo').notNull(),
    checksumHash: varchar('checksum_hash', { length: 64 }).unique().notNull(),
    fechaSubida: timestamp('fecha_subida', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`),
});

// 6. LOG_NOTIFICACION
export const logNotificacion = pgTable('log_notificacion', {
    logId: uuid('log_id').primaryKey().default(sql`uuid_generate_v4()`),
    diagnosticoId: uuid('diagnostico_id').references(() => diagnostico.diagnosticoId, { onDelete: 'set null' }),
    tipo: notificacionTipoEnum('tipo').notNull(),
    destinatario: varchar('destinatario', { length: 255 }).notNull(),
    mensaje: text('mensaje').notNull(),
    exitoso: boolean('exitoso').default(false),
    fechaEnvio: timestamp('fecha_envio', { withTimezone: true }).default(sql`CURRENT_TIMESTAMP`),
});

// Relaciones
export const usuarioRelations = relations(usuario, ({ many }) => ({
    diagnosticosAsignados: many(diagnostico),
}));

export const clienteRelations = relations(cliente, ({ many }) => ({
    equipos: many(equipo),
}));

export const equipoRelations = relations(equipo, ({ one, many }) => ({
    cliente: one(cliente, { fields: [equipo.clienteId], references: [cliente.clienteId] }),
    diagnosticos: many(diagnostico),
}));

export const diagnosticoRelations = relations(diagnostico, ({ one, many }) => ({
    equipo: one(equipo, { fields: [diagnostico.equipoId], references: [equipo.equipoId] }),
    tecnicoAsignado: one(usuario, { fields: [diagnostico.tecnicoAsignadoId], references: [usuario.usuarioId] }),
    archivos: many(archivoAdjunto),
    logs: many(logNotificacion),
}));

export const archivoAdjuntoRelations = relations(archivoAdjunto, ({ one }) => ({
    diagnostico: one(diagnostico, { fields: [archivoAdjunto.diagnosticoId], references: [diagnostico.diagnosticoId] }),
}));

export const logNotificacionRelations = relations(logNotificacion, ({ one }) => ({
    diagnostico: one(diagnostico, { fields: [logNotificacion.diagnosticoId], references: [diagnostico.diagnosticoId] }),
}));

// Tipos TypeScript para las tablas
export type Usuario = typeof usuario.$inferSelect;
export type NewUsuario = typeof usuario.$inferInsert;

export type Cliente = typeof cliente.$inferSelect;
export type NewCliente = typeof cliente.$inferInsert;

export type Equipo = typeof equipo.$inferSelect;
export type NewEquipo = typeof equipo.$inferInsert;

export type Diagnostico = typeof diagnostico.$inferSelect;
export type NewDiagnostico = typeof diagnostico.$inferInsert;

export type ArchivoAdjunto = typeof archivoAdjunto.$inferSelect;
export type NewArchivoAdjunto = typeof archivoAdjunto.$inferInsert;

export type LogNotificacion = typeof logNotificacion.$inferSelect;
export type NewLogNotificacion = typeof logNotificacion.$inferInsert;
