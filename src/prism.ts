"use strict";

(window as any).Prism = (window as any).Prism || {};

const script = document.createElement("script");
script.src = "https://cdnjs.cloudflare.com/ajax/libs/prism/1.30.0/prism.min.js";
script.onload = () => {
  const autoloader = document.createElement("script");
  autoloader.src =
    "https://cdnjs.cloudflare.com/ajax/libs/prism/1.30.0/plugins/autoloader/prism-autoloader.min.js";
  autoloader.onload = () => {
    const win = window as typeof window & { Prism?: any };
    if (win.Prism && win.Prism.plugins && win.Prism.plugins.autoloader) {
      win.Prism.plugins.autoloader.languages_path =
        "https://cdnjs.cloudflare.com/ajax/libs/prism/1.30.0/components/";
    }
  };
  document.head.appendChild(autoloader);
};
document.head.appendChild(script);
