'use strict';

const { And, Branch, Pipeline } = require('..');
const expect = require('chai').expect;

function asyncArrayPush(arr, val, ms) {
    return new Promise(resolve => {
        setTimeout(() => {
            arr.push(val);
            resolve();
        }, ms || 1);
    });
}

describe('And', () => {

    describe('Combine with Branch', () => {

        it('Condition_first and Condition_second are true', async () => {
            const arr = [];
            const ctx = [];
            let flag = false;
            const branch =
                Branch(
                    And(
                        async (ctx, next, ...args) => {
                            for (const a of args) await asyncArrayPush(arr, a);
                            await asyncArrayPush(ctx, 0);
                            const rets = await next(true, 2, 3);
                            for (const r of rets) await asyncArrayPush(arr, r);
                            await asyncArrayPush(ctx, 5);
                            return [11, 12];
                        },
                        async (ctx, next, ...args) => {
                            for (const a of args) await asyncArrayPush(arr, a);
                            await asyncArrayPush(ctx, 1);
                            const rets = await next(true, 4, 5);
                            for (const r of rets) await asyncArrayPush(arr, r);
                            await asyncArrayPush(ctx, 4);
                            return [9, 10];
                        }
                    ),
                    async (ctx, next, ...args) => {
                        for (const a of args) await asyncArrayPush(arr, a);
                        await asyncArrayPush(ctx, 2);
                        const ret = await next(-1); // next = () => { };
                        if (ret !== undefined) flag = true;
                        await asyncArrayPush(arr, 6);
                        await asyncArrayPush(ctx, 3);
                        return [7, 8];
                    }
                );
            const rets = await branch(
                ctx,
                async (ctx, next, ...args) => {
                    flag = true; // Shouldn't reach here
                },
                0, 1);
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
            expect(ctx).to.eql([0, 1, 2, 3, 4, 5]);
            expect(flag).to.equal(false);
        });
        it('Condition_first is true and Condition_second is false', async () => {
            const arr = [];
            const ctx = [];
            let flag = false;
            const branch =
                Branch(
                    And(
                        async (ctx, next, ...args) => {
                            for (const a of args) await asyncArrayPush(arr, a);
                            await asyncArrayPush(ctx, 0);
                            const rets = await next(true, 2, 3);
                            for (const r of rets) await asyncArrayPush(arr, r);
                            await asyncArrayPush(ctx, 5);
                            return [-1];
                        },
                        async (ctx, next, ...args) => {
                            for (const a of args) await asyncArrayPush(arr, a);
                            await asyncArrayPush(ctx, 1);
                            const ret = await next(false, -1);
                            if (ret !== undefined) flag = true;
                            await asyncArrayPush(ctx, 4);
                            return [7, 8];
                        }
                    ),
                    async (ctx, next, ...args) => {
                        flag = true; // Shouldn't reach here
                    }
                );
            const rets = await branch(
                ctx,
                async (ctx, next, ...args) => {
                    for (const a of args) await asyncArrayPush(arr, a);
                    await asyncArrayPush(ctx, 2);
                    const ret = await next(-1); // next = () => { };
                    if (ret !== undefined) flag = true;
                    await asyncArrayPush(arr, 4);
                    await asyncArrayPush(ctx, 3);
                    return [5, 6];
                },
                0, 1);
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql([0, 1, 2, 3, 0, 1, 4, 7, 8, 5, 6]);
            expect(ctx).to.eql([0, 1, 2, 3, 4, 5]);
            expect(flag).to.equal(false);
        });
        it('Condition_first is false', async () => {
            const arr = [];
            const ctx = [];
            let flag = false;
            const branch =
                Branch(
                    And(
                        async (ctx, next, ...args) => {
                            for (const a of args) await asyncArrayPush(arr, a);
                            await asyncArrayPush(ctx, 0);
                            const ret = await next(false, -1);
                            if (ret !== undefined) flag = true;
                            await asyncArrayPush(ctx, 3);
                            return [-1];
                        },
                        async (ctx, next, ...args) => {
                            flag = true; // Shouldn't reach here
                        }
                    ),
                    async (ctx, next, ...args) => {
                        flag = true; // Shouldn't reach here
                    }
                );
            const rets = await branch(
                ctx,
                async (ctx, next, ...args) => {
                    for (const a of args) await asyncArrayPush(arr, a);
                    await asyncArrayPush(ctx, 1);
                    const ret = await next(-1); // next = () => { };
                    if (ret !== undefined) flag = true;
                    await asyncArrayPush(arr, 2);
                    await asyncArrayPush(ctx, 2);
                    return [3, 4];
                },
                0, 1);
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql([0, 1, 0, 1, 2, 3, 4]);
            expect(ctx).to.eql([0, 1, 2, 3]);
            expect(flag).to.equal(false);
        });
        
    });

});
