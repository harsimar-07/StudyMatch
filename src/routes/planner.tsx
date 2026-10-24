import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { ArrowLeft, Clock, Lightbulb, ListTodo, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { generateStudyPlan, type StudyPlan } from "@/lib/planner.functions";

export const Route = createFileRoute("/planner")({
  head: () => ({
    meta: [
      { title: "AI Study Planner — StudyMatch" },
      {
        name: "description",
        content:
          "Turn your subjects and topics into a structured study schedule with time blocks, priorities and short breaks.",
      },
      { property: "og:title", content: "AI Study Planner — StudyMatch" },
      {
        property: "og:description",
        content:
          "Turn your subjects and topics into a structured study schedule with time blocks, priorities and short breaks.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: PlannerPage,
});

const priorityStyles: Record<StudyPlan["blocks"][number]["priority"], string> = {
  high: "bg-primary text-primary-foreground",
  medium: "bg-secondary text-secondary-foreground",
  low: "bg-muted text-muted-foreground",
};

function formatMinutes(total: number) {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}

function PlannerPage() {
  const generatePlan = useServerFn(generateStudyPlan);

  const [subject, setSubject] = useState("");
  const [topics, setTopics] = useState("");
  const [minutes, setMinutes] = useState("90");
  const [plan, setPlan] = useState<StudyPlan | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setPlan(null);

    const parsedMinutes = Number.parseInt(minutes, 10);
    if (subject.trim().length < 2) {
      setError("Please enter a subject.");
      return;
    }
    if (topics.trim().length < 3) {
      setError("Please list the topics you need to study.");
      return;
    }
    if (!Number.isFinite(parsedMinutes) || parsedMinutes < 15 || parsedMinutes > 600) {
      setError("Available time must be between 15 and 600 minutes.");
      return;
    }

    setLoading(true);
    try {
      const result = await generatePlan({
        data: { subject: subject.trim(), topics: topics.trim(), minutes: parsedMinutes },
      });
      if (result.error || !result.plan) {
        setError(result.error ?? "Could not generate a plan right now. Please try again.");
      } else {
        setPlan(result.plan);
      }
    } catch {
      setError("Could not generate a plan right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Button asChild variant="ghost" size="sm" className="-ml-2 mb-4">
        <Link to="/">
          <ArrowLeft className="size-4" />
          Back to groups
        </Link>
      </Button>

      <h1 className="font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
        AI Study Planner
      </h1>
      <p className="mt-2 text-muted-foreground">
        Tell the planner what you're studying and how much time you have — it builds a schedule
        with priorities and breaks.
      </p>

      <form
        onSubmit={submit}
        className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm sm:p-8"
        noValidate
      >
        <div className="grid gap-5">
          <div className="grid gap-2">
            <Label htmlFor="plan-subject">Subject</Label>
            <Input
              id="plan-subject"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              placeholder="e.g. Organic Chemistry"
              maxLength={60}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="plan-topics">Topics to study</Label>
            <Textarea
              id="plan-topics"
              value={topics}
              onChange={(event) => setTopics(event.target.value)}
              placeholder="e.g. Reaction mechanisms, stereochemistry, practice problems from chapter 5"
              rows={3}
              maxLength={500}
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="plan-minutes">Available time (minutes)</Label>
            <Input
              id="plan-minutes"
              type="number"
              min={15}
              max={600}
              step={5}
              value={minutes}
              onChange={(event) => setMinutes(event.target.value)}
            />
            <p className="text-xs text-muted-foreground">Between 15 and 600 minutes (up to 10 hours).</p>
          </div>

          {error ? (
            <p
              role="alert"
              className="rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </p>
          ) : null}

          <Button type="submit" size="lg" disabled={loading} className="mt-1">
            <Sparkles className="size-4" />
            {loading ? "Creating your plan…" : "Generate Study Plan"}
          </Button>
        </div>
      </form>

      {loading ? (
        <div className="mt-8 space-y-3" aria-busy="true">
          {[0, 1, 2].map((index) => (
            <div key={index} className="h-24 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      ) : null}

      {plan && !loading ? (
        <section className="mt-10">
          <div className="rounded-2xl bg-accent p-6 sm:p-8">
            <p className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Sparkles className="size-4" />
              Your study plan
            </p>
            <h2 className="mt-2 font-display text-2xl font-bold text-accent-foreground sm:text-3xl">
              {plan.planTitle}
            </h2>
            <p className="mt-1 flex items-center gap-2 text-sm text-accent-foreground/80">
              <Clock className="size-4" />
              {formatMinutes(plan.totalMinutes)} total · {plan.blocks.length} blocks
            </p>
          </div>

          <div className="mt-5 grid gap-4">
            {plan.blocks.map((block, index) => (
              <article
                key={`${block.title}-${index}`}
                className="rounded-2xl border border-border bg-card p-5 shadow-sm"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <span className="flex size-8 items-center justify-center rounded-lg bg-accent text-sm font-bold text-accent-foreground">
                      {index + 1}
                    </span>
                    <h3 className="font-display text-base font-semibold text-foreground">
                      {block.title}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={priorityStyles[block.priority]}>{block.priority} priority</Badge>
                    <Badge variant="outline">{formatMinutes(block.minutes)}</Badge>
                  </div>
                </div>
                <p className="mt-3 text-sm text-muted-foreground">{block.description}</p>
                {block.breakMinutes > 0 ? (
                  <p className="mt-2 flex items-center gap-1.5 text-xs font-medium text-primary">
                    <Clock className="size-3.5" />
                    Followed by a {block.breakMinutes} min break
                  </p>
                ) : null}
              </article>
            ))}
          </div>

          <div className="mt-6 rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h3 className="flex items-center gap-2 font-display text-base font-semibold text-foreground">
              <Lightbulb className="size-4 text-primary" />
              Study tips
            </h3>
            <ul className="mt-3 space-y-2">
              {plan.tips.map((tip, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <ListTodo className="mt-0.5 size-4 shrink-0 text-primary" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}
    </main>
  );
}
