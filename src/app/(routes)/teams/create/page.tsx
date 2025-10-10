"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import Virgil from "next/font/local";
import { useKindeBrowserClient } from "@kinde-oss/kinde-auth-nextjs";
import Loader from "@/app/_loaders/loader";

const virgil = Virgil({
  src: "../../../fonts/Virgil.woff2",
});

export default function CreateTeam() {
  const { user, isLoading } = useKindeBrowserClient();
  const [dbUser, setDbUser] = useState<any>(null);
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      window.location.href =
        "/api/auth/login?post_login_redirect_url=/teams/create";
      return;
    }

    if (user) {
      fetch("/api/auth/[kindeAuth]/kinde_callback")
        .then((res) => res.json())
        .then((data) => setDbUser(data));
    }
  }, [user, isLoading]);

  if (!dbUser) return <Loader />;

  const createNewTeam = async () => {
    try {
      setLoading(true);
      const trimmedTeamName = teamName.trim();

      if (!trimmedTeamName) {
        toast.error("Team name cannot be empty");
        return;
      }

      const res = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ teamName: trimmedTeamName }),
      });

      const responseText = await res.text();
      let data;

      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = {};
      }

      if (!res.ok) {
        toast.error(data.error || `Failed to create team: ${res.status}`);
        return;
      }

      toast.success("Team created successfully!");
      router.push("/dashboard");
    } catch (e) {
      console.error("Error: ", e);
      toast.error("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="px-6 md:px-16 my-16">
      <div className="relative flex items-start justify-start">
        <Image src={"/logo-1.png"} alt={"logo"} width={150} height={150} />
        <div className="mt-1 ml-2 text-5xl text-black font-bold">Clario</div>
      </div>
      <div className="flex flex-col items-center mt-8">
        <h2 className={`${virgil.className} text-[42px] py-2 font-extrabold`}>
          What should we call your team?
        </h2>
        <h2 className="text-gray-500">
          You can always change this later from settings.
        </h2>
        <div className="mt-7 w-[40%]">
          <label className="text-gray-500">Team Name</label>
          <Input
            placeholder="Team Name"
            className="mt-3"
            onChange={(e) => setTeamName(e.target.value)}
          />
        </div>
        <Button
          className="bg-blue-500 mt-9 w-[30%] hover:bg-blue-600"
          disabled={!(teamName && teamName?.length > 0)}
          onClick={() => createNewTeam()}
        >
          {loading ? "Creating..." : "Create Team"}
        </Button>
      </div>
    </div>
  );
}
