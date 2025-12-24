"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import { CheckCircle, Loader2, FileText, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { ReadmeService } from "@/utils/readmeService";
import { toast } from "sonner";

interface ReadmeUploadProgressProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  fileId: string;
  fileName: string;
  readmeContent: string;
}

export function ReadmeUploadProgress({
  open,
  onOpenChange,
  fileId,
  fileName,
  readmeContent,
}: ReadmeUploadProgressProps) {
  const router = useRouter();
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && status === "idle") {
      startUpload();
    }
  }, [open]);

  useEffect(() => {
    if (!open) {
      setTimeout(() => {
        setStatus("idle");
        setProgress(0);
        setError(null);
      }, 300);
    }
  }, [open]);

  const simulateProgress = (
    current: number,
    target: number,
    duration: number = 500
  ) => {
    const start = current;
    const increment = (target - start) / (duration / 50);

    return new Promise<void>((resolve) => {
      const timer = setInterval(() => {
        setProgress((prev) => {
          const newProgress = Math.min(prev + increment, target);
          if (newProgress >= target) {
            clearInterval(timer);
            resolve();
            return target;
          }
          return newProgress;
        });
      }, 50);
    });
  };

  const startUpload = async () => {
    setStatus("uploading");
    setProgress(0);
    setError(null);

    try {
      await simulateProgress(0, 10);

      await simulateProgress(10, 30);

      await simulateProgress(30, 50);

      await simulateProgress(50, 70);

      await simulateProgress(70, 90);

      const result = await ReadmeService.addReadmeToDocument(
        fileId,
        readmeContent,
        fileName
      );

      if (!result.success) {
        throw new Error(result.error || "Failed to add README");
      }

      await simulateProgress(90, 100);

      setStatus("success");
    } catch (error: any) {
      console.error("Upload error:", error);
      setError(error.message || "An error occurred");
      setStatus("error");
      toast.error(`Failed to add README: ${error.message}`);
    }
  };

  const handleGoToFile = () => {
    router.push(`/workspace/${fileId}`);
    onOpenChange(false);
  };

  const handleRetry = () => {
    setStatus("idle");
    setProgress(0);
    setError(null);

    setTimeout(() => {
      startUpload();
    }, 300);
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (status === "uploading") return;
        onOpenChange(open);
      }}
    >
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            {status === "uploading" && (
              <Loader2 className="h-5 w-5 animate-spin" />
            )}
            {status === "success" && (
              <CheckCircle className="h-5 w-5 text-green-600" />
            )}
            {status === "error" && (
              <AlertCircle className="h-5 w-5 text-red-600" />
            )}
            {status === "uploading"
              ? "Adding README..."
              : status === "success"
              ? "Success!"
              : status === "error"
              ? "Error"
              : "Upload"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {status === "uploading" && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-700">
                    Adding README to {fileName}
                  </span>
                  <span className="font-medium">{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
              <div className="space-y-2 text-sm text-gray-600">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full transition-colors ${
                      progress >= 10 ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                  <span>Preparing document...</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full transition-colors ${
                      progress >= 30 ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                  <span>Processing README content...</span>
                </div>
                <div className="flex items-center gap-2">
                  <div
                    className={`w-2 h-2 rounded-full transition-colors ${
                      progress >= 70 ? "bg-green-500" : "bg-gray-300"
                    }`}
                  />
                  <span>Saving changes...</span>
                </div>
              </div>
            </>
          )}

          {status === "success" && (
            <>
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 mb-4">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">
                  README Added Successfully!
                </h3>
                <p className="text-gray-600 mb-6">
                  The README content has been added to{" "}
                  <strong className="text-gray-900">{fileName}</strong>
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleGoToFile}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Go to File
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                >
                  Close
                </Button>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div className="text-center py-4">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-100 mb-4">
                  <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <h3 className="font-semibold text-lg mb-2">Upload Failed</h3>
                <p className="text-gray-600 mb-2">{error}</p>
                <p className="text-sm text-gray-500">
                  Please try again or check file permissions
                </p>
              </div>
              <div className="flex gap-3">
                <Button
                  onClick={handleRetry}
                  className="flex-1"
                  variant="default"
                >
                  <Loader2 className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="flex-1"
                >
                  Cancel
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
