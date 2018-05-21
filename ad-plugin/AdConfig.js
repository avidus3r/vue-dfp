/**
 * @class AdConfig
 */
export default class AdConfig {
  /**
   *
   * @param {object} vnode - Vue instance
   * @param {string} device - userAgent detected mobile|desktop
   * @memberOf AdConfig
   * @method constructor
   */
  constructor(vnode, device) {
    // Current VueInstance
    this.vnode = vnode;

    this.device = device;
    this.deviceUaFlag = this.device === 'mobile' ? 'mob' : 'dfp';
  }
  /**
   * configure ads by template
   * @param {string} tpl - template to configure
   * @returns {object} ad config
   * @memberOf AdConfig
   * @method tplConfig
   */
  tplConfig(tpl) {
    let cfg, makeModelSlug, vehicleMeta, adFlow, section;
    switch (tpl) {
      case 'homepage':
        cfg = {
          slotID: `/MyDFPSlotID/${this.deviceUaFlag}`,
          targetingKeys: {
          }
        };
        break;
      default:
        break;
    }
    return cfg;
  }
}
