# tinyjs-plugin-easy-animation

> a easy way to use tiny tween animation

## 引用方法

- 推荐作为依赖使用

  - `npm install tinyjs-plugin-easy-animation --save`

- 也可以直接引用线上cdn地址，注意要使用最新的版本号，例如：

  - https://gw.alipayobjects.com/os/lib/tinyjs-plugin-easy-animation/{version}/index.min.js
  - https://gw.alipayobjects.com/os/lib/tinyjs-plugin-easy-animation/{version}/index.debug.js

## 起步
首先当然是要引入，推荐`NPM`方式，当然你也可以使用`CDN`或下载独立版本，先从几个例子入手吧！

引用 Tiny.js 源码
``` html
<script src="https://gw.alipayobjects.com/os/lib/tinyjs/tiny/1.4.0/tiny.js"></script>
```
``` js
require('tinyjs-plugin-easy-animation');
// 或者
// import 'tinyjs-plugin-easy-animation';
```
1、最简单的例子
```js
  // 新建 App
  var app = new Tiny.Application({
    width: 320,
    height: 320,
    fixSize: true,
  });

  var container = new Tiny.Container();
  app.run(container);

  var sprite = Tiny.Sprite.fromImage('https://gw.alipayobjects.com/as/g/tiny/resources/1.0.0/images/logo.png');
  container.addChild(sprite);
  sprite.setAnchor(0.5, 0.5);
  sprite.setPosition(Tiny.WIN_SIZE.width / 2, Tiny.WIN_SIZE.height / 2);
  sprite.plugins[ 'easyAnimation' ].setAnimationConfig({
    popup: [
      {
        property: 'scale.x',
        easeFunction: 'Linear.None',
        clips: [
          { startTime: 0, value: 1 },
          { startTime: 1000, value: 0 },
          { startTime: 2000, value: 1 },
        ],
      },
      {
        property: 'scale.y',
        easeFunction: 'Linear.None',
        clips: [
          { startTime: 0, value: 1 },
          { startTime: 1000, value: 0 },
          { startTime: 2000, value: 1 },
        ],
      },
      {
        property: 'alpha',
        easeFunction: 'Linear.None',
        clips: [
          { startTime: 0, value: 1 },
          { startTime: 1000, value: 0 },
          { startTime: 3000, value: 1 },
        ],
      },
    ],
    fadeInOut: [
      {
        property: 'alpha',
        easeFunction: 'Linear.None',
        duration: 3000,
        clips: [
          { percent: '0%', value: 1 },
          { percent: '50%', value: 0 },
          { percent: '100%', value: 1 },
        ],
      },
    ]
  });
  sprite.plugins[ 'easyAnimation' ].play('popup');
  sprite.on('onAnimationClipEnd', (data) => {
    console.log(data);
  });
  sprite.on('onAnimationEnd', (animationName) => {
    if (animationName === 'popup') {
      sprite.plugins[ 'easyAnimation' ].play('fadeInOut');
    }
  });
```
配置文件规范
```js
Object(config)(
  animationName(动画名称): Array {
    // 属性参考：http://tinyjs.net/api/tiny.displayobject.html
    property(动画属性): String,
    // 缓动参考：https://sole.github.io/tween.js/examples/03_graphs.html
    // 未配置则默认使用 Linear.None
    easeFunction(动画缓动): String,
    // clips使用 startTime 模式时，可不填
    duration(动画时长): Number,
    // percent 模式和 startTime 模式 2选1，如同时存在优先使用 startTime。
    // percent 模式必填 duration
    clips(动画片段): Array {
      // 缓动参考：https://sole.github.io/tween.js/examples/03_graphs.html
      // 优先使用动画片段缓动公式，如未配置则默认使用整个动画的缓动公式。
      easeFunction(动画缓动): String,
      // 例如：'30%'
      percent(动画时间线进度百分比): String,
      // （毫秒） 例如：2000
      startTime(动画片段开始时间): Number,
      value(动画属性值): Number
    }
  }
)
var config = {
    popup: [
      {
        property: 'scale.x',
        easeFunction: 'Linear.None',
        clips: [
          { startTime: 0, value: 1 },
          { startTime: 1000, value: 0 },
          { startTime: 2000, value: 1 },
        ],
      },
      {
        property: 'scale.y',
        easeFunction: 'Linear.None',
        clips: [
          { startTime: 0, value: 1 },
          { startTime: 1000, value: 0 },
          { startTime: 2000, value: 1 },
        ],
      },
      {
        property: 'alpha',
        easeFunction: 'Linear.None',
        clips: [
          { startTime: 0, value: 1 },
          { startTime: 1000, value: 0 },
          { startTime: 3000, value: 1 },
        ],
      },
    ],
    fadeInOut: [
      {
        property: 'alpha',
        easeFunction: 'Linear.None',
        duration: 3000,
        clips: [
          { percent: '0%', value: 1 },
          { percent: '50%', value: 0 },
          { percent: '100%', value: 1 },
        ],
      },
    ]
  }
```
方法
```js
    /**
    * @method setAnimationConfig 设置动画配置
    * @for EasyAnimation
    * @param {Object} config 动画描述文件
    */
    EasyAnimation.prototype.setAnimationConfig(config);

    /**
    * @method play 播放动画
    * @param {String} animationName 播放的动画名称（配置文件中定义）
    * @param {Number} playTimes 当前动画播放的次数
    */
    EasyAnimation.prototype.play(animationName, playTimes);

    /**
    * @method stop 停止动画
    */
    EasyAnimation.prototype.stop();

    /**
    * @method clear 清理所有的动画缓存及配置
    */
    EasyAnimation.prototype.clear();
```
事件
```js
// easy-animation 会在动画片段播完和整体动画播完，在对应的 DisplayObject emit 两个事件。

// onAnimationClipEnd 在每个 clips 结束后都会 emit 对应的事件。
DisplayObject.on('onAnimationClipEnd', data => {
  // data 数据是对应的 property 结束的键值对；
  // {scale.x: 0.4}
  console.log(data);
});

// onAnimationEnd 某个动画完整结束后回调，playTimes 多次会等到全部播放完成触发。
DisplayObject.on('onAnimationEnd', animationName => {
  // animationName 对应的是 config 中定义的动画名称
  // popup
  console.log(animationName);
});

```

## 依赖
- `Tiny.js`: [Link](http://tinyjs.net/api)
