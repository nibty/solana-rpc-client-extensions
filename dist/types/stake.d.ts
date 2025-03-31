import type { ReadonlyUint8Array } from '@solana/codecs';
export declare const stakeAccountCodec: import("@solana/codecs").FixedSizeCodec<{
    discriminant: number | bigint;
    stake: {
        delegation: {
            voterPubkey: ReadonlyUint8Array | Uint8Array<ArrayBufferLike>;
            activationEpoch: number | bigint;
            stake: number | bigint;
            deactivationEpoch: number | bigint;
            unused: number | bigint;
        };
        creditsObserved: number | bigint;
    };
    meta: {
        rentExemptReserve: number | bigint;
        lockup: {
            unixTimestamp: number | bigint;
            custodian: ReadonlyUint8Array | Uint8Array<ArrayBufferLike>;
            epoch: number | bigint;
        };
        authorized: {
            staker: ReadonlyUint8Array | Uint8Array<ArrayBufferLike>;
            withdrawer: ReadonlyUint8Array | Uint8Array<ArrayBufferLike>;
        };
    };
}, {
    discriminant: number;
    stake: {
        delegation: {
            voterPubkey: ReadonlyUint8Array;
            activationEpoch: bigint;
            stake: bigint;
            deactivationEpoch: bigint;
            unused: bigint;
        } & {
            voterPubkey: ReadonlyUint8Array | Uint8Array<ArrayBufferLike>;
            activationEpoch: number | bigint;
            stake: number | bigint;
            deactivationEpoch: number | bigint;
            unused: number | bigint;
        };
        creditsObserved: bigint;
    } & {
        delegation: {
            voterPubkey: ReadonlyUint8Array | Uint8Array<ArrayBufferLike>;
            activationEpoch: number | bigint;
            stake: number | bigint;
            deactivationEpoch: number | bigint;
            unused: number | bigint;
        };
        creditsObserved: number | bigint;
    };
    meta: {
        rentExemptReserve: bigint;
        lockup: {
            unixTimestamp: bigint;
            custodian: ReadonlyUint8Array;
            epoch: bigint;
        } & {
            unixTimestamp: number | bigint;
            custodian: ReadonlyUint8Array | Uint8Array<ArrayBufferLike>;
            epoch: number | bigint;
        };
        authorized: {
            staker: ReadonlyUint8Array;
            withdrawer: ReadonlyUint8Array;
        } & {
            staker: ReadonlyUint8Array | Uint8Array<ArrayBufferLike>;
            withdrawer: ReadonlyUint8Array | Uint8Array<ArrayBufferLike>;
        };
    } & {
        rentExemptReserve: number | bigint;
        lockup: {
            unixTimestamp: number | bigint;
            custodian: ReadonlyUint8Array | Uint8Array<ArrayBufferLike>;
            epoch: number | bigint;
        };
        authorized: {
            staker: ReadonlyUint8Array | Uint8Array<ArrayBufferLike>;
            withdrawer: ReadonlyUint8Array | Uint8Array<ArrayBufferLike>;
        };
    };
} & {
    discriminant: number | bigint;
    stake: {
        delegation: {
            voterPubkey: ReadonlyUint8Array | Uint8Array<ArrayBufferLike>;
            activationEpoch: number | bigint;
            stake: number | bigint;
            deactivationEpoch: number | bigint;
            unused: number | bigint;
        };
        creditsObserved: number | bigint;
    };
    meta: {
        rentExemptReserve: number | bigint;
        lockup: {
            unixTimestamp: number | bigint;
            custodian: ReadonlyUint8Array | Uint8Array<ArrayBufferLike>;
            epoch: number | bigint;
        };
        authorized: {
            staker: ReadonlyUint8Array | Uint8Array<ArrayBufferLike>;
            withdrawer: ReadonlyUint8Array | Uint8Array<ArrayBufferLike>;
        };
    };
}>;
export declare const stakeHistoryCodec: import("@solana/codecs").VariableSizeCodec<{
    epoch: number | bigint;
    activating: number | bigint;
    effective: number | bigint;
    deactivating: number | bigint;
}[], ({
    epoch: bigint;
    activating: bigint;
    effective: bigint;
    deactivating: bigint;
} & {
    epoch: number | bigint;
    activating: number | bigint;
    effective: number | bigint;
    deactivating: number | bigint;
})[]>;
export interface StakeAccount {
    discriminant: number;
    meta: Meta;
    stake: Stake;
}
export interface Meta {
    rentExemptReserve: bigint;
    authorized: Authorized;
    lockup: Lockup;
}
export interface Authorized {
    staker: Uint8Array;
    withdrawer: Uint8Array;
}
export interface Lockup {
    unixTimestamp: bigint;
    epoch: bigint;
    custodian: Uint8Array;
}
export interface Stake {
    delegation: Delegation;
    creditsObserved: bigint;
}
export interface Delegation {
    voterPubkey: ReadonlyUint8Array;
    stake: bigint;
    activationEpoch: bigint;
    deactivationEpoch: bigint;
    unused: bigint;
}
export interface StakeHistoryEntry {
    epoch: bigint;
    effective: bigint;
    activating: bigint;
    deactivating: bigint;
}
//# sourceMappingURL=stake.d.ts.map