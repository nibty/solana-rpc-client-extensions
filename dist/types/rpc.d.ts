import { Address } from '@solana/addresses';
import { Rpc, SolanaRpcApi } from '@solana/rpc';
export interface StakeActivation {
    status: string;
    active: bigint;
    inactive: bigint;
}
export declare function getStakeActivation(rpc: Rpc<SolanaRpcApi>, stakeAddress: Address): Promise<StakeActivation>;
//# sourceMappingURL=rpc.d.ts.map