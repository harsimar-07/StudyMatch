import { Link } from "@tanstack/react-router";
import { Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { JoinDialog } from "@/components/join-dialog";
import type { StudyGroup } from "@/lib/study-groups.functions";

export function GroupCard({ group }: { group: StudyGroup }) {
  const isFull = group.member_count >= group.max_members;
  const fillPercent = Math.min(
    100,
    Math.round((group.member_count / group.max_members) * 100),
  );

  return (
    <div className="group flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <Badge variant="secondary" className="font-medium">
          {group.subject}
        </Badge>
        {isFull ? (
          <Badge variant="outline" className="text-muted-foreground">
            Full
          </Badge>
        ) : null}
      </div>

      <h3 className="mt-3 font-display text-lg font-semibold leading-snug text-foreground">
        {group.name}
      </h3>
      <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">{group.description}</p>

      <div className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="size-4 text-primary" />
        <span>{group.preferred_time}</span>
      </div>

      <div className="mt-3">
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

      <div className="mt-5 flex gap-2 pt-1">
        <Button asChild variant="outline" size="sm" className="flex-1">
          <Link to="/groups/$id" params={{ id: group.id }}>
            View details
          </Link>
        </Button>
        <JoinDialog
          groupId={group.id}
          groupName={group.name}
          disabled={isFull}
          className="flex-1"
        />
      </div>
    </div>
  );
}
