import { getStructCodec, fixCodecSize, getBytesCodec, getU64Codec, getU32Codec, getArrayCodec } from '@solana/codecs';
import { fetchEncodedAccount, assertAccountExists, decodeAccount } from '@solana/accounts';
import { SYSVAR_STAKE_HISTORY_ADDRESS } from '@solana/sysvars';

// src/delegation.ts
var WARMUP_COOLDOWN_RATE = 0.09;
function getStakeHistoryEntry(epoch, stakeHistory) {
  for (const entry of stakeHistory) {
    if (entry.epoch === epoch) {
      return entry;
    }
  }
  return null;
}
function getStakeAndActivating(delegation, targetEpoch, stakeHistory) {
  if (delegation.activationEpoch === delegation.deactivationEpoch) {
    return {
      effective: BigInt(0),
      activating: BigInt(0)
    };
  } else if (targetEpoch === delegation.activationEpoch) {
    return {
      effective: BigInt(0),
      activating: delegation.stake
    };
  } else if (targetEpoch < delegation.activationEpoch) {
    return {
      effective: BigInt(0),
      activating: BigInt(0)
    };
  }
  let currentEpoch = delegation.activationEpoch;
  let entry = getStakeHistoryEntry(currentEpoch, stakeHistory);
  if (entry !== null) {
    let currentEffectiveStake = BigInt(0);
    while (entry !== null) {
      currentEpoch++;
      const remaining = delegation.stake - currentEffectiveStake;
      const weight = Number(remaining) / Number(entry.activating);
      const newlyEffectiveClusterStake = Number(entry.effective) * WARMUP_COOLDOWN_RATE;
      const newlyEffectiveStake = BigInt(
        Math.max(1, Math.round(weight * newlyEffectiveClusterStake))
      );
      currentEffectiveStake += newlyEffectiveStake;
      if (currentEffectiveStake >= delegation.stake) {
        currentEffectiveStake = delegation.stake;
        break;
      }
      if (currentEpoch >= targetEpoch || currentEpoch >= delegation.deactivationEpoch) {
        break;
      }
      entry = getStakeHistoryEntry(currentEpoch, stakeHistory);
    }
    return {
      effective: currentEffectiveStake,
      activating: delegation.stake - currentEffectiveStake
    };
  } else {
    return {
      effective: delegation.stake,
      activating: BigInt(0)
    };
  }
}
function getStakeActivatingAndDeactivating(delegation, targetEpoch, stakeHistory) {
  const { effective, activating } = getStakeAndActivating(
    delegation,
    targetEpoch,
    stakeHistory
  );
  if (targetEpoch < delegation.deactivationEpoch) {
    return {
      deactivationEpoch: delegation.deactivationEpoch,
      activationEpoch: delegation.activationEpoch,
      effective,
      activating,
      deactivating: BigInt(0)
    };
  } else if (targetEpoch === delegation.deactivationEpoch) {
    return {
      deactivationEpoch: delegation.deactivationEpoch,
      activationEpoch: delegation.activationEpoch,
      effective,
      activating: BigInt(0),
      deactivating: effective
    };
  }
  let currentEpoch = delegation.deactivationEpoch;
  let entry = getStakeHistoryEntry(currentEpoch, stakeHistory);
  if (entry !== null) {
    let currentEffectiveStake = effective;
    while (entry !== null) {
      currentEpoch++;
      if (entry.deactivating === BigInt(0)) {
        break;
      }
      const weight = Number(currentEffectiveStake) / Number(entry.deactivating);
      const newlyNotEffectiveClusterStake = Number(entry.effective) * WARMUP_COOLDOWN_RATE;
      const newlyNotEffectiveStake = BigInt(
        Math.max(1, Math.round(weight * newlyNotEffectiveClusterStake))
      );
      currentEffectiveStake -= newlyNotEffectiveStake;
      if (currentEffectiveStake <= 0) {
        currentEffectiveStake = BigInt(0);
        break;
      }
      if (currentEpoch >= targetEpoch) {
        break;
      }
      entry = getStakeHistoryEntry(currentEpoch, stakeHistory);
    }
    return {
      deactivationEpoch: delegation.deactivationEpoch,
      activationEpoch: delegation.activationEpoch,
      effective: currentEffectiveStake,
      deactivating: currentEffectiveStake,
      activating: BigInt(0)
    };
  } else {
    return {
      deactivationEpoch: BigInt(0),
      activationEpoch: BigInt(0),
      effective: BigInt(0),
      activating: BigInt(0),
      deactivating: BigInt(0)
    };
  }
}
var authorizedCodec = getStructCodec([
  ["staker", fixCodecSize(getBytesCodec(), 32)],
  ["withdrawer", fixCodecSize(getBytesCodec(), 32)]
]);
var lockupCodec = getStructCodec([
  ["unixTimestamp", getU64Codec()],
  ["epoch", getU64Codec()],
  ["custodian", fixCodecSize(getBytesCodec(), 32)]
]);
var metaCodec = getStructCodec([
  ["rentExemptReserve", getU64Codec()],
  ["authorized", authorizedCodec],
  ["lockup", lockupCodec]
]);
var delegationCodec = getStructCodec([
  ["voterPubkey", fixCodecSize(getBytesCodec(), 32)],
  ["stake", getU64Codec()],
  ["activationEpoch", getU64Codec()],
  ["deactivationEpoch", getU64Codec()],
  ["unused", getU64Codec()]
]);
var stakeCodec = getStructCodec([
  ["delegation", delegationCodec],
  ["creditsObserved", getU64Codec()]
]);
var stakeAccountCodec = getStructCodec([
  ["discriminant", getU32Codec()],
  ["meta", metaCodec],
  ["stake", stakeCodec]
]);
var stakeHistoryEntryCodec = getStructCodec([
  ["epoch", getU64Codec()],
  ["effective", getU64Codec()],
  ["activating", getU64Codec()],
  ["deactivating", getU64Codec()]
]);
var stakeHistoryCodec = getArrayCodec(stakeHistoryEntryCodec, {
  size: getU64Codec()
});
async function getStakeActivation(rpc, stakeAddress) {
  const [epochInfo, stakeAccount, stakeHistory] = await Promise.all([
    rpc.getEpochInfo().send(),
    (async () => {
      const stakeAccountEncoded = await fetchEncodedAccount(rpc, stakeAddress);
      assertAccountExists(stakeAccountEncoded);
      const stakeAccount2 = decodeAccount(
        stakeAccountEncoded,
        stakeAccountCodec
      );
      if (stakeAccount2.data.discriminant === 0) {
        throw new Error("");
      }
      return stakeAccount2;
    })(),
    (async () => {
      const stakeHistoryAccountEncoded = await fetchEncodedAccount(
        rpc,
        SYSVAR_STAKE_HISTORY_ADDRESS
      );
      assertAccountExists(stakeHistoryAccountEncoded);
      const stakeHistory2 = decodeAccount(
        stakeHistoryAccountEncoded,
        stakeHistoryCodec
      );
      return stakeHistory2;
    })()
  ]);
  const rentExemptReserve = stakeAccount.data.meta.rentExemptReserve;
  if (stakeAccount.data.discriminant === 1) {
    return {
      status: "inactive",
      active: BigInt(0),
      inactive: stakeAccount.lamports - rentExemptReserve
    };
  }
  const { effective, activating, deactivating } = getStakeActivatingAndDeactivating(
    stakeAccount.data.stake.delegation,
    epochInfo.epoch,
    stakeHistory.data
  );
  let status;
  if (deactivating > 0) {
    status = "deactivating";
  } else if (activating > 0) {
    status = "activating";
  } else if (effective > 0) {
    status = "active";
  } else {
    status = "inactive";
  }
  const inactive = stakeAccount.lamports - effective - rentExemptReserve;
  return {
    status,
    active: effective,
    inactive
  };
}

export { getStakeActivatingAndDeactivating, getStakeActivation, stakeAccountCodec, stakeHistoryCodec };
//# sourceMappingURL=index.mjs.map
//# sourceMappingURL=index.mjs.map