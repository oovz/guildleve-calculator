/* eslint-disable @next/next/no-img-element */
import React from 'react';
import { cn } from '@/lib/utils';

interface GilIconProps extends React.HTMLAttributes<HTMLDivElement> {
    className?: string;
}

export function GilIcon({ className, ...props }: GilIconProps) {
    return (
        <div className={cn("inline-flex items-center justify-center shrink-0 w-[1.1em] h-[1.1em] bg-transparent", className)} {...props}>
            <img
                src="https://xivapi.com/i/065000/065002_hr1.png"
                alt="Gil"
                className="w-full h-full object-contain"
                style={{ mixBlendMode: 'normal' }}
            />
        </div>
    );
}
