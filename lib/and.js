'use strict';

function And(
    condition_first = async (ctx, next) => await next(false),
    condition_second = async (ctx, next) => await next(false),
) {

    async function and(ctx, next, ...args) {

        next = next || (() => { });

        let cond1, cond2, ret_false;
        async function sel1(c, ...a) {
            cond1 = c;
            if (c)
                return await condition_second(ctx, sel2, ...a);
            else
                ret_false = await next(false, ...args);
        }

        async function sel2(c, ...a) {
            cond2 = c;
            if (c)
                return await next(true, ...a);
            else
                ret_false = await next(false, ...args);
        }

        const ret_true = await condition_first(ctx, sel1, ...args);

        return cond1 && cond2 ? ret_true : ret_false;
    }

    and.cond1 = function (cond1) {
        condition_first = cond1;
        return this;
    }

    and.cond2 = function (cond2) {
        condition_second = cond2;
        return this;
    }

    return and;
}

module.exports = And;
