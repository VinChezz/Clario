export interface FILE {
  id: string;
  archive: boolean;
  createdBy: {
    id: string;
    name: string;
    image: string | null;
  };
  createdAt: string;
  updatedAt: string;
  document: string;
  fileName: string;
  teamId: string;
  whiteboard: string;
  _creationTime: number;
  version: number;
}
