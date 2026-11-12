/**
 * The extension build rewrites quiz/index.html to satisfy the extension
 * content security policy. These tests pin that rewrite, and check that the
 * real page still goes through it cleanly.
 */
const fs = require('fs');
const path = require('path');
const { transformHtml, findCspViolations, decodeEntities } = require('../../tools/build-extension');

const REMOTE = { 'https://cdn.example/lib.js': { file: 'lib.js', url: 'https://cdn.example/lib.js' } };
const page = body => '<html><head></head><body>' + body + '</body></html>';

describe('transformHtml', () => {
    test('moves inline handlers into the generated script', () => {
        const r = transformHtml(page('<button id="a" onclick="go(1)">x</button><input oninput="f(this)">'), REMOTE);
        expect(r.handlerCount).toBe(2);
        expect(r.html).not.toMatch(/onclick|oninput/);
        expect(r.html).toContain('<button id="a" data-ext-on="0">');
        expect(r.handlersJs).toContain('bind(0, "click", function (event) { go(1) });');
        expect(r.handlersJs).toContain('bind(1, "input", function (event) { f(this) });');
        expect(r.html).toMatch(/<script src="js_src\/ext_handlers\.js"><\/script>\s*<\/body>/);
    });

    test('generated script is valid JavaScript and honours "return false"', () => {
        const r = transformHtml(page('<a href="#" onclick="hit(this); return false;">x</a>'), REMOTE);
        let listener;
        const el = { addEventListener: (type, fn) => { listener = fn; } };
        const calls = [];
        new Function('document', 'hit', r.handlersJs)({ querySelector: () => el }, t => calls.push(t));
        const event = { prevented: false, preventDefault() { this.prevented = true; } };
        listener(event);
        expect(calls).toEqual([el]);
        expect(event.prevented).toBe(true);
    });

    test('decodes HTML entities in handler code', () => {
        const r = transformHtml(page('<b onclick="if (a &amp;&amp; b &lt; 2) say(&quot;hi&quot;)">x</b>'), REMOTE);
        expect(r.handlersJs).toContain('if (a && b < 2) say("hi")');
        expect(decodeEntities('&amp;lt;')).toBe('&lt;');
    });

    test('drops the service-worker registration and the web manifest link', () => {
        const r = transformHtml(page('<link rel="manifest" href="manifest.json">' +
            "<script>if ('serviceWorker' in navigator) navigator.serviceWorker.register('/sw.js');</script>"), REMOTE);
        expect(r.html).not.toMatch(/serviceWorker|rel="manifest"/);
    });

    test('rejects any other inline script', () => {
        expect(() => transformHtml(page('<script>track()</script>'), REMOTE)).toThrow(/inline <script>/);
    });

    test('swaps a known remote script for the bundled copy', () => {
        const r = transformHtml(page('<script src="https://cdn.example/lib.js"></script>'), REMOTE);
        expect(r.html).toContain('<script src="vendor/lib.js"></script>');
        expect(r.vendorFiles).toEqual([REMOTE['https://cdn.example/lib.js']]);
    });

    test('rejects a remote script it has no bundled copy for', () => {
        expect(() => transformHtml(page('<script src="https://other.example/x.js"></script>'), REMOTE))
            .toThrow(/no bundled replacement/);
    });

    test('swaps a known remote stylesheet for the bundled copy', () => {
        const styles = { 'https://cdn.example/a.css': { href: 'vendor/a/a.css', files: [{ file: 'a/a.css' }, { file: 'a/a.woff2' }] } };
        const r = transformHtml(page('<link rel="stylesheet" href="https://cdn.example/a.css" /><link rel="stylesheet" href="local.css">'), REMOTE, styles);
        expect(r.html).toContain('<link rel="stylesheet" href="vendor/a/a.css" />');
        expect(r.html).toContain('href="local.css"');
        expect(r.vendorFiles.map(f => f.file)).toEqual(['a/a.css', 'a/a.woff2']);
    });

    test('rejects a remote stylesheet it has no bundled copy for', () => {
        expect(() => transformHtml(page('<link rel="stylesheet" href="https://other.example/x.css">'), REMOTE, {}))
            .toThrow(/no bundled replacement/);
    });

    test('ignores commented-out markup', () => {
        const r = transformHtml(page('<!-- <button onclick="old()">x</button> <script>old()</script> -->'), REMOTE);
        expect(r.handlerCount).toBe(0);
        expect(r.html).not.toContain('old()');
    });
});

describe('quiz/index.html', () => {
    const html = fs.readFileSync(path.join(__dirname, '../../quiz/index.html'), 'utf8');

    test('builds into a page with no CSP violations and no remote resources', () => {
        const r = transformHtml(html);
        expect(findCspViolations(r.html)).toEqual([]);
        expect(r.html).not.toMatch(/(src|href)=["']https?:\/\/(?!goftan\.github\.io)/);
        expect(r.handlerCount).toBeGreaterThan(0);
        expect(() => new Function(r.handlersJs)).not.toThrow();
    });

    test('scripts do not generate inline handlers at runtime', () => {
        const dir = path.join(__dirname, '../../quiz/js_src');
        const offenders = fs.readdirSync(dir)
            .filter(f => f.endsWith('.js') && !f.includes('.min.'))
            .filter(f => /\bon[a-z]+=\\?["']|attr\(\s*['"]on[a-z]+['"]/.test(fs.readFileSync(path.join(dir, f), 'utf8')));
        expect(offenders).toEqual([]);
    });
});
