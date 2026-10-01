import React from "react";
import { cn } from "@/lib/utils";

export function DataTable({ columns, rows, onRowClick, emptyMessage, dense }) {
    if (!rows || rows.length === 0) {
        return <div className="py-6 text-center text-muted-foreground text-xs">{emptyMessage || "No rows"}</div>;
    }
    return (
        <div className="overflow-x-auto">
            <table className="w-full border-collapse text-xs">
                <thead>
                    <tr className="border-b bg-[hsl(var(--panel-header))]">
                        {columns.map((c) => (
                            <th
                                key={c.key}
                                className={cn(
                                    "text-left font-semibold uppercase tracking-wide text-[10px] text-muted-foreground px-2 py-1.5 whitespace-nowrap",
                                    c.numeric && "text-right num",
                                    c.align === "center" && "text-center"
                                )}
                                style={{ width: c.width }}
                            >
                                {c.header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row, i) => (
                        <tr
                            key={row.id ?? i}
                            onClick={onRowClick ? () => onRowClick(row) : undefined}
                            className={cn(
                                "border-b last:border-b-0 hover:bg-muted/60 transition-colors duration-150",
                                onRowClick && "cursor-pointer",
                                dense && "h-8"
                            )}
                        >
                            {columns.map((c) => (
                                <td
                                    key={c.key}
                                    className={cn("px-2 py-1.5 align-middle", c.numeric && "text-right num", c.align === "center" && "text-center", c.cellClassName)}
                                >
                                    {c.render ? c.render(row) : row[c.key]}
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}