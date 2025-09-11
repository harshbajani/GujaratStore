import React, { ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface AccordionSectionProps {
  id: string;
  title: string;
  index: number;
  children: ReactNode;
  showItemCount?: number;
  onToggle?: (id: string) => void;
  expandedSection?: string | null;
  changeButtonText?: string;
  defaultExpanded?: boolean;
}

const AccordionSection: React.FC<AccordionSectionProps> = ({
  id,
  title,
  index,
  children,
  showItemCount,
  onToggle,
  expandedSection,
  changeButtonText = "CHANGE",
  defaultExpanded = false,
}) => {
  const [localExpanded, setLocalExpanded] = React.useState(defaultExpanded);
  const isExpanded = expandedSection !== null ? expandedSection === id : localExpanded;

  const handleToggle = () => {
    if (onToggle) {
      onToggle(id);
    } else {
      setLocalExpanded(!localExpanded);
    }
  };

  return (
    <div className="bg-white rounded-md overflow-hidden">
      <div
        className={cn(
          "flex justify-between items-center p-4 cursor-pointer",
          isExpanded ? "bg-red-600 text-white" : ""
        )}
        onClick={handleToggle}
      >
        <div className="flex items-center gap-2">
          <span className="flex justify-center items-center h-6 w-6 rounded-full border text-sm">
            {index}
          </span>
          <h2 className="font-semibold">{title}</h2>
          {showItemCount !== undefined && (
            <span className="text-sm">({showItemCount} items)</span>
          )}
        </div>
        {onToggle && (
          <Button
            variant="outline"
            size="sm"
            className={isExpanded ? "bg-white text-black" : ""}
            onClick={(e) => {
              e.stopPropagation();
              handleToggle();
            }}
          >
            {changeButtonText}
          </Button>
        )}
      </div>

      {isExpanded && <div className="p-4">{children}</div>}
    </div>
  );
};

export default AccordionSection;
