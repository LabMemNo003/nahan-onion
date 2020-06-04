'use strict';

function Branch(
    condition = async (ctx, next) => await next(false),
    middleware = () => { }
) {

    async function branch(ctx, next, ...args) {

        next = next || (() => { });

        let cond, ret_false;
        async function sel(c, ...a) {
            cond = c;
            if (c)
                return await middleware.bind(null, ctx, () => { }).apply(null, a);
            else
                // The commented code will expose the returned value from next() to
                // condition function, which should be avoided.
                // return ret_false = await next.apply(null, args);
                ret_false = await next.apply(null, args);
        }

        const ret_true = await condition.bind(null, ctx, sel).apply(null, args);

        return cond ? ret_true : ret_false;
    }

    return branch;
}

module.exports = Branch;
