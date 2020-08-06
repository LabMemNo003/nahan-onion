'use strict';

function Pipeline(...middleware) {

    function pipeline(ctx, next, ...args) {

        let last = -1;
        const length = middleware.length;

        function ite(i, ...a) {

            if (last >= i)
                throw new Error('next() is called multiple times!');
            last = i;

            if (middleware[i] !== undefined)
                return middleware[i](ctx, ite.bind(null, i + 1), ...a);
            else if (i !== length || next === undefined)
                return Promise.resolve();
            else if (next.length === 0)
                // When Pipeline is used in a Pipeline, it has a specific next():
                //     function ite(i, ...a) { ... }
                //     next = ite.bind(null, i + 1);
                // The next() function has zero parameter!
                return next(...a);
            else
                return next(ctx, ite.bind(null, i + 1), ...a);
        }

        return ite(0, ...args);
    }

    pipeline.use = function (mw) {
        middleware.push(mw);
        return this;
    }

    return pipeline;
}

module.exports = Pipeline;
