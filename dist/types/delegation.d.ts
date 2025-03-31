import { Delegation, StakeHistoryEntry } from './stake';
export interface StakeActivatingAndDeactivating {
    deactivationEpoch: bigint;
    activationEpoch: bigint;
    effective: bigint;
    activating: bigint;
    deactivating: bigint;
}
export interface EffectiveAndActivating {
    effective: bigint;
    activating: bigint;
}
export declare function getStakeActivatingAndDeactivating(delegation: Delegation, targetEpoch: bigint, stakeHistory: StakeHistoryEntry[]): StakeActivatingAndDeactivating;
//# sourceMappingURL=delegation.d.ts.map