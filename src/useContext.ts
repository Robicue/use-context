/**
 * The context type
 */
export type Context = object;

/**
 * The states holder type
 */
export type States = Map<Hook<any, unknown>, unknown>;

/**
 * A simple hook type
 */
export type Hook<A extends unknown[], R> = (context: Context, ...args: A) => R;

/**
 * Holds all the context states
 */
const contexts = new WeakMap<Context, States>();

/**
 * Holds all the links to parent contexts
 */
const parents = new WeakMap<Context, Context>();

/**
 * Get the states associated with the specified initializer
 */
const getStates = <A extends unknown[], R>(
  context: Context,
  initializer: Hook<A, R>
): States | undefined => {
  const states = contexts.get(context);

  if (states?.has(initializer)) {
    return states;
  }

  const parent = parents.get(context);

  if (!parent) {
    return undefined;
  }

  return getStates(parent, initializer);
};

/**
 * Checks if the provided value is a valid context object
 */
export const isContext = (value: Context) => {
  return contexts.has(value);
};

/**
 * Checks if the specified context is a forked context
 */
export const isForked = (context: Context) => {
  return parents.has(context);
};

/**
 * Returns TRUE if the specified initializer is used in the context
 */
export const isUsed = <A extends unknown[], R>(
  context: Context,
  initializer: Hook<A, R>
) => {
  return !!getStates(context, initializer);
};

/**
 * Initializes a new state into the context
 */
export const init = <A extends unknown[], R>(
  context: Context,
  initializer: Hook<A, R>,
  ...args: A
) => {
  let states = contexts.get(context);

  if (!states) {
    states = new Map();
    contexts.set(context, states);
  }

  const value = initializer(context, ...args);
  states.set(initializer, value);
  return value;
};

/**
 * Uses or initializes a state in the context
 */
export const use = <A extends unknown[], R>(
  context: Context,
  initializer: Hook<A, R>,
  ...args: A
) => {
  const states = getStates(context, initializer);
  if (!states) {
    return init(context, initializer, ...args);
  }
  return states.get(initializer) as R;
};

/**
 * Gets a state that has already been initialized
 */
export const get = <A extends unknown[], R>(
  context: Context,
  initializer: Hook<A, R>
) => {
  const states = getStates(context, initializer);
  if (!states) {
    throw new Error("Not yet initialized");
  }
  return states.get(initializer) as R;
};

/**
 * Makes a fork of all forkable states the current context.
 * The forked context allows you to keep access to the states
 * of the current context, but newly initialized states, created
 * in the forked context, are not seen by hooks using the current context.
 */
export const fork = (context: Context, forkedContext: Context = {}) => {
  if (context === forkedContext) {
    throw new Error(
      "The parent context and the forked context cannot be the same"
    );
  }

  if (isContext(forkedContext)) {
    throw new Error("The forked context is already in use");
  }

  if (!isContext(context)) {
    contexts.set(context, new Map());
  }

  contexts.set(forkedContext, new Map());
  parents.set(forkedContext, context);

  return forkedContext;
};

/**
 * Checks if the state of an initializer is inherited form a parent context
 */
export const isInherited = <A extends unknown[], R>(
  context: Context,
  initializer: Hook<A, R>
) => {
  const states = getStates(context, initializer);

  if (!states) {
    return false;
  }

  return states !== contexts.get(context);
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
 * Creates a clone of a hook function.
 */
export const clone = <A extends unknown[], R>(
  func: (context: Context, ...args: A) => R
): ((context: Context, ...args: A) => R) => {
  return (context, ...args) => {
    return func(context, ...args);
  };
};

/**
 * Creates an anchor hook factory
 */
export const factory = <A extends unknown[], R>(
  func: (context: Context, ...args: A) => R
): (() => (context: Context, ...args: A) => R) => {
  return () => anchor(clone(func));
};

/**
 * Creates a hook that memorizes the result in the context
 */
export const anchor = <A extends unknown[], R>(
  func: (context: Context, ...args: A) => R
): ((context: Context, ...args: A) => R) => {
  return (context, ...args) => {
    return use(context, func, ...args);
  };
};

/**
 * Creates a utility hook that memorizes the result of the context.
 * The context is optional here. If not provided, the specified
 * function itself will be used as context.
 */
export const util = <A extends unknown[], R>(
  func: (context: Context, ...args: A) => R
): ((context?: Context, ...args: A) => R) => {
  return (context, ...args) => {
    return use(context ?? func, func, ...args);
  };
};

/**
 * Creates an hook that memorizes the result in the unforkable context
 */
export const buoy = <A extends unknown[], R>(
  func: (context: Context, ...args: A) => R
): ((context: Context, ...args: A) => R) => {
  return (context, ...args) => {
    if (isInherited(context, func)) {
      return init(context, func, ...args);
    } else {
      return use(context, func, ...args);
    }
  };
};

/**
 * Major hook that can be used to:
 * - create a new context
 * - create a fork of a context
 * - get or initialize a contextual state
 */
export const useContext = (context: Context = {}) => {
  return {
    context,

    /**
     * Returns TRUE if the specified initializer is used in the context
     */
    isUsed<A extends unknown[], R>(initializer: Hook<A, R>) {
      return isUsed(context, initializer);
    },

    /**
     * Initializes a new state into the context
     */
    init<A extends unknown[], R>(initializer: Hook<A, R>, ...args: A) {
      return init(context, initializer, ...args);
    },

    /**
     * Uses or initializes a state in the context
     */
    use<A extends unknown[], R>(initializer: Hook<A, R>, ...args: A) {
      return use(context, initializer, ...args);
    },

    /**
     * Gets a state that has already been initialized
     */
    get<A extends unknown[], R>(initializer: Hook<A, R>) {
      return get(context, initializer);
    },

    /**
     * Makes a fork of the current context.
     * The forked context allows you to keep access to the states
     * of the current context, but newly initialized states, created
     * in the forked context, are not seen by hooks using the current context.
     */
    fork(forkedContext: Context = {}) {
      return fork(context, forkedContext);
    },

    /**
     * Checks if the state of an initializer is inherited form a parent context
     */
    isInherited<A extends unknown[], R>(initializer: Hook<A, R>) {
      return isInherited(context, initializer);
    },
  };
};
