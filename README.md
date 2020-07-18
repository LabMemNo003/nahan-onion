# nahan-onion

Middleware framework based on async/await and onion model

[![Build Status][travis-ci-image]][travis-ci-url]
[![Coverage Status][coveralls-image]][coveralls-url]

[travis-ci-image]: https://travis-ci.org/LabMemNo003/nahan-onion.svg?branch=master
[travis-ci-url]: https://travis-ci.org/LabMemNo003/nahan-onion
[coveralls-image]: https://coveralls.io/repos/github/LabMemNo003/nahan-onion/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/LabMemNo003/nahan-onion?branch=master

# API

+ Pipeline(...middleware)
+ Branch(condition, middleware)
+ And(condition_1, condition_2)
+ Or(condition_1, condition_2)

# Example

## Pipeline

``` javascript
const arr = [];

const app = Pipeline(
    async (ctx, next, ...args) => {
        for (const a of args) await asyncArrayPush(arr, a); // [step 2]
        const rets = await next(2, 3); // [step 6] = [step 3]
        for (const r of rets) await asyncArrayPush(arr, r); // [step 7]
        return [6, 7]; // [step 8]
    },
    async (ctx, next, ...args) => {
        for (const a of args) await asyncArrayPush(arr, a); // [step 4]
        return [4, 5]; // [step 5]
    }
);

const rets = await app(undefined, undefined, 0, 1); // [step 9] = [step 1]
for (const r of rets) await asyncArrayPush(arr, r); // [step 10]

expect(arr).to.eql([0, 1, 2, 3, 4, 5, 6, 7]);
```

## Pipeline + Branch (true)

``` javascript
const arr = [];

const app =
    Pipeline(
        async (ctx, next, ...args) => {
            for (const a of args) await asyncArrayPush(arr, a); // [step 2]
            const rets = await next(2, 3); // [step 11] = [step 3]
            for (const r of rets) await asyncArrayPush(arr, r); // [step 12]
            return [10, 11]; // [step 13]
        },
        Branch(
            async (ctx, next, ...args) => {
                for (const a of args) await asyncArrayPush(arr, a); // [step 4]
                const rets = await next(true, 4, 5); // [step 8] = [step 5]
                for (const r of rets) await asyncArrayPush(arr, r); // [step 9]
                return [8, 9]; // [step 10]
            },
            async (ctx, next, ...args) => {
                for (const a of args) await asyncArrayPush(arr, a); // = [step 6]
                return [6, 7]; // [step 7]
            }
        ),
        async (ctx, next, ...args) => {
            // Don't reach here
        }
    );

const rets = await app(undefined, undefined, 0, 1); // [step 14] = [step 1]
for (const r of rets) await asyncArrayPush(arr, r); // [step 15]

expect(arr).to.eql([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]);
```

## Pipeline + Branch (false)

``` javascript
const arr = [];

const app =
    Pipeline(
        async (ctx, next, ...args) => {
            for (const a of args) await asyncArrayPush(arr, a); // [step 2]
            const rets = await next(2, 3); // [step 8] = [step 3]
            for (const r of rets) await asyncArrayPush(arr, r); // [step 9]
            return [6, 7]; // [step 10]
        },
        Branch(
            async (ctx, next, ...args) => {
                for (const a of args) await asyncArrayPush(arr, a); // [step 4]
                await next(false); // [step 5]
            },
            async (ctx, next, ...args) => {
                // Don't reach here
            }
        ),
        async (ctx, next, ...args) => {
            for (const a of args) await asyncArrayPush(arr, a); // [step 6]
            return [4, 5]; // [step 7]
        }
    );

const rets = await app(undefined, undefined, 0, 1); // [step 11] = [step 1]
for (const r of rets) await asyncArrayPush(arr, r); // [step 12]

expect(arr).to.eql([0, 1, 2, 3, 2, 3, 4, 5, 6, 7]);
```
