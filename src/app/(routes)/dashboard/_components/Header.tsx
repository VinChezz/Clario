import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import { Search, Send } from "lucide-react";
import Image from "next/image";
import React from "react";

export default function Header() {
  const { user }: any = useKindeBrowserClient();

  return (
    <div className="flex justify-end w-full gap-2 items-center">
      <div className="flex gap-2 items-center border rounded-md p-1">
        <Search className="w-5 h-5" />
        <Input
          placeholder="Search"
          className="border-0 outline-0 w-full h-8"
          type="text"
        />
      </div>
      <Image
        src={user?.picture || "/default-avatar.png"}
        alt="user"
        width={30}
        height={30}
        className="mr-3 ml-3 rounded-full"
      />
      <div>
        <Button
          className="gap-2 flex text-sm
        h-8 hover:bg-blue-700 bg-blue-600"
        >
          <Send className="h-4 w-4" />
          Invite
        </Button>
      </div>
    </div>
  );
}
