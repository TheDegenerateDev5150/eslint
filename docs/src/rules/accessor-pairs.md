---
title: accessor-pairs
rule_type: suggestion
related_rules:
- no-dupe-keys
- no-dupe-class-members
further_reading:
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/set
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/get
- https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Working_with_Objects
---


It's a common mistake in JavaScript to create an object with just a setter for a property but never have a corresponding getter defined for it. Without a getter, you cannot read the property, so it ends up not being used.

Here are some examples:

```js
// Bad
const o = {
    set a(value) {
        this.val = value;
    }
};


// Good
const p = {
    set a(value) {
        this.val = value;
    },
    get a() {
        return this.val;
    }
};

```

This rule warns if setters are defined without getters. Using an option `getWithoutSet`, it will warn if you have a getter without a setter also.

## Rule Details

This rule enforces a style where it requires to have a getter for every property which has a setter defined.

By activating the option `getWithoutSet` it enforces the presence of a setter for every property which has a getter defined.

This rule always checks object literals and property descriptors. By default, it also checks class declarations and class expressions.

## Options

* `setWithoutGet` set to `true` will warn for setters without getters (Default `true`).
* `getWithoutSet` set to `true` will warn for getters without setters (Default `false`).
* `enforceForClassMembers` set to `true` additionally applies this rule to class getters/setters (Default `true`). Set `enforceForClassMembers` to `false` if you want this rule to ignore class declarations and class expressions.
* `enforceForTSTypes`: set to `true` additionally applies this rule to TypeScript type definitions (Default `false`).

### setWithoutGet

Examples of **incorrect** code for the default `{ "setWithoutGet": true }` option:

:::incorrect

```js
/*eslint accessor-pairs: "error"*/

const q = {
    set a(value) {
        this.val = value;
    }
};


const r = {d: 1};
Object.defineProperty(r, 'c', {
    set: function(value) {
        this.val = value;
    }
});
```

:::

Examples of **correct** code for the default `{ "setWithoutGet": true }` option:

:::correct

```js
/*eslint accessor-pairs: "error"*/

const s = {
    set a(value) {
        this.val = value;
    },
    get a() {
        return this.val;
    }
};

const t = {d: 1};
Object.defineProperty(t, 'c', {
    set: function(value) {
        this.val = value;
    },
    get: function() {
        return this.val;
    }
});

```

:::

### getWithoutSet

Examples of **incorrect** code for the `{ "getWithoutSet": true }` option:

:::incorrect

```js
/*eslint accessor-pairs: ["error", { "getWithoutSet": true }]*/

const u = {
    set a(value) {
        this.val = value;
    }
};

const v = {
    get a() {
        return this.val;
    }
};

const w = {d: 1};
Object.defineProperty(w, 'c', {
    set: function(value) {
        this.val = value;
    }
});

const x = {d: 1};
Object.defineProperty(x, 'c', {
    get: function() {
        return this.val;
    }
});
```

:::

Examples of **correct** code for the `{ "getWithoutSet": true }` option:

:::correct

```js
/*eslint accessor-pairs: ["error", { "getWithoutSet": true }]*/
const y = {
    set a(value) {
        this.val = value;
    },
    get a() {
        return this.val;
    }
};

const z = {d: 1};
Object.defineProperty(z, 'c', {
    set: function(value) {
        this.val = value;
    },
    get: function() {
        return this.val;
    }
});

```

:::

### enforceForClassMembers

When `enforceForClassMembers` is set to `true` (default):

* `"getWithoutSet": true` will also warn for getters without setters in classes.
* `"setWithoutGet": true` will also warn for setters without getters in classes.

Examples of **incorrect** code for `{ "getWithoutSet": true, "enforceForClassMembers": true }`:

:::incorrect

```js
/*eslint accessor-pairs: ["error", { "getWithoutSet": true, "enforceForClassMembers": true }]*/

class Foo {
    get a() {
        return this.val;
    }
}

class Bar {
    static get a() {
        return this.val;
    }
}

const Baz = class {
    get a() {
        return this.val;
    }
    static set a(value) {
        this.val = value;
    }
}
```

:::

Examples of **incorrect** code for `{ "setWithoutGet": true, "enforceForClassMembers": true }`:

:::incorrect

```js
/*eslint accessor-pairs: ["error", { "setWithoutGet": true, "enforceForClassMembers": true }]*/

class Foo {
    set a(value) {
        this.val = value;
    }
}

const Bar = class {
    static set a(value) {
        this.val = value;
    }
}
```

:::

When `enforceForClassMembers` is set to `false`, this rule ignores classes.

Examples of **correct** code for `{ "getWithoutSet": true, "setWithoutGet": true, "enforceForClassMembers": false }`:

:::correct

```js
/*eslint accessor-pairs: ["error", {
    "getWithoutSet": true, "setWithoutGet": true, "enforceForClassMembers": false
}]*/

class Foo {
    get a() {
        return this.val;
    }
}

class Bar {
    static set a(value) {
        this.val = value;
    }
}

const Baz = class {
    static get a() {
        return this.val;
    }
}

const Quux = class {
    set a(value) {
        this.val = value;
    }
}
```

:::

### enforceForTSTypes

When `enforceForTSTypes` is set to `true`:

* `"getWithoutSet": true` will also warn for getters without setters in TypeScript types.
* `"setWithoutGet": true` will also warn for setters without getters in TypeScript types.

Examples of **incorrect** code for `{ "getWithoutSet": true, "enforceForTSTypes": true }`:

:::incorrect

```ts
/*eslint accessor-pairs: ["error", { "getWithoutSet": true, "enforceForTSTypes": true }]*/

interface I {
    get a(): string
}

type T = {
    get a(): number
}
```

:::

Examples of **incorrect** code for `{ "setWithoutGet": true, "enforceForTSTypes": true }`:

:::incorrect

```ts
/*eslint accessor-pairs: ["error", { "setWithoutGet": true, "enforceForTSTypes": true }]*/

interface I {
    set a(value: unknown): void
}

type T = {
    set a(value: unknown): void
}
```

:::

When `enforceForTSTypes` is set to `false`, this rule ignores TypeScript types.

Examples of **correct** code for `{ "getWithoutSet": true, "setWithoutGet": true, "enforceForTSTypes": false }`:

:::correct

```ts
/*eslint accessor-pairs: ["error", {
    "getWithoutSet": true, "setWithoutGet": true, "enforceForTSTypes": false
}]*/

interface I {
    get a(): string
}

type T = {
    set a(value: unknown): void
}
```

:::

## Known Limitations

Due to the limits of static analysis, this rule does not account for possible side effects and in certain cases
might not report a missing pair for a getter/setter that has a computed key, like in the following example:

```js
/*eslint accessor-pairs: "error"*/

const z = 1;

// no warnings
const a = {
    get [z++]() {
        return this.val;
    },
    set [z++](value) {
        this.val = value;
    }
};
```

Also, this rule does not disallow duplicate keys in object literals and class definitions, and in certain cases with duplicate keys
might not report a missing pair for a getter/setter, like in the following example:

```js
/*eslint accessor-pairs: "error"*/

// no warnings
const b = {
    get a() {
        return this.val;
    },
    a: 1,
    set a(value) {
        this.val = value;
    }
};
```

The code above creates an object with just a setter for the property `"a"`.

See [no-dupe-keys](no-dupe-keys) if you also want to disallow duplicate keys in object literals.

See [no-dupe-class-members](no-dupe-class-members) if you also want to disallow duplicate names in class definitions.

## When Not To Use It

You can turn this rule off if you are not concerned with the simultaneous presence of setters and getters on objects.
