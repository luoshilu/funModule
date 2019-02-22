// c.js
define(['a.js'], function () {
    var asay
    var haha = function () {
        return 'c say haha'
    };
    // 再发起一次新的require
    require(['a.js'], function (a) {
        asay = a.hi();
    });
    return {
        haha: haha,
        asay: function() {
            return asay
        }
    }
});