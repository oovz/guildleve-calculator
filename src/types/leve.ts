export interface LocalizedString {
    en: string;
    'zh-Hans'?: string;
}

export interface BonusRewardItem {
    itemId: number;
    count: number;
    isHq: boolean;
}

export interface BonusRewardGroup {
    probability: number; // 0.0 to 1.0
    items: BonusRewardItem[];
}

// import { JobId } from './job';

export interface Leve {
    id: number;
    name: LocalizedString;
    level: number;
    jobId: number;

    // Turn-in requirements
    requiredItemId: number;
    requiredQty: number;
    turnins: number;

    // Rewards (base values)
    rewardGil: number;
    rewardExp: number;

    // NPC location
    npcId: number;
    issuerName?: LocalizedString;
    issuerTitle?: LocalizedString;
    turninPlaceName?: LocalizedString;

    // Bonus item rewards
    bonusRewards: BonusRewardGroup[];
}
