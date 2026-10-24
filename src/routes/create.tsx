import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createGroup, createGroupSchema } from "@/lib/study-groups.functions";

export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Create a Study Group — StudyMatch" },
      {
        name: "description",
        content: "Start a campus study group: pick a subject, describe it and set your study time.",
      },
      { property: "og:title", content: "Create a Study Group — StudyMatch" },
      {
        property: "og:description",
        content: "Start a campus study group: pick a subject, describe it and set your study time.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CreateGroupPage,
});

type FieldErrors = Partial<Record<"name" | "subject" | "description" | "preferredTime" | "maxMembers", string>>;

function CreateGroupPage() {
  const navigate = useNavigate({ from: "/create" });
  const queryClient = useQueryClient();
  const createGroupFn = useServerFn(createGroup);

  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [preferredTime, setPreferredTime] = useState("");
  const [maxMembers, setMaxMembers] = useState("10");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);

  const mutation = useMutation({
    mutationFn: (input: {
      name: string;
      subject: string;
      description: string;
      preferredTime: string;
      maxMembers: number;
    }) => createGroupFn({ data: input }),
    onSuccess: async (result) => {
      if (result.error || !result.id) {
        setFormError(result.error ?? "Could not create the group right now.");
        return;
      }
      toast.success("Study group created!");
      await queryClient.invalidateQueries({ queryKey: ["groups"] });
      await navigate({ to: "/groups/$id", params: { id: result.id } });
    },
    onError: () => {
      setFormError("Something went wrong. Please try again.");
    },
  });

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const parsed = createGroupSchema.safeParse({
      name,
      subject,
      description,
      preferredTime,
      maxMembers,
    });

    if (!parsed.success) {
      const errors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (key && !errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    mutation.mutate(parsed.data);
  };

  const field = (key: keyof FieldErrors) =>
    fieldErrors[key] ? <p className="text-sm text-destructive">{fieldErrors[key]}</p> : null;

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-14">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
        <Link to="/">
          <ArrowLeft className="size-4" />
          Back to groups
        </Link>
      </Button>

      <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        Create a Study Group
      </h1>
      <p className="mt-2 text-muted-foreground">
        Set up a group in under a minute — students can find and join it right away.
      </p>

      <form
        onSubmit={submit}
        className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
        noValidate
      >
        <div className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="group-name">Group name</Label>
            <Input
              id="group-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Calculus Crew"
              maxLength={120}
            />
            {field("name")}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="group-subject">Subject</Label>
            <Input
              id="group-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="e.g. Mathematics"
              maxLength={60}
            />
            {field("subject")}
          </div>

          <div className="grid gap-2">
            <Label htmlFor="group-description">Description</Label>
            <Textarea
              id="group-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="What will you work on? Who should join?"
              rows={4}
              maxLength={500}
            />
            {field("description")}
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="group-time">Preferred study time</Label>
              <Input
                id="group-time"
                value={preferredTime}
                onChange={(event) => setPreferredTime(event.target.value)}
                placeholder="e.g. Weekday evenings, 6–8 PM"
                maxLength={60}
              />
              {field("preferredTime")}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="group-max">Maximum members</Label>
              <Input
                id="group-max"
                type="number"
                min={2}
                max={100}
                value={maxMembers}
                onChange={(event) => setMaxMembers(event.target.value)}
              />
              {field("maxMembers")}
            </div>
          </div>

          {formError ? (
            <p
              role="alert"
              className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              {formError}
            </p>
          ) : null}

          <Button type="submit" size="lg" disabled={mutation.isPending} className="mt-1">
            <Users className="size-4" />
            {mutation.isPending ? "Creating…" : "Create group"}
          </Button>
        </div>
      </form>
    </main>
  );
}
