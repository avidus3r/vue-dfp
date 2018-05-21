<template>
  <div class="ad-placement"
    :id="divId"
    :class="{allowRefresh: !disableRefresh, allowAutoRefresh: autoRefresh && !disableRefresh}"
    :data-placement="placementId">
  </div>
</template>

<script>
  /**
   * ad placement component
   * @module components/AdPlacement
   * @param {boolean} disableRefresh - disable ad refresh
   * @param {boolean} autoRefresh - enable automatic ad refresh
   * @param {string} placementId - name of ad placement
   * @param {boolean} overrideId - if set to true, divId will be set to placementID value 1:1
   * @param {array} ua - list of userAgent devices to allow current placement
   * @param {boolean} lazyLoad - lazy load ad
   */
  export default {
    name: 'ad-placement',
    data() {
      return {
        divId: undefined,
        placementData: {}
      };
    },
    props: ['disableRefresh', 'autoRefresh', 'placementId', 'overrideId', 'ua', 'lazyLoad', 'refresh', 'refreshInterval'],
    created() {
      this.divId = this.overrideId ? this.placementId : 'dfp-' + this.placementId + '-' + Math.random().toString(36).substr(2, 5);
    },
    beforeMount() {
      let currentDevice = this.$device.type;
      let placementUA = this.ua;
      let devicePath = currentDevice === 'desktop' ? 'dfp' : 'mob';

      if (!placementUA) {
        placementUA = ['fluid'];
      }
      if (/\?disableAds=true/.test(location.search) && !/www/.test(location.host)) {
        return false;
      }
      if (this.$el) {
        this.$el.id = this.divId;
        let placement = { divId: this.divId, placementId: this.placementId, devicePath: devicePath, refresh: this.refresh || false, refreshInterval: this.refreshInterval || 5000 }; // default refresh interval to refresh the ads;
        if (this.lazyLoad) {
          Object.assign(placement, {lazyLoad: true, elTop: this.$el.offsetTop});
        }
        if (placementUA.indexOf('fluid') > -1 || placementUA.indexOf(currentDevice) > -1) {
          this.placementData = placement;
          this.$emit('placementcreated', placement);
        }
      }
    }
  };
</script>
