import { Finding, FindingSeverity, FindingType } from "forta-agent";
import {
  createAddress,
  TestTransactionEvent,
  TraceProps,
} from "forta-agent-tools";
import { BigNumber, utils } from "ethers";
import {
  ERC20_APPROVE_FUNCTION_SIG,
  ERC20_INCREASE_ALLOWANCE_FUNCTION_SIG,
  MAX_UINT_IN_HEX,
} from "./constants";

import erc20ApproveAgent from "./erc20-approve";

const createTrace = (abi: string, data: any[]): TraceProps => {
  const iface = new utils.Interface([abi]);
  const fragment = Object.values(iface.functions)[0];
  return {
    input: iface.encodeFunctionData(fragment, data),
    value: null,
  } as any;
};

const createApproveTx = (
  asset: string,
  spender: string,
  user: string,
  amount: number,
  blockNumber: number
) => {
  const txEvent = new TestTransactionEvent();
  const parsedAmount =
    amount === -1
      ? BigNumber.from(MAX_UINT_IN_HEX).toString()
      : amount.toString();
  txEvent.addTraces(
    createTrace(ERC20_APPROVE_FUNCTION_SIG, [spender, parsedAmount])
  );
  txEvent.setFrom(user);
  txEvent.setTo(asset);
  txEvent.setBlock(blockNumber);
  return txEvent;
};

const createIncreaseAllowanceTx = (
  asset: string,
  spender: string,
  user: string,
  amount: number,
  blockNumber: number
) => {
  const txEvent = new TestTransactionEvent();
  const parsedAmount =
    amount === -1
      ? BigNumber.from(MAX_UINT_IN_HEX).toString()
      : amount.toString();
  txEvent.addTraces(
    createTrace(ERC20_INCREASE_ALLOWANCE_FUNCTION_SIG, [spender, parsedAmount])
  );
  txEvent.setFrom(user);
  txEvent.setTo(asset);
  txEvent.setBlock(blockNumber);
  return txEvent;
};

const buildFindingResult = (
  asset: string,
  spender: string,
  startingBlock: number,
  affectedAddresses: string,
  minimumNumberOfApprovals: number
) =>
  Finding.fromObject({
    name: "ERC20 Phishing Attack via Approvals",
    description: `Evidence of Phishing Attack. Suspicious behavior detected: more than ${minimumNumberOfApprovals} users approved token transfers to a same EOA target over one day`,
    alertId: "ERC20-PHISHING-ATTACK-1",
    protocol: "ethereum",
    severity: FindingSeverity.High,
    type: FindingType.Suspicious,
    metadata: {
      asset,
      attackerAddress: spender,
      startingAtBlock: startingBlock.toString(),
      affectedAddressesJSON: affectedAddresses,
    },
  });

describe("multiple erc20 approvals to an EOA address during a period of time, reaching the limit", () => {
  let handleTransaction: any;

  const mockIsAddressEOAFunction = jest.fn();

  const mockConfig = {
    observationPeriodDuration: 6000,
    minimumNumberOfApprovals: 10,
  };

  const assets = [
    createAddress("0x10001"),
    createAddress("0x10002"),
    createAddress("0x10003"),
    createAddress("0x10004"),
  ];
  const spenders = [
    createAddress("0x20001"),
    createAddress("0x20002"),
    createAddress("0x20003"),
    createAddress("0x20004"),
  ];
  const users = [
    createAddress("0x30001"),
    createAddress("0x30002"),
    createAddress("0x30003"),
    createAddress("0x30004"),
  ];

  const blockNumbers = [12301, 12302, 30000, 30001, 60000];
  const amounts = [100, 50, -1, 12304];

  beforeAll(() => {
    handleTransaction = erc20ApproveAgent.handleTransaction;
  });

  beforeEach(() => {
    mockIsAddressEOAFunction.mockReturnValue(
      new Promise((resolve) => resolve(true))
    );
    mockConfig.observationPeriodDuration = 6000;
    mockConfig.minimumNumberOfApprovals = 10;
  });

  afterEach(() => {
    mockIsAddressEOAFunction.mockReset();
  });

  it("returns empty findings since there are no approval events", async () => {
    const basicTxEvent = new TestTransactionEvent();
    const findings = await handleTransaction(
      basicTxEvent,
      mockIsAddressEOAFunction,
      mockConfig
    );

    expect(findings).toStrictEqual([]);
    expect(mockIsAddressEOAFunction).toHaveBeenCalledTimes(0);
  });

  it("returns 0 finding with an `approve` transaction to a contract and a limit of 0 approvals", async () => {
    const txEvent = createApproveTx(
      assets[0],
      spenders[0],
      users[0],
      amounts[0],
      blockNumbers[0]
    );

    mockIsAddressEOAFunction.mockReturnValue(
      new Promise((resolve) => resolve(false))
    );

    mockConfig.minimumNumberOfApprovals = 0;

    const findings = await handleTransaction(
      txEvent,
      mockIsAddressEOAFunction,
      mockConfig
    );

    expect(findings).toStrictEqual([]);
    expect(mockIsAddressEOAFunction).toHaveBeenCalledTimes(1);
    expect(mockIsAddressEOAFunction).toBeCalledWith(spenders[0]);
  });

  it("User0 approves to spender0 on asset0 (config limit of 0 approvals) and returns 1 finding", async () => {
    const txEvent = createApproveTx(
      assets[0],
      spenders[0],
      users[0],
      amounts[0],
      blockNumbers[0]
    );

    mockConfig.minimumNumberOfApprovals = 0;

    const findings = await handleTransaction(
      txEvent,
      mockIsAddressEOAFunction,
      mockConfig
    );

    const affectedAddressesJSON = [[users[0], amounts[0].toString()]];
    const expectedFindings = [
      buildFindingResult(
        assets[0],
        spenders[0],
        blockNumbers[0],
        JSON.stringify(affectedAddressesJSON),
        mockConfig.minimumNumberOfApprovals
      ),
    ];
    expect(findings).toStrictEqual(expectedFindings);
    expect(mockIsAddressEOAFunction).toHaveBeenCalledTimes(1);
  });

  it("User0 increaseAllowance to spender0 on asset0 (config limit of 0 approvals) and returns 1 finding", async () => {
    const txEvent = createIncreaseAllowanceTx(
      assets[0],
      spenders[0],
      users[0],
      amounts[0],
      blockNumbers[0]
    );

    mockConfig.minimumNumberOfApprovals = 0;

    const findings = await handleTransaction(
      txEvent,
      mockIsAddressEOAFunction,
      mockConfig
    );

    const amount = amounts[0] * 2;
    const affectedAddressesJSON = [[users[0], amount.toString()]];
    const expectedFindings = [
      buildFindingResult(
        assets[0],
        spenders[0],
        blockNumbers[0],
        JSON.stringify(affectedAddressesJSON),
        mockConfig.minimumNumberOfApprovals
      ),
    ];

    expect(findings).toStrictEqual(expectedFindings);
    expect(mockIsAddressEOAFunction).toHaveBeenCalledTimes(1);
  });

  it("User0 increaseAllowance to spender0 on asset0 (config limit of 0 approvals) and returns 1 finding with updated allowance amount", async () => {
    const txEvent = createIncreaseAllowanceTx(
      assets[0],
      spenders[0],
      users[0],
      amounts[0],
      blockNumbers[0]
    );

    mockConfig.minimumNumberOfApprovals = 0;

    const findings = await handleTransaction(
      txEvent,
      mockIsAddressEOAFunction,
      mockConfig
    );

    const amount = amounts[0] * 3;
    const affectedAddressesJSON = [[users[0], amount.toString()]];
    const expectedFindings = [
      buildFindingResult(
        assets[0],
        spenders[0],
        blockNumbers[0],
        JSON.stringify(affectedAddressesJSON),
        mockConfig.minimumNumberOfApprovals
      ),
    ];
    expect(findings).toStrictEqual(expectedFindings);
    expect(mockIsAddressEOAFunction).toHaveBeenCalledTimes(1);
  });

  it("User0 approve to spender0 on asset0 (config limit of 0 approvals) and returns 1 finding with brand new allowance amount", async () => {
    const txEvent = createApproveTx(
      assets[0],
      spenders[0],
      users[0],
      amounts[0],
      blockNumbers[0]
    );

    mockConfig.minimumNumberOfApprovals = 0;

    const findings = await handleTransaction(
      txEvent,
      mockIsAddressEOAFunction,
      mockConfig
    );

    const affectedAddressesJSON = [[users[0], amounts[0].toString()]];
    const expectedFindings = [
      buildFindingResult(
        assets[0],
        spenders[0],
        blockNumbers[0],
        JSON.stringify(affectedAddressesJSON),
        mockConfig.minimumNumberOfApprovals
      ),
    ];
    expect(findings).toStrictEqual(expectedFindings);
    expect(mockIsAddressEOAFunction).toHaveBeenCalledTimes(1);
  });

  it("User0 increaseAllowance to spender0 on asset0 (config limit of 10 approvals) and returns 0 findings", async () => {
    const txEvent = createIncreaseAllowanceTx(
      assets[0],
      spenders[0],
      users[0],
      amounts[0],
      blockNumbers[0]
    );

    const findings = await handleTransaction(
      txEvent,
      mockIsAddressEOAFunction,
      mockConfig
    );

    expect(findings).toStrictEqual([]);
    expect(mockIsAddressEOAFunction).toHaveBeenCalledTimes(1);
  });

  it("User0 approve 0 units to spender0 on asset0 (config limit of 0 approvals) and returns 0 findings", async () => {
    const txEvent = createApproveTx(
      assets[0],
      spenders[0],
      users[0],
      0,
      blockNumbers[0]
    );

    mockConfig.minimumNumberOfApprovals = 0;

    const findings = await handleTransaction(
      txEvent,
      mockIsAddressEOAFunction,
      mockConfig
    );

    expect(findings).toStrictEqual([]);
    expect(mockIsAddressEOAFunction).toHaveBeenCalledTimes(1);
  });

  it("User0 approve to spender0 on asset0 in new period (config limit of 1 approvals) and returns 0 findings", async () => {
    const txEvent = createApproveTx(
      assets[0],
      spenders[0],
      users[0],
      amounts[1],
      blockNumbers[0] + 6000
    );

    mockConfig.minimumNumberOfApprovals = 1;

    const findings = await handleTransaction(
      txEvent,
      mockIsAddressEOAFunction,
      mockConfig
    );

    expect(findings).toStrictEqual([]);
    expect(mockIsAddressEOAFunction).toHaveBeenCalledTimes(1);
  });

  it("User0 approve to spender0 on asset0 in same period (config limit of 0 approvals) and returns 1 findings with updated allowance amount ", async () => {
    const txEvent = createApproveTx(
      assets[0],
      spenders[0],
      users[0],
      amounts[2],
      blockNumbers[0] + 6001
    );

    mockConfig.minimumNumberOfApprovals = 0;

    const findings = await handleTransaction(
      txEvent,
      mockIsAddressEOAFunction,
      mockConfig
    );

    const affectedAddressesJSON = [[users[0], amounts[2].toString()]];
    const expectedFindings = [
      buildFindingResult(
        assets[0],
        spenders[0],
        blockNumbers[0] + 6000,
        JSON.stringify(affectedAddressesJSON),
        mockConfig.minimumNumberOfApprovals
      ),
    ];
    expect(findings).toStrictEqual(expectedFindings);
    expect(mockIsAddressEOAFunction).toHaveBeenCalledTimes(1);
  });

  it("User1 approve to spender0 on asset0 in same period (config limit of 1 approvals) and returns 1 findings with 2 affected addresses ", async () => {
    const txEvent = createApproveTx(
      assets[0],
      spenders[0],
      users[1],
      amounts[0],
      blockNumbers[0] + 6002
    );

    mockConfig.minimumNumberOfApprovals = 1;

    const findings = await handleTransaction(
      txEvent,
      mockIsAddressEOAFunction,
      mockConfig
    );

    const affectedAddressesJSON = [
      [users[0], amounts[2].toString()],
      [users[1], amounts[0].toString()],
    ];
    const expectedFindings = [
      buildFindingResult(
        assets[0],
        spenders[0],
        blockNumbers[0] + 6000,
        JSON.stringify(affectedAddressesJSON),
        mockConfig.minimumNumberOfApprovals
      ),
    ];
    expect(findings).toStrictEqual(expectedFindings);
    expect(mockIsAddressEOAFunction).toHaveBeenCalledTimes(1);
  });

  it("User1 increaseAllowance to spender0 on asset0 in same period (config limit of 1 approvals) and returns 1 findings with 2 affected addresses ", async () => {
    const txEvent = createIncreaseAllowanceTx(
      assets[0],
      spenders[0],
      users[1],
      amounts[3],
      blockNumbers[0] + 6002
    );

    mockConfig.minimumNumberOfApprovals = 1;

    const findings = await handleTransaction(
      txEvent,
      mockIsAddressEOAFunction,
      mockConfig
    );

    const affectedAddressesJSON = [
      [users[0], amounts[2].toString()],
      [users[1], (amounts[0] + amounts[3]).toString()],
    ];
    const expectedFindings = [
      buildFindingResult(
        assets[0],
        spenders[0],
        blockNumbers[0] + 6000,
        JSON.stringify(affectedAddressesJSON),
        mockConfig.minimumNumberOfApprovals
      ),
    ];
    expect(findings).toStrictEqual(expectedFindings);
    expect(mockIsAddressEOAFunction).toHaveBeenCalledTimes(1);
  });

  it("User2 approve to spender0 on asset0 in new period (config limit of 0 approvals) and returns 1 findings with 1 affected addresses ", async () => {
    const txEvent = createIncreaseAllowanceTx(
      assets[0],
      spenders[0],
      users[2],
      amounts[1],
      blockNumbers[2]
    );

    mockConfig.minimumNumberOfApprovals = 0;

    const findings = await handleTransaction(
      txEvent,
      mockIsAddressEOAFunction,
      mockConfig
    );

    const affectedAddressesJSON = [[users[2], amounts[1].toString()]];
    const expectedFindings = [
      buildFindingResult(
        assets[0],
        spenders[0],
        blockNumbers[2],
        JSON.stringify(affectedAddressesJSON),
        mockConfig.minimumNumberOfApprovals
      ),
    ];
    expect(findings).toStrictEqual(expectedFindings);
    expect(mockIsAddressEOAFunction).toHaveBeenCalledTimes(1);
  });

  it("User0 approve to spender0 and spender1 on asset1 in same transaction both in new period (config limit of 0 approvals) and returns 2 findings with 1 affected addresses ", async () => {
    const txEvent = new TestTransactionEvent();
    txEvent.addTraces(
      createTrace(ERC20_INCREASE_ALLOWANCE_FUNCTION_SIG, [
        spenders[0],
        amounts[0],
      ]),
      createTrace(ERC20_INCREASE_ALLOWANCE_FUNCTION_SIG, [
        spenders[1],
        amounts[1],
      ])
    );
    txEvent.setFrom(users[0]);
    txEvent.setTo(assets[1]);
    txEvent.setBlock(blockNumbers[4]);

    mockConfig.minimumNumberOfApprovals = 0;

    const findings = await handleTransaction(
      txEvent,
      mockIsAddressEOAFunction,
      mockConfig
    );

    const expectedFindings = [
      buildFindingResult(
        assets[1],
        spenders[0],
        blockNumbers[4],
        JSON.stringify([[users[0], amounts[0].toString()]]),
        mockConfig.minimumNumberOfApprovals
      ),
      buildFindingResult(
        assets[1],
        spenders[1],
        blockNumbers[4],
        JSON.stringify([[users[0], amounts[1].toString()]]),
        mockConfig.minimumNumberOfApprovals
      ),
    ];
    expect(findings).toStrictEqual(expectedFindings);
    expect(mockIsAddressEOAFunction).toHaveBeenCalledTimes(2);
  });
});
