export interface FILE {
  id: string;
  fileName: string;
  archive: boolean;
  document?: string;
  whiteboard?: string;
  teamId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
  permissions: string;
  shareToken?: string;
  version: number;
  currentVersion: number;
  autoVersioning: boolean;
  createdBy: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  team: {
    id: string;
    name: string;
    description?: string;
    logo?: string;
  };
}
