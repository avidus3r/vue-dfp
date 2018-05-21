# Implementing Ads
## **_DO NOT USE window.onload anywhere_**
### Implementing the placement in a template

**the component has the following attributes available:**

* placementId: {string} the name of your placement
* slugId: {boolean} creates a randomized value for the element ID generated from @placementId (to load multiple instances of the same placement)
* lazyLoad: {boolean} true to lazy load a placement
* ua: {array} array value of acceptable devices for the placement – mobile, tablet, desktop and fluid (fluid is every device)

**below is an example placement in a page template**

```html
<ad-placement
  placementId="myPlacement"
  slugId="true"
  lazyLoad="true"
  :ua="['fluid']">
</ad-placement>
```

_**When implementing an ad at a page or component level:**_


* your page should import the AdPlacement component

```js
import AdPlacement from './components/AdPlacement';
```

* your page should declare the components property and include the AdPlacement component

```js
components: {
  'ad-placement': AdPlacement
}
```
