'use strict';

function Pipeline(...middleware) {

    async function pipeline(ctx, next, ...args) {

        let last = -1;
        const length = middleware.length;

        async function ite(i, ...a) {

            if (last >= i)
                throw new Error('next() is called multiple times!');
            last = i;

            let fn = middleware[i];
            if (i === length) fn = next;
            if (fn === undefined) return;

            return await fn.bind(null, ctx, ite.bind(null, i + 1)).apply(null, a);
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
