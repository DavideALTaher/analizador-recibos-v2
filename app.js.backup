// ============================================
// CONFIGURACIÓN Y VARIABLES GLOBALES
// ============================================
const TC_BCCR = 508.81;
let myDropzone = null;
let currentData = null;
let analisisActivo = false;

// ============================================
// FUNCIONES DE UTILIDAD CON CONTROL ERRORI
// ============================================
function validarNumero(valor, nombreCampo, valorDefault = 0) {
    if (valor === null || valor === undefined || isNaN(valor) || !isFinite(valor)) {
        console.warn(`⚠️ ${nombreCampo} invalido:`, valor, '- Usando default:', valorDefault);
        return valorDefault;
    }
    return Number(valor);
}

function formatearUSD(valor) {
    const num = validarNumero(valor, 'USD', 0);
    const crc = num * TC_BCCR;
    return `$${num.toFixed(2)} (₡${Math.round(crc).toLocaleString()})`;
}

function mostrarError(mensaje) {
    console.error('❌ ERROR:', mensaje);
    alert('Error: ' + mensaje);
}

// ============================================
// INICIALIZACIÓN CON MANEJO DE ERRORES
// ============================================
Dropzone.autoDiscover = false;

document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Iniciando aplicación...');
    
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
            acceptedFiles: ".jpg,.jpeg,.png,.pdf"
        });
        
        console.log('✅ Dropzone inicializado');
        
    } catch (error) {
        console.error('❌ Error inicializando Dropzone:', error);
    }
    
    // Configurar botones con validación
    configurarBotones();
    
    console.log('✅ Aplicación iniciada correctamente');
});

// ============================================
// CONFIGURACIÓN DE BOTONES CON VALIDACIÓN
// ============================================
function configurarBotones() {
    // Botón Analizar
    const btnAnalizar = document.getElementById('analyze-btn');
    if (btnAnalizar) {
        btnAnalizar.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Evitar múltiples clicks
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
            
            if (!currentData) {
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
}

// ============================================
// ANÁLISIS CON VALIDACIÓN DE DATOS
// ============================================
function realizarAnalisis() {
    console.log('📊 Iniciando análisis...');
    
    const clientName = document.getElementById('client-name')?.value || 'Cliente';
    
    // Simular datos con validación
    const consumo = validarNumero(850 + Math.random() * 200, 'consumo', 850);
    const montoCRC = validarNumero(75000 + Math.random() * 25000, 'montoCRC', 75000);
    const fp = validarNumero(0.82 + Math.random() * 0.15, 'factorPotencia', 0.85);
    
    currentData = {
        clientName: clientName,
        consumoPromedio: consumo,
        montoPromedio: montoCRC,
        montoPromedioUSD: montoCRC / TC_BCCR,
        factorPotencia: Math.min(fp, 1.0), // No puede ser mayor a 1
        tieneMulta: fp < 0.90,
        multaMensual: fp < 0.90 ? (montoCRC * 0.08) / TC_BCCR : 0,
        timestamp: new Date().toISOString()
    };
    
    console.log('✅ Datos analizados:', currentData);
    mostrarResultados();
}

// ============================================
// MOSTRAR RESULTADOS CON CONTROLES
// ============================================
function mostrarResultados() {
    if (!currentData) {
        mostrarError('No hay datos para mostrar');
        return;
    }
    
    const modelo = {
        nombre: 'JS-1299',
        precio: 1299,
        prima: 389.70,
        financiado: 909.30,
        cuotaMensual: 37.89
    };
    
    // Calcular ahorros con validación
    const ahorroEnergia = validarNumero(
        currentData.montoPromedioUSD * 0.15, 
        'ahorroEnergia', 
        0
    );
    
    const ahorroMulta = validarNumero(
        currentData.multaMensual, 
        'ahorroMulta', 
        0
    );
    
    const ahorroTotal = ahorroEnergia + ahorroMulta;
    
    // Evitar división por cero
    const roi = ahorroTotal > 0 ? 
        Math.ceil(modelo.financiado / ahorroTotal) : 
        999;
    
    document.getElementById('results-content').innerHTML = `
        <div class="grid grid-cols-2 gap-4 mb-6">
            <div class="p-3 bg-gray-50 rounded">
                <h3 class="font-bold text-sm text-gray-600">Consumo Promedio:</h3>
                <p class="text-lg">${Math.round(currentData.consumoPromedio)} kWh</p>
            </div>
            <div class="p-3 bg-gray-50 rounded">
                <h3 class="font-bold text-sm text-gray-600">Monto Promedio:</h3>
                <p class="text-lg">${formatearUSD(currentData.montoPromedioUSD)}</p>
            </div>
            <div class="p-3 bg-gray-50 rounded">
                <h3 class="font-bold text-sm text-gray-600">Factor de Potencia:</h3>
                <p class="text-lg ${currentData.factorPotencia < 0.90 ? 'text-red-600 font-bold' : ''}">${currentData.factorPotencia.toFixed(2)}</p>
            </div>
            <div class="p-3 bg-gray-50 rounded">
                <h3 class="font-bold text-sm text-gray-600">Multa Mensual:</h3>
                <p class="text-lg ${currentData.tieneMulta ? 'text-red-600 font-bold' : 'text-green-600'}">${currentData.tieneMulta ? formatearUSD(currentData.multaMensual) : 'Sin multa ✓'}</p>
            </div>
        </div>
        
        <div class="p-4 bg-blue-50 rounded-lg border border-blue-200 mb-6">
            <h3 class="font-bold text-lg mb-3 text-blue-800">Equipo Recomendado: ${modelo.nombre}</h3>
            <div class="grid grid-cols-2 gap-2 text-sm">
                <p>Precio total: <strong>${formatearUSD(modelo.precio)}</strong></p>
                <p>Prima inicial (30%): <strong>${formatearUSD(modelo.prima)}</strong></p>
                <p>Monto a financiar: <strong>${formatearUSD(modelo.financiado)}</strong></p>
                <p>Cuota mensual: <strong>${formatearUSD(modelo.cuotaMensual)}</strong></p>
                <p class="col-span-2 text-center mt-2 text-blue-600">24 meses sin intereses</p>
            </div>
        </div>

        <div class="p-4 bg-green-50 rounded-lg border border-green-200 mb-6">
            <h3 class="font-bold text-lg mb-3 text-green-800">Análisis de Ahorros</h3>
            <div class="space-y-2">
                <div class="flex justify-between">
                    <span>Ahorro por eficiencia energética:</span>
                    <strong>${formatearUSD(ahorroEnergia)}/mes</strong>
                </div>
                ${currentData.tieneMulta ? `
                <div class="flex justify-between">
                    <span>Eliminación de multas:</span>
                    <strong class="text-red-600">${formatearUSD(ahorroMulta)}/mes</strong>
                </div>
                ` : ''}
                <div class="flex justify-between border-t pt-2 mt-2">
                    <span class="font-bold">Ahorro total mensual:</span>
                    <strong class="text-green-700 text-lg">${formatearUSD(ahorroTotal)}/mes</strong>
                </div>
                <div class="flex justify-between">
                    <span>Retorno de inversión:</span>
                    <strong>${roi} meses</strong>
                </div>
            </div>
        </div>

        <!-- Checkbox para incluir/excluir prima -->
        <div class="p-4 bg-gray-100 rounded mb-6">
            <label class="flex items-center cursor-pointer">
                <input type="checkbox" id="incluir-prima" checked onchange="recalcularROI()" class="mr-3">
                <span>Incluir prima inicial en cálculo de ROI</span>
            </label>
            <p id="roi-actualizado" class="mt-2 text-sm text-gray-600"></p>
        </div>

        <div class="flex gap-4">
            <button id="new-analysis-btn" class="bg-gray-600 text-white px-6 py-2 rounded hover:bg-gray-700">
                Nuevo Análisis
            </button>
        </div>
    `;
    
    // Ocultar upload, mostrar resultados
    document.getElementById('upload-section').classList.add('hidden');
    document.getElementById('results-section').classList.remove('hidden');
    
    // Reconfigurar botones después de agregar nuevo contenido
    configurarBotones();
}

// ============================================
// RECALCULAR ROI CON VALIDACIÓN
// ============================================
window.recalcularROI = function() {
    console.log('🔄 Recalculando ROI...');
    
    try {
        if (!currentData) {
            throw new Error('No hay datos disponibles');
        }
        
        const incluirPrima = document.getElementById('incluir-prima')?.checked ?? true;
        const modelo = {
            prima: 389.70,
            financiado: 909.30,
            precio: 1299
        };
        
        const ahorroTotal = validarNumero(
            (currentData.montoPromedioUSD * 0.15) + currentData.multaMensual,
            'ahorroTotal',
            1
        );
        
        const montoCalcular = incluirPrima ? modelo.precio : modelo.financiado;
        const roi = Math.ceil(montoCalcular / ahorroTotal);
        
        const elemento = document.getElementById('roi-actualizado');
        if (elemento) {
            elemento.innerHTML = `
                ROI actualizado: <strong>${roi} meses</strong> 
                (${incluirPrima ? 'incluye prima de $' + modelo.prima.toFixed(2) : 'solo financiamiento'})
            `;
        }
        
        console.log('✅ ROI recalculado:', roi, 'meses');
        
    } catch (error) {
        console.error('❌ Error recalculando ROI:', error);
    }
};

// ============================================
// GENERAR PAGARÉ CON VALIDACIÓN
// ============================================
function generarPagare() {
    console.log('📄 Generando pagaré...');
    
    if (!currentData) {
        throw new Error('No hay datos del análisis');
    }
    
    const fecha = new Date().toLocaleDateString('es-CR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    
    const html = `
<!DOCTYPE html>
<html>
<head>
    <title>Pagaré - ${currentData.clientName}</title>
    <style>
        body { font-family: Arial; max-width: 800px; margin: 50px auto; padding: 20px; }
        h1 { text-align: center; }
        .monto { font-size: 24px; font-weight: bold; text-align: center; }
        .firma { margin-top: 100px; text-align: center; }
        .linea { border-bottom: 1px solid black; width: 300px; margin: 0 auto 10px; }
        @media print { body { margin: 20px; } }
    </style>
</head>
<body>
    <h1>PAGARÉ</h1>
    <p class="monto">$909.30 USD</p>
    
    <p>El suscrito <strong>${currentData.clientName}</strong> PROMETO pagar incondicionalmente 
    a ENERGY SAVER COSTA RICA la suma de NOVECIENTOS NUEVE DÓLARES CON TREINTA CENTAVOS ($909.30 USD)
    en 24 cuotas mensuales de $37.89 cada una.</p>
    
    <p>Fecha: ${fecha}</p>
    <p>Equipo: JS-1299</p>
    
    <div class="firma">
        <div class="linea"></div>
        <p>${currentData.clientName}</p>
        <p>DEUDOR</p>
    </div>
    
    <script>
        window.onload = function() {
            if (confirm('¿Desea imprimir el pagaré?')) {
                window.print();
            }
        }
    </script>
</body>
</html>
    `;
    
    const ventana = window.open('', '_blank');
    if (ventana) {
        ventana.document.write(html);
        ventana.document.close();
        console.log('✅ Pagaré generado');
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

console.log('✅ Script cargado con control de errores completo');
