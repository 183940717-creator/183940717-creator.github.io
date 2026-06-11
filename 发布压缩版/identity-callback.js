(() => {
  const tokenNames = [
    "invite_token",
    "recovery_token",
    "confirmation_token",
    "email_change_token",
    "access_token"
  ];

  const hash = window.location.hash.replace(/^#\/?/, "");
  const search = window.location.search.replace(/^\?/, "");
  const hasIdentityToken = tokenNames.some((name) => hash.includes(`${name}=`) || search.includes(`${name}=`));

  if (!hasIdentityToken) return;
  if (!window.location.pathname.endsWith("/identity.html")) {
    const tokenPayload = hash || search;
    window.location.replace(`/identity.html#${tokenPayload}`);
    return;
  }

  const loadIdentityWidget = () =>
    new Promise((resolve, reject) => {
      if (window.netlifyIdentity) {
        resolve(window.netlifyIdentity);
        return;
      }

      const existingScript = document.querySelector('script[src*="netlify-identity-widget"]');
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(window.netlifyIdentity), { once: true });
        existingScript.addEventListener("error", reject, { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = "https://identity.netlify.com/v1/netlify-identity-widget.js";
      script.onload = () => resolve(window.netlifyIdentity);
      script.onerror = reject;
      document.body.appendChild(script);
    });

  loadIdentityWidget()
    .then((identity) => {
      if (!identity) return;

      let opened = false;
      const openIdentityModal = () => {
        if (opened) return;
        opened = true;
        identity.open();
      };

      identity.on("init", () => {
        openIdentityModal();
      });

      identity.on("login", () => {
        window.location.href = "/admin/";
      });

      identity.init();
      window.setTimeout(openIdentityModal, 300);
    })
    .catch(() => {
      const fallback = document.createElement("a");
      fallback.href = `/admin/${window.location.hash || window.location.search}`;
      fallback.textContent = "账号设置窗口加载失败，点击进入后台重试";
      fallback.style.cssText =
        "position:fixed;left:16px;right:16px;bottom:16px;z-index:9999;padding:14px 16px;border-radius:999px;background:#fff;color:#000;font:700 14px/1.3 Arial,sans-serif;text-align:center;text-decoration:none;";
      document.body.appendChild(fallback);
    });
})();
