import { IconTrendingDown, IconTrendingUp } from "@tabler/icons-react";

import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTasksQuery } from "@/hooks/use-tasks-query";

export function SectionCards() {
  const { data, isPending, isError } = useTasksQuery();

  if (isPending) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="@container/card">
            <CardHeader>
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16" />
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5 text-sm">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </CardFooter>
          </Card>
        ))}
      </div>
    );
  }

  if (isError) {
    return <div className="px-4 lg:px-6">Error loading tasks data.</div>;
  }

  const total = data.tasks.length;
  const pending = data.tasks.filter((t) => t.status === "todo").length;
  const active = data.tasks.filter((t) => t.status === "in_progress").length;
  const completed = data.tasks.filter((t) => t.status === "completed").length;
  const completionRate =
    total > 0 ? ((completed / total) * 100).toFixed(1) : "0.0";

  return (
    <div className="*:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card grid grid-cols-1 gap-4 px-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:shadow-xs lg:px-6 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Tasks</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {total}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Total number of tasks <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">All tasks in the system</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Pending Tasks</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {pending}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Tasks awaiting action <IconTrendingDown className="size-4" />
          </div>
          <div className="text-muted-foreground">Requires attention</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Tasks</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {active}
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Currently in progress <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Active work items</div>
        </CardFooter>
      </Card>
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Completion Rate</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {completionRate}%
          </CardTitle>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            Percentage completed <IconTrendingUp className="size-4" />
          </div>
          <div className="text-muted-foreground">Overall progress</div>
        </CardFooter>
      </Card>
    </div>
  );
}
