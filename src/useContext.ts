const MAGIC_DATA_TOKEN = "__context_container__";
const VERSION = "1.0.0";

/**
 * All the data of our context is stored inside a property with a
 * long name that starts and ends with two underscores.
 * This is to indicate that the context data should never be accessed directly.
 */
export type Context = { [MAGIC_DATA_TOKEN]: unknown };

/**
 * We deliberately did not make the key of type 'string', to encourage the
 * use of the createKey. The createKey function ensures a better naming
 * convention by splitting the key into 3 parts: namespace, hook name, and
 * a name for the state.
 */
export type Key = unknown;

/**
 * Use this function to create a distinguishable
 * key for a contextual state.
 */
export const createKey = (
  namespace: string,
  hook: string,
  name: string
): Key => {
  return `${namespace}/${hook}/${name}`;
};

/**
 * Checks if the provided value is a valid context object.
 */
export const isContext = (value: unknown) => {
  return !!(value as Context)[MAGIC_DATA_TOKEN];
};

/**
 * Major hook that can be used to:
 * - create a new context
 * - create a fork of a context
 * - get or initialize a contextual state
 */
export const useContext = (context?: Context) => {
  let map: Map<Key, unknown>;

  if (context) {
    map = context[MAGIC_DATA_TOKEN] as Map<Key, unknown>;
    if (!map) {
      throw "An invalid context object has been provided";
    }
  } else {
    map = new Map();
    context = {
      [MAGIC_DATA_TOKEN]: map,
      __context_version__: VERSION,
    } as Context;
  }

  return {
    /**
     * The current context object.
     */
    context,

    /**
     * Returns TRUE if the specified key is not used in the context yet.
     */
    isAvailable(key: Key) {
      return map.has(key);
    },

    /**
     * Accesses the contextual state related to the specified key.
     * If the state does not exist yet, the result of the initializer
     * will be set and returned.
     */
    use<T>(key: Key, initializer?: () => T) {
      if (map.has(key)) {
        return map.get(key) as T;
      }

      if (!initializer) {
        throw `No context data available for '${key}'`;
      }

      const value = initializer();
      map.set(key, value);
      return value;
    },

    /**
     * Makes a fork of the current context.
     * The forked context allows you to keep access to the states
     * of the current context, but newly initialized states, created
     * in the forked context, are not seen by hooks using the current context.
     */
    fork() {
      return {
        ...context,
        [MAGIC_DATA_TOKEN]: new Map(map),
      } as Context;
    },
  };
};
