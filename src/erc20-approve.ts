import {
  Finding,
  TransactionEvent,
  FindingSeverity,
  FindingType,
} from "forta-agent";
import {
  ERC20_APPROVE_FUNCTION_SIG,
  ERC20_INCREASE_ALLOWANCE_FUNCTION_FRAGMENT_NAME,
  ERC20_INCREASE_ALLOWANCE_FUNCTION_SIG,
  MAX_UINT_IN_HEX,
} from "./constants";
import {
  addApproveAtInit,
  addApproveInNewPeriod,
  addApproveInSamePeriod,
  exist,
  get,
  getApprovesLength,
  getStartingBlock,
} from "./store-repository";

const buildMetadata = (asset: string, spender: string) => {
  const info = get(asset, spender);
  const affectedAddresses = info?.approves.map(({ origin, amount }) => [
    origin,
    amount,
  ]);
  return {
    asset,
    attackerAddress: spender,
    startingAtBlock: info?.startingBlock.toString() || "",
    affectedAddressesJSON: JSON.stringify(affectedAddresses),
  };
};

const isIncreaseAllowance = (functionFragmentName: string) =>
  functionFragmentName === ERC20_INCREASE_ALLOWANCE_FUNCTION_FRAGMENT_NAME;

const isInSamePeriod = (
  asset: string,
  spender: string,
  blockNumber: number,
  periodDuration: number
) => blockNumber - getStartingBlock(asset, spender) < periodDuration;

async function handleTransaction(
  txEvent: TransactionEvent,
  isEOA: (address: string) => Promise<boolean>,
  config: {
    observationPeriodDuration: number;
    minimumNumberOfApprovals: number;
  }
) {
  const findings: Finding[] = [];

  // if no events found for approving ERC20 assets, return
  const approvedEvents = txEvent.filterFunction([
    ERC20_APPROVE_FUNCTION_SIG,
    ERC20_INCREASE_ALLOWANCE_FUNCTION_SIG,
  ]);
  if (!approvedEvents.length) return findings;

  // fetch spender addresses and check if those are EOAs
  const reducer = (accumulator: any, element: any) => [
    ...accumulator,
    element.args.spender,
  ];
  const reducedApproveEvents = approvedEvents.reduce(reducer, []);
  const promises = reducedApproveEvents.map((possibleEOA) =>
    isEOA(possibleEOA)
  );
  const arraySpenderIsEOA = await Promise.all(promises);

  let asset, spender, origin, amount, blockNumber;
  for (let i = 0; i < reducedApproveEvents.length; i++) {
    asset = txEvent.transaction.to;
    amount = approvedEvents[i].args.amount;

    // If the spender is an EOA and allowance amount not 0: start suspicious case
    if (arraySpenderIsEOA[i] && amount.toString() !== "0" && asset) {
      // Extract info
      spender = approvedEvents[i].args.spender;
      origin = txEvent.transaction.from;
      amount =
        amount.toHexString() === MAX_UINT_IN_HEX ? "-1" : amount.toString();
      blockNumber = txEvent.blockNumber;

      // Add suspicious single approve
      if (!exist(asset, spender)) {
        // Initialize the suspicious case, initializing and adding new approve
        addApproveAtInit(asset, spender, origin, amount, blockNumber);
      } else {
        if (
          isInSamePeriod(
            asset,
            spender,
            blockNumber,
            config.observationPeriodDuration
          )
        ) {
          // Add a new approve in the same period of the suspicious case
          // If it is an `increaseAllowance` operation, the amount is added to
          // the current allowance amount
          addApproveInSamePeriod(
            asset,
            spender,
            origin,
            amount,
            isIncreaseAllowance(approvedEvents[i].functionFragment.name)
          );
        } else {
          // Renew the suspicious case, starting a new period
          addApproveInNewPeriod(asset, spender, origin, amount, blockNumber);
        }
      }

      // Check if the number of approves is above the limit to rise the alarm
      if (
        getApprovesLength(asset, spender) > config.minimumNumberOfApprovals
      ) {
        findings.push(
          Finding.fromObject({
            name: "ERC20 Phishing Attack via Approvals",
            description: `Evidence of Phishing Attack. Suspicious behavior detected: more than ${config.minimumNumberOfApprovals} users approved token transfers to a same EOA target over one day`,
            alertId: "ERC20-PHISHING-ATTACK-1",
            protocol: "ethereum",
            severity: FindingSeverity.High,
            type: FindingType.Suspicious,
            metadata: buildMetadata(asset, spender),
          })
        );
      }
    }
  }

  return findings;
}

export default {
  handleTransaction,
};
