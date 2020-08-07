'use strict';

const { Circuit, Pipeline } = require('..');
const expect = require('chai').expect;
const _ = require('lodash');

const {
    asyncArrayPush,
    MidWare,
    EndWare,
    RetWare,
    MidWareTrue,
    EndWareTrue,
    MidWareFalse,
} = require('./util');

describe('Circuit', () => {

    describe('Basic usage', () => {

        it('Condition is true (1)', async () => {
            const arr = [], ctx = [];
            const rets = await Circuit(
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
            const rets = await Circuit(
                MidWareTrue(arr, [2, 3], [8, 9], 0, 3)
            )(
                ctx,
                EndWare(arr, [4, 5], [6, 7], 1, 2),
                0, 1
            );
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql(_.range(10));
            expect(ctx).to.eql(_.range(4));
        });

        it('Condition is true (3)', async () => {
            const arr = [], ctx = [];
            const rets = await Circuit(
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
            const rets = await Circuit(
                MidWareTrue(arr, [2, 3], [12, 13], 0, 5),
                MidWare(arr, [4, 5], [10, 11], 1, 4)
            )(
                ctx,
                EndWare(arr, [6, 7], [8, 9], 2, 3),
                0, 1
            );
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql(_.range(14));
            expect(ctx).to.eql(_.range(6));
        });

        it('Condition is false (1)', async () => {
            await Circuit()();
        });

        it('Condition is false (2)', async () => {
            const arr = [], ctx = [];
            const rets = await Circuit(
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
            const rets = await Circuit(
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
            const rets = await Circuit(
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
            const rets = await Circuit(
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
            const rets = await Circuit(
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

        it('Condition is C(true,C(true,1))(2)', async () => {
            const arr = [], ctx = [];
            const rets = await Circuit(
                MidWareTrue(arr, [2, 3], [16, 17], 0, 7),
                Circuit(
                    MidWareTrue(arr, [4, 5], [14, 15], 1, 6),
                    MidWare(arr, [6, 7], [12, 13], 2, 5)
                )
            )(
                ctx,
                EndWare(arr, [8, 9], [10, 11], 3, 4),
                0, 1
            );
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql(_.range(18));
            expect(ctx).to.eql(_.range(8));
        });

        it('Condition is C(true,C(true,undefined))(1)', async () => {
            const arr = [], ctx = [];
            const rets = await Circuit(
                MidWareTrue(arr, [2, 3], [12, 13], 0, 5),
                Circuit(
                    MidWareTrue(arr, [4, 5], [10, 11], 1, 4)
                )
            )(
                ctx,
                EndWare(arr, [6, 7], [8, 9], 2, 3),
                0, 1
            );
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql(_.range(14));
            expect(ctx).to.eql(_.range(6));
        });

        it('Condition is C(true,C(false,-1))(1)', async () => {
            const arr = [], ctx = [];
            const rets = await Circuit(
                MidWareTrue(arr, [2, 3], [8, 9], 0, 4),
                Circuit(
                    MidWareFalse(arr, 1),
                    MidWare(arr, [-1, -1], [-1, -1], -1, -1)
                )
            )(
                ctx,
                EndWare(arr, [4, 5], [6, 7], 2, 3),
                0, 1
            );
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql(_.concat(_.range(4), _.range(2, 10)));
            expect(ctx).to.eql(_.range(5));
        });

        it('Condition is C(false,-1)(C(true,1))', async () => {
            const arr = [], ctx = [];
            const rets = await Circuit(
                MidWareFalse(arr, 0),
                MidWare(arr, [-1, -1], [-1, -1], -1, -1)
            )(
                ctx,
                Circuit(
                    MidWareTrue(arr, [2, 3], [8, 9], 1, 4),
                    EndWare(arr, [4, 5], [6, 7], 2, 3)
                ),
                0, 1
            );
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql(_.concat(_.range(2), _.range(10)));
            expect(ctx).to.eql(_.range(5));
        });

        it('Condition is C(false,-1)(C(true,undefined))', async () => {
            const arr = [], ctx = [];
            const rets = await Circuit(
                MidWareFalse(arr, 0),
                MidWare(arr, [-1, -1], [-1, -1], -1, -1)
            )(
                ctx,
                Circuit(
                    EndWareTrue(arr, [2, 3], [4, 5], 1, 2)
                ),
                0, 1
            );
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql(_.concat(_.range(2), _.range(6)));
            expect(ctx).to.eql(_.range(3));
        });

        it('Condition is C(false,-1)(C(false,-1))', async () => {
            const arr = [], ctx = [];
            const rets = await Circuit(
                MidWareFalse(arr, 0),
                MidWare(arr, [-1, -1], [-1, -1], -1, -1)
            )(
                ctx,
                Circuit(
                    MidWareFalse(arr, 1),
                    MidWare(arr, [-1, -1], [-1, -1], -1, -1)
                ),
                0, 1
            );
            if (rets !== undefined) asyncArrayPush(arr, -1);
            expect(arr).to.eql(_.concat(_.range(2), _.range(2)));
            expect(ctx).to.eql(_.range(2));
        });

        it('Condition is C(C(true,1),2)(3)', async () => {
            const arr = [], ctx = [];
            const rets = await Circuit(
                Circuit(
                    MidWareTrue(arr, [2, 3], [16, 17], 0, 7),
                    MidWare(arr, [4, 5], [14, 15], 1, 6)
                ),
                MidWare(arr, [6, 7], [12, 13], 2, 5)
            )(
                ctx,
                EndWare(arr, [8, 9], [10, 11], 3, 4),
                0, 1
            );
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql(_.range(18));
            expect(ctx).to.eql(_.range(8));
        });

        it('Condition is C(C(false,-1),1)(2)', async () => {
            const arr = [], ctx = [];
            const rets = await Circuit(
                Circuit(
                    MidWareFalse(arr, 0),
                    MidWare(arr, [-1, -1], [-1, -1], -1, -1)
                ),
                MidWare(arr, [2, 3], [8, 9], 1, 4)
            )(
                ctx,
                EndWare(arr, [4, 5], [6, 7], 2, 3),
                0, 1
            );
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql(_.concat(_.range(2), _.range(10)));
            expect(ctx).to.eql(_.range(5));
        });
    });

    describe('Usage with Pipeline', () => {

        it('Condition is true', async () => {
            const arr = [], ctx = [];
            const rets = await Pipeline(
                MidWare(arr, [2, 3], [28, 29], 0, 13),
                Circuit(
                    Pipeline(
                        MidWare(arr, [4, 5], [26, 27], 1, 12),
                        MidWare(arr, [6, 7], [24, 25], 2, 11),
                    ),
                    Pipeline(
                        MidWare(arr, [8, 9], [22, 23], 3, 10),
                        MidWare(arr, [10, 11], [20, 21], 4, 9),
                    )
                ),
                MidWare(arr, [12, 13], [18, 19], 5, 8),
            )(
                ctx,
                EndWare(arr, [14, 15], [16, 17], 6, 7),
                0, 1
            );
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql(_.range(30));
            expect(ctx).to.eql(_.range(14));
        });

        it('Condition is false', async () => {
            const arr = [], ctx = [];
            const rets = await Pipeline(
                MidWare(arr, [2, 3], [24, 25], 0, 12),
                Circuit(
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

        it('Condition is P(C(false,-1),C(true,1))', async () => {
            const arr = [], ctx = [];
            const rets = await Pipeline(
                MidWare(arr, [2, 3], [36, 37], 0, 18),
                Circuit(
                    Pipeline(
                        MidWare(arr, [4, 5], [-1, -1], 1, 5),
                        MidWare(arr, [6, 7], [10, 11], 2, 4),
                        RetWare(arr, [8, 9], 3),
                        MidWare(arr, [-1, -1], [-1, -1], -1, -1),
                    ),
                    MidWare(arr, [-1, -1], [-1, -1], -1, -1),
                ),
                Circuit(
                    Pipeline(
                        MidWare(arr, [12, 13], [34, 35], 6, 17),
                        MidWare(arr, [14, 15], [32, 33], 7, 16),
                    ),
                    Pipeline(
                        MidWare(arr, [16, 17], [30, 31], 8, 15),
                        MidWare(arr, [18, 19], [28, 29], 9, 14),
                    )
                ),
                MidWare(arr, [20, 21], [26, 27], 10, 13),
            )(
                ctx,
                EndWare(arr, [22, 23], [24, 25], 11, 12),
                0, 1
            );
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql(_.concat(_.range(12), _.range(2, 4), _.range(12, 38)));
            expect(ctx).to.eql(_.range(19));
        });
    });
});
