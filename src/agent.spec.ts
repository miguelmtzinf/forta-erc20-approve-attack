import agent from "./agent";

describe("ERC20 Approval Phishing Attack Agent", () => {
  let handleTransaction: any;

  const mockErc20ApproveAgent = {
    handleTransaction: jest.fn(),
  };
  const mockTxEvent = {
    some: "event",
  };

  const mockIsAddressEOAFunction = jest.fn();
  const mockConfig = {
    observationPeriodDuration: 10,
    minimumNumberOfApprovals: 6000,
  };

  beforeAll(() => {
    handleTransaction = agent.provideHandleTransaction(
      mockErc20ApproveAgent.handleTransaction,
      mockIsAddressEOAFunction,
      mockConfig
    );
  });

  it("invokes erc20ApproveAgent and returns its findings", async () => {
    const mockFinding = { some: "finding" };
    mockErc20ApproveAgent.handleTransaction.mockReturnValueOnce([mockFinding]);

    const findings = await handleTransaction(mockTxEvent);

    expect(findings).toStrictEqual([mockFinding]);
    expect(mockErc20ApproveAgent.handleTransaction).toHaveBeenCalledTimes(1);
    expect(mockErc20ApproveAgent.handleTransaction).toHaveBeenCalledWith(
      mockTxEvent,
      mockIsAddressEOAFunction,
      mockConfig
    );
  });
});
