import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent, CardHeader } from '@/components/ui/card'; // CardFooterを削除

export function SkeletonCard() {
  return (
    <Card className="flex flex-col overflow-hidden">
      {/* Image Skeleton */}
      <Skeleton className="relative aspect-[16/9] w-full" />

      <CardHeader className="pb-3 pt-4">
        <div className="flex items-center justify-between gap-2">
          {/* Genre Skeleton */}
          <Skeleton className="h-4 w-1/4" />
          {/* Star Skeleton */}
          <Skeleton className="h-4 w-4 rounded-full" />
        </div>
        {/* Title Skeleton */}
        <Skeleton className="h-6 w-3/4 pt-1" />
      </CardHeader>

      <CardContent className="flex-grow pb-3 pt-0">
        {/* Area Skeleton */}
        <div className="flex items-center gap-1.5 mb-1.5">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
        {/* Holiday Skeleton */}
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </CardContent>

      {/* Footer Skeleton (Optional, if memo is common) */}
      {/*
      <CardFooter className="pt-0 pb-4 border-t mt-auto pt-3">
        <div className="flex items-start gap-1.5">
          <Skeleton className="h-4 w-4 mt-0.5" />
          <Skeleton className="h-4 w-full" />
        </div>
      </CardFooter>
      */}
    </Card>
  );
}
