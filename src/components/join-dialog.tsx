import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useJoinGroup } from "@/hooks/use-join-group";

type JoinDialogProps = {
  groupId: string;
  groupName: string;
  disabled?: boolean;
  className?: string;
};

export function JoinDialog({ groupId, groupName, disabled, className }: JoinDialogProps) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const join = useJoinGroup(groupId);

  const submit = async () => {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError("Please enter your name (at least 2 characters).");
      return;
    }
    setError(null);
    join.mutate(trimmed, {
      onSuccess: (result) => {
        if (result.status === "joined") {
          setOpen(false);
          setName("");
        }
      },
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (next) setError(null);
      }}
    >
      <DialogTrigger asChild>
        <Button className={className} disabled={disabled}>
          {disabled ? "Group full" : "Join group"}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Join “{groupName}”</DialogTitle>
          <DialogDescription>Enter your name so other members know who joined.</DialogDescription>
        </DialogHeader>
        <div className="grid gap-2 py-2">
          <Label htmlFor="join-name">Your name</Label>
          <Input
            id="join-name"
            value={name}
            placeholder="e.g. Priya"
            onChange={(event) => setName(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !join.isPending) void submit();
            }}
            maxLength={80}
          />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => void submit()} disabled={join.isPending}>
            {join.isPending ? "Joining…" : "Join group"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
