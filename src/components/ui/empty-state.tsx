import { useTranslations } from 'next-intl';

export function EmptyState() {
    const t = useTranslations('Common');
    // Need keys for empty state.
    return (
        <div className="flex flex-col items-center justify-center p-8 text-center border-2 border-dashed rounded-lg bg-muted/50 h-64">
            <div className="text-4xl mb-4">🔍</div>
            <h3 className="text-lg font-semibold">{t('noResults')}</h3>
            <p className="text-sm text-muted-foreground max-w-sm mt-2">
                Try adjusting your filters or job settings.
            </p>
        </div>
    );
}
