'use strict';

var test = require('ava');
var src = require('../src');

function _interopDefault (e) { return e && e.__esModule ? e : { default: e }; }

var test__default = /*#__PURE__*/_interopDefault(test);

const HUGE_NUM = 1000000000000000n;
test__default.default("activating", (t) => {
  const targetEpoch = 11n;
  const stake = 10n;
  const delegation = {
    stake,
    activationEpoch: targetEpoch,
    deactivationEpoch: HUGE_NUM,
    unused: 0n,
    voterPubkey: new Uint8Array()
  };
  const stakeHistory = [
    {
      epoch: targetEpoch - 1n,
      effective: HUGE_NUM,
      activating: HUGE_NUM,
      deactivating: HUGE_NUM
    }
  ];
  const status = src.getStakeActivatingAndDeactivating(
    delegation,
    targetEpoch,
    stakeHistory
  );
  t.is(status.activating, stake);
  t.is(status.effective, 0n);
  t.is(status.deactivating, 0n);
});
test__default.default("effective", (t) => {
  const targetEpoch = 11n;
  const stake = 10n;
  const delegation = {
    stake,
    activationEpoch: targetEpoch - 1n,
    deactivationEpoch: HUGE_NUM,
    unused: 0n,
    voterPubkey: new Uint8Array()
  };
  const stakeHistory = [
    {
      epoch: targetEpoch - 1n,
      effective: HUGE_NUM,
      activating: stake,
      deactivating: HUGE_NUM
    }
  ];
  const status = src.getStakeActivatingAndDeactivating(
    delegation,
    targetEpoch,
    stakeHistory
  );
  t.is(status.activating, 0n);
  t.is(status.effective, stake);
  t.is(status.deactivating, 0n);
});
test__default.default("deactivating", (t) => {
  const targetEpoch = 11n;
  const stake = 10n;
  const delegation = {
    stake,
    activationEpoch: targetEpoch - 1n,
    deactivationEpoch: targetEpoch,
    unused: 0n,
    voterPubkey: new Uint8Array()
  };
  const stakeHistory = [
    {
      epoch: targetEpoch - 1n,
      effective: HUGE_NUM,
      activating: stake,
      deactivating: stake
    }
  ];
  const status = src.getStakeActivatingAndDeactivating(
    delegation,
    targetEpoch,
    stakeHistory
  );
  t.is(status.activating, 0n);
  t.is(status.effective, stake);
  t.is(status.deactivating, stake);
});
test__default.default("multi-epoch activation", (t) => {
  const targetEpoch = 11n;
  const stake = HUGE_NUM;
  const delegation = {
    stake,
    activationEpoch: targetEpoch - 1n,
    deactivationEpoch: HUGE_NUM,
    unused: 0n,
    voterPubkey: new Uint8Array()
  };
  const stakeHistory = [
    {
      epoch: targetEpoch - 1n,
      effective: HUGE_NUM,
      activating: HUGE_NUM,
      deactivating: HUGE_NUM
    }
  ];
  const status = src.getStakeActivatingAndDeactivating(
    delegation,
    targetEpoch,
    stakeHistory
  );
  const effective = stake * 9n / 100n;
  t.is(status.activating, stake - effective);
  t.is(status.effective, effective);
  t.is(status.deactivating, 0n);
});
test__default.default("multi-epoch deactivation", (t) => {
  const targetEpoch = 11n;
  const stake = HUGE_NUM;
  const delegation = {
    stake,
    activationEpoch: targetEpoch - 2n,
    deactivationEpoch: targetEpoch - 1n,
    unused: 0n,
    voterPubkey: new Uint8Array()
  };
  const stakeHistory = [
    {
      epoch: targetEpoch - 2n,
      effective: HUGE_NUM * 100n,
      // make sure it all activates in one epoch
      activating: stake,
      deactivating: stake
    },
    {
      epoch: targetEpoch - 1n,
      effective: HUGE_NUM,
      activating: HUGE_NUM,
      deactivating: HUGE_NUM
    }
  ];
  const status = src.getStakeActivatingAndDeactivating(
    delegation,
    targetEpoch,
    stakeHistory
  );
  const deactivated = stake * 9n / 100n;
  t.is(status.activating, 0n);
  t.is(status.effective, stake - deactivated);
  t.is(status.deactivating, stake - deactivated);
});
//# sourceMappingURL=delegation.test.js.map
//# sourceMappingURL=delegation.test.js.map