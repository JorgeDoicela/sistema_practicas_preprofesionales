/**
 * ThemeScript — Inline script injected into <head> to prevent FOUC (Flash of Unstyled Content).
 * Reads the saved preference from localStorage and applies the dark class BEFORE React hydrates.
 */
export function ThemeScript() {
  const script = `
    (function() {
      try {
        var saved = localStorage.getItem('emitesis-theme');
        var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        var shouldDark = saved === 'dark' || (saved !== 'light' && prefersDark);
        if (shouldDark) {
          document.documentElement.classList.add('dark');
          document.documentElement.setAttribute('data-theme', 'dark');
        } else {
          document.documentElement.setAttribute('data-theme', 'light');
        }
      } catch(e) {}
    })();
  `;
  // biome-ignore lint/security/noDangerouslySetInnerHtml: intentional inline script to prevent flash
  return <script dangerouslySetInnerHTML={{ __html: script }} />;
}
