import app from "./src/app";

const port = 3000;

app.listen(port, () => {
  console.log(`\x1b[36m%s\x1b[0m`, `--------------------------------------------------`);
  console.log(`\x1b[1m\x1b[32m%s\x1b[0m`, `  Servidor de Etiquetas Zebra (TS) Listo!`);
  console.log(`\x1b[36m%s\x1b[0m`, `  URL: http://localhost:${port}`);
  console.log(`\x1b[36m%s\x1b[0m`, `  Swagger: http://localhost:${port}/api-docs`);
  console.log(`\x1b[36m%s\x1b[0m`, `--------------------------------------------------`);
});