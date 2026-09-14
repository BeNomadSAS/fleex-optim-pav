/* Pre-paint theme + language boot (was an inline <script>; externalised so the
 * CSP can drop script-src 'unsafe-inline'). Render-blocking in <head> so the
 * theme is applied before first paint — no flash. */
(function () {
    try {
        var th = localStorage.getItem('pav_theme');
        if (th === 'dark' || (!th && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.setAttribute('data-theme', 'dark');
        }
        var lang = localStorage.getItem('pav_lang');
        if (['en', 'fr', 'it', 'de'].indexOf(lang) !== -1) document.documentElement.setAttribute('lang', lang);
    } catch (e) { /* storage blocked — ignore */ }
})();
