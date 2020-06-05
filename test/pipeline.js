'use strict';

const { Pipeline } = require('..');
const expect = require('chai').expect;

function asyncArrayPush(arr, val, ms) {
    return new Promise(resolve => {
        setTimeout(() => {
            arr.push(val);
            resolve();
        }, ms || 1);
    });
}

describe('Pipeline', () => {

    describe('Basic call', () => {

        it('Empty middleware', async () => {
            const app = Pipeline();
            await app();
        });

        it('Sequential execution', async () => {
            const arr = [];
            const app = Pipeline(
                async (ctx, next) => {
                    await asyncArrayPush(arr, 0);
                    await next();
                    await asyncArrayPush(arr, 4);
                },
                async (ctx, next) => {
                    await asyncArrayPush(arr, 1);
                    await next();
                    await asyncArrayPush(arr, 3);
                },
                async (ctx) => {
                    await asyncArrayPush(arr, 2);
                }
            );
            await app();
            expect(arr).to.eql([0, 1, 2, 3, 4]);
        });

        it('Early return', async () => {
            const arr = [];
            const app = Pipeline(
                async (ctx, next) => {
                    await asyncArrayPush(arr, 0);
                    await next();
                    await asyncArrayPush(arr, 3);
                },
                async (ctx, next) => {
                    await asyncArrayPush(arr, 1);
                    // await next();
                    await asyncArrayPush(arr, 2);
                },
                async (ctx) => {
                    await asyncArrayPush(arr, -1);
                }
            );
            await app();
            expect(arr).to.eql([0, 1, 2, 3]);
        });

        it('Pass context', async () => {
            const ctx = [];
            const app = Pipeline(
                async (ctx, next) => {
                    await asyncArrayPush(ctx, 0);
                    await next();
                    await asyncArrayPush(ctx, 2);
                },
                async (ctx) => {
                    await asyncArrayPush(ctx, 1);
                },
            );
            await app(ctx);
            expect(ctx).to.eql([0, 1, 2]);
        });

        it('Pass arguments', async () => {
            const arr = [];
            const app = Pipeline(
                async (ctx, next, ...args) => {
                    for (const a of args) await asyncArrayPush(arr, a);
                    const rets = await next(2, 3);
                    for (const r of rets) await asyncArrayPush(arr, r);
                    return [6, 7];
                },
                async (ctx, next, ...args) => {
                    for (const a of args) await asyncArrayPush(arr, a);
                    return [4, 5];
                }
            );
            const rets = await app(undefined, undefined, 0, 1);
            for (const r of rets) await asyncArrayPush(arr, r);
            expect(arr).to.eql([0, 1, 2, 3, 4, 5, 6, 7]);
        });

        it('Provide "next" parameter', async () => {
            const arr = [];
            const app = Pipeline(
                async (ctx, next) => {
                    await asyncArrayPush(arr, 0);
                    await next();
                    await asyncArrayPush(arr, 3);
                });
            await app(undefined, async (ctx, next) => {
                await asyncArrayPush(arr, 1);
                await next();
                await asyncArrayPush(arr, 2);
            });
            expect(arr).to.eql([0, 1, 2, 3]);
        });

        it('Exception: Before next()', done => {
            const arr = [];
            const app = Pipeline(
                async (ctx, next) => {
                    await asyncArrayPush(arr, 0);
                    await next();
                    await asyncArrayPush(arr, -3);
                },
                async (ctx, next) => {
                    await asyncArrayPush(arr, 1);
                    throw 'Before next()';
                    await next();
                    await asyncArrayPush(arr, -2);
                },
                async (ctx) => {
                    await asyncArrayPush(arr, -1);
                }
            );
            app()
                .then(() => done(new Error('Fail to throw error!')))
                .catch(err => {
                    try {
                        expect(err).to.equal('Before next()');
                        expect(arr).to.eql([0, 1]);
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
        });

        it('Exception: After next()', done => {
            const arr = [];
            const app = Pipeline(
                async (ctx, next) => {
                    await asyncArrayPush(arr, 0);
                    await next();
                    await asyncArrayPush(arr, -2);
                },
                async (ctx, next) => {
                    await asyncArrayPush(arr, 1);
                    await next();
                    throw 'After next()';
                    await asyncArrayPush(arr, -1);
                },
                async (ctx) => {
                    await asyncArrayPush(arr, 2);
                }
            );
            app()
                .then(() => done(new Error('Fail to throw error!')))
                .catch(err => {
                    try {
                        expect(err).to.equal('After next()');
                        expect(arr).to.eql([0, 1, 2]);
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
        });

        it('Exception: multi-call next()', done => {
            const arr = [];
            const app = Pipeline(
                async (ctx, next) => {
                    await asyncArrayPush(arr, 0);
                    await next();
                    await asyncArrayPush(arr, -1);
                },
                async (ctx, next) => {
                    await asyncArrayPush(arr, 1);
                    await next();
                    await asyncArrayPush(arr, 3);
                    await next();
                },
                async (ctx) => {
                    await asyncArrayPush(arr, 2);
                }
            );
            app()
                .then(() => done(new Error('Fail to throw error!')))
                .catch(err => {
                    try {
                        expect(err.message).to.equal('next() is called multiple times!');
                        expect(arr).to.eql([0, 1, 2, 3]);
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
        });

        it('pipeline.use()', async () => {
            const arr = [];
            const app = Pipeline();
            app.use(async (ctx, next) => {
                await asyncArrayPush(arr, 0);
                await next();
                await asyncArrayPush(arr, 4);
            });
            app.use(async (ctx, next) => {
                await asyncArrayPush(arr, 1);
                await next();
                await asyncArrayPush(arr, 3);
            });
            app.use(async (ctx) => {
                await asyncArrayPush(arr, 2);
            });
            await app();
            expect(arr).to.eql([0, 1, 2, 3, 4]);
        });
    });

    describe('Nested call', () => {

        it('Empty middleware', async () => {
            const app =
                Pipeline(
                    Pipeline(),
                    Pipeline()
                );
            await app();
        });

        it('Sequential execution', async () => {
            const arr = [];
            const app =
                Pipeline(
                    async (ctx, next) => {
                        await asyncArrayPush(arr, 0);
                        await next();
                        await asyncArrayPush(arr, 10);
                    },
                    Pipeline(
                        async (ctx, next) => {
                            await asyncArrayPush(arr, 1);
                            await next();
                            await asyncArrayPush(arr, 9);
                        },
                        async (ctx, next) => {
                            await asyncArrayPush(arr, 2);
                            await next();
                            await asyncArrayPush(arr, 8);
                        }
                    ),
                    Pipeline(
                        async (ctx, next) => {
                            await asyncArrayPush(arr, 3);
                            await next();
                            await asyncArrayPush(arr, 7);
                        },
                        async (ctx, next) => {
                            await asyncArrayPush(arr, 4);
                            await next();
                            await asyncArrayPush(arr, 6);
                        }
                    ),
                    async (ctx) => {
                        await asyncArrayPush(arr, 5);
                    }
                );
            await app();
            expect(arr).to.eql([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        });

        it('Early return', async () => {
            const arr = [];
            const app =
                Pipeline(
                    async (ctx, next) => {
                        await asyncArrayPush(arr, 0);
                        await next();
                        await asyncArrayPush(arr, 4);
                    },
                    Pipeline(
                        async (ctx, next) => {
                            await asyncArrayPush(arr, 1);
                            await next();
                            await asyncArrayPush(arr, 3);
                        },
                        Pipeline(
                            async (ctx, next) => {
                                await asyncArrayPush(arr, 2);
                            }
                        ),
                    ),
                    async (ctx) => {
                        await asyncArrayPush(arr, -1);
                    }
                );
            await app();
            expect(arr).to.eql([0, 1, 2, 3, 4]);
        });

        it('Pass context', async () => {
            const ctx = [];
            const app =
                Pipeline(
                    async (ctx, next) => {
                        await asyncArrayPush(ctx, 0);
                        await next();
                        await asyncArrayPush(ctx, 4);
                    },
                    Pipeline(
                        async (ctx, next) => {
                            await asyncArrayPush(ctx, 1);
                            await next();
                            await asyncArrayPush(ctx, 3);
                        },
                        Pipeline(
                            async (ctx, next) => {
                                await asyncArrayPush(ctx, 2);
                            }
                        ),
                    )
                );
            await app(ctx);
            expect(ctx).to.eql([0, 1, 2, 3, 4]);
        });

        it('Pass arguments', async () => {
            const arr = [];
            const app =
                Pipeline(
                    async (ctx, next, arg) => {
                        await asyncArrayPush(arr, arg);
                        const ret = await next(1);
                        await asyncArrayPush(arr, ret);
                        return 5;
                    },
                    Pipeline(
                        async (ctx, next, arg) => {
                            await asyncArrayPush(arr, arg);
                            const ret = await next(2);
                            await asyncArrayPush(arr, ret);
                            return 4;
                        },
                        Pipeline(
                            async (ctx, next, arg) => {
                                await asyncArrayPush(arr, arg);
                                return 3;
                            }
                        ),
                    )
                );
            const ret = await app(undefined, undefined, 0);
            await asyncArrayPush(arr, ret);
            expect(arr).to.eql([0, 1, 2, 3, 4, 5]);
        });

        it('Provide "next" parameter', async () => {
            const arr = [];
            const app =
                Pipeline(
                    async (ctx, next) => {
                        await asyncArrayPush(arr, 0);
                        await next();
                        await asyncArrayPush(arr, 4);
                    },
                    Pipeline(
                        async (ctx, next) => {
                            await asyncArrayPush(arr, 1);
                            await next();
                            await asyncArrayPush(arr, 3);
                        }
                    )
                );
            await app(undefined, async (ctx) => {
                await asyncArrayPush(arr, 2);
            });
            expect(arr).to.eql([0, 1, 2, 3, 4]);
        });

        it('Exception: Before next()', done => {
            const arr = [];
            const app =
                Pipeline(
                    async (ctx, next) => {
                        await asyncArrayPush(arr, 0);
                        await next();
                        await asyncArrayPush(arr, -6);
                    },
                    Pipeline(
                        async (ctx, next) => {
                            await asyncArrayPush(arr, 1);
                            await next();
                            await asyncArrayPush(arr, -5);
                        },
                        async (ctx, next) => {
                            await asyncArrayPush(arr, 2);
                            throw 'Before next()';
                            await next();
                            await asyncArrayPush(arr, -4);
                        },
                        async (ctx, next) => {
                            await asyncArrayPush(arr, -1);
                            await next();
                            await asyncArrayPush(arr, -3);
                        }
                    ),
                    async (ctx) => {
                        await asyncArrayPush(arr, -2);
                    }
                );
            app()
                .then(() => done(new Error('Fail to throw error!')))
                .catch(err => {
                    try {
                        expect(err).to.equal('Before next()');
                        expect(arr).to.eql([0, 1, 2]);
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
        });

        it('Exception: After next()', done => {
            const arr = [];
            const app =
                Pipeline(
                    async (ctx, next) => {
                        await asyncArrayPush(arr, 0);
                        await next();
                        await asyncArrayPush(arr, -3);
                    },
                    Pipeline(
                        async (ctx, next) => {
                            await asyncArrayPush(arr, 1);
                            await next();
                            await asyncArrayPush(arr, -2);
                        },
                        async (ctx, next) => {
                            await asyncArrayPush(arr, 2);
                            await next();
                            throw 'After next()';
                            await asyncArrayPush(arr, -1);
                        },
                        async (ctx, next) => {
                            await asyncArrayPush(arr, 3);
                            await next();
                            await asyncArrayPush(arr, 5);
                        }
                    ),
                    async (ctx) => {
                        await asyncArrayPush(arr, 4);
                    }
                );
            app()
                .then(() => done(new Error('Fail to throw error!')))
                .catch(err => {
                    try {
                        expect(err).to.equal('After next()');
                        expect(arr).to.eql([0, 1, 2, 3, 4, 5]);
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
        });

        it('Exception: multi-call next()', done => {
            const arr = [];
            const app =
                Pipeline(
                    async (ctx, next) => {
                        await asyncArrayPush(arr, 0);
                        await next();
                        await asyncArrayPush(arr, -2);
                    },
                    Pipeline(
                        async (ctx, next) => {
                            await asyncArrayPush(arr, 1);
                            await next();
                            await asyncArrayPush(arr, -1);
                        },
                        async (ctx, next) => {
                            await asyncArrayPush(arr, 2);
                            await next();
                            await asyncArrayPush(arr, 6);
                            await next();
                        },
                        async (ctx, next) => {
                            await asyncArrayPush(arr, 3);
                            await next();
                            await asyncArrayPush(arr, 5);
                        }
                    ),
                    async (ctx) => {
                        await asyncArrayPush(arr, 4);
                    }
                );
            app()
                .then(() => done(new Error('Fail to throw error!')))
                .catch(err => {
                    try {
                        expect(err.message).to.equal('next() is called multiple times!');
                        expect(arr).to.eql([0, 1, 2, 3, 4, 5, 6]);
                        done();
                    } catch (e) {
                        done(e);
                    }
                });
        });

        it('Sequential execution', async () => {
            const arr = [];
            const app = Pipeline();
            const pipe_1 = Pipeline();
            const pipe_2 = Pipeline();
            pipe_1.use(async (ctx, next) => {
                await asyncArrayPush(arr, 1);
                await next();
                await asyncArrayPush(arr, 9);
            });
            pipe_1.use(async (ctx, next) => {
                await asyncArrayPush(arr, 2);
                await next();
                await asyncArrayPush(arr, 8);
            });
            pipe_2.use(async (ctx, next) => {
                await asyncArrayPush(arr, 3);
                await next();
                await asyncArrayPush(arr, 7);
            });
            pipe_2.use(async (ctx, next) => {
                await asyncArrayPush(arr, 4);
                await next();
                await asyncArrayPush(arr, 6);
            });
            app.use(async (ctx, next) => {
                await asyncArrayPush(arr, 0);
                await next();
                await asyncArrayPush(arr, 10);
            });
            app.use(pipe_1);
            app.use(pipe_2);
            app.use(async (ctx) => {
                await asyncArrayPush(arr, 5);
            });
            await app();
            expect(arr).to.eql([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
        });
    });
});