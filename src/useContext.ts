/**
 * The context type
 */
export type Context = object;

/**
 * A simple hook type
 */
export type Hook<T = unknown> = (context: Context) => T;

/**
 * Holds all the contexts;
 */
const contexts = new WeakMap<Context, Map<unknown, unknown>>();

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
 * @param context Gets the map for the specified context.
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
    isUsed(initializer: Hook) {
      return map.has(initializer);
    },

    /**
     * Initializes a new state into the context
     */
    init<T>(initializer: Hook<T>) {
      const value = initializer(context);
      map.set(initializer, value);
      return value;
    },

    /**
     * Uses or initializes a state in the context
     */
    use<T>(initializer: Hook<T>) {
      if (map.has(initializer)) {
        return map.get(initializer) as T;
      }
      return self.init(initializer);
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
