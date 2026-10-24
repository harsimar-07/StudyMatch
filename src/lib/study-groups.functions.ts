import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { Database } from "@/integrations/supabase/types";

export type StudyGroup = {
  id: string;
  name: string;
  subject: string;
  description: string;
  preferred_time: string;
  max_members: number;
  created_at: string;
  member_count: number;
};

export type GroupMember = {
  id: string;
  member_name: string;
  created_at: string;
};

export type JoinResult = {
  status: "joined" | "duplicate" | "full" | "error";
  message: string;
  member_count?: number;
};

function createPublicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient<Database>(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false, storage: undefined },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        // Opaque sb_ keys are not JWTs; send apikey, not the default bearer.
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

export const listGroups = createServerFn({ method: "GET" }).handler(async () => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("study_groups")
    .select(
      "id, name, subject, description, preferred_time, max_members, created_at, group_members(count)",
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listGroups failed:", error.message);
    return { groups: [] as StudyGroup[], error: "Could not load study groups right now." };
  }

  const groups: StudyGroup[] = (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    subject: row.subject,
    description: row.description,
    preferred_time: row.preferred_time,
    max_members: row.max_members,
    created_at: row.created_at,
    member_count:
      (row as { group_members?: { count: number }[] }).group_members?.[0]?.count ?? 0,
  }));

  return { groups, error: null as string | null };
});

export const createGroupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(3, "Group name must be at least 3 characters.")
    .max(120, "Group name must be under 120 characters."),
  subject: z
    .string()
    .trim()
    .min(2, "Subject must be at least 2 characters.")
    .max(60, "Subject must be under 60 characters."),
  description: z
    .string()
    .trim()
    .min(10, "Please write at least 10 characters describing the group.")
    .max(500, "Description must be under 500 characters."),
  preferredTime: z
    .string()
    .trim()
    .min(3, "Preferred study time is required.")
    .max(60, "Keep the study time under 60 characters."),
  maxMembers: z.coerce
    .number({ message: "Maximum members must be a number." })
    .int("Maximum members must be a whole number.")
    .min(2, "A group needs at least 2 members.")
    .max(100, "Maximum members cannot exceed 100."),
});

export const createGroup = createServerFn({ method: "POST" })
  .inputValidator((data) => createGroupSchema.parse(data))
  .handler(async ({ data }) => {
    const supabase = createPublicClient();
    const { data: created, error } = await supabase
      .from("study_groups")
      .insert({
        name: data.name,
        subject: data.subject,
        description: data.description,
        preferred_time: data.preferredTime,
        max_members: data.maxMembers,
      })
      .select("id")
      .single();

    if (error || !created) {
      console.error("createGroup failed:", error?.message);
      return {
        id: null as string | null,
        error: "Could not create the group right now. Please try again.",
      };
    }

    return { id: created.id, error: null as string | null };
  });

export const getGroup = createServerFn({ method: "GET" })
  .inputValidator((data) => z.object({ id: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    const supabase = createPublicClient();
    const { data: row, error } = await supabase
      .from("study_groups")
      .select(
        "id, name, subject, description, preferred_time, max_members, created_at, group_members(id, member_name, created_at)",
      )
      .eq("id", data.id)
      .maybeSingle();

    if (error) {
      console.error("getGroup failed:", error.message);
      return { group: null, members: [] as GroupMember[], error: "Could not load this group." };
    }

    if (!row) {
      return { group: null, members: [] as GroupMember[], error: null as string | null };
    }

    const members = (row.group_members ?? []) as GroupMember[];
    members.sort((a, b) => a.created_at.localeCompare(b.created_at));

    return {
      group: {
        id: row.id,
        name: row.name,
        subject: row.subject,
        description: row.description,
        preferred_time: row.preferred_time,
        max_members: row.max_members,
        created_at: row.created_at,
        member_count: members.length,
      } satisfies StudyGroup,
      members,
      error: null as string | null,
    };
  });

export const joinGroup = createServerFn({ method: "POST" })
  .inputValidator((data) =>
    z
      .object({
        groupId: z.string().uuid(),
        name: z
          .string()
          .trim()
          .min(2, "Please enter your name (at least 2 characters).")
          .max(80, "Name must be under 80 characters."),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    const supabase = createPublicClient();
    const { data: result, error } = await supabase.rpc("join_study_group", {
      p_group_id: data.groupId,
      p_member_name: data.name,
    });

    if (error || !result) {
      console.error("joinGroup failed:", error?.message);
      return {
        status: "error" as const,
        message: "Could not join this group right now. Please try again.",
      } satisfies JoinResult;
    }

    return result as JoinResult;
  });

export const groupsQueryOptions = () =>
  queryOptions({ queryKey: ["groups"], queryFn: () => listGroups() });

export const groupQueryOptions = (id: string) =>
  queryOptions({ queryKey: ["group", id], queryFn: () => getGroup({ data: { id } }) });
