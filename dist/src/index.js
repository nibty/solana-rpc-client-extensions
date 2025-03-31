'use strict';

var codecs = require('@solana/codecs');
var accounts = require('@solana/accounts');
var sysvars = require('@solana/sysvars');

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
var authorizedCodec = codecs.getStructCodec([
  ["staker", codecs.fixCodecSize(codecs.getBytesCodec(), 32)],
  ["withdrawer", codecs.fixCodecSize(codecs.getBytesCodec(), 32)]
]);
var lockupCodec = codecs.getStructCodec([
  ["unixTimestamp", codecs.getU64Codec()],
  ["epoch", codecs.getU64Codec()],
  ["custodian", codecs.fixCodecSize(codecs.getBytesCodec(), 32)]
]);
var metaCodec = codecs.getStructCodec([
  ["rentExemptReserve", codecs.getU64Codec()],
  ["authorized", authorizedCodec],
  ["lockup", lockupCodec]
]);
var delegationCodec = codecs.getStructCodec([
  ["voterPubkey", codecs.fixCodecSize(codecs.getBytesCodec(), 32)],
  ["stake", codecs.getU64Codec()],
  ["activationEpoch", codecs.getU64Codec()],
  ["deactivationEpoch", codecs.getU64Codec()],
  ["unused", codecs.getU64Codec()]
]);
var stakeCodec = codecs.getStructCodec([
  ["delegation", delegationCodec],
  ["creditsObserved", codecs.getU64Codec()]
]);
var stakeAccountCodec = codecs.getStructCodec([
  ["discriminant", codecs.getU32Codec()],
  ["meta", metaCodec],
  ["stake", stakeCodec]
]);
var stakeHistoryEntryCodec = codecs.getStructCodec([
  ["epoch", codecs.getU64Codec()],
  ["effective", codecs.getU64Codec()],
  ["activating", codecs.getU64Codec()],
  ["deactivating", codecs.getU64Codec()]
]);
var stakeHistoryCodec = codecs.getArrayCodec(stakeHistoryEntryCodec, {
  size: codecs.getU64Codec()
});
async function getStakeActivation(rpc, stakeAddress) {
  const [epochInfo, stakeAccount, stakeHistory] = await Promise.all([
    rpc.getEpochInfo().send(),
    (async () => {
      const stakeAccountEncoded = await accounts.fetchEncodedAccount(rpc, stakeAddress);
      accounts.assertAccountExists(stakeAccountEncoded);
      const stakeAccount2 = accounts.decodeAccount(
        stakeAccountEncoded,
        stakeAccountCodec
      );
      if (stakeAccount2.data.discriminant === 0) {
        throw new Error("");
      }
      return stakeAccount2;
    })(),
    (async () => {
      const stakeHistoryAccountEncoded = await accounts.fetchEncodedAccount(
        rpc,
        sysvars.SYSVAR_STAKE_HISTORY_ADDRESS
      );
      accounts.assertAccountExists(stakeHistoryAccountEncoded);
      const stakeHistory2 = accounts.decodeAccount(
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

exports.getStakeActivatingAndDeactivating = getStakeActivatingAndDeactivating;
exports.getStakeActivation = getStakeActivation;
exports.stakeAccountCodec = stakeAccountCodec;
exports.stakeHistoryCodec = stakeHistoryCodec;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map