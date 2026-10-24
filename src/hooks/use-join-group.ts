import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { joinGroup, type JoinResult } from "@/lib/study-groups.functions";

export function useJoinGroup(groupId: string) {
  const joinGroupFn = useServerFn(joinGroup);
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => joinGroupFn({ data: { groupId, name } }),
    onSuccess: async (result: JoinResult) => {
      if (result.status === "joined") {
        toast.success(result.message);
        await queryClient.invalidateQueries({ queryKey: ["groups"] });
        await queryClient.invalidateQueries({ queryKey: ["group", groupId] });
      } else {
        toast.error(result.message);
      }
    },
    onError: () => {
      toast.error("Something went wrong. Please try again.");
    },
  });
}
