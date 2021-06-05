/* eslint-disable class-methods-use-this */
/*
http://127.0.0.1:5500/index.html?artefacts=PL_MNW_MOb588_FR044,PRIVATE_NONE-P375_FR-none,US_MMANY_57-22_FR021, PRIVATE_NONE-P333_FR-none
https://codepen.io/imoskvin/pen/yOXqvO
https://github.com/openseadragon/openseadragon/issues/1653
############################################################################ */

const store = new Reef.Store({
  data: {
    artefacts: {},
    variants: {},
    artefactSelector: [],
    variantSelector: [],
    activeArea: 'left',
    artefactSelectorIsOpen: true,
    variantSelectorIsOpen: false,
    toggleViewLock: false,
    viewerHasContent: {
      left: false,
      right: false,
    },
  },
});

const variants = [
  'analysis',
  'conservation',
  'detail',
  'irr',
  'koe',
  'other',
  'overall',
  'photomicrograph',
  'reflected-light',
  'reverse',
  'rkd',
  'transmitted-light',
  'uv-light',
  'x-radiograph',
];

class Compare {
  constructor(config) {
    this.config = config;

    this.initArtefactSelector();
    this.initVariantSelector();
    this.initStage();
    this.getArtefactsFromQuery();
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

  initArtefactSelector() {
    this.artefactSelector = new Reef('#imageStripe', {
      store,
      template() {
        const activeClass = store.data.artefactSelectorIsOpen ? 'image-stripe-grid--is-active' : '';
        const imageStripe = `
        <div class="image-stripe-grid ${activeClass}">
          ${store.data.artefactSelector.map((artefact) => `
          <figure id="${artefact.id}" class="small-card">
            <div class="small-card__image-holder">
              <img
                class="small-card__image js-changeArtefact"
                data-target="${artefact.id}" 
                src='${artefact.src}' 
                alt='${artefact.id}'
              >
            </div>
          </figure>
          `).join('')}
        </div>`;
        return imageStripe;
      },
    });
    this.artefactSelector.render();

    this.artefactSelectorNavigation = new Reef('#artefactSelectorNavigation', {
      store,
      template() {
        const toggleViewLockIcon = store.data.toggleViewLock ? 'lock' : 'lock_open';
        const showViewLock = !!((store.data.viewerHasContent.left
          && store.data.viewerHasContent.right));
        const showViewLockClass = showViewLock ? '' : 'main-navigation__item--is-hidden';

        return `
        <div class="artefact-selector__navigation-toggle">
          <i class="icon js-toggleArtefactSelector">collections</i>
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
    this.artefactSelectorNavigation.render();
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

  initVariantSelector() {
    this.variantSelector = new Reef('#variantSelector', {
      store,
      template() {
        const orientation = store.data.activeArea === 'left' ? 'variant-stripe__wrap--is-right' : 'variant-stripe__wrap--is-left';
        const imageStripe = `
        <div class="variant-stripe__wrap ${orientation}">
          <div class="variant-selector__navigation-toggle">
            <i class="icon l js-closeVariantSelector">close</i>
          </div>
          <div class="variant-stripe__grid">
            ${store.data.variantSelector.map((variant) => `
              <figure id="${variant.id}" class="small-card">
                <div class="small-card__image-holder">
                  <img
                    class="small-card__image js-changeVariant"
                    data-target="${variant.id}" 
                    src='${variant.src}' 
                    alt='${variant.id}'
                  >
                </div>
              </figure>
            `).join('')}
          </div>
        </div>`;
        return imageStripe;
      },
    });
    this.variantSelector.render();
  }

  changeArtefact(element) {
    const id = element.dataset.target;
    const artefact = store.data.artefacts[id];

    this.getVariants(id, artefact);
    this.updateStage(id, 'artefact');
  }

  changeVariant(element) {
    const id = element.dataset.target;
    this.updateStage(id, 'variant');
  }

  listenToEvents() {
    document.addEventListener('click', (e) => {
      const { target } = e;

      if (target.classList.contains('js-changeArtefact')) {
        this.changeArtefact(target);
      }

      if (target.classList.contains('js-changeVariant')) {
        this.changeVariant(target);
      }

      if (target.classList.contains('js-toggleActiveArea')) {
        this.areas.left.classList.toggle('stage-area--is-active');
        this.areas.right.classList.toggle('stage-area--is-active');
        store.data.activeArea = store.data.activeArea === 'left' ? 'right' : 'left';
      }

      if (target.classList.contains('js-toggleArtefactSelector')) {
        store.data.artefactSelectorIsOpen = !store.data.artefactSelectorIsOpen;
      }

      if (target.classList.contains('js-closeVariantSelector')) {
        this.toggleVariantSelector();
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

  toggleVariantSelector() {
    store.data.variantSelectorIsOpen = !store.data.variantSelectorIsOpen;
    document.getElementById('variantSelector').classList.toggle('variant-selector--is-active');
  }

  getArtefactUrl(artefactId) {
    const artefact = store.data.artefacts[artefactId];
    const artefactView = artefact.data.imageStack.overall.images[0].tiles;
    return this.getViewUrl(artefact.slug, artefactView.path, artefactView.src);
  }

  getVariantUrl(variantId) {
    const { artefactId, image } = store.data.variants[variantId];
    const variantView = image.tiles;
    return this.getViewUrl(artefactId, variantView.path, variantView.src);
  }

  getVariants(artefactId, artefact) {
    store.data.variants = {};
    store.data.variantSelector = [];
    variants.forEach((variant) => {
      artefact.data.imageStack[variant].images.forEach((image) => {
        const variantPreview = image.xsmall;
        const variantId = variantPreview.src;
        const variantPreviewUrl = this.getPreviewUrl(
          artefact.slug, variantPreview.path, variantPreview.src,
        );
        store.data.variants[variantId] = { artefactId, image };
        store.data.variantSelector.push({ id: variantId, src: variantPreviewUrl });
      });
    });
    this.toggleVariantSelector();
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

  updateStage(id, mode) {
    const viewerId = this.viewerMapping[store.data.activeArea];
    const viewUrl = mode === 'artefact' ? this.getArtefactUrl(id) : this.getVariantUrl(id);

    store.data.viewerHasContent[store.data.activeArea] = true;
    this.viewerControl[viewerId] = this[viewerId];
    this.viewerControl[viewerId].open(viewUrl);
    this.viewerControl[viewerId].addHandler('open', () => {
    });

  }

  getArtefactsFromQuery() {
    const params = new URLSearchParams(window.location.search);

    if (params.has('artefacts')) {
      const artefacts = params.get('artefacts').replace(' ', '').split(',');
      artefacts.forEach((artefact) => {
        (async () => {
          const [inventoryNumber, objectName] = artefact.split(/:/);
          
          const suffix = objectName !== '' ? `_${objectName}` : '';
          const aretfactSlug = `${inventoryNumber}${suffix}`;
          const url = this.config['image-data-api'] + aretfactSlug;

          try {
            const response = await fetch(url, {
              method: 'GET',
              withCredentials: true,
              headers: {
                'x-api-key': this.config['api-key'],
                'Content-Type': 'application/json',
              },
            });
            const data = await response.json();
            this.addArtefactDataToObject(artefact, data, aretfactSlug);
          } catch (err) {
            console.error(`${err}. There seems to be no data for ${artefact}`);
          }
        })();
      });
    }
  }

  addArtefactDataToObject(artefactId, artefactData, artefactSlug) {
    store.data.artefacts[artefactId] = { data: artefactData, slug: artefactSlug };

    const artefactPreview = artefactData.imageStack.overall.images[0].xsmall;
    const artefactPreviewUrl = this.getPreviewUrl(
      artefactSlug, artefactPreview.path, artefactPreview.src,
    );
    store.data.artefactSelector.push({ id: artefactId, src: artefactPreviewUrl, slug: artefactSlug});
  }

  getPreviewUrl(slug, path, src) {
    const server = this.config.imageserver;
    return `${server}${slug}/${path}/${src}`;
  }

  getViewUrl(slug, path, src) {
    const server = this.config.baseUrlTiles;
    return `${server}${slug}/${path}/${src}`;
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const comparism = new Compare(config);
});
