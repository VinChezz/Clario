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
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      window.location.href =
        "/api/auth/login?post_login_redirect_url=/teams/create";
      return;
    }
  }, [user, isLoading]);

  if (isLoading) return <Loader />;

  const createNewTeam = async () => {
    try {
      setLoading(true);
      const trimmedTeamName = teamName.trim();

      if (!trimmedTeamName) {
        toast.error("Team name cannot be empty");
        return;
      }

      console.log("Creating team with name:", trimmedTeamName);

      const res = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedTeamName,
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch (parseError) {
        console.error("Failed to parse response:", parseError);
        toast.error("Invalid response from server");
        return;
      }

      if (!res.ok) {
        console.error("API Error:", data);

        if (res.status === 503) {
          toast.error(
            "Service temporarily unavailable. Please try again in a moment."
          );
        } else {
          toast.error(data.error || `Failed to create team: ${res.status}`);
        }
        return;
      }

      console.log("Team created successfully:", data);
      toast.success("Team created successfully!");

      setTimeout(() => {
        router.push("/dashboard");
      }, 1000);
    } catch (e) {
      console.error("Network error: ", e);
      toast.error("Network error - please check your connection");
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
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && teamName.trim().length > 0 && !loading) {
                createNewTeam();
              }
            }}
          />
        </div>
        <Button
          className="bg-blue-500 mt-9 w-[30%] hover:bg-blue-600"
          disabled={!(teamName && teamName.trim().length > 0) || loading}
          onClick={createNewTeam}
        >
          {loading ? "Creating Team..." : "Create Team"}
        </Button>
      </div>
    </div>
  );
}
