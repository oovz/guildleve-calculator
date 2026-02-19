
'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { usePriceOverrides } from '@/lib/context/PriceOverrideContext';
import { LeveCalculation } from '@/types/calculation';
import { Label } from '@/components/ui/label';

interface LeveDetailDialogProps {
    calculation: LeveCalculation | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function LeveDetailDialog({ calculation, open, onOpenChange }: LeveDetailDialogProps) {
    const { overrides, setOverride, clearOverride } = usePriceOverrides();
    const [priceInput, setPriceInput] = useState('');

    const itemId = calculation?.item.id;
    const currentOverride = itemId ? overrides[itemId] : undefined;

    useEffect(() => {
        if (open && calculation) {
            // Initialize input with override or current market price
            const price = currentOverride ?? calculation.market?.minPriceNQ ?? '';
            setPriceInput(price === '' ? '' : String(price));
        }
    }, [open, calculation, currentOverride]);

    const handleSave = () => {
        if (!itemId) return;
        const val = parseInt(priceInput);
        if (!isNaN(val) && priceInput.trim() !== '') {
            setOverride(itemId, val);
        } else {
            // If empty, assume clear
            clearOverride(itemId);
        }
        onOpenChange(false);
    };

    const handleClear = () => {
        if (!itemId) return;
        clearOverride(itemId);
        onOpenChange(false);
    };

    if (!calculation) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{calculation.leve.name.en}</DialogTitle>
                    <DialogDescription>
                        {calculation.item.name.en} (x{calculation.leve.requiredQty})
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="price" className="text-right">
                            Price (NQ)
                        </Label>
                        <Input
                            id="price"
                            type="number"
                            value={priceInput}
                            onChange={(e) => setPriceInput(e.target.value)}
                            className="col-span-3"
                            placeholder="Market Price Override"
                        />
                    </div>
                </div>
                <p className="text-xs text-muted-foreground">
                    Current Market NQ: {calculation.market?.minPriceNQ?.toLocaleString() ?? 'N/A'}
                    <br />
                    Original Source: {calculation.market?.worldNQ ?? 'Unknown'}
                </p>

                <DialogFooter className="gap-2 sm:gap-0">
                    {currentOverride !== undefined && (
                        <Button variant="destructive" type="button" onClick={handleClear}>
                            Reset Override
                        </Button>
                    )}
                    <Button type="submit" onClick={handleSave}>Save changes</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
