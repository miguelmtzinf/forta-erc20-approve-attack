import { BigNumber } from "ethers";

type ApproveType = { origin: string; amount: string };
type Store = {
  [spender: string]: {
    [asset: string]: {
      startingBlock: number;
      approves: [ApproveType];
    };
  };
};

const store: Store = {};

export const exist = (asset: string, spender: string) => {
  return store[spender] && store[spender][asset];
};

export const get = (asset: string, spender: string) => {
  if (!store[spender]) return undefined;
  return store[spender][asset];
};

export const getStartingBlock = (asset: string, spender: string) => {
  if (!exist(asset, spender)) return 0;
  return store[spender][asset].startingBlock;
};

export const getApproves = (asset: string, spender: string) => {
  if (!exist(asset, spender)) return [];
  const info = get(asset, spender);
  if (!info) return [];
  return info.approves;
};

export const getApprovesLength = (asset: string, spender: string) => {
  return getApproves(asset, spender).length;
};

export const getApproveIndexByAddress = (
  approves: ApproveType[],
  address: string
) => {
  const addresses = approves.map(({ origin }) => origin);
  for (let index = 0; index < addresses.length; index++) {
    if (addresses[index] == address) return index;
  }
  return -1;
};

export const addApproveInSamePeriod = (
  asset: string,
  spender: string,
  origin: string,
  amount: string,
  isIncreaseAllowance: boolean
) => {
  // Update allowance amount if exists, increasing or overriding
  if (isIncreaseAllowance) {
    const index = getApproveIndexByAddress(getApproves(asset, spender), origin);
    if (index !== -1) {
      const currentAmount = BigNumber.from(
        store[spender][asset].approves[index].amount
      );
      if (currentAmount.toString() !== "-1") {
        store[spender][asset].approves[index].amount = currentAmount
          .add(amount)
          .toString();
      }
    } else {
      store[spender][asset].approves.push({ origin, amount });
    }
  } else {
    const index = getApproveIndexByAddress(getApproves(asset, spender), origin);
    if (index !== -1) {
      store[spender][asset].approves[index].amount = amount;
    } else {
      store[spender][asset].approves.push({ origin, amount });
    }
  }
};

export const addApproveInNewPeriod = (
  asset: string,
  spender: string,
  origin: string,
  amount: string,
  blockNumber: number
) => {
  const newApprove = { origin, amount };
  store[spender][asset] = {
    startingBlock: blockNumber,
    approves: [newApprove],
  };
};

export const addApproveAtInit = (
  asset: string,
  spender: string,
  origin: string,
  amount: string,
  blockNumber: number
) => {
  const newApprove = { origin, amount };
  if (!store[spender]) {
    store[spender] = {
      [asset]: {
        startingBlock: blockNumber,
        approves: [newApprove],
      },
    };
  } else {
    store[spender][asset] = {
      startingBlock: blockNumber,
      approves: [newApprove],
    };
  }
};
