"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface CompareContextType {
  ids: number[];
  toggle: (id: number) => void;
  isSelected: (id: number) => boolean;
  clear: () => void;
}

const CompareContext = createContext<CompareContextType>({
  ids: [],
  toggle: () => {},
  isSelected: () => false,
  clear: () => {},
});

export function CompareProvider({ children }: { children: ReactNode }) {
  const [ids, setIds] = useState<number[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("compare");
    if (stored) setIds(JSON.parse(stored));
  }, []);

  const toggle = (id: number) => {
    setIds((prev) => {
      const next = prev.includes(id)
        ? prev.filter((x) => x !== id)
        : prev.length < 3
        ? [...prev, id]
        : prev; // max 3
      localStorage.setItem("compare", JSON.stringify(next));
      return next;
    });
  };

  const isSelected = (id: number) => ids.includes(id);

  const clear = () => {
    setIds([]);
    localStorage.removeItem("compare");
  };

  return (
    <CompareContext.Provider value={{ ids, toggle, isSelected, clear }}>
      {children}
    </CompareContext.Provider>
  );
}

export function useCompare() {
  return useContext(CompareContext);
}
