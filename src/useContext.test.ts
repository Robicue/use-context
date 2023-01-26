import { expect } from "chai";
import { isContext, unforkable, useContext, util } from "./useContext";

describe("useContext hook tests", () => {
  it("fork context", () => {
    const iA = () => ({ value: "A" });
    const iB = () => ({ value: "B" });
    const iC = () => ({ value: "C" });
    const iD = unforkable(() => ({ value: "D" }));

    const context = useContext();

    expect(context.isUsed(iA)).to.equal(false);
    expect(context.use(iA).value).to.equal("A");
    expect(context.isUsed(iA)).to.equal(true);

    context.use(iA).value = "E";

    expect(context.use(iA).value).to.equal("E");
    expect(context.use(iB).value).to.equal("B");
    expect(context.use(iD).value).to.equal("D");

    // Test forks

    const forkedContext = useContext(context.fork());

    expect(forkedContext.isUsed(iA)).to.equal(true);
    expect(forkedContext.use(iA).value).to.equal("E");

    expect(context.isUsed(iC)).to.equal(false);
    expect(context.use(iC).value).to.equal("C");
    expect(context.isUsed(iC)).to.equal(true);

    expect(forkedContext.isUsed(iC)).to.equal(false);
    expect(forkedContext.use(iC).value).to.equal("C");
    expect(forkedContext.isUsed(iC)).to.equal(true);

    expect(forkedContext.isUsed(iD)).to.equal(false);

    context.use(iA).value = "F";
    context.use(iC).value = "G";

    forkedContext.use(iB).value = "H";
    forkedContext.use(iC).value = "I";

    expect(context.use(iA).value).to.equal("F");
    expect(context.use(iB).value).to.equal("H");
    expect(context.use(iC).value).to.equal("G");

    expect(forkedContext.use(iA).value).to.equal("F");
    expect(forkedContext.use(iB).value).to.equal("H");
    expect(forkedContext.use(iC).value).to.equal("I");
  });

  it("is context", () => {
    const value = {};

    expect(isContext(value)).to.equal(false);
    useContext(value);
    expect(isContext(value)).to.equal(true);
  });

  it("utility hook", () => {
    const useUtil = util(() => {
      let counter = 0;

      return {
        increment() {
          counter++;
        },

        getCounter() {
          return counter;
        },
      };
    });

    const state1 = useUtil();
    const state2 = useUtil();
    const state3 = useUtil({});

    expect(state1.getCounter()).to.eq(0);
    expect(state2.getCounter()).to.eq(0);
    expect(state3.getCounter()).to.eq(0);

    state1.increment();

    expect(state1.getCounter()).to.eq(1);
    expect(state2.getCounter()).to.eq(1);
    expect(state3.getCounter()).to.eq(0);
  });
});
