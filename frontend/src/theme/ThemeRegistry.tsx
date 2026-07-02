"use client";

import createCache from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import CssBaseline from "@mui/material/CssBaseline";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { useServerInsertedHTML } from "next/navigation";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type ColorMode = "light" | "dark";

interface ColorModeContextValue {
  mode: ColorMode;
  toggle: () => void;
}

const ColorModeContext = createContext<ColorModeContextValue>({
  mode: "light",
  toggle: () => {},
});

export function useColorMode() {
  return useContext(ColorModeContext);
}

const MODE_KEY = "controle-toners:mode";

function buildTheme(mode: ColorMode) {
  return createTheme({
    palette: {
      mode,
      primary: { main: mode === "light" ? "#2563eb" : "#90caf9" },
      success: { main: mode === "light" ? "#16a34a" : "#66bb6a" },
      error: { main: mode === "light" ? "#dc2626" : "#f44336" },
      ...(mode === "light"
        ? { background: { default: "#f3f4f6", paper: "#ffffff" } }
        : {}),
    },
    shape: { borderRadius: 12 },
    typography: {
      fontFamily: "var(--font-geist-sans), Roboto, Arial, sans-serif",
      h4: { fontWeight: 700 },
      h6: { fontWeight: 600 },
    },
    components: {
      MuiCard: { defaultProps: { elevation: mode === "light" ? 0 : 1 }, styleOverrides: { root: { border: "1px solid", borderColor: mode === "light" ? "#e5e7eb" : "rgba(255,255,255,0.12)", backgroundImage: "none" } } },
      MuiButton: { defaultProps: { disableElevation: true }, styleOverrides: { root: { textTransform: "none", fontWeight: 600 } } },
    },
  });
}

export function ThemeRegistry({ children }: { children: React.ReactNode }) {
  const [cache] = useState(() => {
    const emotionCache = createCache({ key: "mui", prepend: true });
    emotionCache.compat = true;
    return emotionCache;
  });

  const [mode, setMode] = useState<ColorMode>("light");

  useEffect(() => {
    const stored = window.localStorage.getItem(MODE_KEY);
    if (stored === "light" || stored === "dark") {
      setMode(stored);
    } else if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
      setMode("dark");
    }
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = mode;
    document.documentElement.style.colorScheme = mode;
  }, [mode]);

  useEffect(() => {
    const root = document.documentElement;
    let hideTimer: number | undefined;

    const reveal = () => {
      root.classList.add("show-scrollbar");
      if (hideTimer) window.clearTimeout(hideTimer);
      hideTimer = window.setTimeout(() => root.classList.remove("show-scrollbar"), 1200);
    };

    const onMouseMove = (event: MouseEvent) => {
      const nearRight = window.innerWidth - event.clientX <= 24;
      const nearBottom = window.innerHeight - event.clientY <= 24;
      if (nearRight || nearBottom) reveal();
    };

    window.addEventListener("scroll", reveal, { passive: true, capture: true });
    window.addEventListener("mousemove", onMouseMove, { passive: true });

    return () => {
      window.removeEventListener("scroll", reveal, { capture: true });
      window.removeEventListener("mousemove", onMouseMove);
      if (hideTimer) window.clearTimeout(hideTimer);
    };
  }, []);

  useServerInsertedHTML(() => (
    <style
      data-emotion={`${cache.key} ${Object.keys(cache.inserted).join(" ")}`}
      dangerouslySetInnerHTML={{ __html: Object.values(cache.inserted).join(" ") }}
    />
  ));

  const colorMode = useMemo<ColorModeContextValue>(
    () => ({
      mode,
      toggle: () =>
        setMode((prev) => {
          const next = prev === "light" ? "dark" : "light";
          window.localStorage.setItem(MODE_KEY, next);
          return next;
        }),
    }),
    [mode],
  );

  const theme = useMemo(() => buildTheme(mode), [mode]);

  return (
    <CacheProvider value={cache}>
      <ColorModeContext.Provider value={colorMode}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </ColorModeContext.Provider>
    </CacheProvider>
  );
}
