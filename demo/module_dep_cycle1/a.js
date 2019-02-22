// a.js
define(['b.js'], function (b) {
    console.log('im a.js, get b return:');
    console.log(b);
  var hi = function () {
    //   console.log('a say hi');
      return 'a say hi'
  };
  return {
      hi: hi
  }
});