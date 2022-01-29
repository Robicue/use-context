# An architecture of hooks

Read our [original documentation](https://docs.robicue.com/#knowledge/hooks) to stay up to date.

In the products we develop, we often use a hook function architecture.
They are inspired by the React hooks, but the concept has been made more abstract and usable for both backend and frontend development.

## What is a hook?

A hook is a simple function that provides some features. If for example we need functions to perform mathematical calculations then a hook is not the function that will do the calculations, but it is a function that will provide other functions to perform the calculations.

Example:

```typescript
export const useMath = (context: Context) => {
  const { rand } = useRandom(context);

  return {
    pi: Math.pi,
    add(x: number, y: number) {
      return x + y;
    },
    randomInt(max: number) {
      return Math.round(rand() * max);
    },
  };
};
```

The advantage of using functionalities through hooks instead of using them directly is that most hooks rely on dependencies coming from the context parameter. The context can be easily changed and mocked which makes hooks modular, loosely coupled and much easier to test.

## Conventions

If you start developing hooks there are some rules you can follow to keep consistency:

1. Almost all features should be provided by a hook.
2. A hook should start with `use`, e.g.: `useContext`, `useFile`, ...
3. Every hook should have a single-responsibility (single-responsibility principle).
4. Every hook should be in a separate file with the same name as the hook.
5. Place your hooks together under a common folder, for example `hooks`.
6. If you have a bunch of hooks that are related to each other, you can bundle them in a subfolder, but it is not required. Keep in mind that having too many nested folders might make it hard to keep an overview.
7. If possible, try to write your hooks in TypeScript. This makes it easier to discover mistakes during development-time before running the application.
8. If your hooks become too large and complex, refactor your code and split functionalities apart in separate hooks.
9. Write tests for your hooks (make them testable). If you like test-driven, go for it!
10. Hook functions must be fast. Heavy calculations should not happen inside the body of the hook function, but in functions returned from the hook. This makes them easy to include into other hooks without too much overhead.
11. Avoid depending on global states. Make use of a `useContext` hook to store your state in a contextual object and pass this context object to other hooks.
12. Try not to depend your hooks directly on external resources like files, databases, network requests, device inputs, ... If you need access to an external resource, then make a separate hook for it, that can be mocked for testing.
13. Your hook files can export constants or other functions, but if possible try to make other functions part of your hook function.
14. Take your time to think about the names you give to your hooks, functions or properties. Avoid abbreviations, and make sure that names are self explanatory.
15. All names of hooks, functions or properties should be in camel case
16. If possible try to include other hooks at the top of your hook. This makes it easier to find on which other hooks it depends. E.g.:

    ```typescript
    export const useMyHook = (context: Context) => {
        const { select } = useDBQuery(context);
        const { organizations } = useModelOrganizations(context);

        ....
    }
    ```

17. If possible, try to include other hooks directly into the body of your hook, so as to avoid placing it in sub-functions, loops or conditional statements when not required. This makes it easier to understand on which other hooks there are dependencies.

## Context

The context is a special object that provides, as the name suggests, contextual information to hooks. Below are some reasons why a context is useful.

### Prevents prop drilling

Contexts prevent that when deeply nested functions suddenly need some dependency, you don't have to drill that dependency through many functions until it finally lands into the function you need it for. This would otherwise create dependency on functions that do not really need it, and it forces you to change many parts of your code.

For example, contexts can be created on the level of an HTTP request. If your application is very complex and suddenly there is somewhere deeply in your application a function that needs the request object, you can simple use a hook like `useHTTPRequest` which will immediately give the request object at the right place.

### Easy to mock and test

Suppose you want to create a test scenario for your code that applies within a specific time period. If all your hooks rely on some time provider hook, you can write that hook in such a way that the current time can be overruled. Because that rule would be applied on context level, it is easy to make an individual unit test that does not interfere with the time period of other concurrent running tests.

## The `useContext` hook

This hook is maybe the most crucial hook in the whole architecture. It provides a way to create a new context object and to communicate with that context. We encourage never to access the context object directly. Instead you should rely on other hooks to read or wite the correct information in the context. This gives you a nice separation of concerns.

There are different ways to implement a context hook. But if you want you can use the official version below which we use for our own projects.

Install as NPM package:

```bash
npm install @robicue/use-context
```

Copy the full code:

```typescript
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
```

## How to store states into the context?

The state of your hook should live either inside your hook or inside the context, but not globally.

If you make use of the `useContext` hook, then creating a contextual object can be done like this:

```typescript
import { Context, createKey, useContext } from "./hooks/useContext";

const counterStateKey = createKey("myApp", "useCounterHook", "counterState");

export const useCounterHook = (context: Context) => {
  const { use } = useContext(context);

  // The second parameter of the 'use' function is an
  // initializer that can return an object or value.
  // It will only be invoked if the value for the
  // specified key has not been initialized before
  // in the context.

  const counterState = use(counterStateKey, () => ({
    value: 0;
  }));

  return {
    increase() {
      counterState.value++;
    },
    decrease() {
      counterState.value--;
    },
  };
};
```

## How to create a new context?

Most contexts are just created at very specific places in the application and then passed from one hook to another. If you are using the `useContext` example code above, a new context can be created by using the hook without specifying any parameter:

```typescript
const { context: yourNewContext } = useContext();
```
