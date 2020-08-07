'use strict';

function Pipeline(...middlewares) {

    // Following code is used to be compatible with koa-compose:
    //     1. Use array of middlewares as input parameter (compatible)
    //     2. Throw error if the parameter is empty (incompatible)
    //     3. Throw error if the middlewares aren't functions (compatible)
    // Might be removed in the future
    if (Array.isArray(middlewares[0]))
        middlewares = middlewares[0];
    for (const mv of middlewares)
        if (typeof mv !== 'function')
            throw new TypeError('Middleware must be a function!');

    function pipeline(ctx, next, ...args) {

        let last = -1;
        const length = middlewares.length;

        function ite(i, ...a) {

            if (last >= i)
                throw new Error('next() is called multiple times!');
            last = i;

            // Following code is used to be compatible with koa-compose:
            //     1. Use try-catch to catch the error thrown by middleware
            //     2. Return the result with Promise() to enable .then()
            // Might be restored to original code in the future:
            // {
            //     if (middlewares[i] !== undefined)
            //         return middlewares[i](ctx, ite.bind(null, i + 1), ...a);
            //     if (i !== length || next === undefined)
            //         return Promise.resolve();
            //     if (next.length === 0)
            //         // When Pipeline is used in a Pipeline, it has a specific next():
            //         //     function ite(i, ...a) { ... }
            //         //     next = ite.bind(null, i + 1);
            //         // The next() function has zero parameter!
            //         return next(...a);
            //     return next(ctx, ite.bind(null, i + 1), ...a);
            // }
            try {
                if (middlewares[i] !== undefined)
                    return Promise.resolve(middlewares[i](ctx, ite.bind(null, i + 1), ...a));
                if (i !== length || next === undefined)
                    return Promise.resolve();
                if (next.length === 0)
                    // When Pipeline is used in a Pipeline, it has a specific next():
                    //     function ite(i, ...a) { ... }
                    //     next = ite.bind(null, i + 1);
                    // The next() function has zero parameter!
                    return next(...a);
                return next(ctx, ite.bind(null, i + 1), ...a);
            }
            catch (err) {
                return Promise.reject(err);
            }
        }

        return ite(0, ...args);
    }

    pipeline.use = function (mw) {
        middlewares.push(mw);
        return this;
    }

    return pipeline;
}

module.exports = Pipeline;
