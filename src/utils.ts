import { getEthersProvider } from "forta-agent";
import { EMPTY_CODE } from "./constants";

export const getCode = async (address: string) => {
  const code = await getEthersProvider().getCode(address);
  return code;
};

export const getTransactionReceipt = async (hash: string) => {
  const receipt = await getEthersProvider().getTransactionReceipt(hash);
  return receipt;
};

export const isEOA = async (address: string) => {
  const code = await getEthersProvider().getCode(address);
  return code == EMPTY_CODE;
};