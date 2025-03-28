import React from 'react';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from "@/components/ui/accordion";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { DualThumbSlider } from "@/components/ui/dual-slider";
import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface FilterSidebarProps {
  filters: {
    primaryCategories: string[];
    secondaryCategories: string[];
    colors: string[];
    priceRange: [number, number];
  };
  categories: {
    primary: { _id: string; name: string; count: number }[];
    secondary: { _id: string; name: string; count: number }[];
  };
  colors: { color: string; count: number }[];
  priceRange: [number, number];
  onFilterChange: (filterType: string, value: string | [number, number], checked?: boolean) => void;
}

const ProductFilterSidebar: React.FC<FilterSidebarProps> = ({
  filters,
  categories,
  colors,
  priceRange,
  onFilterChange
}) => {
  return (
    <div className="w-full md:w-64 p-4 bg-white shadow-sm rounded-lg">
      <Accordion type="multiple" defaultValue={["categories", "color", "price"]}>
        {/* Categories Filter */}
        <AccordionItem value="categories">
          <AccordionTrigger>Categories</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Primary Categories</h4>
                {categories.primary.map((category) => (
                  <div 
                    key={category._id} 
                    className="flex items-center space-x-2 mb-1"
                  >
                    <Checkbox
                      id={`primary-${category._id}`}
                      checked={filters.primaryCategories.includes(category._id)}
                      onCheckedChange={(checked) => 
                        onFilterChange('primaryCategories', category._id, checked as boolean)
                      }
                    />
                    <Label 
                      htmlFor={`primary-${category._id}`}
                      className="text-sm font-normal"
                    >
                      {category.name} ({category.count})
                    </Label>
                  </div>
                ))}
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Secondary Categories</h4>
                {categories.secondary.map((category) => (
                  <div 
                    key={category._id} 
                    className="flex items-center space-x-2 mb-1"
                  >
                    <Checkbox
                      id={`secondary-${category._id}`}
                      checked={filters.secondaryCategories.includes(category._id)}
                      onCheckedChange={(checked) => 
                        onFilterChange('secondaryCategories', category._id, checked as boolean)
                      }
                    />
                    <Label 
                      htmlFor={`secondary-${category._id}`}
                      className="text-sm font-normal"
                    >
                      {category.name} ({category.count})
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Color Filter */}
        <AccordionItem value="color">
          <AccordionTrigger>Color</AccordionTrigger>
          <AccordionContent>
            <div className="grid grid-cols-4 gap-2">
              {colors.map(({ color, count }) => (
                <div key={color} className="flex flex-col items-center">
                  <div
                    className={cn(
                      "h-8 w-8 rounded-full border cursor-pointer relative",
                      filters.colors.includes(color)
                        ? "ring-2 ring-brand ring-offset-2"
                        : ""
                    )}
                    style={{ backgroundColor: color }}
                    onClick={() => 
                      onFilterChange('colors', color, !filters.colors.includes(color))
                    }
                  >
                    {filters.colors.includes(color) && (
                      <Check className="h-4 w-4 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-white" />
                    )}
                  </div>
                  <span className="text-xs mt-1">{count}</span>
                </div>
              ))}
            </div>
          </AccordionContent>
        </AccordionItem>

        {/* Price Range Filter */}
        <AccordionItem value="price">
          <AccordionTrigger>Price</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-sm">
                  ₹{filters.priceRange[0].toLocaleString("en-IN")}
                </span>
                <span className="text-sm">
                  ₹{filters.priceRange[1].toLocaleString("en-IN")}
                </span>
              </div>
              <DualThumbSlider
                value={filters.priceRange}
                min={priceRange[0]}
                max={priceRange[1]}
                step={100}
                onValueChange={(value) => 
                  onFilterChange('priceRange', value as [number, number])
                }
                className="mt-6"
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
};

export default ProductFilterSidebar;