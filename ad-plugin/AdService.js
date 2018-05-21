'use strict';

/**
 * AdService
 * @namespace AdService
 * @type {{initialized: boolean, currentPlacements: Array, hasVideoEl: boolean, googletag: {}, renderedPlacements: Array, initGPT: AdService.initGPT, setupAds: AdService.setupAds, onPubadsReady(*, *, *=): void, setTargeting: AdService.setTargeting, displayAds: AdService.displayAds, refreshAds(): void, clearAds(): *}}
 */
const AdService = {
  initialized: false,
  currentPlacements: [],
  hasVideoEl: false,
  googletag: {},
  renderedPlacements: [],
  refreshAdsPlacements: [],
  /**
   * initialize GPT library
   * @memberOf AdService
   * @method initGPT
   * @returns {Promise<any>}
   */
  initGPT: function() {
    return new Promise((resolve, reject) => {
      try {
        let dfpInitInterval = window.setInterval(() => {
          if (!window.googletag) {
            return;
          }
          window.clearInterval(dfpInitInterval);
          this.initialized = true;
          resolve();
        }, 100);
      } catch (e) {
        reject(JSON.stringify(e));
      }
    });
  },
  /**
   * set up and configure ad placements
   * @param {array} placements - prepared ad placement objects
   * @param {boolean} lazy - lazy load ad
   * @memberOf AdService
   * @method setupAds
   */
  setupAds: function(placements = [], lazy = false) {
    if (!placements.length) return;

    if (/\?disableAds=true/.test(location.search) && !/www/.test(location.host)) {
      return false;
    }
    window.googletag = window.googletag || {};

    let pubadsInt = setInterval(() => {
      if (window.googletag.apiReady) {
        this.onPubadsReady(window.googletag, placements, lazy);
        window.clearInterval(pubadsInt);
      }
    }, 100);
  },
  /**
   * handler for googletag.apiReady
   * @param {object} gt - googletag object (gpt.js lib)
   * @param {array} placements - array of configured placements
   * @param {boolean} lazy - lazy load ads
   * @memberOf AdService
   * @method onPubadsReady
   */
  onPubadsReady(gt, placements, lazy) {
    let googletag = this.googletag = gt;

    googletag.cmd = window.googletag.cmd || [];
    placements.forEach((placement) => {
      window.googletag.cmd.push(() => {
        // placement has already been initialized
        if (placement.adSlot) return;
        let adSlot = googletag.defineSlot(placement.slotID, placement.sizes, placement.divId);
        for (const key of Object.keys(placement.targetingKeys)) {
          this.setTargeting(key, placement.targetingKeys[key]);
        }
        if (placement.sizes[0] === 'fluid') {
          adSlot.setSafeFrameConfig({allowPushExpansion: true});
        }
        if (placement.hasOwnProperty('keys')) {
          for (const key of Object.keys(placement.keys)) {
            this.setTargeting(key, placement.keys[key], adSlot);
          }
        }
        this.setTargeting('global-targeting', 'example');

        // check for cd_paidref UTM value cookie
        let paidRef = 'utmCookie';
        if (/utmCookie/.test(document.cookie)) {
          let value = '; ' + document.cookie;
          let parts = value.split('; ' + paidRef + '=');
          if (parts.length === 2) {
            let utmString = parts.pop().split(';').shift();
            this.setTargeting('utm_ref', utmString.split('%')[0]);
          }
        }

        adSlot.addService(googletag.pubads());
        if (this.hasVideoEl && placement.hasOwnProperty('videoPlacement')) {
          adSlot.addService(googletag.content());
        }

        placement.adSlot = adSlot;

        if (placement.refresh && placement.refreshInterval) {
          this.refreshAdsPlacements.push(placement);
        }
        this.currentPlacements.push(placement);
      });
    });

    googletag.pubads().enableAsyncRendering();
    googletag.pubads().collapseEmptyDivs();
    googletag.pubads().enableSingleRequest();
    googletag.enableServices();
    if (lazy) {
      this.displayAds(placements[0].divId);
    } else {
      this.displayAds();
    }
  },
  /**
   * set key/value targeting parameters
   * @param {string} key - targeting key
   * @param value - targeting value
   * @param {object|null} slot - googletag slot instance
   * @memberOf AdService
   * @method setTargeting
   */
  setTargeting: function(key, value, slot = null) {
    if (slot) {
      // slot level targeting
      slot.setTargeting(key, value);
    } else {
      // page level targeting
      this.googletag.pubads().setTargeting(key, value);
    }
  },
  /**
   * display ads
   * @param {string|null} divId - html div id for placement to display
   * @param {function} callback - callback
   * @memberOf AdService
   * @method displayAds
   */
  displayAds: function(divId = null, callback) {
    if (divId) {
      this.googletag.display(divId);
    } else {
      let self = this;
      setTimeout(() => {
        this.googletag.pubads().addEventListener('slotRenderEnded', function(event) {
          let slotElementId = event.slot.getSlotElementId();
          let refreshPlacement = self.refreshAdsPlacements.find((placement) => placement.divId === slotElementId);
          if (refreshPlacement) {
            setTimeout(() => {
              self.googletag.pubads().refresh([event.slot]);
            }, refreshPlacement.refreshInterval);
          }
        });
        this.googletag.pubads().addEventListener('slotVisibilityChanged', function(event) {
          // slotVisibilityChanged handler
        });
        this.currentPlacements.forEach((placement) => {
          if (this.renderedPlacements.indexOf(placement.divId) === -1) {
            this.googletag.display(placement.divId);
            this.renderedPlacements.push(placement.divId);
          }
        });
      }, 10);
    }
  },
  /**
   * refresh ads
   * @memberOf AdService
   * @method refreshAds
   */
  refreshAds() {
    this.googletag.pubads().refresh();
  },
  /**
   * clear ad slot instances
   * @returns {Promise<any>} - resolved when ad slots have been destroyed
   * @memberOf AdService
   * @method clearAds
   */
  clearAds(adsToRefresh) {
    let adsToRefreshSlots = adsToRefresh && adsToRefresh.length ? adsToRefresh.map(placement => placement.divId) : [];
    return new Promise((resolve, reject) => {
      let slotsToDestroy = this.currentPlacements.filter(placement => adsToRefreshSlots.indexOf(placement.divId) !== -1)
        .map((slot) => {
          return slot.adSlot;
        });
      if (slotsToDestroy && slotsToDestroy.length) {
        this.googletag.destroySlots(slotsToDestroy);
      } else if (!adsToRefresh) {
        this.googletag.destroySlots();
      }
      this.currentPlacements = this.currentPlacements.filter(placement => adsToRefreshSlots.indexOf(placement.divId) === -1);
      this.renderedPlacements = this.renderedPlacements.filter(placementId => adsToRefreshSlots.indexOf(placementId) === -1);
      resolve();
    });
  }
};

export default AdService;
