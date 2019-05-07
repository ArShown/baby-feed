var PEE_TEXT = ['淡黃', '深黃', '橘黃', '淡紅', '暗棕', '白色', '帶血'];

var POOP_TEXT = ['黃綠糊軟', '拉稀', '白灰', '帶血', '便秘'];

// Polyfill for rAF
window.requestAnimFrame = (function() {
  return window.requestAnimationFrame ||
    window.webkitRequestAnimationFrame ||
    window.mozRequestAnimationFrame ||
    function(callback) {
      window.setTimeout(callback, 1000 / 60);
    };
})();

// Throttling function
var rafThrottle  = function rafThrottle(fn) { // takes a function as parameter
  var busy = false;
  return function() { // returning function (a closure)
    if (busy) return; // busy? go away!
    busy = true; // hanging "busy" plate on the door
    fn.apply(this, arguments); // calling function
    // using rAF to remove the "busy" plate, when browser is ready
    requestAnimFrame(function() {
      busy = false;
    });
  };
};
