"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import Constant from "@/app/_constant/Constant";

interface FileDataContextType {
  hasFiles: boolean;
  isStorageFull: boolean;
  fileCount: number;
  setFileData: (
    hasFiles: boolean,
    isStorageFull: boolean,
    fileCount: number
  ) => void;
  updateFromFileList: (files: any[]) => void;
}

const FileDataContext = createContext<FileDataContextType | undefined>(
  undefined
);

export function FileDataProvider({ children }: { children: React.ReactNode }) {
  const [fileCount, setFileCount] = useState(0);
  const [hasFiles, setHasFiles] = useState(false);
  const [isStorageFull, setIsStorageFull] = useState(false);

  useEffect(() => {
    const hasFiles = fileCount > 0;
    const isStorageFull = fileCount >= Constant.MAX_FREE_FILE;

    console.log("🔄 FileDataContext Update:", {
      fileCount,
      hasFiles,
      isStorageFull,
      MAX_FREE_FILE: Constant.MAX_FREE_FILE,
    });

    setHasFiles(hasFiles);
    setIsStorageFull(isStorageFull);
  }, [fileCount]);

  const setFileData = (
    newHasFiles: boolean,
    newIsStorageFull: boolean,
    newFileCount: number
  ) => {
    console.log("📝 Setting file data directly:", {
      newHasFiles,
      newIsStorageFull,
      newFileCount,
    });
    setFileCount(newFileCount);
    setHasFiles(newHasFiles);
    setIsStorageFull(newIsStorageFull);
  };

  const updateFromFileList = (files: any[]) => {
    const count = Array.isArray(files) ? files.length : 0;
    console.log("📁 Updating from file list:", { files, count });
    setFileCount(count);
  };

  return (
    <FileDataContext.Provider
      value={{
        hasFiles,
        isStorageFull,
        fileCount,
        setFileData,
        updateFromFileList,
      }}
    >
      {children}
    </FileDataContext.Provider>
  );
}

export function useFileData() {
  const context = useContext(FileDataContext);
  if (context === undefined) {
    throw new Error("useFileData must be used within a FileDataProvider");
  }
  return context;
}
