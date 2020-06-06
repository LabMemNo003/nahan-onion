'use strict';

const { Branch, Pipeline } = require('..');
const expect = require('chai').expect;

function asyncArrayPush(arr, val, ms) {
    return new Promise(resolve => {
        setTimeout(() => {
            arr.push(val);
            resolve();
        }, ms || 1);
    });
}

describe('Branch', () => {

    describe('Basic call', () => {

        it('Condition is true', async () => {
            const arr = [];
            const ctx = [];
            let flag = false;
            const branch =
                Branch(
                    async (ctx, next, ...args) => {
                        for (const a of args) await asyncArrayPush(arr, a);
                        await asyncArrayPush(ctx, 0);
                        const rets = await next(true, 2, 3);
                        for (const r of rets) await asyncArrayPush(arr, r);
                        await asyncArrayPush(ctx, 3);
                        return [7, 8];
                    },
                    async (ctx, next, ...args) => {
                        for (const a of args) await asyncArrayPush(arr, a);
                        await asyncArrayPush(ctx, 1);
                        const ret = await next(-1); // next = () => { };
                        if (ret !== undefined) flag = true;
                        await asyncArrayPush(arr, 4);
                        await asyncArrayPush(ctx, 2);
                        return [5, 6];
                    }
                );
            const rets = await branch(
                ctx,
                async (ctx, next, ...args) => {
                    flag = true; // Shouldn't reach here
                },
                0, 1);
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql([0, 1, 2, 3, 4, 5, 6, 7, 8]);
            expect(ctx).to.eql([0, 1, 2, 3]);
            expect(flag).to.equal(false);
        });

        it('Condition is false', async () => {
            const arr = [];
            const ctx = [];
            let flag = false;
            const branch =
                Branch(
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

        it('Default parameters', async () => {
            const branch = Branch();
            await branch();
        });

        it('Default "condition" parameter (false)', async () => {
            const arr = [];
            const ctx = [];
            let flag = false;
            const branch =
                Branch(
                    undefined,
                    async (ctx, next, ...args) => {
                        flag = true; // Shouldn't reach here
                    }
                );
            const rets = await branch(
                ctx,
                async (ctx, next, ...args) => {
                    for (const a of args) await asyncArrayPush(arr, a);
                    await asyncArrayPush(ctx, 0);
                    const ret = await next(-1); // next = () => { };
                    if (ret !== undefined) flag = true;
                    await asyncArrayPush(arr, 2);
                    await asyncArrayPush(ctx, 1);
                    return [3, 4];
                },
                0, 1);
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql([0, 1, 2, 3, 4]);
            expect(ctx).to.eql([0, 1]);
            expect(flag).to.equal(false);
        });

        it('Default "middleware" parameter (true)', async () => {
            const arr = [];
            const ctx = [];
            let flag = false;
            const branch =
                Branch(
                    async (ctx, next, ...args) => {
                        for (const a of args) await asyncArrayPush(arr, a);
                        await asyncArrayPush(ctx, 0);
                        const ret = await next(true, -1);
                        if (ret !== undefined) flag = true;
                        await asyncArrayPush(ctx, 1);
                        return [2, 3];
                    },
                    undefined
                );
            const rets = await branch(
                ctx,
                async (ctx, next, ...args) => {
                    flag = true; // Shouldn't reach here
                },
                0, 1);
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql([0, 1, 2, 3]);
            expect(ctx).to.eql([0, 1]);
            expect(flag).to.equal(false);
        });

        it('Default "middleware" parameter (false)', async () => {
            const arr = [];
            const ctx = [];
            let flag = false;
            const branch =
                Branch(
                    async (ctx, next, ...args) => {
                        for (const a of args) await asyncArrayPush(arr, a);
                        await asyncArrayPush(ctx, 0);
                        const ret = await next(false, -1);
                        if (ret !== undefined) flag = true;
                        await asyncArrayPush(ctx, 3);
                        return [-1];
                    },
                    undefined
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

        it('branch.cond() & branch.mw()', async () => {
            const arr = [];
            const ctx = [];
            let flag = false;
            const branch = Branch();
            branch.cond(async (ctx, next, ...args) => {
                for (const a of args) await asyncArrayPush(arr, a);
                await asyncArrayPush(ctx, 0);
                const rets = await next(true, 2, 3);
                for (const r of rets) await asyncArrayPush(arr, r);
                await asyncArrayPush(ctx, 3);
                return [7, 8];
            });
            branch.mw(async (ctx, next, ...args) => {
                for (const a of args) await asyncArrayPush(arr, a);
                await asyncArrayPush(ctx, 1);
                const ret = await next(-1); // next = () => { };
                if (ret !== undefined) flag = true;
                await asyncArrayPush(arr, 4);
                await asyncArrayPush(ctx, 2);
                return [5, 6];
            });
            const rets = await branch(
                ctx,
                async (ctx, next, ...args) => {
                    flag = true; // Shouldn't reach here
                },
                0, 1);
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql([0, 1, 2, 3, 4, 5, 6, 7, 8]);
            expect(ctx).to.eql([0, 1, 2, 3]);
            expect(flag).to.equal(false);
        });
    });

    describe('Combine with Pipeline', () => {

        it('Condition is true', async () => {
            const arr = [];
            const ctx = [];
            let flag = false;
            const app =
                Pipeline(
                    async (ctx, next, ...args) => {
                        for (const a of args) await asyncArrayPush(arr, a);
                        await asyncArrayPush(ctx, 0);
                        const rets = await next(2, 3);
                        for (const r of rets) await asyncArrayPush(arr, r);
                        await asyncArrayPush(ctx, 5);
                        return [11, 12];
                    },
                    Branch(
                        async (ctx, next, ...args) => {
                            for (const a of args) await asyncArrayPush(arr, a);
                            await asyncArrayPush(ctx, 1);
                            const rets = await next(true, 4, 5);
                            for (const r of rets) await asyncArrayPush(arr, r);
                            await asyncArrayPush(ctx, 4);
                            return [9, 10];
                        },
                        async (ctx, next, ...args) => {
                            for (const a of args) await asyncArrayPush(arr, a);
                            await asyncArrayPush(ctx, 2);
                            const ret = await next(-1); // next = () => { };
                            if (ret !== undefined) flag = true;
                            await asyncArrayPush(arr, 6);
                            await asyncArrayPush(ctx, 3);
                            return [7, 8];
                        }
                    ),
                    async (ctx, next, ...args) => {
                        flag = true; // Shouldn't reach here
                    }
                );
            const rets = await app(
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

        it('Condition is false', async () => {
            const arr = [];
            const ctx = [];
            let flag = false;
            const app =
                Pipeline(
                    async (ctx, next, ...args) => {
                        for (const a of args) await asyncArrayPush(arr, a);
                        await asyncArrayPush(ctx, 0);
                        const rets = await next(2, 3);
                        for (const r of rets) await asyncArrayPush(arr, r);
                        await asyncArrayPush(ctx, 7);
                        return [11, 12];
                    },
                    Branch(
                        async (ctx, next, ...args) => {
                            for (const a of args) await asyncArrayPush(arr, a);
                            await asyncArrayPush(ctx, 1);
                            const ret = await next(false, -1);
                            if (ret !== undefined) flag = true;
                            await asyncArrayPush(ctx, 6);
                            return [-1];
                        },
                        async (ctx, next, ...args) => {
                            flag = true; // Shouldn't reach here
                        }
                    ),
                    async (ctx, next, ...args) => {
                        for (const a of args) await asyncArrayPush(arr, a);
                        await asyncArrayPush(ctx, 2);
                        const rets = await next(4, 5);
                        for (const r of rets) await asyncArrayPush(arr, r);
                        await asyncArrayPush(ctx, 5);
                        return [9, 10];
                    }
                );
            const rets = await app(
                ctx,
                async (ctx, next, ...args) => {
                    for (const a of args) await asyncArrayPush(arr, a);
                    await asyncArrayPush(ctx, 3);
                    const ret = await next(-1); // next = () => { };
                    if (ret !== undefined) flag = true;
                    await asyncArrayPush(arr, 6);
                    await asyncArrayPush(ctx, 4);
                    return [7, 8];
                },
                0, 1);
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql([0, 1, 2, 3, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
            expect(ctx).to.eql([0, 1, 2, 3, 4, 5, 6, 7]);
            expect(flag).to.equal(false);
        });

        it('Default parameters', async () => {
            const arr = [];
            const ctx = [];
            let flag = false;
            const app =
                Pipeline(
                    async (ctx, next, ...args) => {
                        for (const a of args) await asyncArrayPush(arr, a);
                        await asyncArrayPush(ctx, 0);
                        const rets = await next(2, 3);
                        for (const r of rets) await asyncArrayPush(arr, r);
                        await asyncArrayPush(ctx, 5);
                        return [11, 12];
                    },
                    Branch(),
                    async (ctx, next, ...args) => {
                        for (const a of args) await asyncArrayPush(arr, a);
                        await asyncArrayPush(ctx, 1);
                        const rets = await next(4, 5);
                        for (const r of rets) await asyncArrayPush(arr, r);
                        await asyncArrayPush(ctx, 4);
                        return [9, 10];
                    }
                );
            const rets = await app(
                ctx,
                async (ctx, next, ...args) => {
                    for (const a of args) await asyncArrayPush(arr, a);
                    await asyncArrayPush(ctx, 2);
                    const ret = await next(-1); // next = () => { };
                    if (ret !== undefined) flag = true;
                    await asyncArrayPush(arr, 6);
                    await asyncArrayPush(ctx, 3);
                    return [7, 8];
                },
                0, 1);
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
            expect(ctx).to.eql([0, 1, 2, 3, 4, 5]);
            expect(flag).to.equal(false);
        });

        it('Default "condition" parameter (false)', async () => {
            const arr = [];
            const ctx = [];
            let flag = false;
            const app =
                Pipeline(
                    async (ctx, next, ...args) => {
                        for (const a of args) await asyncArrayPush(arr, a);
                        await asyncArrayPush(ctx, 0);
                        const rets = await next(2, 3);
                        for (const r of rets) await asyncArrayPush(arr, r);
                        await asyncArrayPush(ctx, 5);
                        return [11, 12];
                    },
                    Branch(
                        undefined,
                        async (ctx, next, ...args) => {
                            flag = true; // Shouldn't reach here
                        }
                    ),
                    async (ctx, next, ...args) => {
                        for (const a of args) await asyncArrayPush(arr, a);
                        await asyncArrayPush(ctx, 1);
                        const rets = await next(4, 5);
                        for (const r of rets) await asyncArrayPush(arr, r);
                        await asyncArrayPush(ctx, 4);
                        return [9, 10];
                    }
                );
            const rets = await app(
                ctx,
                async (ctx, next, ...args) => {
                    for (const a of args) await asyncArrayPush(arr, a);
                    await asyncArrayPush(ctx, 2);
                    const ret = await next(-1); // next = () => { };
                    if (ret !== undefined) flag = true;
                    await asyncArrayPush(arr, 6);
                    await asyncArrayPush(ctx, 3);
                    return [7, 8];
                },
                0, 1);
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
            expect(ctx).to.eql([0, 1, 2, 3, 4, 5]);
            expect(flag).to.equal(false);
        });

        it('Default "middleware" parameter (true)', async () => {
            const arr = [];
            const ctx = [];
            let flag = false;
            const app =
                Pipeline(
                    async (ctx, next, ...args) => {
                        for (const a of args) await asyncArrayPush(arr, a);
                        await asyncArrayPush(ctx, 0);
                        const rets = await next(2, 3);
                        for (const r of rets) await asyncArrayPush(arr, r);
                        await asyncArrayPush(ctx, 3);
                        return [7, 8];
                    },
                    Branch(
                        async (ctx, next, ...args) => {
                            for (const a of args) await asyncArrayPush(arr, a);
                            await asyncArrayPush(ctx, 1);
                            const ret = await next(true, -1);
                            if (ret !== undefined) flag = true;
                            await asyncArrayPush(arr, 4);
                            await asyncArrayPush(ctx, 2);
                            return [5, 6];
                        },
                        undefined
                    ),
                    async (ctx, next, ...args) => {
                        flag = true; // Shouldn't reach here
                    }
                );
            const rets = await app(
                ctx,
                async (ctx, next, ...args) => {
                    flag = true; // Shouldn't reach here
                },
                0, 1);
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql([0, 1, 2, 3, 4, 5, 6, 7, 8]);
            expect(ctx).to.eql([0, 1, 2, 3]);
            expect(flag).to.equal(false);
        });

        it('Default "middleware" parameter (false)', async () => {
            const arr = [];
            const ctx = [];
            let flag = false;
            const app =
                Pipeline(
                    async (ctx, next, ...args) => {
                        for (const a of args) await asyncArrayPush(arr, a);
                        await asyncArrayPush(ctx, 0);
                        const rets = await next(2, 3);
                        for (const r of rets) await asyncArrayPush(arr, r);
                        await asyncArrayPush(ctx, 7);
                        return [11, 12];
                    },
                    Branch(
                        async (ctx, next, ...args) => {
                            for (const a of args) await asyncArrayPush(arr, a);
                            await asyncArrayPush(ctx, 1);
                            const ret = await next(false, -1);
                            if (ret !== undefined) flag = true;
                            await asyncArrayPush(ctx, 6);
                            return [-1];
                        },
                        undefined
                    ),
                    async (ctx, next, ...args) => {
                        for (const a of args) await asyncArrayPush(arr, a);
                        await asyncArrayPush(ctx, 2);
                        const rets = await next(4, 5);
                        for (const r of rets) await asyncArrayPush(arr, r);
                        await asyncArrayPush(ctx, 5);
                        return [9, 10];
                    }
                );
            const rets = await app(
                ctx,
                async (ctx, next, ...args) => {
                    for (const a of args) await asyncArrayPush(arr, a);
                    await asyncArrayPush(ctx, 3);
                    const ret = await next(-1); // next = () => { };
                    if (ret !== undefined) flag = true;
                    await asyncArrayPush(arr, 6);
                    await asyncArrayPush(ctx, 4);
                    return [7, 8];
                },
                0, 1);
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql([0, 1, 2, 3, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
            expect(ctx).to.eql([0, 1, 2, 3, 4, 5, 6, 7]);
            expect(flag).to.equal(false);
        });
    });
});
