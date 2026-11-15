export const themeScript = `
(function(){
  try {
    var stored = localStorage.getItem('nexus_theme');
    var theme = stored || 'system';
    var dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.classList.add('dark');
    window.__nexusTheme = theme;
  } catch(e){}
})();
`;

export const themeForCtx = (theme: string) => {
  return theme === "dark" || (theme === "system" && typeof document !== "undefined" && document.documentElement.classList.contains("dark"));
};
