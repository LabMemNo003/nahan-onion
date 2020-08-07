'use strict';

function Branch(condition, middleware) {

    function branch(ctx, next, ...args) {

        const nxt = () => {
            if (next === undefined)
                return;
            if (next.length === 0)
                // When Branch is used in a Pipeline, it has a specific next():
                //     function ite(i, ...a) { ... }
                //     next = ite.bind(null, i + 1);
                // The next() function has zero parameter!
                return next(...args);
            return next(ctx, () => { }, ...args);
        };

        let cond = false;
        function sel(...args) {
            cond = true;
            if (middleware)
                return middleware(ctx, () => { }, ...args);
        }

        if (condition)
            return Promise
                .resolve(condition(ctx, sel, ...args))
                .then(val => cond ? val : nxt());

        return nxt();
    }

    return branch;
}

module.exports = Branch;
