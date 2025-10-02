"use client";

import { Button } from "@/components/ui/button";
import { Link, Save } from "lucide-react";
import Image from "next/image";
import React from "react";
import { FILE } from "@/shared/types/file.interface";
import { redirect } from "next/navigation";

interface WorkspaceHeaderProps {
  file?: FILE;
  onSave: () => void;
}

export default function WorkspaceHeader({
  file,
  onSave,
}: WorkspaceHeaderProps) {
  return (
    <div className="p-3 border-b flex justify-between items-center">
      <div className="flex gap-2 items-center">
        <Image
          src={"/logo-1.png"}
          alt={"logo"}
          width={50}
          height={50}
          onClick={() => redirect("/dashboard")}
        />
        {file && (
          <h2 className="ml-1 text-xl font-semibold">{file.fileName}</h2>
        )}
      </div>
      <div className="flex items-center gap-4">
        <Button
          className="h-8 text-[12px] gap-2 bg-yellow-500 hover:bg-yellow-600"
          onClick={onSave}
        >
          <Save className="h-4 w-4" />
          Save
        </Button>
        <Button className="h-8 text-[12px] gap-2 bg-blue-600 hover:bg-blue-700">
          Share
          <Link className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
