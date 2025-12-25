"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import BackButton from "./BackButton";
import { Button } from "@/components/ui/button";
import { Plus, Settings } from "lucide-react";
import Link from "next/link";
import InviteModal from "@/app/(routes)/dashboard/_components/invite-button/InviteModal";

interface AnimatedHeaderProps {
  teamName: string;
  teamId: string;
}

export function AnimatedHeader({ teamName, teamId }: AnimatedHeaderProps) {
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);

  const handleOpenInviteModal = () => {
    setIsInviteModalOpen(true);
  };

  const handleCloseInviteModal = () => {
    setIsInviteModalOpen(false);
  };

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
          >
            <BackButton />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-1"
          >
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {teamName} Settings
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Manage your Team settings and members
            </p>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="flex items-center gap-3"
        >
          <Button onClick={handleOpenInviteModal}>
            <Plus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>

          <Link href={`/settings/team/${teamId}/setup`}>
            <Button variant="outline">
              <Settings className="h-4 w-4 mr-2" />
              Team Settings
            </Button>
          </Link>
        </motion.div>
      </div>

      <InviteModal
        isOpen={isInviteModalOpen}
        onClose={handleCloseInviteModal}
        teamId={teamId}
        teamName={teamName}
      />
    </>
  );
}
