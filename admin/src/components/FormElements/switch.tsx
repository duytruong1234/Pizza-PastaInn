import { cn } from "@/lib/utils";
import { useId } from "react";

type PropsType = {
  withIcon?: boolean;
  background?: "dark" | "light";
  backgroundSize?: "sm" | "default";
  name?: string;
  checked?: boolean;
  onChange?: (checked: boolean) => void;
};

export function Switch({
  background,
  withIcon,
  backgroundSize,
  name,
  checked,
  onChange,
}: PropsType) {
  const id = useId();

  return (
    <label
      htmlFor={id}
      className="flex max-w-fit cursor-pointer select-none items-center"
    >
      <div className="relative">
        <input
          type="checkbox"
          name={name}
          id={id}
          className="peer sr-only"
          checked={checked}
          onChange={(e) => onChange?.(e.target.checked)}
        />
        <div
          className={cn(
            "h-8 w-14 rounded-full bg-gray-3 transition-colors peer-checked:bg-green-500 dark:bg-[#5A616B] dark:peer-checked:bg-green-500",
            {
              "h-5": backgroundSize === "sm",
              "bg-[#212B36] dark:bg-primary peer-checked:bg-primary": background === "dark",
            },
          )}
        />

        <div
          className={cn(
            "absolute left-1 top-1 flex size-6 items-center justify-center rounded-full bg-white shadow-switch-1 transition-all peer-checked:right-1 peer-checked:translate-x-full",
            {
              "-top-1 left-0 size-7 shadow-switch-2": backgroundSize === "sm",
            },
          )}
        />
      </div>
    </label>
  );
}
