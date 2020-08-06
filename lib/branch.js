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
                return await middleware(ctx, () => { }, ...a);
            else if (next.length === 0)
                // When Branch is used in a Pipeline, it has a specific next():
                //     function ite(i, ...a) { ... }
                //     next = ite.bind(null, i + 1);
                // The next() function has zero parameter!
                ret_false = await next(...args);
            else
                // The commented code will expose the returned value from next() to
                // condition function, which should be avoided.
                // return ret_false = await next(ctx, () => { }, ...args);
                ret_false = await next(ctx, () => { }, ...args);
        }

        const ret_true = await condition(ctx, sel, ...args);

        return cond ? ret_true : ret_false;
    }

    branch.cond = function (cond) {
        condition = cond;
        return this;
    }

    branch.mw = function (mw) {
        middleware = mw;
        return this;
    }

    return branch;
}

module.exports = Branch;
