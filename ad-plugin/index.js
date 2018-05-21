import Vue from 'vue';
import AdConfig from './AdConfig';
import AdService from './AdService';
import PLACEMENTS from './placements';

const vueConfig = {
  adPlacements: [],
  lazyAds: []
};
// let tpl = null;
vueConfig.install = function (Vue, options) {
  Vue.mixin({
    data() {
      return {
        userAgent: {},
        adPlacements: [],
        lazyAds: [],
        defaultCfg: {},
        vnodeType: {
          page: false,
          component: false
        }
      };
    },
    beforeMount() {
      if (this.$options.name === 'ad-placement') {
        this.$on('placementcreated', function(placement) {
          if (placement.hasOwnProperty('lazyLoad')) {
            vueConfig.lazyAds.push(placement);
          } else {
            vueConfig.adPlacements.push(placement);
          }
        });
      }
      if (this.$options.layout === undefined) {
        if (Object.keys(this.$options.components).indexOf('ad-placement') > -1 && this.$options.name !== 'ad-placement' && Object.keys(this.$options.components).indexOf(this.$options.name) === -1) {
          this.vnodeType.page = true;
        } else {
          this.vnodeType.component = true;
        }
      } else {
        this.vnodeType.page = true;
      }
      let ua = this.$device.uaString;
      let device = this.$device.type;
      this.userAgent = { uaString: ua, device: device };
      let adPlacements = vueConfig.adPlacements;
      let lazyAds = vueConfig.lazyAds;
      if (this.vnodeType.page) {
        Vue.nextTick(() => {
          let adCfg = new AdConfig(this, this.userAgent.device);
          this.defaultCfg = adCfg.tplConfig(this.$options.name);
          let self = this;
          AdService.initGPT().then(() => {
            self.configurePlacements(adPlacements)
              .then((result) => {
                self.renderAds(result);
              })
              .catch((reason) => {
                console.log(reason);
              });
          });
          window.addEventListener('load', () => {
            // For triggering ensignten
            let event = document.createEvent('Event');
            event.initEvent('onvirtualload', true, true);
            window.dispatchEvent(event);
            if (lazyAds.length) {
              window.addEventListener('scroll', () => {
                lazyAds.forEach((ad) => {
                  if (window.pageYOffset >= (ad.elTop - window.innerHeight - 200)) {
                    self.configurePlacements([ad])
                      .then((result) => {
                        self.renderAds(result, true);
                        lazyAds.splice(lazyAds.indexOf(ad), 1);
                      })
                      .catch((reason) => {
                        console.log(reason);
                      });
                  }
                });
              });
            }
          });
        });
      }
      this.$on('reloadads', ({ refreshPlacements }) => {
        let adCfg = new AdConfig(this, this.userAgent.device);
        this.defaultCfg = adCfg.tplConfig(this.$options.name);
        let adsToRefresh = adPlacements.filter((placement) => refreshPlacements.indexOf(placement.placementId) !== -1);
        AdService.clearAds(adsToRefresh).then(() => {
          this.configurePlacements(adsToRefresh)
            .then((result) => {
              this.renderAds(result);
            })
            .catch((reason) => {
              console.log(reason);
            });
        });
      });
    },
    methods: {
      renderAds(placements, lazy = false) {
        AdService.setupAds(placements, lazy);
      },
      refreshAds() {
        AdService.refreshAds();
      },
      configurePlacements(adPlacements) {
        return new Promise((resolve, reject) => {
          if (adPlacements && adPlacements.length) {
            adPlacements.forEach((pl) => {
              if (pl.hasOwnProperty('adSlot')) {
                delete pl.adSlot;
              }
              Object.assign(pl, PLACEMENTS[pl.placementId]);
              Object.assign(pl, this.defaultCfg);
              // Object.assign(pl.targetingKeys, this.adParams);
            });
            resolve(adPlacements);
          } else {
            reject('AdDisplay.js :: configurePlacements - adPlacement array is empty');
          }
        });
      }
    }
  });
};

Vue.use(vueConfig);
