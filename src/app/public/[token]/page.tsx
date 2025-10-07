"use client";

import ShareEditor from "@/app/(routes)/workspace/_components/ShareEditor";
import ShareCanvas from "@/app/(routes)/workspace/_components/ShareCanvas";
import { notFound } from "next/navigation";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield, Eye, Edit, Square, FileText } from "lucide-react";
import { useState, useEffect, useCallback, memo } from "react";

const TabbedContent = memo(({ fileData }: { fileData: any }) => {
  const [activeTab, setActiveTab] = useState<"document" | "whiteboard">(
    "document"
  );

  console.log("TabbedContent render", activeTab);

  return (
    <div className="flex flex-col h-full">
      <div className="flex border-b bg-white">
        <button
          onClick={() => setActiveTab("document")}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
            activeTab === "document"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <FileText className="h-4 w-4" />
          Document
        </button>
        <button
          onClick={() => setActiveTab("whiteboard")}
          className={`flex items-center gap-2 px-4 py-2 border-b-2 transition-colors ${
            activeTab === "whiteboard"
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:text-gray-700"
          }`}
        >
          <Square className="h-4 w-4" />
          Whiteboard
        </button>
      </div>

      <div className="flex-1">
        {activeTab === "document" ? (
          <ShareEditor
            fileId={fileData.id}
            fileData={fileData}
            onSaveTrigger={0}
            isPublicAccess={true}
            permissions={fileData.permissions}
          />
        ) : (
          <ShareCanvas
            fileId={fileData.id}
            fileData={fileData}
            onSaveTrigger={0}
            isPublicAccess={true}
            permissions={fileData.permissions}
          />
        )}
      </div>
    </div>
  );
});

TabbedContent.displayName = "TabbedContent";

export default function PublicFilePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const [fileData, setFileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchFileData = useCallback(async () => {
    try {
      const { token } = await params;
      console.log("Fetching data for token:", token);

      const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
      const fileRes = await fetch(`${baseUrl}/api/share/${token}`, {
        cache: "no-store",
      });

      if (!fileRes.ok) {
        throw new Error("File not found");
      }

      const data = await fileRes.json();
      console.log("File data loaded:", data.fileName);
      setFileData(data);
    } catch (error) {
      console.error("Error fetching file data:", error);
      notFound();
    } finally {
      setLoading(false);
    }
  }, [params]);

  useEffect(() => {
    fetchFileData();
  }, [fetchFileData]);

  const getInitials = useCallback((name: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="text-lg text-gray-600">Loading shared document...</div>
      </div>
    );
  }

  if (!fileData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="text-lg text-red-600">Document not found</div>
      </div>
    );
  }

  console.log("Rendering PublicFilePage with:", fileData.fileName);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="max-w-6xl mx-auto h-[95vh] flex flex-col shadow-lg">
        <CardHeader className="pb-4 border-b bg-white rounded-t-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-3">
                <Shield className="h-8 w-8 text-blue-600" />
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {fileData.fileName}
                  </h1>
                  <div className="flex items-center space-x-3 mt-1">
                    <div className="flex items-center space-x-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={fileData.createdBy?.image} />
                        <AvatarFallback className="text-xs bg-blue-100 text-blue-600">
                          {getInitials(fileData.createdBy?.name)}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-sm text-gray-600">
                        Shared by{" "}
                        {fileData.createdBy?.name ||
                          fileData.team?.name ||
                          "Unknown User"}
                      </span>
                    </div>

                    <Badge
                      variant={
                        fileData.permissions === "VIEW"
                          ? "secondary"
                          : "default"
                      }
                      className="flex items-center space-x-1"
                    >
                      {fileData.permissions === "VIEW" ? (
                        <>
                          <Eye className="h-3 w-3" />
                          <span>View only</span>
                        </>
                      ) : (
                        <>
                          <Edit className="h-3 w-3" />
                          <span>Can edit</span>
                        </>
                      )}
                    </Badge>

                    <Badge
                      variant={"outline"}
                      className="bg-green-50 text-green-700 border-green-200"
                    >
                      Public link
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {fileData.version && (
              <Badge variant={"outline"} className="text-xs">
                v{fileData.version}
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="flex-1 p-0 bg-white rounded-b-lg overflow-hidden">
          <TabbedContent fileData={fileData} />
        </CardContent>
      </Card>

      <div className="max-w-6xl mx-auto mt-4 text-center">
        <p className="text-sm text-gray-500">
          This document is shared via secure link •{" "}
          {new Date().toLocaleDateString()}
        </p>
      </div>
    </div>
  );
}
