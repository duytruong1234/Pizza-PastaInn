// Logo Pizza&PastaInn
import { cn } from "@/lib/utils";

export function Logo({ isCollapsed }: { isCollapsed?: boolean }) {
  return (
    <div className={cn("flex items-center", !isCollapsed && "gap-3")}>
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary text-xl font-bold text-white shadow-sm">
        P
      </span>
      <span className={cn(
        "text-xl font-bold text-dark dark:text-white transition-all duration-300 overflow-hidden whitespace-nowrap",
        isCollapsed ? "w-0 opacity-0" : "w-[120px] opacity-100"
      )}>
        Pizza&Pasta
      </span>
    </div>
  );
}
