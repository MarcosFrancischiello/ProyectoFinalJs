document.addEventListener('DOMContentLoaded', function() {

    // Genera el formulario de inicio de sesión
    function generarFormularioInicioSesion() {
        const loginForm = document.createElement('div');
        loginForm.id = 'login-form';
        loginForm.className = 'login-form';
        
        const usuarioInput = document.createElement('input');
        usuarioInput.type = 'text';
        usuarioInput.placeholder = 'Usuario';
        usuarioInput.id = 'usuarioFirebase';

        const contrasenaInput = document.createElement('input');
        contrasenaInput.type = 'password';
        contrasenaInput.placeholder = 'Contraseña';
        contrasenaInput.id = 'contrasenaFirebase';

        const iniciarSesionBtn = document.createElement('button');
        iniciarSesionBtn.innerText = 'Iniciar Sesión';
        iniciarSesionBtn.id = 'iniciarSesion';

        loginForm.appendChild(usuarioInput);
        loginForm.appendChild(contrasenaInput);
        loginForm.appendChild(iniciarSesionBtn);

        return loginForm;
    }

    // Agrega el botón para ver el historial
    function agregarBotonVerHistorial() {
        try {
            const loginForm = document.getElementById('login-form');
            if (!document.getElementById('verHistorial')) {
                const verHistorialBtn = document.createElement('button');
                verHistorialBtn.innerText = 'Ver Historial';
                verHistorialBtn.id = 'verHistorial';
                verHistorialBtn.addEventListener('click', () => convertidorDivisas.mostrarHistorial());
                loginForm.appendChild(verHistorialBtn);
            }
        } catch (error) {
            console.error('Error al agregar botón de ver historial:', error);
        }
    }

    const loginContainer = document.getElementById('login-container');
    loginContainer.appendChild(generarFormularioInicioSesion());

    // Maneja el evento de iniciar sesión
    document.getElementById('iniciarSesion').addEventListener('click', async function() {
        try {
            const usuario = document.getElementById('usuarioFirebase').value.trim();
            const contrasena = document.getElementById('contrasenaFirebase').value.trim();

            if (!usuario || !contrasena) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Por favor, complete todos los campos.'
                });
                return;
            }

            if (usuario === 'PROYECTO' && contrasena === 'CODER') {
                Swal.fire({
                    icon: 'success',
                    title: 'Inicio de Sesión Exitoso',
                    text: 'Has iniciado sesión correctamente.'
                });
                localStorage.setItem('usuarioActual', 'PROYECTO');
                agregarBotonVerHistorial();
                const adminSection = document.getElementById('admin-section');
                if (adminSection) {
                    adminSection.style.display = 'block';
                } else {
                    console.error('El elemento admin-section no se encuentra en el DOM.');
                }
                await cargarCotizacionesAdmin();
                return;
            }

            const userData = await firebaseManager.obtenerUsuario(usuario);
            if (userData && userData.contrasena === contrasena) {
                Swal.fire({
                    icon: 'success',
                    title: 'Inicio de Sesión Exitoso',
                    text: 'Has iniciado sesión correctamente.'
                });
                localStorage.setItem('usuarioActual', usuario);
                agregarBotonVerHistorial();
                const adminSection = document.getElementById('admin-section');
                const usuarioSection = document.getElementById('usuario-section');
                if (adminSection) {
                    adminSection.style.display = 'none';
                } else {
                    console.error('El elemento admin-section no se encuentra en el DOM.');
                }
                if (usuarioSection) {
                    usuarioSection.style.display = 'block';
                    await cargarCotizacionesUsuario(usuario);
                } else {
                    console.error('El elemento usuario-section no se encuentra en el DOM.');
                }
            } else {
                throw new Error('Usuario o contraseña incorrectos.');
            }
        } catch (error) {
            console.error('Error al iniciar sesión:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Usuario o contraseña incorrectos. Por favor, inténtalo de nuevo.'
            });
        }
    });

    // Genera el formulario de registro
    function generarFormularioRegistro() {
        const registroForm = document.createElement('div');
        registroForm.id = 'registro-form';
        registroForm.className = 'registro-form';
        
        const usuarioInput = document.createElement('input');
        usuarioInput.type = 'text';
        usuarioInput.placeholder = 'Usuario';
        usuarioInput.id = 'usuarioRegistro';

        const contrasenaInput = document.createElement('input');
        contrasenaInput.type = 'password';
        contrasenaInput.placeholder = 'Contraseña';
        contrasenaInput.id = 'contrasenaRegistro';

        const registrarseBtn = document.createElement('button');
        registrarseBtn.innerText = 'Registrarse';
        registrarseBtn.id = 'registrarse';

        registroForm.appendChild(usuarioInput);
        registroForm.appendChild(contrasenaInput);
        registroForm.appendChild(registrarseBtn);

        return registroForm;
    }

    const registroContainer = document.getElementById('registro-container');
    registroContainer.appendChild(generarFormularioRegistro());

    // Maneja el evento de registrarse
    document.getElementById('registrarse').addEventListener('click', async function() {
        try {
            const usuario = document.getElementById('usuarioRegistro').value.trim();
            const contrasena = document.getElementById('contrasenaRegistro').value.trim();

            if (!usuario || !contrasena) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'Por favor, complete todos los campos.'
                });
                return;
            }

            if (contrasena.length < 6) {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: 'La contraseña debe tener al menos 6 caracteres.'
                });
                return;
            }

            await firebaseManager.agregarNuevoUsuario(usuario, contrasena);
            Swal.fire({
                icon: 'success',
                title: 'Registro Exitoso',
                text: 'Registro exitoso. Por favor, inicia sesión.'
            });
        } catch (error) {
            console.error('Error al registrar usuario:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Hubo un error durante el registro. Por favor, inténtalo de nuevo.'
            });
        }
    });

    // Carga las cotizaciones para el administrador
    async function cargarCotizacionesAdmin() {
        try {
            const cotizaciones = await firebaseManager.obtenerTasasCambio();
            const nombresMonedas = await firebaseManager.obtenerNombresMonedas();
            const cotizacionesAdminDiv = document.getElementById('cotizaciones-admin');
            cotizacionesAdminDiv.innerHTML = '';

            const monedas = Object.keys(cotizaciones).filter(moneda => !moneda.includes('_'));

            const select = document.createElement('select');
            select.id = 'selectMonedaModificar';

            monedas.forEach(moneda => {
                const option = document.createElement('option');
                option.value = moneda;
                option.innerText = `${moneda} (${nombresMonedas[moneda] || 'Nombre no disponible'})`;
                select.appendChild(option);
            });

            const modificarBtn = document.createElement('button');
            modificarBtn.innerText = 'Modificar Cotizaciones';
            modificarBtn.id = 'btnModificarCotizaciones';
            modificarBtn.addEventListener('click', () => {
                try {
                    const monedaSeleccionada = select.value;
                    convertidorDivisas.mostrarInputsCotizacion(monedaSeleccionada);
                } catch (error) {
                    console.error('Error al mostrar inputs de cotización:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: 'Hubo un error al mostrar los inputs de cotización.'
                    });
                }
            });

            cotizacionesAdminDiv.appendChild(select);
            cotizacionesAdminDiv.appendChild(modificarBtn);

            convertidorDivisas.generarSelectEliminarMoneda();
        } catch (error) {
            console.error('Error al cargar cotizaciones para administrador:', error);
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'Hubo un error al cargar las cotizaciones para el administrador.'
            });
        }
    }

    // Si el usuario actual es "PROYECTO", carga las cotizaciones de admin
    if (localStorage.getItem('usuarioActual') === 'PROYECTO') {
        cargarCotizacionesAdmin();
    }
});
