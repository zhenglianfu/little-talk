/**
 * created by fuzhe
 * 2019/11/7
 */
function setPrototypeOf(target, proto) {
  if (Object.setPrototypeOf) {
    return Object.setPrototypeOf(target, proto);
  }
  target.__proto__ = proto;
  return target;
}

function inherit(child, parent) {
  child.prototype = Object.create(parent.prototype);
  child.prototype.constructor = child;
  setPrototypeOf(child, parent);
}

function MyArray() {
  Array.apply(this, arguments);
}

inherit(MyArray, Array);
MyArray.prototype.size = function() {
  return this.length;
};

const myArray = new MyArray();
myArray.push(1);
console.log(myArray.length);
console.log(myArray.size());
