import { LoaderCircle } from "lucide-react";

type LoadingRowProps = {
  label: string;
};

export function LoadingRow({ label }: LoadingRowProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground">
      <LoaderCircle className="h-4 w-4 animate-spin" />
      {label}
    </div>
  );
}
