"use client";

import { useEffect, useState } from "react";
import { IconSun, IconMoon } from "./icons";

type Theme = "light" | "dark";

const STORAGE_KEY = "earthradar-theme";

const applyTheme = (theme: Theme) => {
  document.documentElement.setAttribute("data-theme", theme);
  localStorage.setItem(STORAGE_KEY, theme);
};

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme | null>(null);

  useEffect(() => {
    const current = document.documentElement.getAttribute("data-theme") as Theme | null;
    setTheme(
      current ?? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
    );
  }, []);

  const toggle = () => {
    const next: Theme = theme === "dark" ? "light" : "dark";
    setTheme(next);
    applyTheme(next);
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={theme === "dark" ? "ライトモードに切り替え" : "ダークモードに切り替え"}
      title={theme === "dark" ? "ライトモードに切り替え" : "ダークモードに切り替え"}
      className="inline-flex h-9 w-9 items-center justify-center rounded-md text-text-secondary
        transition-colors duration-150 hover:bg-surface-hover hover:text-text-primary cursor-pointer"
    >
      {theme === "dark" ? <IconSun /> : <IconMoon />}
    </button>
  );
}
