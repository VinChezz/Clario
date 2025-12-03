export const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

export const formatTime = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export const formatFileSize = (bytes: number): string => {
  if (!bytes) return "0 KB";
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return Math.round((bytes / Math.pow(1024, i)) * 100) / 100 + " " + sizes[i];
};

export const calculateDaysUntilDeletion = (deletedFiles: any[]): number => {
  if (deletedFiles.length === 0) return 30;

  const oldestFile = deletedFiles.reduce((oldest, file) => {
    return new Date(file.deletedAt) < new Date(oldest.deletedAt)
      ? file
      : oldest;
  }, deletedFiles[0]);

  const deletedDate = new Date(oldestFile.deletedAt);
  const thirtyDaysLater = new Date(deletedDate);
  thirtyDaysLater.setDate(deletedDate.getDate() + 30);

  const diffTime = thirtyDaysLater.getTime() - Date.now();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, Math.min(30, diffDays));
};

export const getFileTypeIcon = (fileName: string): string => {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";

  const iconMap: Record<string, string> = {
    pdf: "FileText",
    doc: "FileText",
    docx: "FileText",
    txt: "FileText",
    xls: "Table",
    xlsx: "Table",
    csv: "Table",
    ppt: "Presentation",
    pptx: "Presentation",
    jpg: "Image",
    jpeg: "Image",
    png: "Image",
    gif: "Image",
    svg: "Image",
    zip: "Archive",
    rar: "Archive",
    mp3: "Music",
    mp4: "Video",
    mov: "Video",
  };

  return iconMap[extension] || "File";
};

export const getFileTypeColor = (fileName: string): string => {
  const extension = fileName.split(".").pop()?.toLowerCase() || "";

  const colorMap: Record<string, string> = {
    pdf: "bg-red-100 text-red-700",
    doc: "bg-blue-100 text-blue-700",
    docx: "bg-blue-100 text-blue-700",
    txt: "bg-gray-100 text-gray-700",
    xls: "bg-green-100 text-green-700",
    xlsx: "bg-green-100 text-green-700",
    csv: "bg-green-100 text-green-700",
    ppt: "bg-orange-100 text-orange-700",
    pptx: "bg-orange-100 text-orange-700",
    jpg: "bg-purple-100 text-purple-700",
    jpeg: "bg-purple-100 text-purple-700",
    png: "bg-purple-100 text-purple-700",
    gif: "bg-purple-100 text-purple-700",
    zip: "bg-yellow-100 text-yellow-700",
    rar: "bg-yellow-100 text-yellow-700",
  };

  return colorMap[extension] || "bg-gray-100 text-gray-700";
};
