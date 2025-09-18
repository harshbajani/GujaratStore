"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export interface ComboBoxOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface ComboBoxProps {
  options: ComboBoxOption[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  className?: string;
  popoverClassName?: string;
  searchable?: boolean;
  clearable?: boolean;
}

const ComboBox = React.forwardRef<HTMLButtonElement, ComboBoxProps>(
  (
    {
      options = [],
      value,
      onValueChange,
      placeholder = "Select option...",
      searchPlaceholder = "Search options...",
      emptyText = "No option found.",
      disabled = false,
      className,
      popoverClassName,
      searchable = true,
      clearable = false,
      ...props
    },
    ref
  ) => {
    const [open, setOpen] = React.useState(false);

    // Find selected option
    const selectedOption = React.useMemo(() => {
      return options.find((option) => option.value === value);
    }, [options, value]);

    // Handle option selection
    const handleSelect = React.useCallback(
      (selectedValue: string) => {
        // If clicking the same value and clearable is enabled, clear the selection
        if (clearable && selectedValue === value) {
          onValueChange?.("");
          setOpen(false);
          return;
        }

        onValueChange?.(selectedValue);
        setOpen(false);
      },
      [clearable, value, onValueChange]
    );

    // Handle clear selection
    const handleClear = React.useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onValueChange?.("");
      },
      [onValueChange]
    );


    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            ref={ref}
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn(
              "w-full justify-between text-left font-normal",
              !selectedOption && "text-muted-foreground",
              className
            )}
            disabled={disabled}
            {...props}
          >
            <span className="truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <div className="flex items-center gap-1">
              {clearable && selectedOption && (
                <div
                  onClick={handleClear}
                  className="hover:bg-muted rounded p-0.5 hover:text-foreground"
                >
                  <Check className="h-3 w-3" />
                </div>
              )}
              <ChevronsUpDown className="ml-1 h-4 w-4 shrink-0 opacity-50" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className={cn("w-full p-0", popoverClassName)}
          style={{ width: "var(--radix-popover-trigger-width)" }}
        >
          <Command>
            {searchable && (
              <CommandInput
                placeholder={searchPlaceholder}
              />
            )}
            <CommandList>
              <CommandEmpty>{emptyText}</CommandEmpty>
              <CommandGroup>
                {options.map((option) => (
                  <CommandItem
                    key={option.value}
                    value={option.label}
                    disabled={option.disabled}
                    onSelect={() => handleSelect(option.value)}
                    className="cursor-pointer"
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        value === option.value ? "opacity-100" : "opacity-0"
                      )}
                    />
                    <span className="truncate">{option.label}</span>
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    );
  }
);

ComboBox.displayName = "ComboBox";

export { ComboBox };
