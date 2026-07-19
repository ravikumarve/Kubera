"use client";

import { useEffect, useState } from "react";
import { useTheme } from "@/components/theme-provider";
import KineticCursor from "@/components/kinetic-cursor";
import VaultCursor from "@/components/vault-cursor";

export function CursorWrapper() {
  const { theme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const isVault = theme === "vault";
  return isVault ? <VaultCursor /> : <KineticCursor />;
}
