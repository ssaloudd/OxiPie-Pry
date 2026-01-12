-- CreateTable
CREATE TABLE `pacientes` (
    `id_pac` INTEGER NOT NULL AUTO_INCREMENT,
    `nombres_pac` VARCHAR(100) NOT NULL,
    `apellidos_pac` VARCHAR(100) NOT NULL,
    `cedula_pac` VARCHAR(10) NOT NULL,
    `genero_pac` ENUM('masculino', 'femenino', 'otro') NOT NULL,
    `telefono_pac` VARCHAR(10) NULL,
    `direccion_pac` VARCHAR(255) NULL,
    `email_pac` VARCHAR(150) NULL,
    `fechaNac_pac` DATE NULL,

    UNIQUE INDEX `pacientes_cedula_pac_key`(`cedula_pac`),
    UNIQUE INDEX `pacientes_email_pac_key`(`email_pac`),
    PRIMARY KEY (`id_pac`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `podologas` (
    `id_pod` INTEGER NOT NULL AUTO_INCREMENT,
    `nombres_pod` VARCHAR(100) NOT NULL,
    `apellidos_pod` VARCHAR(100) NOT NULL,
    `cedula_pod` VARCHAR(10) NOT NULL,
    `genero_pod` ENUM('masculino', 'femenino', 'otro') NOT NULL,
    `telefono_pod` VARCHAR(10) NULL,
    `direccion_pod` VARCHAR(255) NULL,
    `email_pod` VARCHAR(150) NULL,
    `fechaNac_pod` DATE NULL,

    UNIQUE INDEX `podologas_cedula_pod_key`(`cedula_pod`),
    UNIQUE INDEX `podologas_email_pod_key`(`email_pod`),
    PRIMARY KEY (`id_pod`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `tratamientos` (
    `id_tra` INTEGER NOT NULL AUTO_INCREMENT,
    `nombres_tra` VARCHAR(191) NOT NULL,
    `precioBase_tra` DOUBLE NOT NULL,

    PRIMARY KEY (`id_tra`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `consultas` (
    `id_con` INTEGER NOT NULL AUTO_INCREMENT,
    `id_pac` INTEGER NOT NULL,
    `id_pod` INTEGER NOT NULL,
    `fechaHora_con` DATETIME(0) NOT NULL,
    `horaInicio_con` TIME NULL,
    `horaFin_con` TIME NULL,
    `motivoConsulta_con` TEXT NULL,
    `diagnostico_con` TEXT NULL,
    `notasAdicionales_con` TEXT NULL,
    `estado_con` ENUM('pendiente', 'completada', 'cancelada', 'noAsistio') NOT NULL DEFAULT 'pendiente',
    `pagado_con` BOOLEAN NOT NULL DEFAULT false,
    `cantidadPagada_con` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `id_tra_recomendado` INTEGER NULL,
    `precioSugerido_con` DECIMAL(10, 2) NULL,

    PRIMARY KEY (`id_con`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `citas` (
    `id_cit` INTEGER NOT NULL AUTO_INCREMENT,
    `id_pac` INTEGER NOT NULL,
    `id_con_origen` INTEGER NULL,
    `id_pod` INTEGER NOT NULL,
    `id_tra` INTEGER NOT NULL,
    `fechaHora_cit` DATETIME(0) NOT NULL,
    `horaInicio_cit` TIME NULL,
    `horaFin_cit` TIME NULL,
    `notasAdicionales_cit` TEXT NULL,
    `estado_cit` ENUM('pendiente', 'completada', 'cancelada', 'noAsistio') NOT NULL DEFAULT 'pendiente',
    `precioAcordado_cit` DECIMAL(10, 2) NOT NULL,
    `pagado_cit` BOOLEAN NOT NULL DEFAULT false,
    `cantidadPagada_cit` DECIMAL(10, 2) NOT NULL DEFAULT 0.00,

    PRIMARY KEY (`id_cit`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `egresos` (
    `id_egr` INTEGER NOT NULL AUTO_INCREMENT,
    `monto_egr` DECIMAL(10, 2) NOT NULL,
    `fecha_egr` DATETIME(0) NOT NULL,
    `motivo_egr` VARCHAR(255) NULL,
    `id_pod` INTEGER NOT NULL,

    PRIMARY KEY (`id_egr`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `consultas` ADD CONSTRAINT `consultas_id_pac_fkey` FOREIGN KEY (`id_pac`) REFERENCES `pacientes`(`id_pac`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consultas` ADD CONSTRAINT `consultas_id_pod_fkey` FOREIGN KEY (`id_pod`) REFERENCES `podologas`(`id_pod`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `consultas` ADD CONSTRAINT `consultas_id_tra_recomendado_fkey` FOREIGN KEY (`id_tra_recomendado`) REFERENCES `tratamientos`(`id_tra`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `citas` ADD CONSTRAINT `citas_id_pac_fkey` FOREIGN KEY (`id_pac`) REFERENCES `pacientes`(`id_pac`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `citas` ADD CONSTRAINT `citas_id_con_origen_fkey` FOREIGN KEY (`id_con_origen`) REFERENCES `consultas`(`id_con`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `citas` ADD CONSTRAINT `citas_id_pod_fkey` FOREIGN KEY (`id_pod`) REFERENCES `podologas`(`id_pod`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `citas` ADD CONSTRAINT `citas_id_tra_fkey` FOREIGN KEY (`id_tra`) REFERENCES `tratamientos`(`id_tra`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `egresos` ADD CONSTRAINT `egresos_id_pod_fkey` FOREIGN KEY (`id_pod`) REFERENCES `podologas`(`id_pod`) ON DELETE RESTRICT ON UPDATE CASCADE;
