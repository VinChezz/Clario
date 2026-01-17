export interface FILE {
  id?: string;
  fileName: string;
  archive?: boolean;
  document?: string | null;
  whiteboard?: string | null;
  teamId: string;
  createdById: string;
  createdAt: string;
  updatedAt: string;
  isPublic?: boolean;
  deletedAt?: string | null;
  permissions?: string;
  shareToken?: string | null;
  version?: number;
  sizeBytes?: bigint | number;
  currentVersion?: number;
  autoVersioning?: boolean;
  createdBy?: {
    id: string;
    name: string;
    email: string;
    image?: string;
  };
  size?: number;
  isDeleted?: boolean;
}
