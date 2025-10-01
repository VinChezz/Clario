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

  useEffect(() => {
    console.log("File list: ", fileList);
  });

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
                {moment(file._creationTime).format("DD MMM YYYY")}
              </TableCell>
              <TableCell>
                {moment(file._creationTime).format("DD MMM YYYY")}
              </TableCell>
              <TableCell>
                {user && (
                  <Image
                    src={user?.picture}
                    alt="user"
                    width={30}
                    height={30}
                    className="ml-1 rounded-full"
                  />
                )}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger>
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
