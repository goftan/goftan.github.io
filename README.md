# Goftan
Learning languages by Quizes!

This is an open source web project with the goal to create a learning platform for different languages in which the topics are organized as quizes. 

You can start to try the quiz it under the url:
https://goftan.github.io/quiz


## Browser extension (Quiz Pulse)

The same quiz also ships as **Quiz Pulse**, a browser extension that shows it on
every new tab. It is built from `quiz/`, so the web app and the extension share
one codebase and one question bank.

```bash
npm run build:extension      # writes dist/extension/
```

Then load `dist/extension/` as an unpacked extension (`chrome://extensions` →
Developer mode → **Load unpacked**, or `about:debugging` in Firefox).

Extension pages may not use inline scripts, inline `on…=""` handlers or scripts
from a CDN, so `tools/build-extension.js` rewrites `index.html`: handlers move
into a generated `js_src/ext_handlers.js`, Plotly is bundled (downloaded once
into `extension/vendor/`), and the service-worker registration is dropped. The
build fails if it meets something it cannot rewrite. Keep scripts in `js_src/`
from generating inline handlers; a unit test checks this.

The extension manifest and icon live in `extension/`. This replaces the separate
[quizpulse](https://github.com/rostam/quizpulse) repository.

---
### Credits
- Ali Rostami
- Amir Aghdam
