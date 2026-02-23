"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { Globe } from "lucide-react";
import { setUserLocale } from "@/i18n/locale";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@shared/ui/dropdown-menu";

export function LocaleSwitcher() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function onSelectChange(locale: string) {
    startTransition(() => {
      setUserLocale(locale).then(() => {
        router.refresh();
      });
    });
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={isPending}
        className="h-9 w-9 rounded-full border border-border/50 bg-background flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors disabled:opacity-50"
      >
        <Globe className="h-4 w-4" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() => onSelectChange("en")}
          className="cursor-pointer"
        >
          <span className="mr-2">🇺🇸</span>
          <span>English</span>
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={() => onSelectChange("ru")}
          className="cursor-pointer"
        >
          <span className="mr-2">🇷🇺</span>
          <span>Русский</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
