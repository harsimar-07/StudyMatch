import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { BookOpen, Search, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GroupCard } from "@/components/group-card";
import { groupsQueryOptions } from "@/lib/study-groups.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "StudyMatch — Find Your People. Study Smarter." },
      {
        name: "description",
        content:
          "Discover, create and join campus study groups by subject and study time, and build AI-powered study plans.",
      },
      { property: "og:title", content: "StudyMatch — Find Your People. Study Smarter." },
      {
        property: "og:description",
        content:
          "Discover, create and join campus study groups by subject and study time, and build AI-powered study plans.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(groupsQueryOptions()),
  component: Dashboard,
});

function Dashboard() {
  const { data } = useSuspenseQuery(groupsQueryOptions());
  const [search, setSearch] = useState("");
  const [subject, setSubject] = useState("all");

  const subjects = useMemo(
    () => Array.from(new Set(data.groups.map((g) => g.subject))).sort(),
    [data.groups],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return data.groups.filter((group) => {
      const matchesSubject = subject === "all" || group.subject === subject;
      const matchesQuery =
        query.length === 0 ||
        group.name.toLowerCase().includes(query) ||
        group.subject.toLowerCase().includes(query) ||
        group.description.toLowerCase().includes(query);
      return matchesSubject && matchesQuery;
    });
  }, [data.groups, search, subject]);

  return (
    <main>
      <section className="border-b border-border/70 bg-accent/60">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 sm:py-20">
          <p className="flex items-center gap-2 text-sm font-semibold text-primary">
            <Sparkles className="size-4" />
            Campus study groups, matched to you
          </p>
          <h1 className="mt-3 max-w-2xl font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Find Your People. Study Smarter.
          </h1>
          <p className="mt-3 max-w-xl text-muted-foreground">
            Browse study groups by subject and preferred study time, start your own, or let the AI
            planner build your next study session.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild size="lg">
              <Link to="/create">Create a study group</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/planner">
                <Sparkles className="size-4" />
                AI Study Planner
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search group names or topics…"
              className="pl-9"
              aria-label="Search study groups"
            />
          </div>
          <Select value={subject} onValueChange={setSubject}>
            <SelectTrigger className="w-full sm:w-56" aria-label="Filter by subject">
              <SelectValue placeholder="All subjects" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All subjects</SelectItem>
              {subjects.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {data.error ? (
          <p className="mt-8 rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
            {data.error}
          </p>
        ) : null}

        {filtered.length > 0 ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((group) => (
              <GroupCard key={group.id} group={group} />
            ))}
          </div>
        ) : (
          <div className="mt-12 flex flex-col items-center rounded-2xl border border-dashed border-border bg-card px-6 py-16 text-center">
            <span className="flex size-12 items-center justify-center rounded-2xl bg-accent text-accent-foreground">
              <BookOpen className="size-6" />
            </span>
            <h2 className="mt-4 font-display text-xl font-semibold text-foreground">
              No groups match your filters
            </h2>
            <p className="mt-2 max-w-sm text-sm text-muted-foreground">
              Try a different search or subject — or be the first to start a group for this topic.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSearch("");
                  setSubject("all");
                }}
              >
                Clear filters
              </Button>
              <Button asChild>
                <Link to="/create">
                  <Users className="size-4" />
                  Create a group
                </Link>
              </Button>
            </div>
          </div>
        )}
      </section>
    </main>
  );
}
