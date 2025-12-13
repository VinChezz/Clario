import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function useUserStatus() {
  const queryClient = useQueryClient();

  const { data: userStatus, isLoading } = useQuery({
    queryKey: ["user-status"],
    queryFn: async () => {
      const res = await fetch("/api/users/settings");
      if (!res.ok) throw new Error("Failed to fetch user status");
      const data = await res.json();
      return {
        availabilityStatus: data.user?.availabilityStatus || "AVAILABLE",
        customStatus: data.user?.customStatus || "",
      };
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (data: {
      availabilityStatus: string;
      customStatus?: string;
    }) => {
      const res = await fetch("/api/users/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update status");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-status"] });
      queryClient.invalidateQueries({ queryKey: ["user-settings"] });
    },
    onError: (error) => {
      console.error("Failed to update status:", error);
    },
  });

  return {
    userStatus,
    isLoading,
    updateStatus: updateStatusMutation.mutateAsync,
    updateStatusMutation,
  };
}
