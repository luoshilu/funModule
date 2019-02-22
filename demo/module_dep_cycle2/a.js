// a.js
define(['b.js'], function (b) {
  console.log('im a.js, get b return:');
  console.log(b);
  var hi = function () {
      return 'a say hi'
  };
  return {
      hi: hi
  }
});