'use strict';

function Branch(condition, middleware) {

    async function branch(ctx, next, ...args) {

        let cond = false;
        function sel(...a) {
            cond = true;
            if (middleware)
                return middleware(ctx, () => { }, ...a);
        }

        let ret_true;
        if (condition)
            ret_true = await condition(ctx, sel, ...args);
        if (cond === true)
            return ret_true;

        if (next === undefined)
            return;
        if (next.length === 0)
            // When Branch is used in a Pipeline, it has a specific next():
            //     function ite(i, ...a) { ... }
            //     next = ite.bind(null, i + 1);
            // The next() function has zero parameter!
            return next(...args);
        return next(ctx, () => { }, ...args);
    }

    return branch;
}

module.exports = Branch;
