import { useState } from "react";
import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { ArrowLeft, Clock, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useJoinGroup } from "@/hooks/use-join-group";
import { groupQueryOptions, type StudyGroup } from "@/lib/study-groups.functions";

export const Route = createFileRoute("/groups/$id")({
  head: ({ loaderData }) => {
    const group = loaderData?.group;
    return {
      meta: [
        { title: group ? `${group.name} — StudyMatch` : "Study group — StudyMatch" },
        {
          name: "description",
          content: group
            ? `${group.subject} study group: ${group.description}`.slice(0, 160)
            : "A campus study group on StudyMatch.",
        },
        {
          property: "og:title",
          content: group ? `${group.name} — StudyMatch` : "Study group — StudyMatch",
        },
        {
          property: "og:description",
          content: group
            ? `${group.subject} study group: ${group.description}`.slice(0, 160)
            : "A campus study group on StudyMatch.",
        },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(groupQueryOptions(params.id));
    if (!data.group) throw notFound();
    return data;
  },
  component: GroupDetailPage,
});

function JoinForm({ group }: { group: StudyGroup }) {
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const join = useJoinGroup(group.id);
  const isFull = group.member_count >= group.max_members;

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Please enter your name (at least 2 characters).");
      return;
    }
    setError(null);
    join.mutate(trimmed, {
      onSuccess: (result) => {
        if (result.status === "joined") setName("");
      },
    });
  };

  if (isFull) {
    return (
      <div className="rounded-lg bg-muted px-4 py-3 text-sm text-muted-foreground">
        This group has reached its maximum of {group.max_members} members.
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="grid gap-2">
        <Label htmlFor="detail-join-name">Your name</Label>
        <Input
          id="detail-join-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="e.g. Priya"
          maxLength={80}
        />
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
      </div>
      <Button type="submit" className="mt-3 w-full" disabled={join.isPending}>
        <UserPlus className="size-4" />
        {join.isPending ? "Joining…" : "Join group"}
      </Button>
    </form>
  );
}

function GroupDetailPage() {
  const { params } = Route.useParams();
  const { data } = useSuspenseQuery(groupQueryOptions(params.id));

  if (!data.group) throw notFound();
  const group = data.group;
  const isFull = group.member_count >= group.max_members;
  const fillPercent = Math.min(
    100,
    Math.round((group.member_count / group.max_members) * 100),
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
        <Link to="/">
          <ArrowLeft className="size-4" />
          Back to groups
        </Link>
      </Button>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <Badge variant="secondary" className="font-medium">
            {group.subject}
          </Badge>
          <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            {group.name}
          </h1>
          <p className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="size-4 text-primary" />
            {group.preferred_time}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-[1.6fr_1fr]">
        <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-foreground">About this group</h2>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">
            {group.description}
          </p>

          <div className="mt-6">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-2 text-muted-foreground">
                <Users className="size-4 text-primary" />
                {group.member_count} / {group.max_members} members
              </span>
              <span className="text-xs font-medium text-muted-foreground">{fillPercent}%</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${fillPercent}%` }}
              />
            </div>
          </div>

          <h3 className="mt-8 font-display text-base font-semibold text-foreground">
            Members ({data.members.length})
          </h3>
          {data.members.length > 0 ? (
            <ul className="mt-3 flex flex-wrap gap-2">
              {data.members.map((member) => (
                <li
                  key={member.id}
                  className="rounded-full bg-accent px-3 py-1 text-sm text-accent-foreground"
                >
                  {member.member_name}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm text-muted-foreground">
              No members yet — be the first to join!
            </p>
          )}
        </section>

        <aside className="h-fit rounded-2xl border border-border bg-card p-6 shadow-sm">
          <h2 className="font-display text-lg font-semibold text-foreground">
            {isFull ? "Group is full" : "Join this group"}
          </h2>
          <p className="mt-1 mb-4 text-sm text-muted-foreground">
            {isFull
              ? "Check back later — spots may open up."
              : `${group.max_members - group.member_count} spot${group.max_members - group.member_count === 1 ? "" : "s"} left.`}
          </p>
          <JoinForm group={group} />
        </aside>
      </div>
    </main>
  );
}
