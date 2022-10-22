/* eslint-disable class-methods-use-this */
/*
http://127.0.0.1:5500/index.html?artefacts=PL_MNW_MOb588_FR044,PRIVATE_NONE-P375_FR-none,US_MMANY_57-22_FR021, PRIVATE_NONE-P333_FR-none
https://codepen.io/imoskvin/pen/yOXqvO
https://github.com/openseadragon/openseadragon/issues/1653
############################################################################ */

const store = new Reef.Store({
  data: {
    images: {},
    imageSelector: [],
    activeArea: 'left',
    imageSelectorIsOpen: true,
    toggleViewLock: false,
    viewerHasContent: {
      left: false,
      right: false,
    },
  },
});

class Compare {
  constructor(config) {
    this.config = config;

    this.initImageSelector();
    this.initStage();
    this.getImagesFromLocalStorage();
    this.listenToEvents();
    
    this.compareRootElement = document.getElementById('compareRoot');
    this.viewerMapping = {
      left: 'leftViewer',
      right: 'rightViewer',
    };
    this.areas = {
      left: document.getElementById('leftArea'),
      right: document.getElementById('rightArea'),
    };
    this.viewerControl = {
      left: false,
      right: false,
    };
  }

  initImageSelector() {
    this.imageSelector = new Reef('#imageStripe', {
      store,
      template() {
        const activeClass = store.data.imageSelectorIsOpen ? '' : 'image-stripe-grid--is-active';
        const imageStripe = `
        <div class="image-stripe-grid ${activeClass}">
          ${store.data.imageSelector.map((image) => `
          <figure id="${image.id}" data-image-id="${image.id}" class="small-card js-is-collectable">
            <span class="compare-collection-remove js-compareCollectionRemove" title="remove"></span>
            <div class="small-card__image-holder">
              <img
                class="small-card__image js-changeImage"
                data-target="${image.id}" 
                src='${image.src}' 
                alt='${image.id}'
              >
            </div>
          </figure>
          `).join('')}
        </div>`;
        return imageStripe;
      },
    });

    this.imageSelector.render();

    this.imageSelectorNavigation = new Reef('#imageSelectorNavigation', {
      store,
      template() {
        const toggleViewLockIcon = store.data.toggleViewLock ? 'lock' : 'lock_open';
        const showViewLock = !!((store.data.viewerHasContent.left
          && store.data.viewerHasContent.right));
        const showViewLockClass = showViewLock ? '' : 'main-navigation__item--is-hidden';

        return `
        <div class="image-selector__navigation-toggle">
          <i class="icon js-toggleImageSelector">collections</i>
        </div>
        <div class="main-navigation__item js-toggleFullscreen" >
          <i class="icon">fullscreen</i>
        </div>
        <div class="main-navigation__item js-toggleActiveArea" >
          <i class="icon">multiple_stop</i>
        </div>

        <div class="main-navigation__item js-toggleViewLock ${showViewLockClass}" >
          <i class="icon">${toggleViewLockIcon}</i>
        </div>
        `;
      },
    });
    this.imageSelectorNavigation.render();
  }

  initStage() {
    this.areaIndicatorLeft = new Reef('#leftAreaNavigation', {
      store,
      template() {
        const additionalClass = store.data.activeArea === 'left' ? 'active-stage-indicator--is-active' : '';
        return `<div class="active-stage-indicator ${additionalClass}"></div>`;
      },
    });
    this.areaIndicatorLeft.render();

    this.areaIndicatorRight = new Reef('#rightAreaNavigation', {
      store,
      template: () => {
        const additionalClass = store.data.activeArea === 'right' ? 'active-stage-indicator--is-active' : '';
        return `<div class="active-stage-indicator ${additionalClass}"></div>`;
      },
    });
    this.areaIndicatorRight.render();

    this.leftViewer = OpenSeadragon({
      id: 'leftViewer',
      prefixUrl: './assets/icons/',
      tileSources: {
        type: 'image',
        url: './assets/no-image-l.svg',
      },
    });

    this.rightViewer = OpenSeadragon({
      id: 'rightViewer',
      prefixUrl: './assets/icons/',
      tileSources: {
        type: 'image',
        url: './assets/no-image-l.svg',
      },
    });
  }

  changeImage(element) {
    const id = element.dataset.target;
    const image = store.data.images[id];
    this.updateStage(image.data.imageTilesUrl);
  }

  listenToEvents() {
    document.addEventListener('click', (e) => {
      const { target } = e;

      if (target.classList.contains('js-changeImage')) {
        this.changeImage(target);
      }

      if (target.classList.contains('js-compareCollectionRemove')) {
        const element = target.closest('.js-compareCollectionRemove').parentElement;
        removeFromCompareCollection(element);
        this.getImagesFromLocalStorage();
      }


      if (target.classList.contains('js-toggleActiveArea')) {
        this.areas.left.classList.toggle('stage-area--is-active');
        this.areas.right.classList.toggle('stage-area--is-active');
        store.data.activeArea = store.data.activeArea === 'left' ? 'right' : 'left';
      }

      if (target.classList.contains('js-toggleImageSelector')) {
        store.data.imageSelectorIsOpen = !store.data.imageSelectorIsOpen;
      }

      if (target.classList.contains('js-toggleFullscreen')) {
        if (this.compareRootElement.requestFullscreen) {
          this.compareRootElement.requestFullscreen();
        }
      }

      if (target.classList.contains('js-toggleViewLock')) {
        this.toggleViewLock();
      }
    }, true);
  }

  enableViewLock() {
    store.data.toggleViewLock = true;

    const viewerIdLeft = this.viewerMapping.left;
    const viewerIdRight = this.viewerMapping.right;

    this.viewerControl[viewerIdLeft].addHandler('zoom', () => {
      const zoom = this.viewerControl[viewerIdLeft].viewport.getZoom();
      this.viewerControl[viewerIdRight].viewport.zoomTo(zoom, null, false);
    });

    /* this.viewerControl[viewerIdRight].addHandler('zoom', () => {
      const zoom = this.viewerControl[viewerIdRight].viewport.getZoom();
      this.viewerControl[viewerIdLeft].viewport.zoomTo(zoom, null, false);
    }); */

    this.viewerControl[viewerIdLeft].addHandler('pan', () => {
      const pan = this.viewerControl[viewerIdLeft].viewport.getCenter();
      this.viewerControl[viewerIdRight].viewport.panTo(pan);
    });
    /* this.viewerControl[viewerIdRight].addHandler('pan', () => {
      const pan = this.viewerControl[viewerIdRight].viewport.getCenter();
      this.viewerControl[viewerIdLeft].viewport.panTo(pan);
    }); */
  }

  disableViewLock() {
    store.data.toggleViewLock = false;
    const viewerIdLeft = this.viewerMapping.left;
    const viewerIdRight = this.viewerMapping.right;
    this.viewerControl[viewerIdLeft].removeAllHandlers('zoom');
    this.viewerControl[viewerIdRight].removeAllHandlers('zoom');
    this.viewerControl[viewerIdLeft].removeAllHandlers('pan');
    this.viewerControl[viewerIdRight].removeAllHandlers('pan');
  }

  toggleViewLock() {
    if (store.data.toggleViewLock) {
      this.disableViewLock();
    } else {
      this.enableViewLock();
    }
  }

  updateStage(imageTileUrl) {
    const viewerId = this.viewerMapping[store.data.activeArea];
    const viewUrl = imageTileUrl;
    
    store.data.viewerHasContent[store.data.activeArea] = true;
    this.viewerControl[viewerId] = this[viewerId];
    this.viewerControl[viewerId].open(viewUrl);
    this.viewerControl[viewerId].addHandler('open', () => {
    });

  }

  getImagesFromLocalStorage() {
    store.data.images = {};
    store.data.imageSelector = [];
    const compareCollectionJSON = localStorage.getItem('cranachCollect');
    const compareCollection = JSON.parse(compareCollectionJSON);
    if(compareCollection === null) return;
    

    compareCollection.forEach(item => {
      const { imageId } = item;
      const { imageTilesUrl } = item;
      const { imagePreviewUrl } = item;

      const imageData = {
        imageId, imageTilesUrl, imagePreviewUrl
      };
      this.addImageDataToObject(imageId, imageData);
    });

  }

  addImageDataToObject(imageId, imageData) {
    store.data.images[imageId] = { data: imageData };

    const { imagePreviewUrl } = imageData;
    store.data.imageSelector.push({ id: imageId, src: imagePreviewUrl });
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const comparism = new Compare(config);
});
