// Logo Pizza&PastaInn
import { cn } from "@/lib/utils";

export function Logo({ isCollapsed }: { isCollapsed?: boolean }) {
  return (
    <div className={cn("flex items-center transition-all duration-300", !isCollapsed && "gap-3")}>
      {/* Logo with dark text for Light Mode */}
      <img
        src="/images/logo-dark-text.png"
        alt="Pizza & Pasta Inn Logo"
        style={{
          height: isCollapsed ? "34px" : "40px",
          width: "auto",
          maxWidth: isCollapsed ? "44px" : "180px",
          objectFit: "contain",
        }}
        className={cn(
          "transition-all duration-300 dark:hidden",
          isCollapsed ? "mx-auto rounded-lg" : ""
        )}
      />
      {/* Logo with white text for Dark Mode */}
      <img
        src="/images/logo.png"
        alt="Pizza & Pasta Inn Logo"
        style={{
          height: isCollapsed ? "34px" : "40px",
          width: "auto",
          maxWidth: isCollapsed ? "44px" : "180px",
          objectFit: "contain",
        }}
        className={cn(
          "transition-all duration-300 hidden dark:block",
          isCollapsed ? "mx-auto rounded-lg" : ""
        )}
      />
    </div>
  );
}
