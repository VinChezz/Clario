"use client";

import { FileListContext } from "@/app/_context/FileListContext";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { Archive, MoreHorizontal } from "lucide-react";
import moment from "moment";
import Image from "next/image";
import React, { useContext, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FILE } from "@/shared/types/file.interface";

export default function FileList() {
  const { fileList_, setFileList_ } = useContext(FileListContext);
  const [fileList, setFileList] = useState<FILE[]>([]);
  const { user }: any = useKindeBrowserClient();
  const router = useRouter();

  useEffect(() => {
    if (fileList_) setFileList(fileList_);
  }, [fileList_]);

  const formatDate = (dateString: string) => {
    const date = moment(dateString);
    const now = moment();

    if (date.isSame(now, "day")) {
      return "Today";
    } else if (date.isSame(now.clone().subtract(1, "day"), "day")) {
      return "Yesterday";
    } else if (date.isSame(now, "week")) {
      return date.format("dddd");
    } else {
      return date.format("DD MMM YYYY");
    }
  };

  const formatTime = (dateString: string) => {
    return moment(dateString).format("HH:mm");
  };
  return (
    <div className="mt-5">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>File Name</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead>Edited</TableHead>
            <TableHead>Author</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fileList.map((file, index) => (
            <TableRow
              key={file.id || index}
              className="cursor-pointer hover:bg-gray-50"
              onClick={() => router.push(`/workspace/${file.id}`)}
            >
              <TableCell className="font-medium">{file.fileName}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-m">{formatDate(file.createdAt)}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="text-m">{formatDate(file.updatedAt)}</span>
                </div>
              </TableCell>
              <TableCell>
                {file.createdBy && (
                  <div className="flex items-center gap-2">
                    <Image
                      src={file.createdBy.image || "/default-avatar.png"}
                      alt={file.createdBy.name}
                      width={24}
                      height={24}
                      className="rounded-full"
                    />
                    <span className="text-sm text-gray-600">
                      {file.createdBy.name}
                    </span>
                  </div>
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger onClick={(e) => e.stopPropagation()}>
                    <MoreHorizontal className="cursor-pointer" />
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem className="flex items-center gap-2">
                      <Archive className="h-4 w-4" /> Archive
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
