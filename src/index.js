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
        let firstTween = null;
        let tweenAnimation = configs.reduce((prevItem, curItem, index) => {
          const { property, target, to, easeFunction, duration, delay } = curItem;
          const _updateProperty = property.split('.');
          const _easeFunction = easeFunction.split('.').reduce((prev, cur) => prev[ cur ], Tiny.TWEEN.Easing);
          const tween = new Tiny.TWEEN.Tween(target, this.tweenGroup);
          const initValue = target[ property ];
          this.__cacheDisplayObjectInitPropertyValue(_updateProperty, property, displayObjectInitProperty);
          tween.animationName = animationName;
          tween.to(to, duration);
          tween.easing(_easeFunction);
          tween.delay(delay);
          tween.onUpdate(() => {
            this.__updateDisplayObjectProperty(_updateProperty, target[ property ]);
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
            target[ property ] = initValue;

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

          if (!prevItem) {
            firstTween = tween;
            return tween;
          }

          prevItem.chain(tween);

          if (!configs[ index + 1 ]) {
            return firstTween;
          } else {
            return tween;
          }
        }, null);
        tweenAnimation.tweenCount = tweenCount;

        return tweenAnimation;
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
    if (updatePropertyList.length > 1) {
      this.displayObject[ updatePropertyList[ 0 ] ][ updatePropertyList[ 1 ] ] = value;
      return;
    }

    this.displayObject[ updatePropertyList[ 0 ] ] = value;
  }

  __cacheDisplayObjectInitPropertyValue(_updateProperty, property, map) {
    if (_updateProperty.length > 1) {
      map[ property ] = this.displayObject[ _updateProperty[ 0 ] ][ _updateProperty[ 1 ] ];
    } else {
      map[ property ] = this.displayObject[ _updateProperty[ 0 ] ];
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

          if (this.useRelativePositionValue && (property === 'position.x' || property === 'position.y')) {
            const values = getParentRelativePosValue(this.displayObject, property, targetValue, toValue, index);
            targetValue = values.targetValue;
            toValue = values.toValue;
          }

          const param = {
            property,
            target: {
              [ property ]: targetValue,
            },
            to: {
              [ property ]: toValue,
            },
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
