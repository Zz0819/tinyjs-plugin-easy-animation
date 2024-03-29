/**
 * @name        tinyjs-plugin-easy-animation
 * @overview    a easy way to use tiny tween animation
 * @author      zhaizheng.zz
 * @license     MIT
 */

/**
 * Tiny.js
 * @external Tiny
 * @see {@link http://tinyjs.net/}
 */

/**
 * a easy way to use tiny tween animation
 *
 * @class EasyAnimation
 */

import {
  parsePercent,
  isUndefined,
  isObject,
  deepCloneConfig,
  xRequestAnimationFrame,
  xCancelAnimationFrame,
  getParentRelativePosValue,
} from './utils';

const ANIMATION_FILL_MODE = {
  'FORWARDS': 'forwards',
  'BACKWARDS': 'backwards',
};

class EasyAnimation {
  /**
   * @constructor
   * @param {Object<Tiny.DisplayObject>} displayObject Tiny 的显示对象
   */
  constructor(displayObject) {
    this.pluginName = 'easyAnimation';
    this.displayObject = displayObject;
    this.tweenGroup = new Tiny.TWEEN.Group();
    this.tweenAnimationCache = {};
    this.playingAimationCompleteTimes = {};
    this.playingAnimation = '';
    this.playTimes = 1;
    this.chainAnimationCompleteTimes = 0;
    this.playing = false;
    this.useRelativePositionValue = false;
    this.animationFillMode = 'forwards';
  }

  /**
   * @method setAnimationConfig 设置动画配置
   * @for EasyAnimation
   * @param {Object} config 动画描述文件
   * @param {Boolean} useRelativePositionValue 使用相对位置计算位移
   */
  setAnimationConfig(config, useRelativePositionValue) {
    this.displayObject.updateTransform = () => {
      this.tweenGroup.update();
      // eslint-disable-next-line no-useless-call
      this.displayObject.containerUpdateTransform.call(this.displayObject);
    };

    this.useRelativePositionValue = useRelativePositionValue;

    const tweenConfigs = this.__parseAnimationConfig(deepCloneConfig(config));
    this.__createTween(tweenConfigs);
  }

  /**
   * @method play 播放动画
   * @param {String} animationName 播放的动画名称（配置文件中定义）
   * @param {Number}[playTimes=1] playTimes 当前动画播放的次数
   * @param {String}[animationFillMode='forwards'] animationFillMode 类似 css3 animation-fill-mode ，目前支持 forwards 和 backwards。详见 https://developer.mozilla.org/zh-CN/docs/Web/CSS/animation-fill-mode
   */
  play(animationName, playTimes, animationFillMode) {
    const animations = this.tweenAnimationCache[ animationName ];

    if (!animations) {
      throw new Error(`can not find animationName {${animationName}} in your configs.`);
    }

    if (this.playing) {
      return;
    }

    // 新加了参数 animationFillMode ，为了兼容老用法，需要对参数做判断。保证可以不传 playTimes 也可以配置 animationFillMode；
    if (typeof playTimes === 'number') {
      this.playTimes = playTimes || 1;
    }

    if (typeof playTimes === 'string') {
      this.animationFillMode = playTimes;
    }

    if (animationFillMode) {
      this.animationFillMode = animationFillMode;
    }

    this.playingAnimation = animationName;
    this.playing = true;
    this.__playAnimation(animationName);
  }

  /**
   * @method stop 停止动画
   */
  stop() {
    const animations = this.tweenGroup.getAll();
    animations.forEach(animation => {
      animation.stop();
    });
    this.playing = false;
    this.__setAnimationClipCompleteTimes(this.playingAnimation, 0);
    this.playingAnimation = '';
    this.playTimes = 1;
  }

  /**
   * @method clear 清理所有的动画缓存及配置
   */
  clear() {
    this.tweenAnimationCache = {};
    this.tweenGroup.removeAll();
    this.playingAnimation = '';
    this.playingAimationCompleteTimes = {};
    this.playTimes = 1;
    this.playing = false;
  }

  __playAnimation(animationName) {
    const animations = this.tweenAnimationCache[ animationName ];

    if (!animations) return;

    animations.forEach(animation => {
      animation.start();
    });
  }

  __createTween(tweenConfigs) {
    const animationNames = Object.keys(tweenConfigs);

    animationNames.forEach(animationName => {
      const tweenConfig = tweenConfigs[ animationName ];
      const propertyKeys = Object.keys(tweenConfig);
      const displayObjectInitProperty = {};

      this.tweenAnimationCache[ animationName ] = propertyKeys.map(property => {
        const configs = tweenConfig[ property ];
        let tweenCount = 0;
        let headTween;
        configs.reduce((prevItem, curItem) => {
          const { property, target, to, easeFunction, duration, delay } = curItem;
          const _updateProperty = property.split('.');
          const _easeFunction = typeof easeFunction === 'function'
            ? easeFunction
            : easeFunction.split('.').reduce((prev, cur) => prev[ cur ], Tiny.TWEEN.Easing);
          const tween = new Tiny.TWEEN.Tween(target, this.tweenGroup);
          /**
           * 由于 position 属性的相对位置计算的特殊性，以及 tween 的 target 和 to 属性无法嵌套对象，
           * 所以 position 直接使用了 {x: number, y: number} 作为 tween 的参数，
           * 优先取 target[ property ] 取不到说明是开启了相对位移计算的 position ，直接浅拷贝（避免引用类型问题）一份作为初始值。
           */
          const initValue = target[ property ] || { ...target };
          this.__cacheDisplayObjectInitPropertyValue(_updateProperty, property, displayObjectInitProperty);
          tween.animationName = animationName;
          tween.to(to, duration);
          tween.easing(_easeFunction);
          tween.delay(delay);
          tween.onUpdate(() => {
            this.__updateDisplayObjectProperty(
              _updateProperty,
              /**
               * 由于存在相对位置计算，target 值可能是 {x: number, y: number}，也可能是 { [property]: number },
               * 所以判断一下，保证取值正确。
               */
              isUndefined(target[ property ]) ? target : target[ property ]
            );
          });
          tween.onComplete((data) => {
            const playingAnimations = this.tweenAnimationCache[ this.playingAnimation ];

            if (!playingAnimations) {
              return;
            }

            const animationTotalCount = playingAnimations.reduce((prev, cur) => prev + cur.tweenCount, 0);
            const animationPlayCount = animationTotalCount * this.playTimes;

            this.__setAnimationClipCompleteTimes(this.playingAnimation);
            this.displayObject.emit('onAnimationClipEnd', data);

            /**
             * 这里在每个 clip 播放完成后重置回 initValue 时也要做区分。
             */
            if (this.useRelativePositionValue && property === 'position') {
              target.x = initValue.x;
              target.y = initValue.y;
            } else {
              target[ property ] = initValue;
            }

            const clipCompleteTimes = this.__getAnimationClipCompleteTimes(this.playingAnimation);

            if (this.playTimes === Infinity) {
              if (animationTotalCount === clipCompleteTimes) {
                this.__setAnimationClipCompleteTimes(this.playingAnimation, 0);
                // 延迟一下，修复tween状态改变不及时的问题
                const rafId = xRequestAnimationFrame(() => {
                  this.__playAnimation(this.playingAnimation);
                  xCancelAnimationFrame(rafId);
                });
              }
            } else {
              if (clipCompleteTimes % animationTotalCount === 0 && this.playTimes > this.chainAnimationCompleteTimes + 1) {
                this.chainAnimationCompleteTimes++;
                // 延迟一下，修复tween状态改变不及时的问题
                const rafId = xRequestAnimationFrame(() => {
                  this.__playAnimation(this.playingAnimation);
                  xCancelAnimationFrame(rafId);
                });
              }

              if (clipCompleteTimes === animationPlayCount) {
                this.playing = false;
                this.__setAnimationClipCompleteTimes(this.playingAnimation, 0);
                this.playTimes = 1;
                this.chainAnimationCompleteTimes = 0;
                if (this.animationFillMode === ANIMATION_FILL_MODE.BACKWARDS) {
                  Object.keys(displayObjectInitProperty).forEach(key => {
                    const _updateProperty = key.split('.');
                    this.__updateDisplayObjectProperty(_updateProperty, displayObjectInitProperty[ key ]);
                  });
                }
                this.displayObject.emit('onAnimationEnd', this.playingAnimation);
              }
            }
          });
          tweenCount++;

          // 如果是第一次遍历保存 tween 链的头，返回 headTween
          if (!prevItem) {
            headTween = tween;
            return headTween;
          }

          // 每一次将前一个 tween 和 当前的 tween 连接起来
          prevItem.chain(tween);
          return tween;
        }, null);
        headTween.tweenCount = tweenCount;

        return headTween;
      });
    });
  }

  __getAnimationClipCompleteTimes(animationName) {
    return this.playingAimationCompleteTimes[ animationName ];
  }

  __setAnimationClipCompleteTimes(animationName, times) {
    if (!isUndefined(times)) {
      this.playingAimationCompleteTimes[ animationName ] = times;

      return;
    }

    if (this.playingAimationCompleteTimes[ animationName ]) {
      this.playingAimationCompleteTimes[ animationName ]++;
    } else {
      this.playingAimationCompleteTimes[ animationName ] = 1;
    }
  }

  __updateDisplayObjectProperty(updatePropertyList, value) {
    const [ property0, property1 ] = updatePropertyList;

    if (isUndefined(this.displayObject[ property0 ])) {
      console.warn(`DisplayObject no ${property0}`);
      return;
    }

    if (property1) {
      this.displayObject[ property0 ][ property1 ] = value;
      return;
    }

    /**
     * 这里其实应该判断是不是 instanceof observePoint 但是 Tiny 有个奇怪的逻辑所以不敢用。
     * https://code.alipay.com/tiny/tiny/blob/master/src%2Ftiny%2Fcore%2Fdisplay%2FDisplayObject.js#L26
     */
    if (
      isObject(this.displayObject[ property0 ]) &&
      !isUndefined(this.displayObject[ property0 ][ 'x' ]) &&
      !isUndefined(this.displayObject[ property0 ][ 'y' ])
    ) {
      /**
       * 由于因为提供了简写 observePoint 属性的能力，比如原先的 scale.x -> 0.1 scale.y -> 0.1 , 可以简写成 scale -> 0.1。
       * 所以需要同时修改 x 和 y 的属性，并且因为 animation-fill-mode 其实是取的 DisplayObject 的真是属性，会有 observePoint 的实例的情况。
       * 所以需要判断是否是对象，是就取 value.x 否则取 value。
       */
      this.displayObject[ property0 ][ 'x' ] = isObject(value) ? value.x : value;
      this.displayObject[ property0 ][ 'y' ] = isObject(value) ? value.y : value;
    } else {
      this.displayObject[ property0 ] = value;
    }
  }

  __cacheDisplayObjectInitPropertyValue(_updateProperty, property, map) {
    if (!isUndefined(map[ property ])) {
      return;
    }

    if (_updateProperty.length > 1) {
      map[ property ] = this.displayObject[ _updateProperty[ 0 ] ][ _updateProperty[ 1 ] ];
    } else {
      const value = this.displayObject[ _updateProperty[ 0 ] ];
      /**
       * 这里因为 observePoint 的简写的存在，所以需要处理 value 需要判断是简单类型还是对象。
       */
      map[ property ] = isObject(value) ? { x: value.x, y: value.y } : value;
    }

    return map;
  }

  __parseAnimationConfig(config) {
    const animationNames = Object.keys(config);
    let tweenParams = {};
    let tweenConfigs = {};

    animationNames.forEach(animationName => {
      const curAnimationConfig = config[ animationName ];

      curAnimationConfig.forEach(animation => {
        let { property, easeFunction = 'Linear.None', duration, clips } = animation;

        clips.map(item => {
          const { percent } = item;

          if (percent) {
            item.percent = parsePercent(percent);
          }

          if (property === 'rotation') {
            item.value = Tiny.deg2radian(item.value);
          }

          return item;
        }).sort((a, b) => {
          if (!isUndefined(a.startTime) && !isUndefined(b.startTime)) {
            return a.startTime - b.startTime;
          }

          return a.percent - b.percent;
        }).forEach((clip, index) => {
          if (!clips[ index + 1 ]) {
            return;
          }

          let _duration = clips[ index + 1 ].startTime - clip.startTime;
          let targetValue = clip.value;
          let toValue = clips[ index + 1 ].value;

          if (!isUndefined(clip.percent) && !isUndefined(clips[ index + 1 ].percent)) {
            _duration = clips[ index + 1 ].percent * duration - clip.percent * duration;
          }

          // eslint-disable-next-line no-unused-expressions
          if (!_duration) {
            throw new Error('animation clips property startTime or percent is required!');
          }

          /**
           * 需要在 position.x 和 position.y 的基础上增加在 position 简写的支持
           */
          if (this.useRelativePositionValue && /position/.test(property)) {
            const values = getParentRelativePosValue(this.displayObject, property, targetValue, toValue, index);
            targetValue = values.targetValue;
            toValue = values.toValue;
          }

          let target = {
            [ property ]: targetValue,
          };
          let to = {
            [ property ]: toValue,
          };

          /**
           * 如果是相对位移计算，并且是简写属性，需要修改 target 和 to 的数据格式。
           */
          if (property === 'position' && this.useRelativePositionValue) {
            target = {
              ...targetValue,
            };
            to = {
              ...toValue,
            };
          }

          const param = {
            property,
            target,
            to,
            duration: _duration,
            easeFunction: clip.easeFunction || easeFunction,
            delay: clip.delay || 0,
          };

          if (tweenParams[ property ]) {
            tweenParams[ property ].push(param);
          } else {
            tweenParams[ property ] = [ param ];
          }
        });
      });

      tweenConfigs[ animationName ] = tweenParams;
      tweenParams = {};
    });

    return tweenConfigs;
  }
}

Tiny.DisplayObject.registerPlugin('easyAnimation', EasyAnimation);
