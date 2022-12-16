import { expect } from "chai";
import { isContext, useContext } from "./useContext";

describe("useContext hook tests", () => {
  it("fork context", () => {
    const iA = () => ({ value: "A" });
    const iB = () => ({ value: "B" });
    const iC = () => ({ value: "C" });

    const context = useContext();

    expect(context.isUsed(iA)).to.equal(false);
    expect(context.use(iA).value).to.equal("A");
    expect(context.isUsed(iA)).to.equal(true);

    context.use(iA).value = "D";

    expect(context.use(iA).value).to.equal("D");
    expect(context.use(iB).value).to.equal("B");

    // Test forks

    const forkedContext = useContext(context.fork());

    expect(forkedContext.isUsed(iA)).to.equal(true);
    expect(forkedContext.use(iA).value).to.equal("D");

    expect(context.isUsed(iC)).to.equal(false);
    expect(context.use(iC).value).to.equal("C");
    expect(context.isUsed(iC)).to.equal(true);

    expect(forkedContext.isUsed(iC)).to.equal(false);
    expect(forkedContext.use(iC).value).to.equal("C");
    expect(forkedContext.isUsed(iC)).to.equal(true);

    context.use(iA).value = "E";
    context.use(iC).value = "F";

    forkedContext.use(iB).value = "G";
    forkedContext.use(iC).value = "H";

    expect(context.use(iA).value).to.equal("E");
    expect(context.use(iB).value).to.equal("G");
    expect(context.use(iC).value).to.equal("F");

    expect(forkedContext.use(iA).value).to.equal("E");
    expect(forkedContext.use(iB).value).to.equal("G");
    expect(forkedContext.use(iC).value).to.equal("H");
  });

  it("is context", () => {
    const value = {};

    expect(isContext(value)).to.equal(false);
    useContext(value);
    expect(isContext(value)).to.equal(true);
  });
});
