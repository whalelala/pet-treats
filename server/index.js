import { app } from './app.js';

const port = Number(process.env.PORT || process.argv[2] || 8787);
const keepAlive = setInterval(() => {}, 2147483647);

const server = app.listen(port, () => {
  console.log(`Paw Pantry server running at http://127.0.0.1:${port}`);
});

process.on('SIGTERM', () => {
  clearInterval(keepAlive);
  server.close(() => {
    process.exit(0);
  });
});