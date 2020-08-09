'use strict';

// function getExtCtx(ctx) {
//     if (ctx && ctx._extCtx) {
//         Object.assign(ctx, ctx._extCtx);
//         delete ctx._extCtx;
//     }
//     return ctx;
// }

function getNewCtx(ctx) {
    if (ctx && ctx._newCtx) {
        const newCtx = ctx._newCtx;
        if (ctx.nh) newCtx.nh = ctx.nh;
        delete ctx._newCtx;
        return newCtx;
    }
    return ctx;
}

module.exports = {
    // getExtCtx,
    getNewCtx,
};
