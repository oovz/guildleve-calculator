
import { JOBS, JobId } from '@/types/job';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useLocale } from 'next-intl';
import { CircleHelp } from 'lucide-react';

interface JobIconProps {
    jobId: JobId | string;
    className?: string;
    showTooltip?: boolean;
}

export function JobIcon({ jobId, className, showTooltip = false }: JobIconProps) {
    const locale = useLocale();
    const normalizedJobId = jobId.toString().toUpperCase() as JobId;
    const job = JOBS[normalizedJobId];
    const dataLocale = locale === 'zh-Hans' ? 'zh-Hans' : 'en';
    const jobName = job?.name[dataLocale] || job?.name.en || normalizedJobId;

    const iconClass = `job-icon-${normalizedJobId.toLowerCase()}`;
    const baseUrl = locale === 'zh-Hans' ? 'https://cafemaker.wakingsands.com' : 'https://xivapi.com';
    let iconUrl = job?.iconUrl || null;

    if (iconUrl) {
        if (iconUrl.startsWith('https://xivapi.com')) {
            iconUrl = iconUrl.replace('https://xivapi.com', baseUrl);
        } else if (!iconUrl.startsWith('http')) {
            iconUrl = `${baseUrl}${iconUrl}`;
        }
    }

    return (
        <div
            className={cn(
                "w-6 h-6 rounded-lg flex items-center justify-center shrink-0 overflow-hidden shadow-sm",
                iconClass,
                className
            )}
            title={showTooltip ? jobName : undefined}
        >
            {iconUrl ? (
                <Image
                    src={iconUrl}
                    alt={jobName}
                    width={24}
                    height={24}
                    className="object-contain"
                    unoptimized
                />
            ) : (
                <CircleHelp className="w-4 h-4 text-white" />
            )}
        </div>
    );
}
