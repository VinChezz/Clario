"use client";

import Image from "next/image";

export default function WorkspaceLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-white dark:bg-[#0B1020]">
      <div className="flex flex-col items-center gap-4">
        <Image
          src="/logo-1.png"
          alt="Workspace"
          width={72}
          height={72}
          priority
          className="animate-pulse"
        />

        <p className="text-sm text-gray-600 dark:text-gray-400">
          Loading workspace…
        </p>

        <div className="relative w-40 h-0.5 overflow-hidden bg-gray-200 dark:bg-gray-800 rounded-full">
          <span className="absolute inset-0 animate-loader bg-linear-to-r from-blue-400 to-blue-600" />
        </div>
      </div>
    </div>
  );
}
