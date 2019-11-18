Redux和Mobx都是状态管理的解决方案，都不局限于React，可以用在其他的UI库上。
那么状态管理有什么需要解决的问题呢？什么又是状态管理呢？

### 前端应用的状态
到目前为止，前端应用的状态大体上可以分为model和view的状态。
以`backbone`为代表的类库提出了在前端使用数据和视图分离的设计方法，努力的将`Model`和`View`分开，这种努力是为了让数据和逻辑从View中剥离出来，或者说不揉合在一起，解耦出来。

**关注点分离**  

View根据某个或多个Model提供的数据来渲染，不关心Model里的逻辑，而Model压根不知道View的存在。Model关注数据是怎么变化的，View只关心UI层如何渲染。

**各自的状态**    

View和Model都有自己的状态，他们的状态我认为并不是同一类状态，但统称为状态state。

Model很简单，作为数据对象，不依赖于View，包含数据和处理数据的业务逻辑，它表示的是数据的状态。

View通常需要依赖一个或多个Model（也有不依赖于Model的纯UI的View），根据这些Model的数据来渲染，View所表示的是UI的状态。虽然UI状态大部分情况下是由数据状态决定的，但是和用户发生交互操作时，UI的状态就和数据的状态存在着差异了（UI的状态领先于Model的状态），这时候就要将状态变化传递给对应的Model。

虽然我将其细分为两种状态，但是这两种状态通常都会集成到一个对象中，这个对象一般叫做Abstraction Presentation Model，包含有UI组件的状态和行为，你可以理解为Virtual DOM对象。

### React的状态传递思路

View通常负责接收用户事件，这些动作可能会影响Model。Model的数据可能会更新（异步获取数据），这些更新要应用到对应的View上去。

目前普遍认为View的状态应该由Model决定，Model没有变化，则View也不变，它是一个纯函数（纯函数的结果由它的参数决定，参数不变，不论运行多少次，结果都不变，我们认为它没有副作用）。
$$
View = F(Model)
$$
View可以去影响Model，但是无法直接修改Model（View也不知道怎么修改Model），在Model更新之前，View不能自己偷偷变化，View始终由Model决定。数据的变化只能在Model中，也只有Model才关心数据是怎么变，View不应该操心。普遍将这种模式称之为<u>单向传递的数据流</u>，View和Model之间的逻辑关系是
$$
Model \longrightarrow View
$$
两者间的数据传导是单向的，总是从Model直接传导到View，Model的变更，总是引起View的变更。而View无法主动变更，总是处于被动地位，需要触发Model上的数据变更，才能获得变更。

### 状态管理

根据上面的公式`View = F(Model)`，View依赖于Model，View将消息传给Model，Model更新之后，又触发当前View的更新，看起来并不复杂。这其中状态管理需要解决两个基本的问题。

- 问题1：

  View中依赖了Model（可能由多个Model共同组成）中的状态，当和用户产生交互时，能准确的将用户消息作用到对应的Model上。

- 问题2：

  是有的Model会被多个View所共享，View和View之间并不是毫无瓜葛，这当中可能存在着重叠的部分，比如好几个组件共享了当前登录者信息。Model上属性的变化要能准确的更新到那些 依赖了这个Model的View上去。

### 状态管理的难点 

问题1很简单，我们已经将逻辑从View中剥离，View只是将用户交互消息传递过来，找到订阅了Model上订阅了用户事件的逻辑处理函数，触发它就可以了。这里需要注意的是View没有依赖Model，Model去订阅了View上的事件，订阅的代码一般都在Model上，因为业务逻辑在Model上，所以通常是Model会有一个指向View的引用（MVP、PM）。

问题2稍微复杂，Model上得到来自于View的事件，这个事件可能会更新Model，Model知道怎么更新数据，但是并不清楚这些变化会影响哪些View。

有两种设想可以规避问题2：

1. 只有一个View时候我更新这个View就ok了，但这显然不怎么科学，你会有一个巨大的View。
2. View和View之间没有共享Model，给View提供状态的Model，不会去影响其他Model（一般也不会，Model之间一般比较独立）。在面对复杂UI程序的时候，这种理想很快就会破灭。

要解决问题2，可以让需要的View去订阅Model上的事件（MVC backbone），这样的话，View需要有Model的引用。Model已经引用了View，View又引用了Model（可能还不止一个，而Model只会引用一个View），这并不符合React单向依赖的设计哲学，View和Model间的双向依赖解决了问题，但是也将一些Model和View紧密耦合在了一起。

React有自己的解决思路，作为一个组件我不知道我的兄弟组件是否和我存在着重叠的状态，但是我的父节点可能知道，一直追溯到Root节点，肯定能够清楚的知道所有的状态关系。React管这个叫状态提升，将被共享的状态往上，放到一个共同的"祖先节点"上，这样一来，依赖这些共享状态的组件，都在同一个祖先节点下方了，祖先节点上Model的更新，就能传递到后代节点上去了。

### Redux的方案

Redux的方案和React本身给出的思路有些类似（毕竟是脱胎于Flux）。Redux将状态统统提升到根节点，用一个Store（Store只有一个实例，将数据和逻辑从Model中提取到了Store里，Model也被淡化）来管理应用的状态。Stroe管理着所有后代组件节点的状态，View上的事件被这个Store订阅。

Redux负责创建这个Store对象，主要有两个方法：

1. 提供subscribe方法来订阅state的变更
2. 提供dispatch方法来让state进行变更

直接变更state上的属性值，无法触发subscribe上的订阅回调，所以要严格使用`dispatch action`来触发变更，这种变更是同步的，产生new state的方法被称为reducer，命名意图是让你每次产生最小的变更，接收上一次的state和dispatch发送来的action这两个参数。

### Mobx的办法

Mobx采用了另一种模式，称之为Model-View-ViewModel（PM）。其实它就是上面讲到的解决问题2的第一种思路，让View去订阅Model，观察Model的变化，可以理解为观察者模式或发布订阅模式（两者很接近，观察者模式是目标和观察者直接交互，订阅发布则存在一个订阅中心，目标和观察者间接交互）。这种做法会造成双向依赖和耦合的问题，想要破除两者间的引用并不容易。2005年微软架构师John Gossman首次介绍了[MVVM](https://blogs.msdn.microsoft.com/johngossman/2005/10/08/introduction-to-modelviewviewmodel-pattern-for-building-wpf-apps/)这种模式，文中提到的做法是采用C#的databinding来让View直接和Model中的绑定，部分属性可以直接View和Model间双向绑定，需要state叠加计算才能得到的属性则通过ViewModel来完成（其实都可以通过ViewModel来完成绑定），文中认为ViewModel是View的抽象表示，包含了Model数据转为View数据的转换过程（那些需要叠加计算确定的UI属性），包含了View和Model之间的交互命令（用户交互事件传给Model）。使用Databanding并加入了视图的抽象表示ViewModel之后，断开了Model和View之间的直接引用，Model也不再需要引用View，而是ViewModel去引用View。ES5开放了Object.defineProperty接口，能够实现类似databanding的功能，以Vue为代表的框架就实现了MVVM模式为基础的框架。

Mobx同样是MVVM模式，通过Object.defineProperty / Proxy来收集要用到的依赖，将View自动和Model/ViewModel绑定。直接修改某个Model上的属性即可触发所有依赖该属性的View。

### 两者的对比

| comparons        | Redux                                                        | Mobx                                                         |
| ---------------- | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Core Principles  | 状态提升，单向数据流控制，只有一个Store实例，通过`action`来触发变更，reducer是`pure function` | MVVM模式，数据双向绑定，不用通过`action`来触发，这一切都是自动的 |
| File Size        | 7KB + 15KB = 22KB                                            | 53KB + 10KB = 63KB                                           |
| Storage Instance | Singleton                                                    | Multiple Instances                                           |
| Debug            | 都是普通函数，相对透明，易于Debug                            | 被自动绑定，并不透明，不利于Debug                            |
| Learning curve   | 普遍认为有些陡峭，函数式编程确实有些反人类，加入了很多的概念，并要求使用者理解它 | 更OOP，比较容易掌握                                          |
| Efficiency       | 效率较低，概念更多，编码更加复杂，更多                       | 在框架内部做更多的事情，不需要写很多代码                     |
| Maintainable     | 虽然需要写更多的代码，但是它只能通过手动`action`来触发变更，约束更强，受控属性都在一个store中，更集中。 | 对比Redux，框架的约束会稍弱，不强制你使用MVVM还是手动触发。可以存在多个实例，可能变得分散。 |
| Scalable         | Redux本身功能很简单，可扩展性强，不改变React组件需要手动触发更新的原生逻辑， | 封装了React的原生逻辑，变成了MVVM模式。React组件开始变得“不像”React。 |
| Async Support    | 需要Enhancer（redux-thunk，redux-saga）的帮助来延迟`dispatch action`，或自行写代码包裹，延迟调用dispatch。 | 支持异步                                                     |
| TypeScript       | 通常需要增加额外的一些声明                                   | 基本不需要额外的声明，根据类的定义和类型推导就能得出类型     |

### 如何选择

// TODO

### 怎样应用

// TODO

### 优化你的状态管理

**Redux** 

待续

**Mobx** 

待续

> [GUI Architectures](https://martinfowler.com/eaaDev/uiArchs.html)
>
> [Presentation Model](https://martinfowler.com/eaaDev/PresentationModel.html)
>
> [Model-View-ViewModel](https://blogs.msdn.microsoft.com/johngossman/2005/10/08/introduction-to-modelviewviewmodel-pattern-for-building-wpf-apps/)
