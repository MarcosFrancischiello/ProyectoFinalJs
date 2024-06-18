class FirebaseManager {
    constructor() {
        // Inicializar Firebase aquí si es necesario
    }

    // Obtiene la información del usuario desde Firebase
    async obtenerUsuario(usuario) {
        try {
            const response = await fetch(`https://calculadora-41a41-default-rtdb.firebaseio.com/usuarios/${usuario}.json`);
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error al obtener el usuario:', error);
            return null;
        }
    }

    // Obtiene el historial de transacciones del usuario desde Firebase
    async obtenerHistorialUsuario(usuario) {
        try {
            const response = await fetch(`https://calculadora-41a41-default-rtdb.firebaseio.com/historialTransacciones/${usuario}.json`);
            const data = await response.json();
            return data ? Object.values(data) : [];
        } catch (error) {
            console.error('Error al obtener historial del usuario:', error);
            return [];
        }
    }

    // Envía una transacción al historial del usuario en Firebase
    async enviarTransaccion(usuario, transaccion) {
        try {
            const response = await fetch(`https://calculadora-41a41-default-rtdb.firebaseio.com/historialTransacciones/${usuario}.json`, {
                method: 'POST',
                body: JSON.stringify(transaccion),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error al enviar transacción:', error);
            return null;
        }
    }

    // Obtiene las tasas de cambio desde Firebase
    async obtenerTasasCambio() {
        try {
            const response = await fetch('https://calculadora-41a41-default-rtdb.firebaseio.com/tasasCambio.json');
            const data = await response.json();
            return data ? data : {};
        } catch (error) {
            console.error('Error al obtener las tasas de cambio:', error);
            return {};
        }
    }

    // Obtiene los nombres de las monedas desde Firebase
    async obtenerNombresMonedas() {
        try {
            const response = await fetch('https://calculadora-41a41-default-rtdb.firebaseio.com/nombresMonedas.json');
            const data = await response.json();
            return data ? data : {};
        } catch (error) {
            console.error('Error al obtener los nombres de las monedas:', error);
            return {};
        }
    }

    // Actualiza las tasas de cambio en Firebase
    async actualizarTasaCambio(tasas) {
        try {
            const updates = {};
            for (const [key, value] of Object.entries(tasas)) {
                updates[`tasasCambio/${key}`] = value;
            }
            const response = await fetch(`https://calculadora-41a41-default-rtdb.firebaseio.com/.json`, {
                method: 'PATCH',
                body: JSON.stringify(updates),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error al actualizar tasa de cambio:', error);
            return null;
        }
    }

    // Agrega una nueva moneda en Firebase
    async agregarNuevaMoneda(nuevaMoneda, nombreCompleto) {
        try {
            const tasasExistentes = await this.obtenerTasasCambio();
            const updates = {};

            for (const monedaExistente in tasasExistentes) {
                if (!monedaExistente.includes('_')) {
                    const tasaDirecta = 1;
                    updates[`tasasCambio/${nuevaMoneda}_${monedaExistente}`] = tasaDirecta;
                    updates[`tasasCambio/${monedaExistente}_${nuevaMoneda}`] = 1 / tasaDirecta;
                }
            }

            updates[`tasasCambio/${nuevaMoneda}`] = 1;
            updates[`nombresMonedas/${nuevaMoneda}`] = nombreCompleto;

            const response = await fetch(`https://calculadora-41a41-default-rtdb.firebaseio.com/.json`, {
                method: 'PATCH',
                body: JSON.stringify(updates),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error al agregar nueva moneda:', error);
            return null;
        }
    }

    // Agrega un nuevo usuario en Firebase
    async agregarNuevoUsuario(usuario, contrasena) {
        try {
            const response = await fetch(`https://calculadora-41a41-default-rtdb.firebaseio.com/usuarios/${usuario}.json`, {
                method: 'PUT',
                body: JSON.stringify({ usuario, contrasena }),
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error al agregar nuevo usuario:', error);
            return null;
        }
    }

    // Limpia el historial de transacciones del usuario en Firebase
    async limpiarHistorialUsuario(usuario) {
        try {
            const response = await fetch(`https://calculadora-41a41-default-rtdb.firebaseio.com/historialTransacciones/${usuario}.json`, {
                method: 'DELETE'
            });
            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error al limpiar historial del usuario:', error);
            return null;
        }
    }

    // Elimina una moneda de Firebase
    async eliminarMoneda(moneda) {
        try {
            const tasasExistentes = await this.obtenerTasasCambio();
            const updates = {};

            for (const key in tasasExistentes) {
                if (key.startsWith(moneda) || key.endsWith(moneda)) {
                    updates[`tasasCambio/${key}`] = null;
                }
            }

            updates[`nombresMonedas/${moneda}`] = null;

            const response = await fetch(`https://calculadora-41a41-default-rtdb.firebaseio.com/.json`, {
                method: 'PATCH',
                body: JSON.stringify(updates),
                headers: {
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error al eliminar moneda:', error);
            return null;
        }
    }
}

// Inicializa la clase FirebaseManager
const firebaseManager = new FirebaseManager();
