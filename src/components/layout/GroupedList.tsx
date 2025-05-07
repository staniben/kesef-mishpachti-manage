
import React from "react";
import { cn } from "@/lib/utils";

interface GroupedListProps<T extends { id: string; label: string }> {
  title?: string;
  items: T[];
  renderItem: (item: T) => React.ReactNode;
  className?: string;
}

export function GroupedList<T extends { id: string; label: string }>({
  title,
  items,
  renderItem,
  className,
}: GroupedListProps<T>) {
  return (
    <div className={cn("space-y-2", className)}>
      {title && (
        <h2 className="text-lg font-semibold">{title}</h2>
      )}
      <ul className="space-y-1">
        {items.map((item) => (
          <li key={item.id} className="flex items-center">
            {renderItem(item)}
          </li>
        ))}
      </ul>
    </div>
  );
}
