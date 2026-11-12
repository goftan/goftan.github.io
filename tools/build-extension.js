#!/usr/bin/env node
/**
 * Builds the Quiz Pulse browser extension (new-tab quiz) from quiz/.
 *
 *   node tools/build-extension.js        ->  dist/extension/
 *
 * The web app and the extension share one codebase. Extension pages run under
 * a content security policy that forbids three things the web page uses, so
 * the build rewrites index.html:
 *
 *   - inline <script> blocks      -> dropped (only the service-worker
 *                                    registration, which an extension page
 *                                    neither needs nor can use)
 *   - inline on*="" handlers      -> moved into js_src/ext_handlers.js and
 *                                    attached with addEventListener
 *   - scripts loaded from a CDN   -> replaced by a copy bundled in vendor/
 *
 * The Font Awesome stylesheet is bundled the same way. A remote stylesheet is
 * allowed by the policy, but a new-tab page should not need the network.
 *
 * Anything it does not know how to rewrite is an error, not a silent skip, so
 * a change to quiz/index.html cannot quietly produce a broken extension.
 */
'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');
const crypto = require('crypto');

const ROOT = path.resolve(__dirname, '..');
const SRC = path.join(ROOT, 'quiz');
const EXT = path.join(ROOT, 'extension');
const OUT = path.join(ROOT, 'dist', 'extension');
const VENDOR_CACHE = path.join(EXT, 'vendor');

// Remote scripts the page loads, and the pinned file bundled in their place.
// plotly-latest on the CDN is frozen at 1.58.5; the basic bundle of the same
// version covers the bar and line charts the results page draws.
const REMOTE_SCRIPTS = {
    'https://cdn.plot.ly/plotly-latest.min.js': {
        file: 'plotly-basic-1.58.5.min.js',
        url: 'https://cdn.plot.ly/plotly-basic-1.58.5.min.js',
        sha256: '75e92469b4c54da6c7ed5286841d69ffe47bbfb4ded1624d2e1e2afa0596362d',
    },
};

// Remote stylesheets, the bundled stylesheet that replaces each, and the files
// that stylesheet pulls in. Only the icon styles the page uses are bundled
// (solid, regular, v4 names); the brands font is not.
const FA = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/';
const REMOTE_STYLES = {
    'https://use.fontawesome.com/releases/v6.4.0/css/all.css': {
        href: 'vendor/fontawesome/css/all.min.css',
        files: [
            { file: 'fontawesome/css/all.min.css', url: FA + 'css/all.min.css', sha256: '1edb1725a9ea8ca4dcf2f5508cee183218aa1685e47c1b23056717f754f58ebf' },
            { file: 'fontawesome/webfonts/fa-solid-900.woff2', url: FA + 'webfonts/fa-solid-900.woff2', sha256: '7152a6933ee3d690ec2af3d09da9d701723d16aa3410a6d80f28ff8866f3b880' },
            { file: 'fontawesome/webfonts/fa-regular-400.woff2', url: FA + 'webfonts/fa-regular-400.woff2', sha256: '8e7e5ea1b15f62ab14dbd41768e8fbcd21cc859a4ea5da812457ee714299fb35' },
            { file: 'fontawesome/webfonts/fa-v4compatibility.woff2', url: FA + 'webfonts/fa-v4compatibility.woff2', sha256: '694a17c3d9d6c05f8aac63c544615552a4b220e9a4de863d87341a6bcfc1bc8d' },
        ],
    },
};

// Files in quiz/ that have no place in the extension.
const SKIP = [
    /(^|\/)\./,               // dotfiles and dot-directories
    /^service-worker\.js$/,   // extension pages are already local
    /^manifest\.json$/,       // the web-app manifest; replaced by the extension's
    /\.md$/i,
    /(^|\/)[^/]*OLD\.json$/,  // superseded question banks, not referenced by the app
];

const HANDLERS_FILE = 'js_src/ext_handlers.js';

function decodeEntities(s) {
    return s
        .replace(/&quot;/g, '"')
        .replace(/&#39;|&apos;/g, "'")
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&amp;/g, '&');
}

/**
 * Rewrites the web page into one that satisfies the extension CSP.
 * Pure function: returns { html, handlersJs, vendorFiles } and touches no files.
 */
function transformHtml(html, remoteScripts, remoteStyles) {
    remoteScripts = remoteScripts || REMOTE_SCRIPTS;
    remoteStyles = remoteStyles || REMOTE_STYLES;

    // Comments first, so commented-out markup is never rewritten or counted.
    html = html.replace(/<!--[\s\S]*?-->/g, '');

    html = html.replace(/[ \t]*<link\b[^>]*\brel=["']manifest["'][^>]*>\s*\n?/gi, '');

    // Inline script blocks: only the service-worker registration is expected.
    html = html.replace(/[ \t]*<script\b([^>]*)>([\s\S]*?)<\/script>\s*\n?/gi, function (block, attrs, body) {
        if (/\bsrc\s*=/.test(attrs)) return block;
        if (/serviceWorker/.test(body)) return '';
        throw new Error('Unexpected inline <script> in index.html; move it to a file under js_src/:\n' + body.trim().slice(0, 200));
    });

    // Remote scripts -> bundled copies.
    const vendorFiles = [];
    html = html.replace(/(<script\b[^>]*\bsrc=)(["'])(https?:\/\/[^"']+)\2/gi, function (m, pre, q, url) {
        const repl = remoteScripts[url];
        if (!repl) throw new Error('Remote script with no bundled replacement: ' + url);
        vendorFiles.push(repl);
        return pre + q + 'vendor/' + repl.file + q;
    });

    // Remote stylesheets -> bundled copies.
    html = html.replace(/<link\b[^>]*>/gi, function (tag) {
        if (!/\brel=["']stylesheet["']/i.test(tag)) return tag;
        const m = /\bhref=(["'])(https?:\/\/[^"']+)\1/i.exec(tag);
        if (!m) return tag;
        const repl = remoteStyles[m[2]];
        if (!repl) throw new Error('Remote stylesheet with no bundled replacement: ' + m[2]);
        repl.files.forEach(function (f) { vendorFiles.push(f); });
        return tag.replace(m[2], repl.href);
    });

    // Inline handlers -> data attributes plus one generated script.
    const binds = [];
    html = html.replace(/(\s)on([a-z]+)\s*=\s*"([^"]*)"/g, function (m, ws, type, code) {
        const id = binds.length;
        binds.push({ id: id, type: type, code: decodeEntities(code) });
        return ws + 'data-ext-on="' + id + '"';
    });
    if (/\son[a-z]+\s*=\s*'/.test(html)) {
        throw new Error('Single-quoted inline event handler found; use double quotes or addEventListener.');
    }

    const handlersJs =
        '// Generated by tools/build-extension.js from the on*="" attributes of quiz/index.html.\n' +
        '// Do not edit.\n' +
        '(function () {\n' +
        '    function bind(id, type, fn) {\n' +
        '        var el = document.querySelector(\'[data-ext-on="\' + id + \'"]\');\n' +
        '        if (!el) return;\n' +
        '        el.addEventListener(type, function (event) {\n' +
        '            if (fn.call(el, event) === false) event.preventDefault();\n' +
        '        });\n' +
        '    }\n' +
        binds.map(function (b) {
            return '    bind(' + b.id + ', ' + JSON.stringify(b.type) + ', function (event) { ' + b.code + ' });\n';
        }).join('') +
        '})();\n';

    if (binds.length) {
        if (!/<\/body>/i.test(html)) throw new Error('index.html has no </body> to place the handler script before.');
        html = html.replace(/<\/body>/i, '<script src="' + HANDLERS_FILE + '"></script>\n</body>');
    }

    return { html: html, handlersJs: handlersJs, vendorFiles: vendorFiles, handlerCount: binds.length };
}

/** Problems that would make the page fail under the extension CSP, or need the network. Empty = ok. */
function findCspViolations(html) {
    const problems = [];
    const stripped = html.replace(/<!--[\s\S]*?-->/g, '');
    (stripped.match(/<script\b[^>]*>/gi) || []).forEach(function (tag) {
        if (!/\bsrc\s*=/.test(tag)) problems.push('inline script: ' + tag);
        else if (/\bsrc=["']https?:/i.test(tag)) problems.push('remote script: ' + tag);
    });
    (stripped.match(/\son[a-z]+\s*=\s*["'][^"']*["']/g) || []).forEach(function (attr) {
        problems.push('inline handler:' + attr);
    });
    (stripped.match(/<link\b[^>]*>/gi) || []).forEach(function (tag) {
        if (/\brel=["']stylesheet["']/i.test(tag) && /\bhref=["']https?:/i.test(tag)) problems.push('remote stylesheet: ' + tag);
    });
    if (/javascript:/i.test(stripped)) problems.push('javascript: URL');
    return problems;
}

function copyTree(src, dst, rel) {
    rel = rel || '';
    fs.mkdirSync(dst, { recursive: true });
    fs.readdirSync(src, { withFileTypes: true }).forEach(function (entry) {
        const r = rel ? rel + '/' + entry.name : entry.name;
        if (SKIP.some(function (re) { return re.test(r); })) return;
        const s = path.join(src, entry.name);
        const d = path.join(dst, entry.name);
        if (entry.isDirectory()) copyTree(s, d, r);
        else if (entry.isFile()) fs.copyFileSync(s, d);
    });
}

function download(url) {
    return new Promise(function (resolve, reject) {
        https.get(url, function (res) {
            if (res.statusCode !== 200) {
                res.resume();
                return reject(new Error('GET ' + url + ' -> HTTP ' + res.statusCode));
            }
            const chunks = [];
            res.on('data', function (c) { chunks.push(c); });
            res.on('end', function () { resolve(Buffer.concat(chunks)); });
        }).on('error', reject);
    });
}

/** Returns the bundled script's bytes, downloading it into extension/vendor/ once. */
async function vendorFile(spec) {
    const cached = path.join(VENDOR_CACHE, spec.file);
    let data;
    if (fs.existsSync(cached)) {
        data = fs.readFileSync(cached);
    } else {
        console.log('  fetching ' + spec.url);
        try {
            data = await download(spec.url);
        } catch (e) {
            throw new Error(e.message + '\nThe extension bundles this file. Download it once to ' +
                path.relative(ROOT, cached) + ' and re-run.');
        }
    }
    if (spec.sha256) {
        const sum = crypto.createHash('sha256').update(data).digest('hex');
        if (sum !== spec.sha256) {
            throw new Error(spec.file + ' has sha256 ' + sum + ', expected ' + spec.sha256 +
                '. Delete ' + path.relative(ROOT, cached) + ' and re-run, or update the pin.');
        }
    }
    if (!fs.existsSync(cached)) {
        fs.mkdirSync(path.dirname(cached), { recursive: true });
        fs.writeFileSync(cached, data);
    }
    return data;
}

async function build() {
    fs.rmSync(OUT, { recursive: true, force: true });
    copyTree(SRC, OUT);

    const result = transformHtml(fs.readFileSync(path.join(SRC, 'index.html'), 'utf8'));
    const problems = findCspViolations(result.html);
    if (problems.length) throw new Error('Built page still violates the extension CSP:\n  ' + problems.join('\n  '));

    fs.writeFileSync(path.join(OUT, 'index.html'), result.html);
    fs.writeFileSync(path.join(OUT, HANDLERS_FILE), result.handlersJs);

    for (const spec of result.vendorFiles) {
        const dest = path.join(OUT, 'vendor', spec.file);
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.writeFileSync(dest, await vendorFile(spec));
    }

    fs.copyFileSync(path.join(EXT, 'manifest.json'), path.join(OUT, 'manifest.json'));
    fs.readdirSync(EXT).filter(function (f) { return /^icon-\d+\.png$/.test(f); }).forEach(function (f) {
        fs.copyFileSync(path.join(EXT, f), path.join(OUT, f));
    });

    const manifest = JSON.parse(fs.readFileSync(path.join(OUT, 'manifest.json'), 'utf8'));
    console.log('Built ' + manifest.name + ' ' + manifest.version + ' -> ' + path.relative(ROOT, OUT) +
        ' (' + result.handlerCount + ' handlers moved out of the page)');
}

module.exports = { transformHtml: transformHtml, findCspViolations: findCspViolations, decodeEntities: decodeEntities };

if (require.main === module) {
    build().catch(function (e) {
        console.error('build-extension: ' + e.message);
        process.exit(1);
    });
}
