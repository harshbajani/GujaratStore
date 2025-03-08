import * as React from "react";
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandGroup,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface Option {
  value: string;
  label: string;
  isActive?: boolean;
}

interface MultiSelectProps {
  options: Option[]; // Array of options with { value, label }
  onValueChange: (values: string[]) => void; // Callback for value changes
  defaultValue?: string[]; // Initial selected values
  placeholder?: string; // Placeholder text
}

export function MultiSelect({
  options,
  onValueChange,
  defaultValue = [],
  placeholder = "Select options",
}: MultiSelectProps) {
  const [selectedValues, setSelectedValues] =
    React.useState<string[]>(defaultValue);

  const toggleOption = (optionValue: string) => {
    const newSelectedValues = selectedValues.includes(optionValue)
      ? selectedValues.filter((v) => v !== optionValue)
      : [...selectedValues, optionValue];

    setSelectedValues(newSelectedValues);
    onValueChange(newSelectedValues);
  };

  React.useEffect(() => {
    setSelectedValues(defaultValue || []); // Sync state with prop changes
  }, [defaultValue]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className="w-full justify-start">
          {selectedValues.length > 0 ? (
            <div className="flex gap-1 items-center flex-wrap">
              {selectedValues.map((value) => {
                const option = options.find((o) => o.value === value);
                return option ? (
                  <Badge key={value} variant="secondary">
                    {option.label}
                  </Badge>
                ) : null;
              })}
            </div>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0" align="start">
        <Command>
          <CommandList>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem
                  key={option.value}
                  onSelect={() => toggleOption(option.value)}
                  value={option.value}
                >
                  <div
                    className={cn(
                      "mr-2 flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                      selectedValues.includes(option.value)
                        ? "bg-primary text-primary-foreground"
                        : "opacity-50 [&_svg]:invisible"
                    )}
                  >
                    {selectedValues.includes(option.value) && "✓"}
                  </div>
                  <span>{option.label}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
