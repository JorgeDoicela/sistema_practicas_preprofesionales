"use client";

import { cn } from "@/lib/utils";

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-200/60", className)}
      {...props}
    />
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="space-y-3">
        <Skeleton className="h-4 w-[150px] bg-[#C5A059]/10" />
        <Skeleton className="h-10 w-[300px]" />
        <Skeleton className="h-4 w-[500px]" />
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-4">
             <Skeleton className="w-12 h-12 rounded-2xl" />
             <div className="space-y-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-8 w-24" />
             </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 p-10 space-y-6">
        <div className="flex justify-between">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="space-y-4">
           {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-2xl" />
           ))}
        </div>
      </div>
    </div>
  );
}
