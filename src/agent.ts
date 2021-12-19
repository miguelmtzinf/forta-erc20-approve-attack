import { Finding, HandleTransaction, TransactionEvent } from "forta-agent";
import erc20Approve from "./erc20-approve";
import { isEOA } from "./utils";
import {
  OBSERVATION_PERIOD_DURATION,
  MINIMUM_NUMBER_OF_APPROVALS,
} from "./config";

export type IsAddressEOAFunctionType = (address: string) => Promise<boolean>;
export type Config = {
  observationPeriodDuration: number;
  minimumNumberOfApprovals: number;
};

export type HandleTransactionFunctionType = (
  txEvent: TransactionEvent,
  isAddressEOA: IsAddressEOAFunctionType,
  config: Config
) => Promise<Finding[]>;

function provideHandleTransaction(
  erc20approveHandleTransaction: HandleTransactionFunctionType,
  isAddressEOA: IsAddressEOAFunctionType,
  config: Config
): HandleTransaction {
  return async function handleTransaction(txEvent: TransactionEvent) {
    const findings = await erc20approveHandleTransaction(
      txEvent,
      isAddressEOA,
      config
    );

    return findings;
  };
}

export default {
  provideHandleTransaction,
  handleTransaction: provideHandleTransaction(
    erc20Approve.handleTransaction,
    isEOA,
    {
      observationPeriodDuration: OBSERVATION_PERIOD_DURATION,
      minimumNumberOfApprovals: MINIMUM_NUMBER_OF_APPROVALS,
    }
  ),
};
