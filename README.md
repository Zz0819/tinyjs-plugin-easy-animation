# tinyjs-plugin-easy-animation

> a easy way to use tiny tween animation

## 查看demo

http://tinyjs.net/plugins/tinyjs-plugin-easy-animation.html#demo

## 引用方法

- 推荐作为依赖使用

  - `npm install tinyjs-plugin-easy-animation --save`

- 也可以直接引用线上cdn地址，注意要使用最新的版本号，例如：

  - https://gw.alipayobjects.com/os/lib/tinyjs-plugin-easy-animation/0.0.1/index.min.js
  - https://gw.alipayobjects.com/os/lib/tinyjs-plugin-easy-animation/0.0.1/index.debug.js

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
    easeFunction(动画缓动): String,
    // clips使用 startTime 模式时，可不填
    duration(动画时长): Number,
    // percent 模式和 startTime 模式 2选1，如同时存在优先使用 startTime。
    // percent 模式必填 duration
    clips(动画片段): Array {
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

## 依赖
- `Tiny.js`: [Link](http://tinyjs.net/api)

## API文档

http://tinyjs.net/plugins/tinyjs-plugin-easy-animation.html#docs
