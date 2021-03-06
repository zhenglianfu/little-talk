闭包在js中扮演着重要的角色，有很多js编程技巧都与闭包相关。很多人会熟练的使用闭包，但可能并不清楚闭包到底是个什么东西。所谓知其然而不知其所以然，下面就来看看闭包的所以然。

#### 1、自由变量
首先来铺垫一些小知识
```javascript
// example-1
var x = 1;
function g(y){
     return x + y;
}
```
观察函数g，有一个入参y，但是函数体内还有一个变量x，这个变量x并不是由函数g指定的（既没有像y那样作为形式参数，也没有在函数g中定义 x），这时候我们称变量x为函数g的自由变量。g函数内的变量x指向函数外部。如果运行g函数，得到的结果依赖于函数所处的外部环境，也就是依赖于外部环境中x的值。换句话说，g函数想要找到变量x对应的值，而x的值是外部环境提供的。这里要解释下什么是"环境"，以及它的作用。

#### 2、环境
```javascript
function f(x){
     return x + 1;
}
f(1); // 2
```
这里定义了一个函数f，接受一个参数x，得到x+1之后的值，然后返回。想要通过调用f(1)得到结果，首先要将变量绑定到函数f的参数x上，然后进入函数体内，然后去查询x的值，进行加1运算，返回结果。
上述过程分为两步：  
1、把x绑定到1，这样函数体能够看见这个绑定。  
2、进入 f 的函数体，对 x + 1 求值。  

在第一步和第二步之间，我们该怎么记住x的值呢？通过所谓的“环境”。我们用环境记录变量的值，并且把它们传递到变量的“可见区域”（出了f函数，变量x就不再可见了，无法取到x的值，环环境除了记录变量的值，还要准确的控制变量的可见区域）。变量的可见区域，就叫做 “作用域”（scope）。

我们用一个堆栈（stack）数组`[]`来模拟环境，用(name, value)表示一组变量。
```javascript
var env = []; // 用于模拟环境，现在是空环境
// 下面使用函数立即执行的用法，让函数立即执行，内层函数同样立即执行
(function g() {
     var x = 1; // env = [], 把x绑定到1
     return (function h(){
          var y = 2; // env = [(x, 1)] 绑定y到2
          return (function f(){
               var x = 3; // env = [(y, 2), (x, 1)] 绑定x到3
               return x + y; // env = [(x, 3), (y, 2), (x, 1)] 查找x得到3，查找y得到2
          })();
     })();
})();
```
这段代码返回5。这是因为最内层的绑定把(x, 3)放到了环境的最前面（后绑定变量的追加到环境堆栈的最前面），这样查找x的时候 ，我们首先看到(x, 3)，然后就得到3了。之前的绑定(x, 1)仍然存在，但是我们先看到了最上面的那个(x, 3)，所以它被忽略了。注意这里每一步的绑定都会生成新的环境，而不是去修改原有的环境。

#### 3、动态作用域与词法作用域
下面我们来了解一下不同的“作用域”规则
```javascript
var x = 1;  // env = []
// env = [(x, 1)] 这里多写一点，表明已经绑定完成
function f(y){
     return x + y;
}
function g(){
     var x = 2; // env = [(x, 1)]
     return f(2); // env = [(x, 2), (x, 1)]
}
g(); // 答案应该是多少呢
```
我们的代码里，有两个地方对x进行了绑定，一个等于1，一个等于2，那么x应该指向哪一个绑定呢？按照上一讲当中的变量绑定逻辑似乎可以解决，总是内层的在先。然而当我们调用f(2)的时候，严重的问题来了，f的函数体是return x + y, 我们知道y来自于参数2，可是x的值呢，它应该是1，还是2？

历史上对于这样类似的代码会有两种不同的结果（我不是指javascript），这种区别一直延续到今天。因为它们做出了不同的选择，一种选择了指向1，一种选择了指向2。

选择指向1，得到答案3。这种方式叫做词法作用域(lexical scoping)或者静态作用域(static scoping)
选择指向2，得到答案4。这种方式叫做动态作用域(dynamic scoping)

那么那一种方式更好呢？我们看到不同的方式会带来不同的结果。历史的教训告诉我们dynamic scoping是非常错误的做法，它会带来许许多多莫名其妙的bug，导致dynamic scoping的语言完全几乎完全没法用（现在你所接触到的编程语言几乎都是采用lexical scoping） 。这是为什么呢？
原因在于，像函数g中 var x = 2; 这样的变量绑定，应该只影响它内部“看得见”的 x 值。当我们绑定完var x = 2;之后，剩下的函数体`return f(2)`中，并没有看到任何叫 x 的变量，所以我们“直觉 ”的认为，var x = 2的绑定不应该引起f(2)的变化。

然而对于dynamic scoping，我们的“直觉”却是错误的。因为函数f的函数体里有个x，虽然我们没有在f(2)这个函数调用里面看见它，然而它却存在于f定义的地方。 要知道，f 定义的地方也许隔着几百行代码，甚至在另外一个文件里面。而且调用函数的人凭什么应该知道， f 的定义里面有一个自由变量，它的名字叫做 x？我们想要的模块化的黑盒结构不是被这种规则打破了吗，我们必须十分了解我们所用到的模块，小心翼翼的避免名称冲突，当这模块又引用其他模块的时候，你可以想象，还是重写一遍吧 :P。

相反lexical scoping是符合人们直觉的，也是复杂系统模块化实现的基石。虽然在g函数var x = 2影响下，我们把x绑定到了2，然而 f 的函数体并不是在那里定义的，我们再也没看见任何x，所以 f
的函数体里面的x，仍然指向我们定义它的时候看得见的那个x，也就是最上面的那个var x = 1，它的值是1。所以f(2)的值应该等于3，而不是4。

#### 4、对函数定义的解释
为了实现lexical scoping，我们把函数做成“闭包”(closure)。我把闭包解释为一种特殊的数据结构，用于绑定函数的定义和函数定义时的环境，也就是把函数和函数定义时的环境映射起来。
```
(struct Closure (f, env))
```
关于f，f 应该记录函数名，参数信息和函数体，这样我们能够通过函数名去查询到这个函数是我们想要的。在下面的使用中我将用`#` + 函数名称的方式来代表这种结构，来简化书写
首先说明的是函数同变量一样也是记录在环境中，函数调用首先要查询到这个函数。之前只记录了普通变量，没有将函数考虑进去。
函数定义的时候我们将这样一个打包好的结构放进env中。这个闭包结构记录了我们函数定义的位置“看得见”的那个环境。稍后我们在调用的时候就可以从这个闭包记录的环境里，得到函数体内的自由变量的值。

#### 5、函数的调用
好了，已经到了最后关头了，函数调用。再来看一下上面的例子
```javascript
// 注意这里的env，并不是指真的有env这个变量指向环境，只是将环境统称为env，你可以认为每个env都不相同，每一次绑定的代码都对应一个新的环境
//（这里不涉及对变量的修改，假设所有变量都是通过var声明，变量的再赋值会永久的修改环境，会影响到所有引用到这个环境的相对更大的环境。稍后你可以自己尝试去修改环境中的值，看看应该怎么做）
var x = 1;  // env = []
// env = [(x, 1)] 这里多写一点，表明已经绑定完成
function f(y){
     return x + y;
}
// 将函数f和当前环境打包放进env，关于#f见上一步中的解释
// env = [(Closure (#f, [(x, 1)])), (x, 1)]
function g(){
     var x = 2; // env = [(Closure (#f, [(x, 1)])), (x, 1)]
     return f(2); // env = [(x, 2), (Closure (#f, [(x, 1)])), (x, 1)]
     // 开始查询函数f，并进入函数f，为了方便讲解，直接在下面展开
     // 查询f，遇到Closure结构，就进入查看是名称匹配。结果匹配，得到Closure结构
     // Closure结构拆分，得到函数定义#f和函数定义时的环境env-save = [(x, 1)] (我另起一个env-save，以做区别)
     // 解释函数#f,有参数y,入参为2,y绑定到2，这时候要记录到env-save这个环境中来代替之前的env，env-save = [(y, 2), (x, 1)]
     // 进入函数体，环境这时候是env-save
     return x + y; // env-save = [(y, 2), (x, 1)] 查询x得到1， 查询y得到2。
}
g(); // 3

```
如果我们不使用闭包结构来记录函数定义位置的环境，只使用env的话，你会发现我们实现了dynamic scoping。

#### 6、闭包
最后在说回闭包，为了实现lexical scoping我们多少都要使用到闭包。闭包也存在于其他静态作用域实现的语言中，java，php， python等。但是javascript的闭包比这些语言明显的多，介绍js的书籍里都会提到闭包，但是java，python这些语言书籍却几乎不讲。因为函数在js中是first-class function，能够在任意位置定义函数，并且能够作为值传递（赋值给普通变量，作为参数传递，作为返回值）。闭包的结构用于封装函数和函数定义位置的环境，函数能在任意位置定义，就要能在任意位置构造闭包。

将上面的例子稍微改写一下，改成更常见的例子
```javascript
// env = [];
// 包装进函数作用域内，并返回函数
var f = function(){
     var x = 1;
     return function(y){
          return x + y;
     }
}();
// 注意这个函数，没有包含自由变量
var h = function(y){
     return y + 1;
}
function g(){
     var x = 2;
     f(2);
     h(2);
}
g();
```
第一个函数 f 跟之前的并没有什么区别，只是包装进了函数作用域内。执行过程与上面一致，你可以试试。  
第二个函数 h 和 f 有一些不同，函数 h 内部没有自由变量，只有依赖于传入的参数，这时候还需要构造闭包吗？同学们自己思考吧。
