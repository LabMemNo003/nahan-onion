'use strict';

function Circuit(condition, middleware) {

    function circuit(ctx, next, ...args) {

        const nxt = () => {
            if (next === undefined)
                return () => { };
            if (next.length === 0)
                return next.bind(null);
            return next.bind(null, ctx, () => { });
        };

        let cond = false;
        function sel(...args) {
            cond = true;
            if (middleware)
                return middleware(ctx, nxt(), ...args);
            return nxt()(...args);
        }

        if (condition)
            return Promise
                .resolve(condition(ctx, sel, ...args))
                .then(val => cond ? val : nxt()(...args));

        return nxt()(...args);
    }

    return circuit;
}

module.exports = Circuit;
