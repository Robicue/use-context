import { expect } from "chai";
import { createKey, useContext } from "./useContext";

describe("useContext hook tests", () => {
  it("fork context", () => {
    const rootContextUtils = useContext();
    rootContextUtils.use("keyA", () => "valueA");

    const forkedContext = rootContextUtils.fork();
    const forkedContextUtils = useContext(forkedContext);
    forkedContextUtils.use("keyB", () => "valueB");

    // Test root context
    expect(rootContextUtils.isAvailable("keyA")).to.equal(true);
    expect(rootContextUtils.use("keyA")).to.equal("valueA");
    expect(rootContextUtils.isAvailable("keyB")).to.equal(false);

    // Test forked context
    expect(forkedContextUtils.isAvailable("keyA")).to.equal(true);
    expect(forkedContextUtils.use("keyA")).to.equal("valueA");
    expect(forkedContextUtils.isAvailable("keyB")).to.equal(true);
    expect(forkedContextUtils.use("keyB")).to.equal("valueB");
  });

  it("duplicate key error", () => {
    try {
      createKey("use-context", "useContext", "test");
      createKey("use-context", "useContext", "test");
      expect.fail("Duplicate key error not thrown");
    } catch (ex: any) {
      expect(ex?.message).to.equal("The context key 'use-context/useContext/test' is already created somewhere else");
    }
  });
});
