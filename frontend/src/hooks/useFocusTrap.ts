import { useEffect } from "react";
import type { RefObject } from "react";

/**
 * Traps keyboard focus inside a modal/dialog element.
 * When Tab reaches the last focusable element, focus loops to the first.
 * Shift+Tab from the first element loops to the last.
 *
 * @param containerRef - ref to the modal container element
 * @param isActive - whether the trap is currently active (modal is open)
 */
export function useFocusTrap(
  containerRef: RefObject<HTMLElement | null>,
  isActive: boolean
): void {
  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;

    const getFocusableElements = (): HTMLElement[] => {
      const selectors = [
        "button:not([disabled])",
        "[href]",
        "input:not([disabled])",
        "select:not([disabled])",
        "textarea:not([disabled])",
        '[tabindex]:not([tabindex="-1"])',
      ].join(",");
      return Array.from(container.querySelectorAll<HTMLElement>(selectors));
    };

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      const focusable = getFocusableElements();
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const activeElement = document.activeElement as HTMLElement;

      // Shift+Tab from first element → go to last
      if (e.shiftKey && activeElement === first) {
        e.preventDefault();
        last.focus();
      }
      // Tab from last element → go to first
      else if (!e.shiftKey && activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    };

    container.addEventListener("keydown", handleTab);
    return () => container.removeEventListener("keydown", handleTab);
  }, [containerRef, isActive]);
}