// b.js
define(['c.js'], function () {
    var csay
    var goodbye = function () {
        return 'b say goodbye'
    };
    // 再发起一次新的require
    require(['c.js'], function (c) {
        csay = c.haha();
    });
    return {
        goodbye: goodbye,
        csay: function() {
            return csay
        }
    }
});