"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { toast } from "sonner";
import { Imprima } from "next/font/google";

const imprima = Imprima({
  subsets: ["latin"],
  weight: ["400", "400"],
});

export default function CreateTeam() {
  const [teamName, setTeamName] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const createNewTeam = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ teamName }),
      });

      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to create team");
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
      <Image src={"/logo-black.png"} alt={"logo"} width={200} height={200} />
      <div className="flex flex-col items-center mt-8">
        <h2 className={`${imprima.className} text-[42px] py-2 font-extrabold`}>
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
