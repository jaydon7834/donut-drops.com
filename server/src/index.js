import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";

async function bootstrap() {
  await connectDb();
  const app = createApp();

  app.listen(env.port, () => {
    console.log(`DonutDrop server listening on port ${env.port}`);
  });
}

bootstrap().catch((error) => {
  console.error("Failed to start server", error);
  process.exit(1);
});
