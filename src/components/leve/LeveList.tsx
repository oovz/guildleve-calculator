import { RankedLeveResult } from '@/types/calculation';
import { LeveCard } from './LeveCard';
import { EmptyState } from '@/components/ui/empty-state';

interface LeveListProps {
    results: RankedLeveResult[];
    selectedId?: number;
    onSelect?: (result: RankedLeveResult) => void;
    sortBy?: 'profit' | 'xp' | 'ratio';
}

export function LeveList({ results, selectedId, onSelect, sortBy }: LeveListProps) {
    if (results.length === 0) {
        return <EmptyState />;
    }

    return (
        <div className="space-y-3">
            {results.map((result) => (
                <LeveCard
                    key={result.calculation.leve.id}
                    result={result}
                    isSelected={selectedId === result.calculation.leve.id}
                    onSelect={() => onSelect?.(result)}
                    sortBy={sortBy}
                />
            ))}
        </div>
    );
}
