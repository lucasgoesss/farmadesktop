import { contextBridge } from "electron";

contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  isDesktop: true,
  apiPort: process.env["API_PORT"] ?? "8081",
});
