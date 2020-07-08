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

import { parsePercent, isUndefined } from './uitls';

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
    this.playingAnimation = '';
  }

  /**
   * @method setAnimationConfig 设置动画配置
   * @for EasyAnimation
   * @param {Object} config 动画描述文件
   */
  setAnimationConfig(config) {
    this.displayObject.updateTransform = () => {
      this.tweenGroup.update();
      // eslint-disable-next-line no-useless-call
      this.displayObject.containerUpdateTransform.call(this.displayObject);
    };
    const tweenConfigs = this.__parseAnimationConfig(config);
    this.__createTween(tweenConfigs);
  }

  /**
   * @method play 播放动画
   * @param {String} animationName 播放的动画名称（配置文件中定义）
   * @param {Number} playTimes 当前动画播放的次数
   */
  play(animationName, playTimes) {
    const animations = this.tweenAnimationCache[ animationName ];
    animations.forEach(animation => {
      animation.repeat(playTimes || 0);
      animation.yoyo(!!playTimes);
      animation.start();
    });
    this.playingAnimation = animationName;
  }

  /**
   * @method stop 暂停动画
   */
  stop() {
    const animations = this.tweenGroup.getAll();
    animations.forEach(animation => {
      animation.stop();
    });
  }

  __createTween(tweenConfigs) {
    const animationNames = Object.keys(tweenConfigs);

    animationNames.forEach(animationName => {
      const tweenConfig = tweenConfigs[ animationName ];
      const propertyKeys = Object.keys(tweenConfig);

      this.tweenAnimationCache[ animationName ] = propertyKeys.map(property => {
        const configs = tweenConfig[ property ];

        return configs.reduce((prevTween, curItem) => {
          const { property, target, to, easeFunction, duration } = curItem;
          const _updateProperty = property.split('.');
          const _easeFunction = easeFunction.split('.').reduce((prev, cur) => prev[ cur ], Tiny.TWEEN.Easing);
          const tween = new Tiny.TWEEN.Tween(target);
          const initValue = target[ property ];
          tween.animationName = animationName;
          tween.to(to, duration);
          tween.easing(_easeFunction);
          tween.onUpdate(() => {
            if (_updateProperty.length > 1) {
              this.displayObject[ _updateProperty[ 0 ] ][ _updateProperty[ 1 ] ] = target[ property ];
              return;
            }

            this.displayObject[ _updateProperty[ 0 ] ] = target[ property ];
          });
          tween.onComplete((data) => {
            this.displayObject.emit('onAnimationClipEnd', data);
            // 异步一下，保证 tweenGroup 数据正确
            setTimeout(() => {
              const tweenLeft = this.tweenGroup.getAll();
              if (!tweenLeft.filter(tween => tween.animationName === this.playingAnimation).length) {
                this.displayObject.emit('onAnimationEnd', this.playingAnimation);
                target[ property ] = initValue;
              }
            }, 0);
          });
          this.tweenGroup.add(tween);

          if (!prevTween) {
            return tween;
          }

          return prevTween.chain(tween);
        }, null);
      });
    });
  }

  __parseAnimationConfig(config) {
    const animationNames = Object.keys(config);
    let tweenParams = {};
    let tweenConfigs = {};

    animationNames.forEach(animationName => {
      const curAnimationConfig = config[ animationName ];
      curAnimationConfig.forEach(animation => {
        let { property, easeFunction, duration, clips } = animation;

        clips.map(item => {
          const { percent } = item;
          if (percent) {
            item.percent = parsePercent(percent);
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

          if (!isUndefined(clip.percent) && !isUndefined(clips[ index + 1 ].percent)) {
            _duration = clips[ index + 1 ].percent * duration - clip.percent * duration;
          }

          // eslint-disable-next-line no-unused-expressions
          if (!_duration) {
            throw new Error('animation clips property startTime or percent is required!');
          }

          const param = {
            property,
            target: {
              [ property ]: clip.value,
            },
            to: {
              [ property ]: clips[ index + 1 ].value,
            },
            duration: _duration,
            easeFunction,
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

(() => {
  let globalTiny;

  try {
    globalTiny = $global.Tiny;
  } catch (e) {
    globalTiny = window.Tiny;
  }

  if (!globalTiny) {
    throw new Error('Tiny is required');
  }

  globalTiny.DisplayObject.registerPlugin('easyAnimation', EasyAnimation);
})();
