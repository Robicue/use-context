/**
 * The context type
 */
export type Context = object;

/**
 * A simple hook type
 */
export type Hook<A extends unknown[], R> = (context: Context, ...args: A) => R;

/**
 * Holds all the contexts;
 */
const contexts = new WeakMap<Context, Map<Hook<any, unknown>, unknown>>();

/**
 * Checks if the provided value is a valid context object.
 */
export const isContext = (value: Context) => {
  return contexts.has(value);
};

/**
 * Creates a hook function
 */
export const hook = <A extends unknown[], R>(
  func: (context: Context, ...args: A) => R
): ((context: Context, ...args: A) => R) => {
  return func;
};

/**
 * Gets the map for the specified context.
 */
const getContextMap = (context: Context) => {
  let map = contexts.get(context);
  if (!map) {
    map = new Map();
    contexts.set(context, map);
  }
  return map;
};

/**
 * Major hook that can be used to:
 * - create a new context
 * - create a fork of a context
 * - get or initialize a contextual state
 */
export const useContext = (context: Context = {}) => {
  const map = getContextMap(context);

  const self = {
    /**
     * The current context object.
     */
    context,

    /**
     * Returns TRUE if the specified initializer is used in the context.
     */
    isUsed<A extends unknown[], R>(initializer: Hook<A, R>) {
      return map.has(initializer);
    },

    /**
     * Initializes a new state into the context
     */
    init<A extends unknown[], R>(initializer: Hook<A, R>, ...args: A) {
      const value = initializer(context, ...args);
      map.set(initializer, value);
      return value;
    },

    /**
     * Uses or initializes a state in the context
     */
    use<A extends unknown[], R>(initializer: Hook<A, R>, ...args: A) {
      if (map.has(initializer)) {
        return map.get(initializer) as R;
      }
      return self.init(initializer, ...args);
    },

    /**
     * Gets a state that has already been initialized
     */
    get<A extends unknown[], R>(initializer: Hook<A, R>) {
      if (!map.has(initializer)) {
        throw new Error("Not yet initialized");
      }
      return map.get(initializer) as R;
    },

    /**
     * Makes a fork of the current context.
     * The forked context allows you to keep access to the states
     * of the current context, but newly initialized states, created
     * in the forked context, are not seen by hooks using the current context.
     */
    fork() {
      const forkedContext = { ...context };
      contexts.set(forkedContext, new Map(map));
      return forkedContext;
    },
  };

  return self;
};
