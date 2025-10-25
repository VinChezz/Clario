"use client";

import { useEffect, useState } from "react";
import {
  useKindeBrowserClient,
  LogoutLink,
} from "@kinde-oss/kinde-auth-nextjs";
import Header from "./_components/Header";
import { HeaderProps } from "@/types/header";
import { TextProps } from "@/types/common";
import FileList from "./_components/FileList";

export default function Dashboard({
  variant = "light",
}: HeaderProps & TextProps) {
  const { user, isLoading } = useKindeBrowserClient();
  const [dbUser, setDbUser] = useState<any>(null);

  useEffect(() => {
    if (!isLoading && !user) {
      window.location.href =
        "/api/auth/login?post_login_redirect_url=/dashboard";
      return;
    }

    if (user) {
      fetch("/api/auth/[kindeAuth]/kinde_callback")
        .then((res) => res.json())
        .then((data) => setDbUser(data));
    }
  }, [user, isLoading]);

  const isLight = variant === "light";

  return (
    <div className="p-8">
      <Header />

      <FileList />

      {/* AdBanner */}

      <button>
        <LogoutLink className={isLight ? "text-black" : "text-white"}>
          Logout
        </LogoutLink>
      </button>
    </div>
  );
}
