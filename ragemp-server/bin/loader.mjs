import { createRequire } from 'module'; import fs from 'fs'; import path from 'path'; (async function () {
    const FgReset = "\x1b[0m"; const FgRed = "\x1b[31m"; const FgGreen = "\x1b[32m"; const FgYellow = "\x1b[33m"; const FgBlue = "\x1b[34m"; async function loadPackages() {
        const require = createRequire(import.meta.url); function getDirectories(srcpath) { return fs.readdirSync(srcpath).filter(file => { return fs.statSync(path.join(srcpath, file)).isDirectory() }) }
        console.log(`${FgYellow}[INFO]${FgReset} Loading NodeJS packages...`); for (let src of getDirectories('packages')) {
            try {
                if (fs.existsSync('./packages/' + src + '/index.js')) { require('./../packages/' + src + '/index.js') } else { await import('./../packages/' + src + '/index.mjs') }
                console.log(`${FgGreen}[DONE]${FgReset} "${src}" package has been loaded.`)
            } catch (e) { console.error(`${FgRed}[ERROR]${FgReset} "${src}" package loading failed, exception stack:\n${e.stack}\n\n`) }
        }
    }
    await loadPackages(); console.log(`${FgYellow}[INFO]${FgReset} Starting packages...`); let successful = !0; if (typeof mp !== 'undefined' && mp.events) {
        for (let h of mp.events.getAllOf('packagesLoaded')) {
            try { h() }
            catch (e) { successful = !1; console.error(`${FgRed}[ERROR]${FgReset} ${e.stack}`) }
        }
        mp.events.remove('packagesLoaded'); mp.events.initialized = !0
    } else { console.log(`${FgYellow}[INFO]${FgReset} mp object not available yet, skipping packagesLoaded events`); }
    console.log(successful ? `${FgGreen}[DONE]${FgReset} Server packages have been started.` : `${FgRed}[ERROR]${FgReset} Some packages have not managed to launch successfully, check the logs above.`)
})()