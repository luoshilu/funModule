// b.js
define(['a.js'], function () {
    var asay
    var goodbye = function () {
        return 'b say goodbye'
    };
    // 再发起一次新的require
    require(['a.js'], function (a) {
        asay = a.hi();
    });
    return {
        goodbye: goodbye,
        asay: function() {
            return asay
        }
    }
});