import app from "./app";
import luaLoader from "./lua/luaLoader";

const PORT = process.env.PORT || 3000;

async function start() {
    await luaLoader.loadScripts();

    app.listen(PORT, () => {
        console.log(`Server running on ${PORT}`);
    });
}

start();