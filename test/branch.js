'use strict';

const { Branch, Pipeline } = require('..');
const expect = require('chai').expect;
const _ = require('lodash');

const {
    asyncArrayPush,
    MidWare,
    EndWare,
    RetWare,
    MidWareTrue,
    MidWareTrueFalse,
    EndWareTrue,
    MidWareFalse,
} = require('./util');


describe('Branch', () => {

    describe('Basic usage', () => {

        it('Condition is true (1)', async () => {
            const arr = [], ctx = [];
            const rets = await Branch(
                EndWareTrue(arr, [2, 3], [4, 5], 0, 1)
            )(
                ctx,
                undefined,
                0, 1
            );
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql(_.range(6));
            expect(ctx).to.eql(_.range(2));
        });

        it('Condition is true (2)', async () => {
            const arr = [], ctx = [];
            const rets = await Branch(
                EndWareTrue(arr, [2, 3], [4, 5], 0, 1)
            )(
                ctx,
                MidWare(arr, [-1, -1], [-1, -1], -1, -1),
                0, 1
            );
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql(_.range(6));
            expect(ctx).to.eql(_.range(2));
        });

        it('Condition is true (3)', async () => {
            const arr = [], ctx = [];
            const rets = await Branch(
                MidWareTrue(arr, [2, 3], [8, 9], 0, 3),
                EndWare(arr, [4, 5], [6, 7], 1, 2)
            )(
                ctx,
                undefined,
                0, 1
            );
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql(_.range(10));
            expect(ctx).to.eql(_.range(4));
        });

        it('Condition is true (4)', async () => {
            const arr = [], ctx = [];
            const rets = await Branch(
                MidWareTrue(arr, [2, 3], [8, 9], 0, 3),
                EndWare(arr, [4, 5], [6, 7], 1, 2)
            )(
                ctx,
                MidWare(arr, [-1, -1], [-1, -1], -1, -1),
                0, 1
            );
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql(_.range(10));
            expect(ctx).to.eql(_.range(4));
        });

        it('Condition is false (1)', async () => {
            await Branch()();
        });

        it('Condition is false (2)', async () => {
            const arr = [], ctx = [];
            const rets = await Branch(
                MidWareFalse(arr, 0)
            )(
                ctx,
                undefined,
                0, 1
            );
            if (rets !== undefined) asyncArrayPush(arr, -1);
            expect(arr).to.eql(_.range(2));
            expect(ctx).to.eql(_.range(1));
        });

        it('Condition is false (3)', async () => {
            const arr = [], ctx = [];
            const rets = await Branch(
                MidWareFalse(arr, 0)
            )(
                ctx,
                EndWare(arr, [2, 3], [4, 5], 1, 2),
                0, 1
            );
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql(_.concat(_.range(2), _.range(6)));
            expect(ctx).to.eql(_.range(3));
        });

        it('Condition is false (4)', async () => {
            const arr = [], ctx = [];
            const rets = await Branch(
                undefined,
                MidWare(arr, [-1, -1], [-1, -1], -1, -1)
            )(
                ctx,
                undefined,
                -1
            );
            if (rets !== undefined) asyncArrayPush(arr, -1);
            expect(arr).to.eql(_.range());
            expect(ctx).to.eql(_.range());
        });

        it('Condition is false (5)', async () => {
            const arr = [], ctx = [];
            const rets = await Branch(
                undefined,
                MidWare(arr, [-1, -1], [-1, -1], -1, -1)
            )(
                ctx,
                EndWare(arr, [2, 3], [4, 5], 0, 1),
                0, 1
            );
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql(_.range(6));
            expect(ctx).to.eql(_.range(2));
        });

        it('Condition is false (6)', async () => {
            const arr = [], ctx = [];
            const rets = await Branch(
                MidWareFalse(arr, 0),
                MidWare(arr, [-1, -1], [-1, -1], -1, -1)
            )(
                ctx,
                EndWare(arr, [2, 3], [4, 5], 1, 2),
                0, 1
            );
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql(_.concat(_.range(2), _.range(6)));
            expect(ctx).to.eql(_.range(3));
        });
    });

    describe('Nested usage', () => {

        it('Condition is B(true,B(true,1))(-1)', async () => {
            const arr = [], ctx = [];
            const rets = await Branch(
                MidWareTrue(arr, [2, 3], [12, 13], 0, 5),
                Branch(
                    MidWareTrue(arr, [4, 5], [10, 11], 1, 4),
                    EndWare(arr, [6, 7], [8, 9], 2, 3)
                )
            )(
                ctx,
                MidWare(arr, [-1, -1], [-1, -1], -1, -1),
                0, 1
            );
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql(_.range(14));
            expect(ctx).to.eql(_.range(6));
        });

        it('Condition is B(true,B(false,-1))(-1)', async () => {
            const arr = [], ctx = [];
            const rets = await Branch(
                MidWareTrueFalse(arr, [2, 3], [4, 5], [6, 7], 0, 2),
                Branch(
                    MidWareFalse(arr, 1),
                    MidWare(arr, [-1, -1], [-1, -1], -1, -1)
                )
            )(
                ctx,
                MidWare(arr, [-1, -1], [-1, -1], -1, -1),
                0, 1
            );
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql(_.range(8));
            expect(ctx).to.eql(_.range(3));
        });

        it('Condition is B(false,-1)(B(true,1))', async () => {
            const arr = [], ctx = [];
            const rets = await Branch(
                MidWareFalse(arr, 0),
                MidWare(arr, [-1, -1], [-1, -1], -1, -1)
            )(
                ctx,
                Branch(
                    MidWareTrue(arr, [2, 3], [8, 9], 1, 4),
                    EndWare(arr, [4, 5], [6, 7], 2, 3)
                ),
                0, 1
            );
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql(_.concat(_.range(2), _.range(10)));
            expect(ctx).to.eql(_.range(5));
        });

        it('Condition is B(false,-1)(B(false,-1))', async () => {
            const arr = [], ctx = [];
            const rets = await Branch(
                MidWareFalse(arr, 0),
                MidWare(arr, [-1, -1], [-1, -1], -1, -1)
            )(
                ctx,
                Branch(
                    MidWareFalse(arr, 1),
                    MidWare(arr, [-1, -1], [-1, -1], -1, -1)
                ),
                0, 1
            );
            if (rets !== undefined) asyncArrayPush(arr, -1);
            expect(arr).to.eql(_.concat(_.range(2), _.range(2)));
            expect(ctx).to.eql(_.range(2));
        });

        it('Condition is B(B(true,1),-1)(2)', async () => {
            const arr = [], ctx = [];
            const rets = await Branch(
                Branch(
                    MidWareTrue(arr, [2, 3], [-1, -1], 0, 3),
                    EndWare(arr, [4, 5], [6, 7], 1, 2)
                ),
                MidWare(arr, [-1, -1], [-1, -1], -1, -1)
            )(
                ctx,
                EndWare(arr, [10, 11], [12, 13], 4, 5),
                0, 1
            );
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql(_.concat(_.range(8), _.range(2), _.range(10, 14)));
            expect(ctx).to.eql(_.range(6));
        });

        it('Condition is B(B(false,-1),1)(-1)', async () => {
            const arr = [], ctx = [];
            const rets = await Branch(
                Branch(
                    MidWareFalse(arr, 0),
                    MidWare(arr, [-1, -1], [-1, -1], -1, -1)
                ),
                EndWare(arr, [2, 3], [4, 5], 1, 2)
            )(
                ctx,
                MidWare(arr, [-1, -1], [-1, -1], -1, -1),
                0, 1
            );
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql(_.concat(_.range(2), _.range(6)));
            expect(ctx).to.eql(_.range(3));
        });
    });

    describe('Usage with Pipeline', () => {

        it('Condition is true', async () => {
            const arr = [], ctx = [];
            const rets = await Pipeline(
                MidWare(arr, [2, 3], [20, 21], 0, 9),
                Branch(
                    Pipeline(
                        MidWare(arr, [4, 5], [18, 19], 1, 8),
                        MidWare(arr, [6, 7], [16, 17], 2, 7),
                    ),
                    Pipeline(
                        MidWare(arr, [8, 9], [14, 15], 3, 6),
                        EndWare(arr, [10, 11], [12, 13], 4, 5),
                    )
                ),
                MidWare(arr, [-1, -1], [-1, -1], -1, -1),
            )(
                ctx,
                MidWare(arr, [-1, -1], [-1, -1], -1, -1),
                0, 1
            );
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql(_.range(22));
            expect(ctx).to.eql(_.range(10));
        });

        it('Condition is false', async () => {
            const arr = [], ctx = [];
            const rets = await Pipeline(
                MidWare(arr, [2, 3], [24, 25], 0, 12),
                Branch(
                    Pipeline(
                        MidWare(arr, [4, 5], [-1, -1], 1, 5),
                        MidWare(arr, [6, 7], [10, 11], 2, 4),
                        RetWare(arr, [8, 9], 3),
                        MidWare(arr, [-1, -1], [-1, -1], -1, -1),
                    ),
                    MidWare(arr, [-1, -1], [-1, -1], -1, -1),
                ),
                Pipeline(
                    MidWare(arr, [12, 13], [22, 23], 6, 11),
                    MidWare(arr, [14, 15], [20, 21], 7, 10),
                )
            )(
                ctx,
                EndWare(arr, [16, 17], [18, 19], 8, 9),
                0, 1
            );
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql(_.concat(_.range(12), _.range(2, 4), _.range(12, 26)));
            expect(ctx).to.eql(_.range(13));
        });

        it('Condition is P(B(false,-1),B(true,1))', async () => {
            const arr = [], ctx = [];
            const rets = await Pipeline(
                MidWare(arr, [2, 3], [28, 29], 0, 14),
                Branch(
                    Pipeline(
                        MidWare(arr, [4, 5], [-1, -1], 1, 5),
                        MidWare(arr, [6, 7], [10, 11], 2, 4),
                        RetWare(arr, [8, 9], 3),
                        MidWare(arr, [-1, -1], [-1, -1], -1, -1),
                    ),
                    MidWare(arr, [-1, -1], [-1, -1], -1, -1),
                ),
                Branch(
                    Pipeline(
                        MidWare(arr, [12, 13], [26, 27], 6, 13),
                        MidWare(arr, [14, 15], [24, 25], 7, 12),
                    ),
                    Pipeline(
                        MidWare(arr, [16, 17], [22, 23], 8, 11),
                        EndWare(arr, [18, 19], [20, 21], 9, 10),
                    )
                ),
                MidWare(arr, [-1, -1], [-1, -1], -1, -1),
            )(
                ctx,
                MidWare(arr, [-1, -1], [-1, -1], -1, -1),
                0, 1
            );
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql(_.concat(_.range(12), _.range(2, 4), _.range(12, 30)));
            expect(ctx).to.eql(_.range(15));
        });
    });
});
