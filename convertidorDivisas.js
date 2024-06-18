class ConvertidorDivisas {
    constructor() {
        this.tasasCambio = {}; // Almacena las tasas de cambio
        this.nombresMonedas = {}; // Almacena los nombres de las monedas
        this.historialTransacciones = []; // Almacena el historial de transacciones
        this.inicializar(); // Inicializa la clase
    }

    // Inicializa la clase cargando las tasas de cambio y configurando los eventos
    async inicializar() {
        try {
            await this.cargarTasasCambio();
            this.configurarEventos();
        } catch (error) {
            console.error('Error al inicializar:', error);
        }
    }

    // Carga las tasas de cambio y los nombres de las monedas desde Firebase
    async cargarTasasCambio() {
        try {
            this.tasasCambio = await firebaseManager.obtenerTasasCambio();
            this.nombresMonedas = await firebaseManager.obtenerNombresMonedas();
            this.poblarSelects();
            this.poblarAdminMonedas();
            this.generarSelectEliminarMoneda();
        } catch (error) {
            console.error('Error al cargar las tasas de cambio:', error);
        }
    }

    // Población de los selectores de monedas en la interfaz
    poblarSelects() {
        try {
            const monedaOrigenSelect = document.getElementById('monedaOrigen');
            const monedaDestinoSelect = document.getElementById('monedaDestino');

            if (monedaOrigenSelect && monedaDestinoSelect) {
                monedaOrigenSelect.innerHTML = '';
                monedaDestinoSelect.innerHTML = '';

                for (let moneda in this.nombresMonedas) {
                    const optionOrigen = document.createElement('option');
                    optionOrigen.value = moneda;
                    optionOrigen.innerText = `${moneda} (${this.nombresMonedas[moneda] || 'Nombre no disponible'})`;
                    monedaOrigenSelect.appendChild(optionOrigen);

                    const optionDestino = document.createElement('option');
                    optionDestino.value = moneda;
                    optionDestino.innerText = `${moneda} (${this.nombresMonedas[moneda] || 'Nombre no disponible'})`;
                    monedaDestinoSelect.appendChild(optionDestino);
                }
            }
        } catch (error) {
            console.error('Error al poblar selects:', error);
        }
    }

    // Configuración de eventos de la interfaz
    configurarEventos() {
        try {
            const convertirBtn = document.getElementById('convertir');
            const verCotizacionesBtn = document.getElementById('verCotizaciones');
            const closeResultadoBtn = document.getElementById('close-resultado');
            const closeHistorialBtn = document.getElementById('close-historial');
            const limpiarHistorialBtn = document.getElementById('limpiar-historial');
            const agregarMonedaBtn = document.getElementById('agregarMoneda');
            const eliminarMonedaBtn = document.getElementById('eliminarMoneda');

            if (convertirBtn) convertirBtn.addEventListener('click', () => this.realizarConversion());
            if (verCotizacionesBtn) verCotizacionesBtn.addEventListener('click', () => this.mostrarCotizaciones());
            if (closeResultadoBtn) closeResultadoBtn.addEventListener('click', () => document.getElementById('resultado').style.display = 'none');
            if (closeHistorialBtn) closeHistorialBtn.addEventListener('click', () => document.getElementById('historial').style.display = 'none');
            if (limpiarHistorialBtn) limpiarHistorialBtn.addEventListener('click', () => this.limpiarHistorial());
            if (agregarMonedaBtn) agregarMonedaBtn.addEventListener('click', () => this.agregarMoneda());
            if (eliminarMonedaBtn) eliminarMonedaBtn.addEventListener('click', () => this.eliminarMoneda());
        } catch (error) {
            console.error('Error al configurar eventos:', error);
        }
    }

    // Realiza la conversión de monedas
    realizarConversion() {
        try {
            const monto = parseFloat(document.getElementById('monto').value);
            const monedaOrigen = document.getElementById('monedaOrigen').value;
            const monedaDestino = document.getElementById('monedaDestino').value;

            if (isNaN(monto) || !monedaOrigen || !monedaDestino) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Por favor, complete todos los campos.'
                });
                return;
            }

            const tasaCambio = this.tasasCambio[`${monedaOrigen}_${monedaDestino}`];

            if (!tasaCambio) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: `No se encontró tasa de cambio para ${monedaOrigen} a ${monedaDestino}`
                });
                return;
            }

            const montoConvertido = monto * tasaCambio;
            this.mostrarResultado(`Monto convertido: ${montoConvertido.toFixed(2)} ${monedaDestino}`);

            const transaccion = {
                fecha: new Date().toLocaleString(),
                operacion: `${monto} ${monedaOrigen} a ${montoConvertido.toFixed(2)} ${monedaDestino}`,
                monto: montoConvertido.toFixed(2),
            };

            const usuarioActual = localStorage.getItem('usuarioActual');
            if (usuarioActual) {
                firebaseManager.enviarTransaccion(usuarioActual, transaccion);
            }

            this.historialTransacciones.push(transaccion);
        } catch (error) {
            console.error('Error al realizar la conversión:', error);
        }
    }

    // Muestra el resultado de la conversión
    mostrarResultado(mensaje) {
        try {
            const resultadoDiv = document.getElementById('resultado');
            const resultadoTexto = resultadoDiv.querySelector('#resultado-text');
            resultadoTexto.innerText = mensaje;
            resultadoDiv.style.display = 'block';
        } catch (error) {
            console.error('Error al mostrar el resultado:', error);
        }
    }

    // Muestra las cotizaciones en la interfaz
    async mostrarCotizaciones() {
        try {
            const cotizacionesDiv = document.getElementById('cotizaciones-text-inner');
            cotizacionesDiv.innerHTML = '';

            const select = document.createElement('select');
            select.id = 'selectMonedaCotizaciones';
            for (let moneda in this.tasasCambio) {
                if (!moneda.includes('_')) {
                    const option = document.createElement('option');
                    option.value = moneda;
                    option.innerText = `${moneda} (${this.nombresMonedas[moneda] || 'Nombre no disponible'})`;
                    select.appendChild(option);
                }
            }

            const mostrarBtn = document.createElement('button');
            mostrarBtn.innerText = 'Mostrar Cotizaciones';
            mostrarBtn.addEventListener('click', () => this.actualizarCotizaciones(select.value));

            const divWrapper = document.createElement('div');
            divWrapper.classList.add('cotizacion-wrapper');
            divWrapper.appendChild(select);
            divWrapper.appendChild(mostrarBtn);

            const cerrarBtn = document.createElement('button');
            cerrarBtn.innerText = 'Cerrar';
            cerrarBtn.classList.add('close-btn');
            cerrarBtn.addEventListener('click', () => {
                document.getElementById('cotizaciones-text').style.display = 'none';
            });

            divWrapper.appendChild(cerrarBtn);

            cotizacionesDiv.appendChild(divWrapper);
            document.getElementById('cotizaciones-text').style.display = 'block';
        } catch (error) {
            console.error('Error al mostrar cotizaciones:', error);
        }
    }

    // Actualiza las cotizaciones en la interfaz
    async actualizarCotizaciones(monedaBase) {
        try {
            await this.cargarTasasCambio();
            const cotizacionesDiv = document.getElementById('cotizaciones-text-inner');
            cotizacionesDiv.innerHTML = '';

            for (let key in this.tasasCambio) {
                if (key.startsWith(`${monedaBase}_`)) {
                    const monedaDestino = key.split('_')[1];
                    const p = document.createElement('p');
                    p.classList.add('estiloResultados');
                    p.innerText = `1 ${monedaBase} equivale a ${this.tasasCambio[key]} ${monedaDestino} (${this.nombresMonedas[monedaDestino] || 'Nombre no disponible'})`;
                    cotizacionesDiv.appendChild(p);
                }
            }

            const cotizacionButtons = document.createElement('div');
            cotizacionButtons.classList.add('cotizacion-buttons');
            
            const volverBtn = document.createElement('button');
            volverBtn.innerText = 'Volver';
            volverBtn.addEventListener('click', () => this.mostrarCotizaciones());

            const cerrarBtn = document.createElement('button');
            cerrarBtn.innerText = 'Cerrar';
            cerrarBtn.classList.add('close-btn');
            cerrarBtn.addEventListener('click', () => {
                document.getElementById('cotizaciones-text').style.display = 'none';
            });

            cotizacionButtons.appendChild(volverBtn);
            cotizacionButtons.appendChild(cerrarBtn);

            cotizacionesDiv.appendChild(cotizacionButtons);
        } catch (error) {
            console.error('Error al actualizar cotizaciones:', error);
        }
    }

    // Muestra el historial de transacciones
    async mostrarHistorial() {
        try {
            const usuarioActual = localStorage.getItem('usuarioActual');
            if (!usuarioActual) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Debe iniciar sesión para ver el historial.'
                });
                return;
            }

            const historialDiv = document.getElementById('historial');
            const historialTexto = document.getElementById('historial-text');
            historialTexto.innerHTML = '';

            const historialUsuario = await firebaseManager.obtenerHistorialUsuario(usuarioActual);
            if (historialUsuario.length > 0) {
                historialUsuario.slice().reverse().forEach((transaccion) => {
                    const p = document.createElement('p');
                    p.classList.add('estiloResultados');
                    p.innerText = `${transaccion.fecha}: ${transaccion.operacion}`;
                    historialTexto.appendChild(p);
                });
                historialDiv.style.display = 'block';
            } else {
                Swal.fire({
                    icon: 'info',
                    title: 'Sin transacciones',
                    text: 'No hay transacciones en el historial.'
                });
            }
        } catch (error) {
            console.error('Error al mostrar historial:', error);
        }
    }

    // Limpia el historial de transacciones
    limpiarHistorial() {
        try {
            const usuarioActual = localStorage.getItem('usuarioActual');
            if (usuarioActual) {
                firebaseManager.limpiarHistorialUsuario(usuarioActual);
                this.historialTransacciones = [];
                this.mostrarHistorial();
            }
        } catch (error) {
            console.error('Error al limpiar historial:', error);
        }
    }

    // Muestra las cotizaciones para el administrador
    async mostrarCotizacionesAdmin(monedaBase) {
        try {
            const cotizacionesAdminDiv = document.getElementById('cotizaciones-admin');
            if (cotizacionesAdminDiv) {
                cotizacionesAdminDiv.innerHTML = '';

                for (let key in this.tasasCambio) {
                    if (key.startsWith(`${monedaBase}_`)) {
                        const monedaDestino = key.split('_')[1];
                        const div = document.createElement('div');
                        div.classList.add('cotizacion-item');

                        const label = document.createElement('label');
                        label.innerText = `1 ${monedaBase} a ${monedaDestino}`;

                        const input = document.createElement('input');
                        input.type = 'number';
                        input.value = this.tasasCambio[key];
                        input.addEventListener('input', () => {
                            try {
                                this.tasasCambio[key] = parseFloat(input.value);
                                this.tasasCambio[`${monedaDestino}_${monedaBase}`] = 1 / parseFloat(input.value);
                            } catch (error) {
                                console.error('Error al actualizar la tasa de cambio localmente:', error);
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Error',
                                    text: 'Hubo un error al actualizar la tasa de cambio localmente.'
                                });
                            }
                        });

                        const actualizarBtn = document.createElement('button');
                        actualizarBtn.innerText = 'Actualizar';
                        actualizarBtn.addEventListener('click', async () => {
                            try {
                                await firebaseManager.actualizarTasaCambio({ [`${monedaBase}_${monedaDestino}`]: parseFloat(input.value) });
                                Swal.fire({
                                    icon: 'success',
                                    title: 'Actualización Exitosa',
                                    text: 'Tasa de cambio actualizada exitosamente.'
                                });
                                await this.cargarTasasCambio();
                                this.mostrarInputsCotizacion(monedaBase);
                            } catch (error) {
                                console.error('Error al actualizar la tasa de cambio:', error);
                                Swal.fire({
                                    icon: 'error',
                                    title: 'Error',
                                    text: 'Hubo un error al actualizar la tasa de cambio.'
                                });
                            }
                        });

                        div.appendChild(label);
                        div.appendChild(input);
                        div.appendChild(actualizarBtn);
                        cotizacionesAdminDiv.appendChild(div);
                    }
                }

                this.generarSelectEliminarMoneda();
            }
        } catch (error) {
            console.error('Error al mostrar cotizaciones de admin:', error);
        }
    }

    // Población de las monedas en la sección de administrador
    poblarAdminMonedas() {
        try {
            const cotizacionesAdminDiv = document.getElementById('cotizaciones-admin');
            if (cotizacionesAdminDiv) {
                let select = document.getElementById('selectMonedaModificar');
                if (!select) {
                    select = document.createElement('select');
                    select.id = 'selectMonedaModificar';
                    cotizacionesAdminDiv.appendChild(select);
                }
                
                select.innerHTML = '';

                for (let moneda in this.nombresMonedas) {
                    const option = document.createElement('option');
                    option.value = moneda;
                    option.innerText = `${moneda} (${this.nombresMonedas[moneda] || 'Nombre no disponible'})`;
                    select.appendChild(option);
                }

                let modificarBtn = document.getElementById('btnModificarCotizaciones');
                if (!modificarBtn) {
                    modificarBtn = document.createElement('button');
                    modificarBtn.innerText = 'Modificar Cotizaciones';
                    modificarBtn.id = 'btnModificarCotizaciones';
                    modificarBtn.addEventListener('click', () => {
                        try {
                            const monedaSeleccionada = select.value;
                            this.mostrarInputsCotizacion(monedaSeleccionada);
                        } catch (error) {
                            console.error('Error al mostrar inputs de cotización:', error);
                            Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: 'Hubo un error al mostrar los inputs de cotización.'
                            });
                        }
                    });
                    cotizacionesAdminDiv.appendChild(modificarBtn);
                }
            } else {
                console.error('El elemento cotizaciones-admin no se encuentra en el DOM.');
            }
        } catch (error) {
            console.error('Error al poblar monedas de admin:', error);
        }
    }

    // Muestra los inputs de cotización para el administrador
    mostrarInputsCotizacion(moneda) {
        try {
            const divMoneda = document.getElementById('divCotizacionInputs');
            if (divMoneda) divMoneda.remove();

            const cotizacionesAdminDiv = document.getElementById('cotizaciones-admin');

            const nuevoDivMoneda = document.createElement('div');
            nuevoDivMoneda.id = 'divCotizacionInputs';
            nuevoDivMoneda.classList.add('admin-form');

            const h3 = document.createElement('h3');
            h3.innerText = `${moneda} (${this.nombresMonedas[moneda] || 'Nombre no disponible'})`;

            nuevoDivMoneda.appendChild(h3);

            for (let key in this.tasasCambio) {
                if (key.startsWith(`${moneda}_`)) {
                    const monedaDestino = key.split('_')[1];
                    const divItem = document.createElement('div');
                    divItem.classList.add('cotizacion-item');

                    const label = document.createElement('label');
                    label.innerText = `1 ${moneda} a ${monedaDestino}`;

                    const input = document.createElement('input');
                    input.type = 'number';
                    input.step = '0.01';
                    input.dataset.monedaorigen = moneda;
                    input.dataset.monedadestino = monedaDestino;
                    input.value = this.tasasCambio[`${moneda}_${monedaDestino}`] || 0;

                    divItem.appendChild(label);
                    divItem.appendChild(input);

                    const actualizarBtn = document.createElement('button');
                    actualizarBtn.innerText = 'Actualizar';
                    actualizarBtn.addEventListener('click', async () => {
                        try {
                            await firebaseManager.actualizarTasaCambio({ [`${moneda}_${monedaDestino}`]: parseFloat(input.value) });
                            Swal.fire({
                                icon: 'success',
                                title: 'Actualización Exitosa',
                                text: 'Tasa de cambio actualizada exitosamente.'
                            });
                            await this.cargarTasasCambio();
                            this.mostrarInputsCotizacion(moneda);
                        } catch (error) {
                            console.error('Error al actualizar la tasa de cambio:', error);
                            Swal.fire({
                                icon: 'error',
                                title: 'Error',
                                text: 'Hubo un error al actualizar la tasa de cambio.'
                            });
                        }
                    });

                    divItem.appendChild(actualizarBtn);
                    nuevoDivMoneda.appendChild(divItem);
                }
            }

            cotizacionesAdminDiv.appendChild(nuevoDivMoneda);
        } catch (error) {
            console.error('Error al mostrar inputs de cotización:', error);
        }
    }

    // Genera el selector para eliminar monedas
    generarSelectEliminarMoneda() {
        try {
            const relacionesDiv = document.getElementById('relacionesDiv');
            relacionesDiv.innerHTML = '';

            const eliminarDiv = document.createElement('div');
            eliminarDiv.classList.add('admin-form');

            const select = document.createElement('select');
            select.id = 'selectEliminarMoneda';

            for (let moneda in this.nombresMonedas) {
                const option = document.createElement('option');
                option.value = moneda;
                option.innerText = moneda;
                select.appendChild(option);
            }

            const eliminarBtn = document.createElement('button');
            eliminarBtn.innerText = 'Eliminar Moneda';
            eliminarBtn.addEventListener('click', () => this.eliminarMoneda());

            eliminarBtn.classList.add('boton-eliminar');

            eliminarDiv.appendChild(select);
            eliminarDiv.appendChild(eliminarBtn);

            relacionesDiv.appendChild(eliminarDiv);
        } catch (error) {
            console.error('Error al generar select para eliminar moneda:', error);
        }
    }

    // Agrega una nueva moneda
    async agregarMoneda() {
        try {
            const nuevaMoneda = document.getElementById('nuevaMoneda').value.trim().toUpperCase();
            const nombreMonedaCompleto = document.getElementById('nombreMonedaCompleto').value.trim();

            if (!nuevaMoneda || !nombreMonedaCompleto) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Por favor, complete todos los campos.'
                });
                return;
            }

            await firebaseManager.agregarNuevaMoneda(nuevaMoneda, nombreMonedaCompleto);
            Swal.fire({
                icon: 'success',
                title: 'Moneda Agregada',
                text: 'Nueva moneda agregada exitosamente.'
            });
            await this.cargarTasasCambio();
        } catch (error) {
            console.error('Error al agregar nueva moneda:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Hubo un error al agregar la nueva moneda.'
            });
        }
    }

    // Elimina una moneda existente
    async eliminarMoneda() {
        try {
            const selectMoneda = document.getElementById('selectEliminarMoneda');
            const moneda = selectMoneda.value;

            if (!moneda) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Por favor, seleccione una moneda.'
                });
                return;
            }

            await firebaseManager.eliminarMoneda(moneda);
            Swal.fire({
                icon: 'success',
                title: 'Moneda Eliminada',
                text: 'Moneda eliminada exitosamente.'
            });
            await this.cargarTasasCambio();
        } catch (error) {
            console.error('Error al eliminar moneda:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Hubo un error al eliminar la moneda.'
            });
        }
    }
}

// Inicializa la clase ConvertidorDivisas
const convertidorDivisas = new ConvertidorDivisas();
