"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { usePathname } from "next/navigation";

/**
 * Menu déroulant des petits écrans. Basé sur <details> : il s'ouvre aussi sans JavaScript.
 * Avec JavaScript, il se referme à chaque navigation, avec Échap et au clic en dehors.
 */
export function MenuMobile({ children }: { children: ReactNode }) {
  const menu = useRef<HTMLDetailsElement>(null);
  const chemin = usePathname();

  useEffect(() => {
    if (menu.current) menu.current.open = false;
  }, [chemin]);

  useEffect(() => {
    function fermer(e: KeyboardEvent | MouseEvent) {
      const details = menu.current;
      if (!details?.open) return;
      if (e instanceof KeyboardEvent) {
        if (e.key !== "Escape") return;
        details.open = false;
        details.querySelector("summary")?.focus();
        return;
      }
      if (!details.contains(e.target as Node)) details.open = false;
    }
    document.addEventListener("keydown", fermer);
    document.addEventListener("click", fermer);
    return () => {
      document.removeEventListener("keydown", fermer);
      document.removeEventListener("click", fermer);
    };
  }, []);

  return (
    <details ref={menu} className="group lg:hidden">
      <summary className="flex cursor-pointer list-none items-center gap-1.5 rounded-full border border-trait bg-carte px-3 py-2 text-sm font-semibold [&::-webkit-details-marker]:hidden">
        <svg aria-hidden viewBox="0 0 20 20" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <path className="group-open:hidden" d="M3 5h14M3 10h14M3 15h14" />
          <path className="hidden group-open:block" d="M5 5l10 10M15 5L5 15" />
        </svg>
        Menu
      </summary>
      <div className="absolute inset-x-0 top-full border-b border-trait bg-papier shadow-lg">
        <div className="mx-auto max-w-6xl px-4 py-3 sm:px-6">{children}</div>
      </div>
    </details>
  );
}
