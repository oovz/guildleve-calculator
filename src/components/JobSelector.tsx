import { Button } from "@/components/ui/button";
import { JOBS, JobId } from "@/types/job";
import { cn } from "@/lib/utils";
import { JobIcon } from "@/components/ui/JobIcon";
import { useLocale } from "next-intl";

interface JobSelectorProps {
    selectedJobIds: JobId[];
    onSelect: (id: JobId) => void;
    variant?: 'default' | 'horizontal';
}



export function JobSelector({ selectedJobIds, onSelect, variant = 'default' }: JobSelectorProps) {
    const locale = useLocale();
    const dataLocale = locale === 'zh-Hans' ? 'zh-Hans' : 'en';
    const jobIds = Object.keys(JOBS) as JobId[];

    if (variant === 'horizontal') {
        return (
            <div className="flex items-center gap-2 bg-white/50 dark:bg-black/20 p-1.5 rounded-lg border border-black/5 dark:border-white/5 overflow-x-auto max-w-full no-scrollbar">
                {jobIds.map((id) => {
                    const job = JOBS[id];
                    const isExplicitlySelected = selectedJobIds.includes(id);

                    return (
                        <button
                            key={id}
                            title={job.name[dataLocale] || job.name.en}
                            onClick={() => onSelect(id)}
                            className={cn(
                                "relative transition-all duration-200 ease-in-out w-9 h-9 rounded-md flex items-center justify-center",
                                isExplicitlySelected
                                    ? "opacity-100 scale-100 shadow-sm bg-accent-blue/15 ring-2 ring-offset-1 ring-offset-white dark:ring-offset-zinc-900 ring-accent-blue dark:ring-accent-cool z-10"
                                    : "opacity-40 scale-90 hover:opacity-80 hover:scale-95 grayscale hover:grayscale-0"
                            )}
                        >
                            <JobIcon jobId={id} className="w-7 h-7" />

                            {/* Active Dot Indicator for explicit selection */}
                            {isExplicitlySelected && (
                                <span className="absolute -bottom-1 -right-1 w-2.5 h-2.5 bg-white dark:bg-zinc-800 rounded-full flex items-center justify-center shadow-sm z-20">
                                    <span className="w-1.5 h-1.5 bg-accent-blue rounded-full"></span>
                                </span>
                            )}
                        </button>
                    );
                })}
            </div>
        );
    }

    return (
        <div className="flex flex-wrap gap-2 justify-center py-4 bg-muted/30 rounded-lg border border-border/50">
            {jobIds.map((id) => {
                const job = JOBS[id];
                const isSelected = selectedJobIds.includes(id);
                return (
                    <Button
                        key={id}
                        variant={isSelected ? "default" : "outline"}
                        size="sm"
                        onClick={() => onSelect(id)}
                        className={cn(
                            "flex items-center gap-2 transition-all",
                            isSelected
                                ? "bg-primary text-primary-foreground shadow-md scale-105"
                                : "hover:bg-accent hover:text-accent-foreground text-muted-foreground"
                        )}
                    >
                        <span>{job.name.en.slice(0, 3).toUpperCase()}</span>
                    </Button>
                );
            })}
        </div>
    );
}
