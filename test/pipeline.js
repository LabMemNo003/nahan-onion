'use strict';

const { Pipeline } = require('..');
const expect = require('chai').expect;
const _ = require('lodash');

const {
    msgRight,
    msgWrong,
    asyncArrayPush,
    MidWare,
    EndWare,
    RetWare,
    MidWareErrBeforeNext,
    MidWareErrAfterNext,
    MidWareErrMultiNext,
    EndWareErrAfterNext,
    EndWareErrMultiNext,
} = require('./util');

describe('Pipeline', () => {

    describe('Basic useage', () => {

        it('Should work with empty middleware', async () => {
            let arr, ctx, rets;

            await Pipeline()();

            arr = [], ctx = [];
            rets = await Pipeline()(
                ctx,
                EndWare(arr, [0, 1], [2, 3], 0, 1),
            );
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql(_.range(4));
            expect(ctx).to.eql(_.range(2));

            arr = [], ctx = [];
            rets = await Pipeline()(
                ctx,
                EndWare(arr, [2, 3], [4, 5], 0, 1),
                0, 1
            );
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql(_.range(6));
            expect(ctx).to.eql(_.range(2));
        });

        it('Should call middlewares sequentially', async () => {
            let arr, ctx, rets;

            arr = [], ctx = [];
            rets = await Pipeline(
                MidWare(arr, [2, 3], [12, 13], 0, 5),
                MidWare(arr, [4, 5], [10, 11], 1, 4),
                EndWare(arr, [6, 7], [8, 9], 2, 3),
            )(
                ctx,
                undefined,
                0, 1
            );
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql(_.range(14));
            expect(ctx).to.eql(_.range(6));

            arr = [], ctx = [];
            rets = await Pipeline(
                MidWare(arr, [2, 3], [12, 13], 0, 5),
                MidWare(arr, [4, 5], [10, 11], 1, 4),
            )(
                ctx,
                EndWare(arr, [6, 7], [8, 9], 2, 3),
                0, 1
            );
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql(_.range(14));
            expect(ctx).to.eql(_.range(6));
        });

        it('Should return early when not call next()', async () => {
            let arr, ctx, rets;

            arr = [], ctx = [];
            rets = await Pipeline(
                MidWare(arr, [2, 3], [6, 7], 0, 2),
                RetWare(arr, [4, 5], 1),
                MidWare(arr, [-1, -1], [-1, -1], -1, -1),
            )(
                ctx,
                undefined,
                0, 1
            );
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql(_.range(8));
            expect(ctx).to.eql(_.range(3));

            arr = [], ctx = [];
            rets = await Pipeline(
                MidWare(arr, [2, 3], [6, 7], 0, 2),
                RetWare(arr, [4, 5], 1),
            )(
                ctx,
                MidWare(arr, [-1, -1], [-1, -1], -1, -1),
                0, 1
            );
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql(_.range(8));
            expect(ctx).to.eql(_.range(3));
        });

        it('Should work with pipeline.use()', async () => {
            let arr, ctx, rets;

            arr = [], ctx = [];
            rets = await Pipeline()
                .use(MidWare(arr, [2, 3], [12, 13], 0, 5))
                .use(MidWare(arr, [4, 5], [10, 11], 1, 4))
                .use(EndWare(arr, [6, 7], [8, 9], 2, 3))
                (
                    ctx,
                    undefined,
                    0, 1
                );
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql(_.range(14));
            expect(ctx).to.eql(_.range(6));

            arr = [], ctx = [];
            rets = await Pipeline()
                .use(MidWare(arr, [2, 3], [12, 13], 0, 5))
                .use(MidWare(arr, [4, 5], [10, 11], 1, 4))
                (
                    ctx,
                    EndWare(arr, [6, 7], [8, 9], 2, 3),
                    0, 1
                );
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql(_.range(14));
            expect(ctx).to.eql(_.range(6));
        });

        describe('Error capture', () => {

            it('Throw error before next() in middleware', done => {
                const arr = [], ctx = [];
                const app = Pipeline(
                    MidWare(arr, [2, 3], [-1, -1], 0, -1),
                    MidWare(arr, [4, 5], [-1, -1], 1, -1),
                    MidWareErrBeforeNext(arr, 2),
                    MidWare(arr, [-1, -1], [-1, -1], -1, -1),
                );
                app(
                    ctx,
                    MidWare(arr, [-1, -1], [-1, -1], -1, -1),
                    0, 1
                )
                    .then(() => done(new Error(msgWrong)))
                    .catch(err => {
                        try {
                            expect(err.message).to.equal(msgRight);
                            expect(arr).to.eql(_.range(6));
                            expect(ctx).to.eql(_.range(3));
                            done();
                        } catch (e) {
                            console.log(e);
                            done(e);
                        }
                    });
            });

            it('Throw error before next() in next()', done => {
                const arr = [], ctx = [];
                const app = Pipeline(
                    MidWare(arr, [2, 3], [-1, -1], 0, -1),
                    MidWare(arr, [4, 5], [-1, -1], 1, -1),
                );
                app(
                    ctx,
                    MidWareErrBeforeNext(arr, 2),
                    0, 1
                )
                    .then(() => done(new Error(msgWrong)))
                    .catch(err => {
                        try {
                            expect(err.message).to.equal(msgRight);
                            expect(arr).to.eql(_.range(6));
                            expect(ctx).to.eql(_.range(3));
                            done();
                        } catch (e) {
                            console.log(e);
                            done(e);
                        }
                    });
            });

            it('Throw error after next() in middleware', done => {
                const arr = [], ctx = [];
                const app = Pipeline(
                    MidWare(arr, [2, 3], [-1, -1], 0, -1),
                    MidWare(arr, [4, 5], [-1, -1], 1, -1),
                    MidWareErrAfterNext(arr, [6, 7], 2, 7),
                    MidWare(arr, [8, 9], [14, 15], 3, 6),
                );
                app(
                    ctx,
                    EndWare(arr, [10, 11], [12, 13], 4, 5),
                    0, 1
                )
                    .then(() => done(new Error(msgWrong)))
                    .catch(err => {
                        try {
                            expect(err.message).to.equal(msgRight);
                            expect(arr).to.eql(_.range(16));
                            expect(ctx).to.eql(_.range(8));
                            done();
                        } catch (e) {
                            console.log(e);
                            done(e);
                        }
                    });
            });

            it('Throw error after next() in next()', done => {
                const arr = [], ctx = [];
                const app = Pipeline(
                    MidWare(arr, [2, 3], [-1, -1], 0, -1),
                    MidWare(arr, [4, 5], [-1, -1], 1, -1),
                );
                app(
                    ctx,
                    EndWareErrAfterNext(arr, [6, 7], 2, 3),
                    0, 1
                )
                    .then(() => done(new Error(msgWrong)))
                    .catch(err => {
                        try {
                            expect(err.message).to.equal(msgRight);
                            expect(arr).to.eql(_.range(8));
                            expect(ctx).to.eql(_.range(4));
                            done();
                        } catch (e) {
                            console.log(e);
                            done(e);
                        }
                    });
            });

            it('Call next() multiple times in middleware', done => {
                const arr = [], ctx = [];
                const app = Pipeline(
                    MidWare(arr, [2, 3], [-1, -1], 0, -1),
                    MidWare(arr, [4, 5], [-1, -1], 1, -1),
                    MidWareErrMultiNext(arr, [6, 7], 2, 7),
                    MidWare(arr, [8, 9], [14, 15], 3, 6),
                );
                app(
                    ctx,
                    EndWare(arr, [10, 11], [12, 13], 4, 5),
                    0, 1
                )
                    .then(() => done(new Error(msgWrong)))
                    .catch(err => {
                        try {
                            expect(err.message).to.equal('next() is called multiple times!');
                            expect(arr).to.eql(_.range(16));
                            expect(ctx).to.eql(_.range(8));
                            done();
                        } catch (e) {
                            console.log(e);
                            done(e);
                        }
                    });
            });

            it('Call next() multiple times in next()', done => {
                const arr = [], ctx = [];
                const app = Pipeline(
                    MidWare(arr, [2, 3], [-1, -1], 0, -1),
                    MidWare(arr, [4, 5], [-1, -1], 1, -1),
                );
                app(
                    ctx,
                    EndWareErrMultiNext(arr, [6, 7], 2, 3),
                    0, 1
                )
                    .then(() => done(new Error(msgWrong)))
                    .catch(err => {
                        try {
                            expect(err.message).to.equal('next() is called multiple times!');
                            expect(arr).to.eql(_.range(8));
                            expect(ctx).to.eql(_.range(4));
                            done();
                        } catch (e) {
                            console.log(e);
                            done(e);
                        }
                    });
            });
        });
    });

    describe('Nested useage', () => {

        it('Should work with empty middleware', async () => {
            let arr, ctx, rets;

            await Pipeline(
                Pipeline(),
                Pipeline(),
            )();

            await Pipeline(
                Pipeline(),
                Pipeline(),
            )(
                Pipeline(),
            );

            arr = [], ctx = [];
            rets = await Pipeline(
                Pipeline(),
                Pipeline(),
            )(
                ctx,
                EndWare(arr, [0, 1], [2, 3], 0, 1),
            );
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql(_.range(4));
            expect(ctx).to.eql(_.range(2));

            arr = [], ctx = [];
            rets = await Pipeline(
                Pipeline(),
                Pipeline(),
            )(
                ctx,
                EndWare(arr, [2, 3], [4, 5], 0, 1),
                0, 1
            );
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql(_.range(6));
            expect(ctx).to.eql(_.range(2));
        });

        it('Should call middlewares sequentially', async () => {
            let arr, ctx, rets;

            arr = [], ctx = [];
            rets = await Pipeline(
                MidWare(arr, [2, 3], [36, 37], 0, 17),
                Pipeline(
                    MidWare(arr, [4, 5], [34, 35], 1, 16),
                    MidWare(arr, [6, 7], [32, 33], 2, 15),
                ),
                MidWare(arr, [8, 9], [30, 31], 3, 14),
                Pipeline(
                    MidWare(arr, [10, 11], [28, 29], 4, 13),
                    MidWare(arr, [12, 13], [26, 27], 5, 12),
                ),
                MidWare(arr, [14, 15], [24, 25], 6, 11),
            )(
                ctx,
                Pipeline(
                    MidWare(arr, [16, 17], [22, 23], 7, 10),
                    EndWare(arr, [18, 19], [20, 21], 8, 9)
                ),
                0, 1
            );
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql(_.range(38));
            expect(ctx).to.eql(_.range(18));
        });

        it('Should return early when not call next()', async () => {
            let arr, ctx, rets;

            arr = [], ctx = [];
            rets = await Pipeline(
                MidWare(arr, [2, 3], [14, 15], 0, 6),
                Pipeline(
                    MidWare(arr, [4, 5], [12, 13], 1, 5),
                    Pipeline(
                        MidWare(arr, [6, 7], [10, 11], 2, 4),
                        RetWare(arr, [8, 9], 3),
                        MidWare(arr, [-1, -1], [-1, -1], -1, -1),
                    ),
                    MidWare(arr, [-1, -1], [-1, -1], -1, -1),
                ),
                MidWare(arr, [-1, -1], [-1, -1], -1, -1),
            )(
                ctx,
                MidWare(arr, [-1, -1], [-1, -1], -1, -1),
                0, 1
            )
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql(_.range(16));
            expect(ctx).to.eql(_.range(7));

            arr = [], ctx = [];
            rets = await Pipeline(
                MidWare(arr, [2, 3], [30, 31], 0, 14),
                Pipeline(
                    MidWare(arr, [4, 5], [28, 29], 1, 13),
                    Pipeline(
                        MidWare(arr, [6, 7], [26, 27], 2, 12),
                        MidWare(arr, [8, 9], [24, 25], 3, 11),
                    ),
                    MidWare(arr, [10, 11], [22, 23], 4, 10),
                ),
                MidWare(arr, [12, 13], [20, 21], 5, 9),
            )(
                ctx,
                Pipeline(
                    MidWare(arr, [14, 15], [18, 19], 6, 8),
                    RetWare(arr, [16, 17], 7),
                    MidWare(arr, [-1, -1], [-1, -1], -1, -1),
                ),
                0, 1
            )
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql(_.range(32));
            expect(ctx).to.eql(_.range(15));
        });

        it('Should work with pipeline.use()', async () => {
            let arr = [], ctx = [], rets;

            rets = await Pipeline()
                .use(MidWare(arr, [2, 3], [36, 37], 0, 17))
                .use(
                    Pipeline()
                        .use(MidWare(arr, [4, 5], [34, 35], 1, 16))
                        .use(MidWare(arr, [6, 7], [32, 33], 2, 15))
                )
                .use(MidWare(arr, [8, 9], [30, 31], 3, 14))
                .use(
                    Pipeline()
                        .use(MidWare(arr, [10, 11], [28, 29], 4, 13))
                        .use(MidWare(arr, [12, 13], [26, 27], 5, 12))
                )
                .use(MidWare(arr, [14, 15], [24, 25], 6, 11))
                (
                    ctx,
                    Pipeline()
                        .use(MidWare(arr, [16, 17], [22, 23], 7, 10))
                        .use(EndWare(arr, [18, 19], [20, 21], 8, 9)),
                    0, 1
                )
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql(_.range(38));
            expect(ctx).to.eql(_.range(18));
        });

        describe('Error capture', () => {

            it('Throw error before next() in middleware', done => {
                const arr = [], ctx = [];
                const app = Pipeline(
                    MidWare(arr, [2, 3], [-1, -1], 0, -1),
                    Pipeline(
                        MidWare(arr, [4, 5], [-1, -1], 1, -1),
                        MidWareErrBeforeNext(arr, 2),
                        MidWare(arr, [-1, -1], [-1, -1], -1, -1),
                    ),
                    MidWare(arr, [-1, -1], [-1, -1], -1, -1),
                );
                app(
                    ctx,
                    Pipeline(
                        MidWare(arr, [-1, -1], [-1, -1], -1, -1),
                        MidWare(arr, [-1, -1], [-1, -1], -1, -1),
                    ),
                    0, 1
                )
                    .then(() => done(new Error(msgWrong)))
                    .catch(err => {
                        try {
                            expect(err.message).to.equal(msgRight);
                            expect(arr).to.eql(_.range(6));
                            expect(ctx).to.eql(_.range(3));
                            done();
                        } catch (e) {
                            console.log(e);
                            done(e);
                        }
                    });
            });

            it('Throw error before next() in next()', done => {
                const arr = [], ctx = [];
                const app = Pipeline(
                    MidWare(arr, [2, 3], [-1, -1], 0, -1),
                    Pipeline(
                        MidWare(arr, [4, 5], [-1, -1], 1, -1),
                        MidWare(arr, [6, 7], [-1, -1], 2, -1),
                    ),
                    MidWare(arr, [8, 9], [-1, -1], 3, -1),
                );
                app(
                    ctx,
                    Pipeline(
                        MidWare(arr, [10, 11], [-1, -1], 4, -1),
                        MidWareErrBeforeNext(arr, 5),
                        MidWare(arr, [-1, -1], [-1, -1], -1, -1),
                    ),
                    0, 1
                )
                    .then(() => done(new Error(msgWrong)))
                    .catch(err => {
                        try {
                            expect(err.message).to.equal(msgRight);
                            expect(arr).to.eql(_.range(12));
                            expect(ctx).to.eql(_.range(6));
                            done();
                        } catch (e) {
                            console.log(e);
                            done(e);
                        }
                    });
            });

            it('Throw error after next() in middleware', done => {
                const arr = [], ctx = [];
                const app = Pipeline(
                    MidWare(arr, [2, 3], [-1, -1], 0, -1),
                    Pipeline(
                        MidWare(arr, [4, 5], [-1, -1], 1, -1),
                        MidWareErrAfterNext(arr, [6, 7], 2, 11),
                        MidWare(arr, [8, 9], [22, 23], 3, 10),
                    ),
                    MidWare(arr, [10, 11], [20, 21], 4, 9),
                );
                app(
                    ctx,
                    Pipeline(
                        MidWare(arr, [12, 13], [18, 19], 5, 8),
                        EndWare(arr, [14, 15], [16, 17], 6, 7),
                    ),
                    0, 1
                )
                    .then(() => done(new Error(msgWrong)))
                    .catch(err => {
                        try {
                            expect(err.message).to.equal(msgRight);
                            expect(arr).to.eql(_.range(24));
                            expect(ctx).to.eql(_.range(12));
                            done();
                        } catch (e) {
                            console.log(e);
                            done(e);
                        }
                    });
            });

            it('Throw error after next() in next()', done => {
                const arr = [], ctx = [];
                const app = Pipeline(
                    MidWare(arr, [2, 3], [-1, -1], 0, -1),
                    Pipeline(
                        MidWare(arr, [4, 5], [-1, -1], 1, -1),
                        MidWare(arr, [6, 7], [-1, -1], 2, -1),
                    ),
                    MidWare(arr, [8, 9], [-1, -1], 3, -1),
                );
                app(
                    ctx,
                    Pipeline(
                        MidWare(arr, [10, 11], [-1, -1], 4, -1),
                        MidWareErrAfterNext(arr, [12, 13], 5, 8),
                        EndWare(arr, [14, 15], [16, 17], 6, 7),
                    ),
                    0, 1
                )
                    .then(() => done(new Error(msgWrong)))
                    .catch(err => {
                        try {
                            expect(err.message).to.equal(msgRight);
                            expect(arr).to.eql(_.range(18));
                            expect(ctx).to.eql(_.range(9));
                            done();
                        } catch (e) {
                            console.log(e);
                            done(e);
                        }
                    });
            });

            it('Call next() multiple times in middleware', done => {
                const arr = [], ctx = [];
                const app = Pipeline(
                    MidWare(arr, [2, 3], [-1, -1], 0, -1),
                    Pipeline(
                        MidWare(arr, [4, 5], [-1, -1], 1, -1),
                        MidWareErrMultiNext(arr, [6, 7], 2, 11),
                        MidWare(arr, [8, 9], [22, 23], 3, 10),
                    ),
                    MidWare(arr, [10, 11], [20, 21], 4, 9),
                );
                app(
                    ctx,
                    Pipeline(
                        MidWare(arr, [12, 13], [18, 19], 5, 8),
                        EndWare(arr, [14, 15], [16, 17], 6, 7),
                    ),
                    0, 1
                )
                    .then(() => done(new Error(msgWrong)))
                    .catch(err => {
                        try {
                            expect(err.message).to.equal('next() is called multiple times!');
                            expect(arr).to.eql(_.range(24));
                            expect(ctx).to.eql(_.range(12));
                            done();
                        } catch (e) {
                            console.log(e);
                            done(e);
                        }
                    });
            });

            it('Call next() multiple times in next()', done => {
                const arr = [], ctx = [];
                const app = Pipeline(
                    MidWare(arr, [2, 3], [-1, -1], 0, -1),
                    Pipeline(
                        MidWare(arr, [4, 5], [-1, -1], 1, -1),
                        MidWare(arr, [6, 7], [-1, -1], 2, -1),
                    ),
                    MidWare(arr, [8, 9], [-1, -1], 3, -1),
                );
                app(
                    ctx,
                    Pipeline(
                        MidWare(arr, [10, 11], [-1, -1], 4, -1),
                        MidWareErrMultiNext(arr, [12, 13], 5, 8),
                        EndWare(arr, [14, 15], [16, 17], 6, 7),
                    ),
                    0, 1
                )
                    .then(() => done(new Error(msgWrong)))
                    .catch(err => {
                        try {
                            expect(err.message).to.equal('next() is called multiple times!');
                            expect(arr).to.eql(_.range(18));
                            expect(ctx).to.eql(_.range(9));
                            done();
                        } catch (e) {
                            console.log(e);
                            done(e);
                        }
                    });
            });
        });
    });
});
