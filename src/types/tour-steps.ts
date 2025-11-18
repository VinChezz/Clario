export interface TourStep {
  id: number;
  target: string;
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
  condition?: (hasFiles: boolean, isStorageFull?: boolean) => boolean;
}

export const tourSteps: TourStep[] = [
  {
    id: 1,
    target: "members-check",
    title: "Team Members Hub",
    description:
      "Manage your team members, assign roles (Admin, Editor, Viewer) and control access permissions.",
    position: "bottom",
  },
  {
    id: 2,
    target: "team-switcher",
    title: "Your Team Workspace",
    description:
      "This is your team dashboard. Switch between teams or manage members here.",
    position: "bottom",
  },

  {
    id: 3,
    target: "create-file-button-filelist",
    title: "Create Your First File",
    description:
      "Click here to create new documents, whiteboards, or text files.",
    position: "bottom",
    condition: (hasFiles, isStorageFull) => !hasFiles && !isStorageFull,
  },

  {
    id: 4,
    target: "create-file-button-sidenav",
    title: "Create New File",
    description:
      "Click here to create additional documents, whiteboards, or text files anytime.",
    position: "right",
    condition: (hasFiles, isStorageFull) => {
      const result = hasFiles && !isStorageFull;
      console.log("🔍 Step 4 Condition:", { hasFiles, isStorageFull, result });
      return result;
    },
  },

  {
    id: 5,
    target: "storage-full-button",
    title: "Storage Limit Reached",
    description:
      "You've reached your storage limit. Upgrade to Pro to create more files and unlock unlimited storage.",
    position: "right",
    condition: (hasFiles, isStorageFull) => {
      const result = Boolean(hasFiles && isStorageFull);
      console.log("🔍 Step 5 Condition:", { hasFiles, isStorageFull, result });
      return result;
    },
  },

  {
    id: 6,
    target: "storage-section",
    title: "Storage Usage",
    description:
      "Keep track of your storage usage. Upgrade to Pro for unlimited files and advanced features.",
    position: "top",
  },
  {
    id: 7,
    target: "total-files-card",
    title: "File Management",
    description:
      "Track your total files and documents. Keep an eye on your team's productivity.",
    position: "top",
  },
  {
    id: 8,
    target: "team-members-card",
    title: "Team Size",
    description:
      "See how many members are in your team. Grow your collaboration network.",
    position: "top",
  },
  {
    id: 9,
    target: "storage-card",
    title: "Storage Status",
    description:
      "Monitor your storage usage. Upgrade your plan if you're running low on space.",
    position: "top",
  },
  {
    id: 10,
    target: "file-list-container",
    title: "Your Files & Documents",
    description:
      "All your team's files appear here. Organize them with different views.",
    position: "left",
  },
];
