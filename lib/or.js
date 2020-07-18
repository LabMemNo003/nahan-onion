'use strict';

function Or(
    condition_1 = async (ctx, next) => await next(false),
    condition_2 = async (ctx, next) => await next(false),
) {

    async function or(ctx, next, ...args) {

        let cond_1, cond_2, ret_false;

        async function sel_1(c, ...a) {
            cond_1 = c;
            if (c)
                return await next(true, ...a);
            else
                ret_false = await condition_2(ctx, sel_2, ...args);
        }

        async function sel_2(c, ...a) {
            cond_2 = c;
            if (c)
                return await next(true, ...a);
            else
                ret_false = await next(false, ...args);
        }

        const ret_true = await condition_1(ctx, sel_1, ...args);

        return cond_1 || cond_2 ? ret_true : ret_false;
    }

    or.cond = function (cond_1, cond_2) {
        condition_1 = cond_1;
        condition_2 = cond_2;
        return this;
    }

    return or;
}

module.exports = Or;
