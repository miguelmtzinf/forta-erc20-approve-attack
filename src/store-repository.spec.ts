import {
  get,
  getStartingBlock,
  getApproves,
  getApprovesLength,
  getApproveIndexByAddress,
  addApproveInSamePeriod,
  addApproveInNewPeriod,
  addApproveAtInit,
  exist,
} from "./store-repository";

describe("store repository management", () => {
  const onGoingStore: any = {};

  it("add a new approve at initialization", async () => {
    expect(exist("asset1", "spender1")).toBeFalsy;
    expect(get("asset1", "spender1")).toBeUndefined;
    expect(getApproves("asset1", "spender1")).toStrictEqual([]);
    expect(getApprovesLength("asset1", "spender1")).toBe(0);
    expect(
      getApproveIndexByAddress(getApproves("asset1", "spender1"), "origin1")
    ).toBe(-1);
    expect(getStartingBlock("asset1", "spender1")).toBe(0);

    addApproveAtInit("asset1", "spender1", "origin1", "10", 1);

    onGoingStore["spender1"] = {
      ["asset1"]: {
        approves: [{ origin: "origin1", amount: "10" }],
        startingBlock: 1,
      },
    };

    expect(exist("asset1", "spender1")).toBeTruthy;
    expect(get("asset1", "spender1")).toStrictEqual(
      onGoingStore["spender1"]["asset1"]
    );
    expect(getApproves("asset1", "spender1")).toStrictEqual(
      onGoingStore["spender1"]["asset1"].approves
    );
    expect(getApprovesLength("asset1", "spender1")).toBe(
      onGoingStore["spender1"]["asset1"].approves.length
    );
    expect(
      getApproveIndexByAddress(getApproves("asset1", "spender1"), "origin1")
    ).toBe(0);
    expect(getStartingBlock("asset1", "spender1")).toBe(
      onGoingStore["spender1"]["asset1"].startingBlock
    );
  });

  it("add a new approve in same period with increaseAllowance", async () => {
    addApproveInSamePeriod("asset1", "spender1", "origin1", "20", true);

    onGoingStore["spender1"]["asset1"].approves[0].amount = "30";

    expect(get("asset1", "spender1")).toStrictEqual(
      onGoingStore["spender1"]["asset1"]
    );
    expect(getApproves("asset1", "spender1")).toStrictEqual(
      onGoingStore["spender1"]["asset1"].approves
    );
    expect(getApprovesLength("asset1", "spender1")).toBe(
      onGoingStore["spender1"]["asset1"].approves.length
    );
    expect(
      getApproveIndexByAddress(getApproves("asset1", "spender1"), "origin1")
    ).toBe(0);
    expect(getStartingBlock("asset1", "spender1")).toBe(
      onGoingStore["spender1"]["asset1"].startingBlock
    );
  });

  it("add a new approve in same period with no increaseAllowance", async () => {
    addApproveInSamePeriod("asset1", "spender1", "origin1", "40", false);

    onGoingStore["spender1"]["asset1"].approves[0].amount = "40";

    expect(get("asset1", "spender1")).toStrictEqual(
      onGoingStore["spender1"]["asset1"]
    );
    expect(getApproves("asset1", "spender1")).toStrictEqual(
      onGoingStore["spender1"]["asset1"].approves
    );
    expect(getApprovesLength("asset1", "spender1")).toBe(
      onGoingStore["spender1"]["asset1"].approves.length
    );
    expect(
      getApproveIndexByAddress(getApproves("asset1", "spender1"), "origin1")
    ).toBe(0);
    expect(getStartingBlock("asset1", "spender1")).toBe(
      onGoingStore["spender1"]["asset1"].startingBlock
    );
  });

  it("add a new approve in new period", async () => {
    addApproveInNewPeriod("asset1", "spender1", "origin1", "10", 100);

    onGoingStore["spender1"] = {
      ["asset1"]: {
        approves: [{ origin: "origin1", amount: "10" }],
        startingBlock: 100,
      },
    };

    expect(get("asset1", "spender1")).toStrictEqual(
      onGoingStore["spender1"]["asset1"]
    );
    expect(getApproves("asset1", "spender1")).toStrictEqual(
      onGoingStore["spender1"]["asset1"].approves
    );
    expect(getApprovesLength("asset1", "spender1")).toBe(
      onGoingStore["spender1"]["asset1"].approves.length
    );
    expect(
      getApproveIndexByAddress(getApproves("asset1", "spender1"), "origin1")
    ).toBe(0);
    expect(getStartingBlock("asset1", "spender1")).toBe(
      onGoingStore["spender1"]["asset1"].startingBlock
    );
  });

  it("add a new approve with asset2 same spender at init", async () => {
    addApproveAtInit("asset2", "spender1", "origin2", "20", 200);

    onGoingStore["spender1"]["asset2"] = {
      approves: [{ origin: "origin2", amount: "20" }],
      startingBlock: 200,
    };

    // Existing
    expect(get("asset1", "spender1")).toStrictEqual(
      onGoingStore["spender1"]["asset1"]
    );
    expect(getApproves("asset1", "spender1")).toStrictEqual(
      onGoingStore["spender1"]["asset1"].approves
    );
    expect(getApprovesLength("asset1", "spender1")).toBe(
      onGoingStore["spender1"]["asset1"].approves.length
    );
    expect(
      getApproveIndexByAddress(getApproves("asset1", "spender1"), "origin1")
    ).toBe(0);
    expect(getStartingBlock("asset1", "spender1")).toBe(
      onGoingStore["spender1"]["asset1"].startingBlock
    );

    // New
    expect(get("asset2", "spender1")).toStrictEqual(
      onGoingStore["spender1"]["asset2"]
    );
    expect(getApproves("asset2", "spender1")).toStrictEqual(
      onGoingStore["spender1"]["asset2"].approves
    );
    expect(getApprovesLength("asset2", "spender1")).toBe(
      onGoingStore["spender1"]["asset2"].approves.length
    );
    expect(
      getApproveIndexByAddress(getApproves("asset2", "spender1"), "origin2")
    ).toBe(0);
    expect(getStartingBlock("asset2", "spender1")).toBe(
      onGoingStore["spender1"]["asset2"].startingBlock
    );
  });

  it("add a new approve with asset2 same spender same period", async () => {
    addApproveInSamePeriod("asset2", "spender1", "origin3", "20", false);

    onGoingStore["spender1"]["asset2"].approves.push({
      origin: "origin3",
      amount: "20",
    });

    expect(get("asset2", "spender1")).toStrictEqual(
      onGoingStore["spender1"]["asset2"]
    );
    expect(getApproves("asset2", "spender1")).toStrictEqual(
      onGoingStore["spender1"]["asset2"].approves
    );
    expect(getApprovesLength("asset2", "spender1")).toBe(
      onGoingStore["spender1"]["asset2"].approves.length
    );
    expect(
      getApproveIndexByAddress(getApproves("asset2", "spender1"), "origin3")
    ).toBe(1);
    expect(getStartingBlock("asset2", "spender1")).toBe(
      onGoingStore["spender1"]["asset2"].startingBlock
    );
  });

  it("add a new approve with asset2 same spender new period", async () => {
    addApproveInNewPeriod("asset2", "spender1", "origin3", "20", 300);

    onGoingStore["spender1"]["asset2"] = {
      startingBlock: 300,
      approves: [{ origin: "origin3", amount: "20" }],
    };

    expect(get("asset2", "spender1")).toStrictEqual(
      onGoingStore["spender1"]["asset2"]
    );
    expect(getApproves("asset2", "spender1")).toStrictEqual(
      onGoingStore["spender1"]["asset2"].approves
    );
    expect(getApprovesLength("asset2", "spender1")).toBe(
      onGoingStore["spender1"]["asset2"].approves.length
    );
    expect(
      getApproveIndexByAddress(getApproves("asset2", "spender1"), "origin3")
    ).toBe(0);
    expect(getStartingBlock("asset2", "spender1")).toBe(
      onGoingStore["spender1"]["asset2"].startingBlock
    );
  });

  it("add a new approve with asset3 new spender", async () => {
    addApproveAtInit("asset3", "spender2", "origin1", "20", 200);

    onGoingStore["spender2"] = {
      ["asset3"]: {
        approves: [{ origin: "origin1", amount: "20" }],
        startingBlock: 200,
      },
    };

    expect(get("asset3", "spender2")).toStrictEqual(
      onGoingStore["spender2"]["asset3"]
    );
    expect(getApproves("asset3", "spender2")).toStrictEqual(
      onGoingStore["spender2"]["asset3"].approves
    );
    expect(getApprovesLength("asset3", "spender2")).toBe(
      onGoingStore["spender2"]["asset3"].approves.length
    );
    expect(
      getApproveIndexByAddress(getApproves("asset3", "spender2"), "origin1")
    ).toBe(0);
    expect(getStartingBlock("asset3", "spender2")).toBe(
      onGoingStore["spender2"]["asset3"].startingBlock
    );
  });
});
