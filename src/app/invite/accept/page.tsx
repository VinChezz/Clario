import { Suspense } from "react";
import AcceptInviteClient from "./AcceptInviteClient";

function AcceptInviteLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-linear-to-br from-blue-50 to-indigo-100 dark:from-[#1a1a1c] dark:to-[#252528] p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#1a1a1c] border border-gray-200 dark:border-[#2a2a2d] rounded-xl shadow-lg p-8">
        <div className="flex flex-col items-center space-y-6">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-500 dark:border-blue-400 border-t-transparent" />
          <p className="text-gray-600 dark:text-[#a0a0a0]">
            Loading invitation...
          </p>
        </div>
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<AcceptInviteLoading />}>
      <AcceptInviteClient />
    </Suspense>
  );
}
