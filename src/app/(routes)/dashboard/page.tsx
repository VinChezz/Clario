"use client";

import { useEffect, useState } from "react";
import {
  useKindeBrowserClient,
  LogoutLink,
} from "@kinde-oss/kinde-auth-nextjs";
import Header from "@/app/_components/Header";

export default function Dashboard() {
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

  if (!dbUser) return <p>Loading...</p>;

  return (
    <div className="bg-black">
      <Header />
      <h1 className="text-white">Welcome, {dbUser.name}</h1>
      <p className="text-white">Email: {dbUser.email}</p>
      <img src={dbUser.image || "/default-avatar.png"} width={80} />
      <button>
        <LogoutLink className="text-white">Logout</LogoutLink>
      </button>
    </div>
  );
}
