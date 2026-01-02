"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft } from "lucide-react";
import { useRouter } from "next/navigation";

export default function NotFound() {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 bg-linear-to-b from-gray-50 to-white dark:from-gray-900 dark:to-black">
      <div className="max-w-md w-full text-center space-y-8">
        <div className="relative">
          <div className="text-[120px] md:text-[160px] font-bold tracking-tighter">
            <span className="bg-linear-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              4
            </span>
            <span className="bg-linear-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              0
            </span>
            <span className="bg-linear-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
              4
            </span>
          </div>

          <div className="absolute -top-4 -left-4 h-20 w-20 rounded-full bg-blue-500/10 blur-xl" />
          <div className="absolute -bottom-4 -right-4 h-20 w-20 rounded-full bg-purple-500/10 blur-xl" />
        </div>

        <div className="space-y-4">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Page Not Found
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-lg">
            Oops! The page you are looking for doesn't exist or you don't have
            permission to access it.
          </p>

          <div className="py-6">
            <div className="inline-flex items-center justify-center p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl">
              <div className="relative">
                <div className="h-16 w-16 border-2 border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center">
                  <div className="h-8 w-8 border-2 border-gray-400 dark:border-gray-500 rounded rotate-45" />
                </div>
                <div className="absolute -top-2 -right-2 h-6 w-6 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-xs font-bold">!</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-8">
          <Button asChild size="lg" className="gap-2">
            <Link href="/dashboard">
              <Home className="h-4 w-4" />
              Go Home
            </Link>
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="gap-2"
            onClick={handleGoBack}
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </div>

        <div className="pt-12 border-t border-gray-200 dark:border-gray-800">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            If you believe this is an error, please contact support
          </p>
        </div>
      </div>
    </div>
  );
}
