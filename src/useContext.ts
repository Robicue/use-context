/**
 * The context type
 */
export type Context = object;

/**
 * A simple hook type
 */
export type Hook<A extends unknown[], R> = (context: Context, ...args: A) => R;

/**
 * Holds all the contexts
 */
const contexts = new WeakMap<Context, Map<Hook<any, unknown>, unknown>>();

/**
 * Holds all the contexts with unforkable states
 */
const contextsUnforkable = new WeakMap<
  Context,
  Map<Hook<any, unknown>, unknown>
>();

/**
 * Holds all the unforkable initializers.
 */
const unforkables = new WeakSet<Hook<any, unknown>>();

/**
 * Checks if the provided value is a valid context object
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
 * Creates an unforkable hook function
 */
export const unforkable = <A extends unknown[], R>(
  func: (context: Context, ...args: A) => R
): ((context: Context, ...args: A) => R) => {
  unforkables.add(func);
  return func;
};

/**
 * Creates a hook that memorizes the result in the context
 */
export const anchor = <A extends unknown[], R>(
  func: (context: Context, ...args: A) => R
): ((context: Context, ...args: A) => R) => {
  return (context, ...args) => {
    const { use } = useContext(context);
    return use(func, ...args);
  };
};

/**
 * Creates an hook that memorizes the result in the unforkable context
 */
export const unforkableAnchor = <A extends unknown[], R>(
  func: (context: Context, ...args: A) => R
): ((context: Context, ...args: A) => R) => {
  return anchor(unforkable(func));
};

/**
 * Gets the map for the specified context
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
 * Gets the map with unforkable states for the specified context
 */
const getUnforkableContextMap = (context: Context) => {
  let map = contextsUnforkable.get(context);
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
  const mapForkable = getContextMap(context);
  const mapUnforkable = getUnforkableContextMap(context);

  const getMap = <A extends unknown[], R>(initializer: Hook<A, R>) => {
    if (unforkables.has(initializer)) {
      return mapUnforkable;
    } else {
      return mapForkable;
    }
  };

  const self = {
    /**
     * The current context object.
     */
    context,

    /**
     * Returns TRUE if the specified initializer is used in the context
     */
    isUsed<A extends unknown[], R>(initializer: Hook<A, R>) {
      return getMap(initializer).has(initializer);
    },

    /**
     * Initializes a new state into the context
     */
    init<A extends unknown[], R>(initializer: Hook<A, R>, ...args: A) {
      const value = initializer(context, ...args);
      getMap(initializer).set(initializer, value);
      return value;
    },

    /**
     * Uses or initializes a state in the context
     */
    use<A extends unknown[], R>(initializer: Hook<A, R>, ...args: A) {
      const map = getMap(initializer);
      if (map.has(initializer)) {
        return map.get(initializer) as R;
      }
      return self.init(initializer, ...args);
    },

    /**
     * Gets a state that has already been initialized
     */
    get<A extends unknown[], R>(initializer: Hook<A, R>) {
      const map = getMap(initializer);
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
      const forkedContext: Context = { ...context };
      contexts.set(forkedContext, new Map(mapForkable));
      return forkedContext;
    },
  };

  return self;
};
