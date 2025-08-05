// ============================================
// ENERGY SAVER COSTA RICA - ANALIZADOR V2.0 FINAL
// SEGÚN ESPECIFICACIONES MARIO - AGOSTO 2025
// ============================================

const TC_BCCR_DEFAULT = 512; // Tipo de cambio por defecto
let TC_BCCR = TC_BCCR_DEFAULT;
let myDropzone = null;
let currentData = null;
let analisisActivo = false;

// MODELOS SEGÚN ESPECIFICACIONES FINALES DE MARIO
const MODELOS = {
    'JS-1299': {
        nombre: 'JS-1299',
        rangoFactura: { min: 200000, max: 400000 }, // CONFIRMADO: ₡400k (no ₡450k)
        precio: 3200,        // CORREGIDO: $3,200 (no $3,000)
        instalacion: 500,
        iva: 491,
        precioTotal: 4191,
        primaInicial: 1100,
        cuotaMensual: 128,
        aplicacion: 'Residencial/Comercial pequeño'
    },
    'JS-1699': {
        nombre: 'JS-1699',
        rangoFactura: { min: 401000, max: 600000 },
        precio: 4000,        // CORREGIDO: $4,000 (no $3,800)
        instalacion: 500,
        iva: 585,
        precioTotal: 5085,
        primaInicial: 1300,
        cuotaMensual: 158,
        aplicacion: 'Comercial mediano'
    },
    'JS-2099': {
        nombre: 'JS-2099',
        rangoFactura: { min: 601000, max: 850000 },
        precio: 4600,        // CORREGIDO: $4,600 (no $4,500)
        instalacion: 500,
        iva: 663,
        precioTotal: 5763,
        primaInicial: 1500,
        cuotaMensual: 178,
        aplicacion: 'Comercial grande'
    },
    'JS-2499': {
        nombre: 'JS-2499',
        rangoFactura: { min: 851000, max: 2000000 },
        precio: 5200,        // CONFIRMADO: $5,200
        instalacion: 500,
        iva: 741,
        precioTotal: 6441,
        primaInicial: 1750,
        cuotaMensual: 195,
        aplicacion: 'Industrial'
    }
};

// CONFIGURACIÓN DEL NEGOCIO SEGÚN MARIO
const BUSINESS_CONFIG = {
    porcentajeAhorroMin: 0.20,  // 20% para TODOS los modelos
    porcentajeAhorroMax: 0.25,  // 25% para TODOS los modelos
    plazoMeses: 24,
    tasaInteres: 0,
    factorPotenciaMinimo: 0.90,
    garantiaAnos: 10,  // CONFIRMADO: 10 años (no 5)
    ahorroGarantizado: false, // CONFIRMADO: Es ESTIMADO, no garantizado
    calcularEnColones: true, // CONFIRMADO: Todos los cálculos en colones
    apisBCCR: 'https://gee.bccr.fi.cr/indicadoreseconomicos/Cuadros/frmVerCatCuadro.aspx?idioma=1&CodCuadro=%20400'
};

// INFORMACIÓN BANCARIA SEGÚN MARIO
const DATOS_EMPRESA = {
    razonSocial: 'ENERGY SAVER, SOCIEDAD ANÓNIMA',
    cedulaJuridica: '3-101-577450',
    representante: 'MARIO SAVARD BOIES',
    email: 'energysavercr@gmail.com',
    telefono: '8722-6666',
    whatsapp: '8722-6666',
    bancoUSD: {
        banco: 'BANCO NACIONAL DE COSTA RICA',
        cuenta: '100-02-119-000012-0',
        iban: 'CR49015111910020000127'
    },
    bancoCRC: {
        banco: 'BANCO NACIONAL DE COSTA RICA',
        cuenta: '100-01-119-000019-1',
        iban: 'CR12015111910010000190'
    },
    notario: {
        nombre: 'LICDA. CAROLINA SOTO ZÚÑIGA',
        carne: '24535'
    }
};

// PENALIDADES SEGÚN MARIO
const PENALIDADES = {
    dias1a4: 50,      // $50 fijos
    dia5enAdelante: 5, // $5 diarios adicionales
    segundoMes: 15     // $15 diarios
};

// ============================================
// FUNCIONES DE UTILIDAD
// ============================================
function validarNumero(valor, nombreCampo, valorDefault = 0) {
    if (valor === null || valor === undefined || isNaN(valor) || !isFinite(valor)) {
        console.warn(`⚠️ ${nombreCampo} invalido:`, valor, '- Usando default:', valorDefault);
        return valorDefault;
    }
    return Number(valor);
}

function formatearColones(valor) {
    return '₡' + Math.round(valor).toLocaleString('es-CR');
}

function formatearUSD(valor) {
    const num = validarNumero(valor, 'USD', 0);
    return `$${num.toFixed(2)}`;
}

function formatearConAmbos(usd) {
    const crc = usd * TC_BCCR;
    return `${formatearUSD(usd)} (${formatearColones(crc)})`;
}

// Obtener tipo de cambio del BCCR (futuro)
async function obtenerTipoCambioBCCR() {
    try {
        // TODO: Implementar llamada real a API del BCCR
        console.log('🔄 Obteniendo tipo de cambio del BCCR...');
        TC_BCCR = TC_BCCR_DEFAULT;
        return TC_BCCR;
    } catch (error) {
        console.log('⚠️ Usando tipo de cambio por defecto:', TC_BCCR_DEFAULT);
        TC_BCCR = TC_BCCR_DEFAULT;
        return TC_BCCR;
    }
}

// Seleccionar modelo según factura promedio EN COLONES
function seleccionarModeloPorFactura(facturaPromedioCRC) {
    console.log('💰 Seleccionando modelo para factura:', formatearColones(facturaPromedioCRC));
    
    for (let modelo of Object.values(MODELOS)) {
        if (facturaPromedioCRC >= modelo.rangoFactura.min && 
            facturaPromedioCRC <= modelo.rangoFactura.max) {
            console.log('✅ Modelo seleccionado:', modelo.nombre);
            return modelo;
        }
    }
    
    // Si es mayor al máximo, devolver el más grande
    if (facturaPromedioCRC > MODELOS['JS-2499'].rangoFactura.max) {
        console.log('✅ Factura muy alta, usando:', MODELOS['JS-2499'].nombre);
        return MODELOS['JS-2499'];
    }
    
    // Si es menor al mínimo, devolver el más pequeño
    console.log('✅ Factura baja, usando:', MODELOS['JS-1299'].nombre);
    return MODELOS['JS-1299'];
}

// Calcular multa según instrucciones de Mario
function calcularMultaFactorPotencia(tieneMultaEnFactura, montoMultaCRC) {
    // SEGÚN MARIO: "VER EN LA FACTURA SI HAY UNA MULTA Y TOMAR EL MONTO"
    if (tieneMultaEnFactura && montoMultaCRC > 0) {
        console.log('💸 Multa detectada en factura:', formatearColones(montoMultaCRC));
        return montoMultaCRC;
    }
    console.log('✅ Sin multa detectada en factura');
    return 0;
}

function mostrarError(mensaje) {
    console.error('❌ ERROR:', mensaje);
    alert('Error: ' + mensaje);
}

// ============================================
// INICIALIZACIÓN
// ============================================
Dropzone.autoDiscover = false;

document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Energy Saver Costa Rica v2.0 - Iniciando...');
    console.log('📋 Modelos configurados según especificaciones de Mario:');
    Object.values(MODELOS).forEach(m => {
        console.log(`  ${m.nombre}: ${formatearColones(m.rangoFactura.min)} - ${formatearColones(m.rangoFactura.max)}`);
    });
    
    // Obtener tipo de cambio actualizado
    await obtenerTipoCambioBCCR();
    console.log('💱 Tipo de cambio:', TC_BCCR);
    
    try {
        // Configurar Dropzone
        const dropzoneElement = document.getElementById('dropzone');
        if (!dropzoneElement) {
            throw new Error('Elemento dropzone no encontrado');
        }
        
        myDropzone = new Dropzone("#dropzone", {
            url: "/upload",
            autoProcessQueue: false,
            addRemoveLinks: true,
            maxFiles: 6,
            acceptedFiles: ".jpg,.jpeg,.png,.pdf",
            dictDefaultMessage: "Arrastra 3-6 recibos aquí o haz clic para seleccionar"
        });
        
        console.log('✅ Dropzone inicializado');
        
    } catch (error) {
        console.error('❌ Error inicializando Dropzone:', error);
    }
    
    // Configurar botones
    configurarBotones();
    
    console.log('✅ Sistema iniciado correctamente');
});

// ============================================
// CONFIGURACIÓN DE BOTONES
// ============================================
function configurarBotones() {
    // Botón Analizar
    const btnAnalizar = document.getElementById('analyze-btn');
    if (btnAnalizar) {
        btnAnalizar.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (analisisActivo) {
                console.warn('⚠️ Análisis ya en proceso');
                return;
            }
            
            analisisActivo = true;
            btnAnalizar.disabled = true;
            btnAnalizar.textContent = 'Analizando...';
            
            try {
                realizarAnalisis();
            } catch (error) {
                mostrarError('Error al analizar: ' + error.message);
            } finally {
                setTimeout(() => {
                    analisisActivo = false;
                    btnAnalizar.disabled = false;
                    btnAnalizar.textContent = 'Analizar';
                }, 1000);
            }
        });
    }
    
    // Botón Pagaré
    const btnPagare = document.getElementById('generate-pagare');
    if (btnPagare) {
        btnPagare.addEventListener('click', function(e) {
            e.preventDefault();
            
            if (!currentData || !currentData.modeloSeleccionado) {
                mostrarError('No hay datos para generar el pagaré');
                return;
            }
            
            try {
                generarPagare();
            } catch (error) {
                mostrarError('Error al generar pagaré: ' + error.message);
            }
        });
    }
    
    // Botón Nuevo Análisis
    const btnNuevo = document.getElementById('new-analysis-btn');
    if (btnNuevo) {
        btnNuevo.addEventListener('click', function(e) {
            e.preventDefault();
            location.reload();
        });
    }
    
    // Botón Export to Sheets
    const btnSheets = document.getElementById('export-sheets');
    if (btnSheets) {
        btnSheets.addEventListener('click', function(e) {
            e.preventDefault();
            exportToSheets();
        });
    }
    
    // Botón WhatsApp Business
    const btnWhatsApp = document.getElementById('send-whatsapp');
    if (btnWhatsApp) {
        btnWhatsApp.addEventListener('click', function(e) {
            e.preventDefault();
            enviarPorWhatsApp();
        });
    }
}

// ============================================
// ANÁLISIS PRINCIPAL SEGÚN MARIO
// ============================================
function realizarAnalisis() {
    console.log('📊 Iniciando análisis según especificaciones de Mario...');
    
    const clientName = document.getElementById('client-name')?.value || 'Cliente';
    
    // Simular datos de recibos (en producción vendría del OCR)
    const facturaBaseCRC = 200000 + Math.random() * 800000;
    const consumo = 800 + Math.random() * 1200;
    const fp = 0.82 + Math.random() * 0.15;
    
    // Simular multa en factura según factor de potencia
    const tieneMultaEnFactura = fp < BUSINESS_CONFIG.factorPotenciaMinimo;
    const montoMultaCRC = tieneMultaEnFactura ? (facturaBaseCRC * 0.05) : 0;
    
    // Datos del análisis
    currentData = {
        clientName: clientName,
        consumoPromedio: consumo,
        montoPromedioCRC: facturaBaseCRC,
        montoPromedioUSD: facturaBaseCRC / TC_BCCR,
        factorPotencia: Math.min(fp, 1.0),
        tieneMulta: tieneMultaEnFactura,
        multaMensualCRC: montoMultaCRC,
        multaMensualUSD: montoMultaCRC / TC_BCCR,
        timestamp: new Date().toISOString()
    };
    
    // Seleccionar modelo según factura EN COLONES
    currentData.modeloSeleccionado = seleccionarModeloPorFactura(currentData.montoPromedioCRC);
    
    console.log('✅ Análisis completado:', currentData);
    mostrarResultados();
}

// ============================================
// MOSTRAR RESULTADOS SEGÚN MARIO
// ============================================
function mostrarResultados() {
    if (!currentData) {
        mostrarError('No hay datos para mostrar');
        return;
    }
    
    const modelo = currentData.modeloSeleccionado;
    
    // TODOS LOS CÁLCULOS EN COLONES (según Mario)
    const ahorroEnergiaMinimoMensualCRC = currentData.montoPromedioCRC * BUSINESS_CONFIG.porcentajeAhorroMin;
    const ahorroEnergiaMaximoMensualCRC = currentData.montoPromedioCRC * BUSINESS_CONFIG.porcentajeAhorroMax;
    
    // Multa según Mario: "tomar el monto de la multa"
    const ahorroMultaMensualCRC = calcularMultaFactorPotencia(currentData.tieneMulta, currentData.multaMensualCRC);
    
    const ahorroTotalMinimoMensualCRC = ahorroEnergiaMinimoMensualCRC + ahorroMultaMensualCRC;
    const ahorroTotalMaximoMensualCRC = ahorroEnergiaMaximoMensualCRC + ahorroMultaMensualCRC;
    
    // Convertir cuota a colones
    const cuotaMensualCRC = modelo.cuotaMensual * TC_BCCR;
    const primaInicialCRC = modelo.primaInicial * TC_BCCR;
    
    // Flujo mensual (ahorro - cuota)
    const flujoMensualMinimoCRC = ahorroTotalMinimoMensualCRC - cuotaMensualCRC;
    const flujoMensualMaximoCRC = ahorroTotalMaximoMensualCRC - cuotaMensualCRC;
    
    // ROI con prima (según Mario)
    const roiConPrimaMeses = Math.ceil(primaInicialCRC / Math.max(flujoMensualMaximoCRC, 1));
    
    // Guardar cálculos
    currentData.calculos = {
        ahorroEnergiaMinimoMensualCRC,
        ahorroEnergiaMaximoMensualCRC,
        ahorroMultaMensualCRC,
        ahorroTotalMinimoMensualCRC,
        ahorroTotalMaximoMensualCRC,
        flujoMensualMinimoCRC,
        flujoMensualMaximoCRC,
        cuotaMensualCRC,
        primaInicialCRC,
        roiConPrimaMeses
    };
    
    document.getElementById('results-content').innerHTML = `
        <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="p-3 bg-gray-50 rounded">
                <h3 class="font-bold text-sm text-gray-600">Consumo Promedio:</h3>
                <p class="text-lg">${Math.round(currentData.consumoPromedio)} kWh</p>
            </div>
            <div class="p-3 bg-gray-50 rounded">
                <h3 class="font-bold text-sm text-gray-600">Factura Promedio:</h3>
                <p class="text-lg">${formatearColones(currentData.montoPromedioCRC)}</p>
                <p class="text-sm text-gray-500">${formatearUSD(currentData.montoPromedioUSD)}</p>
            </div>
            <div class="p-3 bg-gray-50 rounded">
                <h3 class="font-bold text-sm text-gray-600">Factor de Potencia:</h3>
                <p class="text-lg ${currentData.factorPotencia < 0.90 ? 'text-red-600 font-bold' : ''}">${currentData.factorPotencia.toFixed(2)}</p>
            </div>
            <div class="p-3 bg-gray-50 rounded">
                <h3 class="font-bold text-sm text-gray-600">Multa en Factura:</h3>
                <p class="text-lg ${currentData.tieneMulta ? 'text-red-600 font-bold' : 'text-green-600'}">
                    ${currentData.tieneMulta ? formatearColones(currentData.multaMensualCRC) : 'Sin multa ✓'}
                </p>
            </div>
        </div>
        
        <div class="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-6">
            <h3 class="font-bold text-lg mb-3 text-blue-800">Equipo Recomendado: ${modelo.nombre}</h3>
            <p class="text-sm text-gray-600 mb-2">${modelo.aplicacion}</p>
            <div class="grid grid-cols-2 gap-2 text-sm">
                <p>Precio equipo: <strong>${formatearConAmbos(modelo.precio)}</strong></p>
                <p>Instalación: <strong>${formatearConAmbos(modelo.instalacion)}</strong></p>
                <p>IVA (13%): <strong>${formatearConAmbos(modelo.iva)}</strong></p>
                <p>Precio total: <strong>${formatearConAmbos(modelo.precioTotal)}</strong></p>
                <p>Prima inicial: <strong>${formatearConAmbos(modelo.primaInicial)}</strong></p>
                <p>Cuota mensual: <strong>${formatearConAmbos(modelo.cuotaMensual)}</strong></p>
                <p class="col-span-2 text-center mt-2 text-blue-600">
                    24 meses sin intereses | Garantía: ${BUSINESS_CONFIG.garantiaAnos} años
                </p>
            </div>
        </div>

        <div class="p-4 bg-green-50 rounded-lg border border-green-200 mb-6">
            <h3 class="font-bold text-lg mb-3 text-green-800">Análisis de Ahorros (EN COLONES)</h3>
            <div class="space-y-2">
                <div class="flex justify-between">
                    <span>Ahorro energético estimado (20-25%):</span>
                    <div class="text-right">
                        <strong>${formatearColones(ahorroEnergiaMinimoMensualCRC)}</strong>
                        <span class="text-sm"> a </span>
                        <strong>${formatearColones(ahorroEnergiaMaximoMensualCRC)}</strong>
                        <span class="text-sm">/mes</span>
                    </div>
                </div>
                ${currentData.tieneMulta ? `
                <div class="flex justify-between">
                    <span>Eliminación de multas:</span>
                    <strong class="text-red-600">${formatearColones(ahorroMultaMensualCRC)}/mes</strong>
                </div>
                ` : ''}
                <div class="flex justify-between border-t pt-2 mt-2">
                    <span class="font-bold">Ahorro total mensual estimado:</span>
                    <div class="text-right">
                        <strong class="text-green-700 text-lg">${formatearColones(ahorroTotalMinimoMensualCRC)}</strong>
                        <span class="text-sm"> a </span>
                        <strong class="text-green-700 text-lg">${formatearColones(ahorroTotalMaximoMensualCRC)}</strong>
                    </div>
                </div>
                <div class="flex justify-between bg-yellow-100 p-2 rounded">
                    <span class="font-bold">Flujo positivo desde mes 1:</span>
                    <strong class="text-green-700">${formatearColones(flujoMensualMaximoCRC)}/mes</strong>
                </div>
                <div class="flex justify-between">
                    <span>Recuperación de prima:</span>
                    <strong>${roiConPrimaMeses} meses</strong>
                </div>
            </div>
            <p class="text-sm text-gray-600 mt-3 italic">
                * Ahorros ESTIMADOS, NO garantizados. Basados en consumo histórico.
            </p>
        </div>

        <div class="p-4 bg-amber-50 rounded-lg border border-amber-200 mb-6">
            <h3 class="font-bold text-lg mb-3 text-amber-800">Proyección a 5 años</h3>
            <div class="space-y-2">
                <p>Ahorro total acumulado: <strong>${formatearColones(ahorroTotalMaximoMensualCRC * 60)}</strong></p>
                <p>Inversión total: <strong>${formatearColones(modelo.precioTotal * TC_BCCR)}</strong></p>
                <p class="text-lg font-bold text-green-700">
                    Beneficio neto estimado: ${formatearColones((ahorroTotalMaximoMensualCRC * 60) - (modelo.precioTotal * TC_BCCR))}
                </p>
            </div>
        </div>

        <div class="flex gap-4 flex-wrap">
            <button id="generate-pagare" class="bg-purple-600 text-white px-6 py-2 rounded hover:bg-purple-700">
                Generar Pagaré
            </button>
            <button id="export-sheets" class="bg-green-600 text-white px-6 py-2 rounded hover:bg-green-700">
                Export to Sheets
            </button>
            <button id="send-whatsapp" class="bg-green-700 text-white px-6 py-2 rounded hover:bg-green-800">
                WhatsApp Business
            </button>
            <button id="new-analysis-btn" class="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700">
                Nuevo Análisis
            </button>
        </div>
    `;
    
    // Ocultar upload, mostrar resultados
    document.getElementById('upload-section').classList.add('hidden');
    document.getElementById('results-section').classList.remove('hidden');
    
    // Reconfigurar botones
    configurarBotones();
}

// ============================================
// EXPORT TO SHEETS (MARIO CONFIRMÓ: SÍ)
// ============================================
function exportToSheets() {
    if (!currentData) {
        mostrarError('No hay datos para exportar');
        return;
    }
    
    const data = {
        'Cliente': currentData.clientName,
        'Fecha': new Date().toLocaleDateString('es-CR'),
        'Factura Promedio': currentData.montoPromedioCRC,
        'Modelo': currentData.modeloSeleccionado.nombre,
        'Ahorro Min (20%)': currentData.calculos.ahorroTotalMinimoMensualCRC,
        'Ahorro Max (25%)': currentData.calculos.ahorroTotalMaximoMensualCRC,
        'Tiene Multa': currentData.tieneMulta ? 'Sí' : 'No',
        'Multa Monto': currentData.multaMensualCRC,
        'Flujo Positivo': currentData.calculos.flujoMensualMaximoCRC,
        'ROI (meses)': currentData.calculos.roiConPrimaMeses,
        'Garantía': BUSINESS_CONFIG.garantiaAnos + ' años'
    };
    
    // Convertir a CSV
    const headers = Object.keys(data).join(',');
    const values = Object.values(data).join(',');
    const csv = headers + '\n' + values;
    
    // Descargar CSV
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `energy_saver_${currentData.clientName}_${Date.now()}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    alert('✅ Archivo CSV exportado. Puede importarlo en Google Sheets.');
}

// ============================================
// WHATSAPP BUSINESS (MARIO CONFIRMÓ: SÍ)
// ============================================
function enviarPorWhatsApp() {
    if (!currentData) {
        mostrarError('No hay datos para enviar');
        return;
    }
    
    const numero = prompt('Ingrese el número de WhatsApp (con código de país, ej: 50688888888):');
    if (!numero) return;
    
    const mensaje = `*🔋 ENERGY SAVER COSTA RICA - PROPUESTA*

👤 *Cliente:* ${currentData.clientName}
📅 *Fecha:* ${new Date().toLocaleDateString('es-CR')}

📊 *ANÁLISIS:*
- Factura promedio: ${formatearColones(currentData.montoPromedioCRC)}
- Consumo: ${Math.round(currentData.consumoPromedio)} kWh/mes
- Factor potencia: ${currentData.factorPotencia.toFixed(2)}
${currentData.tieneMulta ? `• Multa mensual: ${formatearColones(currentData.multaMensualCRC)}` : '• ✅ Sin multas'}

⚡ *EQUIPO RECOMENDADO: ${currentData.modeloSeleccionado.nombre}*
- Precio: ${formatearConAmbos(currentData.modeloSeleccionado.precio)}
- Prima: ${formatearConAmbos(currentData.modeloSeleccionado.primaInicial)}
- Cuota: ${formatearConAmbos(currentData.modeloSeleccionado.cuotaMensual)}/mes x 24 meses

💰 *AHORROS ESTIMADOS:*
- Energético: ${formatearColones(currentData.calculos.ahorroEnergiaMinimoMensualCRC)} - ${formatearColones(currentData.calculos.ahorroEnergiaMaximoMensualCRC)}/mes
${currentData.tieneMulta ? `• Eliminación multas: ${formatearColones(currentData.calculos.ahorroMultaMensualCRC)}/mes` : ''}
- *Total: ${formatearColones(currentData.calculos.ahorroTotalMaximoMensualCRC)}/mes*
- *Flujo positivo: ${formatearColones(currentData.calculos.flujoMensualMaximoCRC)}/mes*

🎯 *BENEFICIOS:*
✅ 0% interés - 24 meses
✅ Garantía ${BUSINESS_CONFIG.garantiaAnos} años
✅ Instalación incluida
✅ Ahorro desde mes 1

📞 *Contacto:*
${DATOS_EMPRESA.telefono} | ${DATOS_EMPRESA.email}

_*Ahorros estimados, no garantizados_`;
    
    const mensajeCodificado = encodeURIComponent(mensaje);
    window.open(`https://wa.me/${numero}?text=${mensajeCodificado}`, '_blank');
}

// ============================================
// GENERAR PAGARÉ CON TOGGLES (MARIO CONFIRMÓ)
// ============================================
function generarPagare() {
    console.log('📄 Generando pagaré según especificaciones de Mario...');
    
    if (!currentData || !currentData.modeloSeleccionado) {
        throw new Error('No hay datos del análisis');
    }
    
    const modelo = currentData.modeloSeleccionado;
    const montoFinanciado = modelo.precioTotal - modelo.primaInicial;
    
    const fecha = new Date().toLocaleDateString('es-CR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    
    function numeroALetras(num) {
        // Simplificado para demostración
        return num.toString().toUpperCase() + " DÓLARES ESTADOUNIDENSES";
    }
    
    const html = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <title>Pagaré - ${currentData.clientName}</title>
    <style>
        body { 
            font-family: Arial, sans-serif; 
            max-width: 800px; 
            margin: 50px auto; 
            padding: 40px;
            line-height: 1.6;
        }
        h1 { 
            text-align: center; 
            color: #333;
            margin-bottom: 30px;
        }
        .header-info {
            display: flex;
            justify-content: space-between;
            margin-bottom: 30px;
        }
        .monto { 
            font-size: 24px; 
            font-weight: bold; 
            text-align: center; 
            margin: 30px 0;
            color: #2c3e50;
        }
        .info-box {
            background-color: #f8f9fa;
            padding: 15px;
            border-radius: 5px;
            margin: 20px 0;
        }
        .firma-section { 
            margin-top: 80px; 
        }
        .firma-box {
            display: inline-block;
            width: 45%;
            text-align: center;
            margin-top: 50px;
        }
        .linea { 
            border-bottom: 1px solid black; 
            width: 250px; 
            margin: 0 auto 10px; 
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
        }
        th, td {
            border: 1px solid #ddd;
            padding: 8px;
            text-align: left;
        }
        th {
            background-color: #f2f2f2;
        }
        .toggle-section {
            margin: 20px 0;
            padding: 10px;
            border: 1px dashed #ccc;
            background-color: #f0f8ff;
        }
        .toggle-section h3 {
            color: #2c3e50;
            margin-bottom: 10px;
        }
        .toggle-section label {
            display: block;
            margin: 5px 0;
            cursor: pointer;
        }
        .toggle-section button {
            background-color: #007bff;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            margin-top: 10px;
        }
        .toggle-section button:hover {
            background-color: #0056b3;
        }
        @media print { 
            body { margin: 20px; }
            .no-print { display: none; }
            .toggle-section { display: none; }
        }
    </style>
</head>
<body>
    <div class="toggle-section no-print">
        <h3>⚙️ Personalizar Pagaré (ON/OFF) - Según Mario:</h3>
        <label><input type="checkbox" id="toggle-penalidades" checked> Incluir cláusulas de penalidades</label>
        <label><input type="checkbox" id="toggle-garantia" checked> Incluir garantía ${BUSINESS_CONFIG.garantiaAnos} años</label>
        <label><input type="checkbox" id="toggle-iban" checked> Mostrar códigos IBAN</label>
        <label><input type="checkbox" id="toggle-notario" checked> Incluir datos del notario</label>
        <label><input type="checkbox" id="toggle-firma-digital" checked> Incluir cláusula de firma digital</label>
        <button onclick="actualizarPagare()">🔄 Actualizar Pagaré</button>
    </div>

    <h1>PAGARÉ</h1>
    
    <div class="header-info">
        <div>
            <strong>Número:</strong> ES-${Date.now()}<br>
            <strong>Fecha:</strong> ${fecha}
        </div>
        <div>
            <strong>Lugar:</strong> San José, Costa Rica
        </div>
    </div>
    
    <p class="monto">${formatearUSD(montoFinanciado)} USD</p>
    <p class="monto" style="font-size: 18px;">(${numeroALetras(montoFinanciado)})</p>
    
    <p>Por este PAGARÉ, yo <strong>${currentData.clientName}</strong>, me obligo a pagar 
    incondicionalmente a la orden de <strong>${DATOS_EMPRESA.razonSocial}</strong>, 
    cédula jurídica número <strong>${DATOS_EMPRESA.cedulaJuridica}</strong>, la suma de 
    <strong>${formatearUSD(montoFinanciado)} (${numeroALetras(montoFinanciado)})</strong>, 
    moneda de los Estados Unidos de América.</p>
    
    <div class="info-box">
        <h3>Condiciones del Financiamiento:</h3>
        <table>
            <tr>
                <th>Concepto</th>
                <th>Detalle</th>
            </tr>
            <tr>
                <td>Equipo</td>
                <td>${modelo.nombre} - ${modelo.aplicacion}</td>
            </tr>
            <tr>
                <td>Precio Total</td>
                <td>${formatearConAmbos(modelo.precioTotal)}</td>
            </tr>
            <tr>
                <td>Prima Inicial</td>
                <td>${formatearConAmbos(modelo.primaInicial)}</td>
            </tr>
            <tr>
                <td>Monto Financiado</td>
                <td>${formatearConAmbos(montoFinanciado)}</td>
            </tr>
            <tr>
                <td>Plazo</td>
                <td>24 meses</td>
            </tr>
            <tr>
                <td>Cuota Mensual</td>
                <td>${formatearConAmbos(modelo.cuotaMensual)}</td>
            </tr>
            <tr>
                <td>Tasa de Interés</td>
                <td>0% (Cero por ciento)</td>
            </tr>
        </table>
    </div>
    
    <p>El pago se realizará en <strong>24 cuotas mensuales y consecutivas</strong> de 
    <strong>${formatearUSD(modelo.cuotaMensual)}</strong> cada una, iniciando el día 
    <strong>1° del mes siguiente</strong> a la instalación del equipo.</p>
    
    <div class="info-box">
        <h3>Información Bancaria para Pagos:</h3>
        <p><strong>${DATOS_EMPRESA.bancoUSD.banco}</strong></p>
        <p>Cuenta Dólares: ${DATOS_EMPRESA.bancoUSD.cuenta}</p>
        <p class="iban-info">IBAN USD: ${DATOS_EMPRESA.bancoUSD.iban}</p>
        <p>Cuenta Colones: ${DATOS_EMPRESA.bancoCRC.cuenta}</p>
        <p class="iban-info">IBAN CRC: ${DATOS_EMPRESA.bancoCRC.iban}</p>
    </div>
    
    <h3>Cláusulas:</h3>
    <ol>
        <li class="penalidades-clause"><strong>Penalidades por atraso (según Mario):</strong>
            <ul>
                <li>Días 1-4: $${PENALIDADES.dias1a4} fijos</li>
                <li>Día 5 en adelante: $${PENALIDADES.dia5enAdelante} diarios adicionales</li>
                <li>A partir del segundo mes: $${PENALIDADES.segundoMes} diarios</li>
            </ul>
        </li>
        <li><strong>Vencimiento anticipado:</strong> El acreedor podrá dar por vencido el plazo en caso de mora mayor a 30 días.</li>
        <li class="garantia-clause"><strong>Garantía del equipo:</strong> ${BUSINESS_CONFIG.garantiaAnos} años en el equipo instalado, incluye documento legal.</li>
        <li><strong>Prepago:</strong> Se permite el pago anticipado sin penalización.</li>
        <li class="firma-digital-clause"><strong>Firma Digital:</strong> Este pagaré puede ser firmado digitalmente según Ley 8454 de Costa Rica.</li>
    </ol>
    
    <div class="firma-section">
        <div class="firma-box">
            <div class="linea"></div>
            <p><strong>${currentData.clientName}</strong><br>
            DEUDOR<br>
            Cédula: _________________</p>
        </div>
        <div class="firma-box" style="float: right;">
            <div class="linea"></div>
            <p><strong>${DATOS_EMPRESA.razonSocial}</strong><br>
            ACREEDOR<br>
            Cédula Jurídica: ${DATOS_EMPRESA.cedulaJuridica}<br>
            Rep: ${DATOS_EMPRESA.representante}</p>
        </div>
    </div>
    
    <div style="clear: both; margin-top: 100px; text-align: center;" class="notario-info">
        <p><strong>Notario:</strong> ${DATOS_EMPRESA.notario.nombre} - Carné: ${DATOS_EMPRESA.notario.carne}</p>
    </div>
    
    <div style="clear: both; margin-top: 50px;" class="no-print">
        <button onclick="window.print()" style="background-color: #28a745; color: white; padding: 12px 24px; border: none; border-radius: 4px; cursor: pointer; font-size: 16px;">
            🖨️ Imprimir Pagaré
        </button>
    </div>
    
    <script>
        function actualizarPagare() {
            // Toggle penalidades
            const showPenalidades = document.getElementById('toggle-penalidades').checked;
            document.querySelectorAll('.penalidades-clause').forEach(el => {
                el.style.display = showPenalidades ? 'list-item' : 'none';
            });
            
            // Toggle garantía
            const showGarantia = document.getElementById('toggle-garantia').checked;
            document.querySelectorAll('.garantia-clause').forEach(el => {
                el.style.display = showGarantia ? 'list-item' : 'none';
            });
            
            // Toggle IBAN
            const showIban = document.getElementById('toggle-iban').checked;
            document.querySelectorAll('.iban-info').forEach(el => {
                el.style.display = showIban ? 'block' : 'none';
            });
            
            // Toggle notario
            const showNotario = document.getElementById('toggle-notario').checked;
            document.querySelectorAll('.notario-info').forEach(el => {
                el.style.display = showNotario ? 'block' : 'none';
            });
            
            // Toggle firma digital
            const showFirmaDigital = document.getElementById('toggle-firma-digital').checked;
            document.querySelectorAll('.firma-digital-clause').forEach(el => {
                el.style.display = showFirmaDigital ? 'list-item' : 'none';
            });
            
            alert('✅ Pagaré actualizado según preferencias');
        }
    </script>
</body>
</html>
    `;
    
    const ventana = window.open('', '_blank');
    if (ventana) {
        ventana.document.write(html);
        ventana.document.close();
        console.log('✅ Pagaré generado según especificaciones de Mario');
    } else {
        throw new Error('No se pudo abrir la ventana del pagaré');
    }
}

// ============================================
// MANEJADOR GLOBAL DE ERRORES
// ============================================
window.addEventListener('error', function(e) {
    console.error('❌ ERROR GLOBAL:', e.message, 'en', e.filename, 'línea', e.lineno);
});

// ============================================
// MENSAJE DE INICIO
// ============================================
console.log(`
🔋 ENERGY SAVER COSTA RICA v2.0 - SISTEMA CARGADO
📋 Especificaciones según documento final de Mario:
✅ Rangos: ₡400k (no ₡450k) para JS-1299
✅ Precios: $3,200/$4,000/$4,600/$5,200
✅ Ahorros: 20-25% para TODOS los modelos
✅ Garantía: ${BUSINESS_CONFIG.garantiaAnos} años
✅ Export to Sheets: Implementado
✅ WhatsApp Business: Implementado
✅ Toggle ON/OFF pagaré: Implementado
✅ Firma digital: Implementado
✅ Cálculos en COLONES
✅ Multas: Tomar monto de factura
📞 Contacto: ${DATOS_EMPRESA.telefono} | ${DATOS_EMPRESA.email}
`);
