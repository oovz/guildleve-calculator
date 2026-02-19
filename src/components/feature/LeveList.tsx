
import React, { useRef } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { RankedLeveResult } from '@/types/calculation';
import { LeveCard } from './LeveCard';

interface LeveListProps {
    results: RankedLeveResult[];
    onLeveClick?: (result: RankedLeveResult) => void;
    selectedLeveId?: number | null;
}

export function LeveList({ results, onLeveClick, selectedLeveId }: LeveListProps) {
    const parentRef = useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
        count: results.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 72,
        overscan: 10,
    });

    return (
        <div
            ref={parentRef}
            className="flex-1 overflow-y-auto w-full h-full border-0 bg-transparent pb-20"
            style={{ contain: 'strict' }}
        >
            <div
                style={{
                    height: `${rowVirtualizer.getTotalSize()}px`,
                    width: '100%',
                    position: 'relative',
                }}
            >
                {rowVirtualizer.getVirtualItems().map((virtualRow) => {
                    const result = results[virtualRow.index];
                    if (!result) return null;

                    return (
                        <div
                            key={result.calculation.leve.id}
                            style={{
                                position: 'absolute',
                                top: 0,
                                left: 0,
                                width: '100%',
                                height: `${virtualRow.size}px`,
                                transform: `translateY(${virtualRow.start}px)`,
                            }}
                            className="border-b border-border/60"
                        >
                            <LeveCard
                                result={result}
                                onClick={() => onLeveClick?.(result)}
                                isSelected={selectedLeveId === result.calculation.leve.id}
                            />
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
