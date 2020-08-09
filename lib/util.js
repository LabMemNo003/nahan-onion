'use strict';

// function getExtCtx(ctx) {
//     if (ctx && ctx._extCtx) {
//         Object.assign(ctx, ctx._extCtx);
//         delete ctx._extCtx;
//     }
//     return ctx;
// }

function getNewCtx(ctx) {
    if (ctx && ctx._nh_new) {
        const newCtx = ctx._nh_new;
        if (ctx.nh) newCtx.nh = ctx.nh;
        if (ctx._nh) newCtx._nh = ctx._nh;
        delete ctx._nh_new;
        return newCtx;
    }
    return ctx;
}

module.exports = {
    // getExtCtx,
    getNewCtx,
};
