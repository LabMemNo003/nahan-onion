# nahan-onion

Middleware framework based on async/await and onion model

[![Build Status][travis-ci-image]][travis-ci-url]
[![Coverage Status][coveralls-image]][coveralls-url]

[travis-ci-image]: https://travis-ci.org/nahanjs/nahan-onion.svg?branch=master
[travis-ci-url]: https://travis-ci.org/nahanjs/nahan-onion
[coveralls-image]: https://coveralls.io/repos/github/nahanjs/nahan-onion/badge.svg?branch=master
[coveralls-url]: https://coveralls.io/github/nahanjs/nahan-onion?branch=master

# API

+ Pipeline(...middlewares)
+ Branch(condition, middleware)
