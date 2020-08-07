'use strict';

const _ = require('lodash');

const delay = 10;

const msgRight = 'Work correctly!';
const msgWrong = 'Something wrong!';

async function asyncSleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function asyncArrayPush(arr, val, ms) {
    return asyncSleep(ms || _.random(delay)).then(() => arr.push(val));
}

function MidWare(arr, a1, a2, c1, c2) {
    return async (ctx, next, ...args) => {
        for (const a of args) await asyncArrayPush(arr, a);
        await asyncArrayPush(ctx, c1);
        const rets = await next(...a1);
        for (const r of rets) await asyncArrayPush(arr, r);
        await asyncArrayPush(ctx, c2);
        return a2;
    };
}

function EndWare(arr, a1, a2, c1, c2) {
    return async (ctx, next, ...args) => {
        for (const a of args) await asyncArrayPush(arr, a);
        await asyncArrayPush(ctx, c1);
        const rets = await next(-1);
        if (rets !== undefined) arr.push(-1);
        for (const a of a1) await asyncArrayPush(arr, a);
        await asyncArrayPush(ctx, c2)
        return a2;
    };
}

function RetWare(arr, a1, c1) {
    return async (ctx, next, ...args) => {
        for (const a of args) await asyncArrayPush(arr, a);
        await asyncArrayPush(ctx, c1);
        return a1;
    };
}

function MidWareErrBeforeNext(arr, c1) {
    return async (ctx, next, ...args) => {
        for (const a of args) await asyncArrayPush(arr, a);
        await asyncArrayPush(ctx, c1);
        throw new Error(msgRight);
        await next(-1);
        await asyncArrayPush(arr, -1);
        return -1;
    };
}

function MidWareErrAfterNext(arr, a1, c1, c2) {
    return async (ctx, next, ...args) => {
        for (const a of args) await asyncArrayPush(arr, a);
        await asyncArrayPush(ctx, c1);
        const rets = await next(...a1);
        for (const r of rets) await asyncArrayPush(arr, r);
        await asyncArrayPush(ctx, c2);
        throw new Error(msgRight);
        await asyncArrayPush(arr, -1);
        return -1;
    };
}

function MidWareErrMultiNext(arr, a1, c1, c2) {
    return async (ctx, next, ...args) => {
        for (const a of args) await asyncArrayPush(arr, a);
        await asyncArrayPush(ctx, c1);
        const rets = await next(...a1);
        for (const r of rets) await asyncArrayPush(arr, r);
        await asyncArrayPush(ctx, c2);
        await next(-1);
        await asyncArrayPush(arr, -1);
        return -1;
    };
}

function EndWareErrAfterNext(arr, a1, c1, c2) {
    return async (ctx, next, ...args) => {
        for (const a of args) await asyncArrayPush(arr, a);
        await asyncArrayPush(ctx, c1);
        const rets = await next(-1);
        if (rets !== undefined) arr.push(-1);
        for (const a of a1) await asyncArrayPush(arr, a);
        await asyncArrayPush(ctx, c2);
        throw new Error(msgRight);
        await asyncArrayPush(arr, -1);
        return -1;
    };
}

function EndWareErrMultiNext(arr, a1, c1, c2) {
    return async (ctx, next, ...args) => {
        for (const a of args) await asyncArrayPush(arr, a);
        await asyncArrayPush(ctx, c1);
        const rets = await next(-1);
        if (rets !== undefined) arr.push(-1);
        for (const a of a1) await asyncArrayPush(arr, a);
        await asyncArrayPush(ctx, c2);
        await next(-1);
        await asyncArrayPush(arr, -1);
        return -1;
    };
}

const MidWareTrue = MidWare;

function MidWareTrueFalse(arr, a1, a2, a3, c1, c2) {
    return async (ctx, next, ...args) => {
        for (const a of args) await asyncArrayPush(arr, a);
        await asyncArrayPush(ctx, c1);
        const rets = await next(...a1);
        if (rets !== undefined) arr.push(-1);
        for (const a of a2) await asyncArrayPush(arr, a);
        await asyncArrayPush(ctx, c2);
        return a3;
    };
}

const EndWareTrue = EndWare;

function MidWareFalse(arr, c1) {
    return async (ctx, next, ...args) => {
        for (const a of args) await asyncArrayPush(arr, a);
        await asyncArrayPush(ctx, c1);
        return -1;
    };
}

module.exports = {
    msgRight,
    msgWrong,
    asyncSleep,
    asyncArrayPush,
    MidWare,
    EndWare,
    RetWare,
    MidWareErrBeforeNext,
    MidWareErrAfterNext,
    MidWareErrMultiNext,
    EndWareErrAfterNext,
    EndWareErrMultiNext,
    MidWareTrue,
    MidWareTrueFalse,
    EndWareTrue,
    MidWareFalse,
};
