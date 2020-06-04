'use strict';

function Pipeline(...middleware) {

    async function pipeline(ctx, next, ...args) {

        next = next || (() => { });
        const last = middleware.length - 1;

        async function ite(i, ...a) {
            const fn = i < last ? ite.bind(null, i + 1) : next;
            return await middleware[i].bind(null, ctx, fn).apply(null, a);
        }

        return await ite.bind(null, 0).apply(null, args);
    }

    pipeline.use = function (mw) {
        middleware.push(mw);
        return this;
    }

    return pipeline;
}

module.exports = Pipeline;
