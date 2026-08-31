# Guía de Despliegue: Synth Argentina 🚀

Este repositorio está preparado para ser desplegado de forma rápida y gratuita utilizando **GitHub**, **Supabase** (Base de datos PostgreSQL) y **Vercel** (Servidor y Frontend).

---

## 🛠️ Paso 1: Configurar la Base de Datos en Supabase

1. Crea una cuenta gratuita en [Supabase](https://supabase.com/).
2. Haz clic en **New Project** y selecciona un nombre (ej. `synth-argentina`) y una contraseña fuerte para la base de datos.
3. Elige la región geográfica más cercana (por ejemplo, `Sao Paulo` o `East US`).
4. Una vez creado el proyecto, ve a la barra lateral izquierda a **Project Settings** (icono de engranaje) > **Database**.
5. Busca la sección **Connection string**, selecciona la pestaña **URI** y copia la cadena de conexión. Será similar a esta:
   `postgresql://postgres.[tu-id-proyecto]:[tu-contraseña]@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`
   * *(Nota: Recuerda reemplazar `[tu-contraseña]` por la contraseña real que configuraste al crear el proyecto).*

---

## 💻 Paso 2: Crear el Repositorio en GitHub y Subir el Código

1. Entra a tu cuenta de [GitHub](https://github.com/) y crea un nuevo repositorio vacío (no marques la opción de agregar README o .gitignore, ya que el proyecto local los tiene creados).
2. Abre una terminal de PowerShell en la carpeta del proyecto y ejecuta los siguientes comandos para subir el código:
   ```powershell
   git branch -M main
   git commit -m "feat: preparar proyecto para Vercel y Supabase"
   git remote add origin <PEGA_AQUÍ_LA_URL_DE_TU_REPOSITORIO_DE_GITHUB>
   git push -u origin main
   ```

---

## 🚀 Paso 3: Desplegar en Vercel

1. Inicia sesión en [Vercel](https://vercel.com/) con tu cuenta de GitHub.
2. Haz clic en **Add New** > **Project**.
3. Importa el repositorio de `Proyecto comunidad Sinth` que acabas de subir.
4. En la configuración del proyecto, expande la sección **Environment Variables** (Variables de Entorno) y agrega las siguientes claves:
   * **`DATABASE_URL`**: Pega la cadena de conexión URI de Supabase que copiaste en el Paso 1.
   * **`JWT_SECRET_KEY`**: Escribe una frase larga y secreta al azar (se usa para firmar de forma segura las sesiones de los usuarios).
   * **`GOOGLE_CLIENT_ID`** *(Opcional)*: Si vas a configurar el login real de Google, coloca aquí tu Client ID de Google Cloud Platform.
5. Haz clic en **Deploy**.
6. ¡Listo! Vercel compilará automáticamente las dependencias usando `requirements.txt` y servirá el frontend de forma estática y el backend mediante funciones Serverless en la nube de Vercel.
