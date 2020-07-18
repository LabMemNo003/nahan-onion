'use strict';

function And(
    condition_1 = async (ctx, next) => await next(false),
    condition_2 = async (ctx, next) => await next(false),
) {

    async function and(ctx, next, ...args) {

        next = next || (() => { });

        let cond_1, cond_2, ret_false;

        async function sel_1(c, ...a) {
            cond_1 = c;
            if (c)
                return await condition_2(ctx, sel_2.bind(null, a), ...args);
            else
                ret_false = await next(false, ...args);
        }

        async function sel_2(cond_1_paras, c, ...a) {
            for (let i = 0; i < a.length; i++) {
                cond_1_paras.push(a[i]);
            }
            cond_2 = c;
            if (c)
                return await next(true, ...cond_1_paras);
            else
                ret_false = await next(false, ...args);
        }

        const ret_true = await condition_1(ctx, sel_1, ...args);

        return cond_1 && cond_2 ? ret_true : ret_false;
    }

    and.cond_1 = function (cond_1) {
        condition_1 = cond_1;
        return this;
    }

    and.cond_2 = function (cond_2) {
        condition_2 = cond_2;
        return this;
    }

    return and;
}

module.exports = And;
