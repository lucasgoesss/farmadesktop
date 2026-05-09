import { app, BrowserWindow, shell } from "electron";
import path from "path";
import { spawn, type ChildProcess } from "child_process";
import http from "http";
import { fileURLToPath } from "url";
import { mkdirSync } from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const API_PORT = parseInt(process.env["API_PORT"] ?? "8081", 10);
const FRONTEND_PORT = parseInt(process.env["FRONTEND_PORT"] ?? "5173", 10);
const isDev = !app.isPackaged;

let apiServerProcess: ChildProcess | null = null;
let mainWindow: BrowserWindow | null = null;

function waitForServer(port: number, maxRetries = 30): Promise<void> {
  return new Promise((resolve, reject) => {
    let retries = 0;
    const check = () => {
      const req = http.get(`http://127.0.0.1:${port}/api/healthz`, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          retry();
        }
        res.resume();
      });
      req.on("error", retry);
      req.end();
    };
    const retry = () => {
      if (++retries >= maxRetries) {
        reject(new Error(`API server on port ${port} did not start within ${maxRetries * 500}ms`));
      } else {
        setTimeout(check, 500);
      }
    };
    check();
  });
}

async function startApiServer(): Promise<void> {
  const userData = app.getPath("userData");
  const dbDir = path.join(userData, "data");
  mkdirSync(dbDir, { recursive: true });

  const sqlitePath =
    process.env["SQLITE_PATH"] ?? path.join(dbDir, "farmasystem.db");

  const serverScript = isDev
    ? path.join(__dirname, "..", "..", "api-server", "dist-desktop", "index.mjs")
    : path.join(process.resourcesPath, "api-server", "index.mjs");

  apiServerProcess = spawn(
    process.execPath.replace("electron", "node"),
    ["--enable-source-maps", serverScript],
    {
      env: {
        ...process.env,
        PORT: String(API_PORT),
        DB_DRIVER: "sqlite",
        SQLITE_PATH: sqlitePath,
        NODE_ENV: isDev ? "development" : "production",
        LOG_LEVEL: isDev ? "debug" : "info",
      },
      stdio: ["ignore", "pipe", "pipe"],
    }
  );

  apiServerProcess.stdout?.on("data", (d: Buffer) =>
    process.stdout.write(d)
  );
  apiServerProcess.stderr?.on("data", (d: Buffer) =>
    process.stderr.write(d)
  );
  apiServerProcess.on("exit", (code) => {
    if (code !== 0 && code !== null) {
      console.error(`[desktop] API server exited with code ${code}`);
    }
  });

  console.log(`[desktop] Waiting for API server on port ${API_PORT}...`);
  await waitForServer(API_PORT);
  console.log(`[desktop] API server ready.`);
}

async function createWindow(): Promise<void> {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
    title: "FarmaSystem",
    show: false,
    backgroundColor: "#ffffff",
  });

  mainWindow.once("ready-to-show", () => {
    mainWindow?.show();
    if (isDev) mainWindow?.webContents.openDevTools();
  });

  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: "deny" };
  });

  const frontendUrl = isDev
    ? `http://localhost:${FRONTEND_PORT}`
    : `file://${path.join(__dirname, "..", "public", "index.html")}`;

  console.log(`[desktop] Loading frontend: ${frontendUrl}`);
  await mainWindow.loadURL(frontendUrl);

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(async () => {
  try {
    await startApiServer();
    await createWindow();
  } catch (err) {
    console.error("[desktop] Failed to start FarmaSystem:", err);
    app.quit();
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow().catch(console.error);
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    apiServerProcess?.kill("SIGTERM");
    app.quit();
  }
});

app.on("before-quit", () => {
  apiServerProcess?.kill("SIGTERM");
});
