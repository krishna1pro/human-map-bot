(async () => {
    try {
        console.log("🚀 Starting Moltbot Engine...");
        
        // Use dynamic import to handle ES Modules
        const moltbot = await import('./node_modules/moltbot/dist/index.js');
        
        // In ESM, the exports are usually in .default or .start
        const startFn = moltbot.start || moltbot.default;

        if (typeof startFn === 'function') {
            console.log("✅ Found start function, initializing with SKILL.md...");
            await startFn({ skill: './SKILL.md' });
        } else {
            console.log("❌ Could not find function. Available exports:", Object.keys(moltbot));
        }
    } catch (err) {
        console.error("❌ Critical Error during startup:", err.message);
    }
})();
