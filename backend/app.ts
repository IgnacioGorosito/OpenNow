import { createApp } from './src/createApp';
import { initDB } from './src/db/init';

const app = createApp();

// Inicializar BD y arrancar servidor
const PORT = Number(process.env.PORT) || 3000;

initDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 [OpenNow] Servidor corriendo en http://localhost:${PORT}/`);
    });
  })
  .catch((err) => {
    console.error('No se pudo inicializar la base de datos:', err);
    process.exit(1);
  });