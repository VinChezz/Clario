"use client";

import React, { useEffect } from "react";

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const header = document.getElementById("dashboard-header");

    if (header) header.style.display = "none";

    return () => {
      if (header) header.style.display = "";
    };
  }, []);

  return (
    <div className="w-full min-h-screen bg-background flex">
      <main className="flex-1 max-w-4xl mx-auto px-4 py-10">{children}</main>
    </div>
  );
}
