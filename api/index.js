let cachedApp;

module.exports = async (req, res) => {
    if (!cachedApp) {
        const mod = await import("../artifacts/api-server/dist/app.mjs");
        cachedApp = mod.default;
    }

    return cachedApp(req, res);
};
