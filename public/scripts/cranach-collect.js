let compareCollection = [];

/* Is local storage available?
============================================================================ */

const checkIfStorageIsAvailable = () => {
  try {
    var storage = window['localStorage'],
      x = '__storage_test__';
    storage.setItem(x, x);
    storage.removeItem(x);
    return true;
  }
  catch (e) {
    return e instanceof DOMException && (
      // everything except Firefox
      e.code === 22 ||
      // Firefox
      e.code === 1014 ||
      // test name field too, because code might not be present
      // everything except Firefox
      e.name === 'QuotaExceededError' ||
      // Firefox
      e.name === 'NS_ERROR_DOM_QUOTA_REACHED') &&
      // acknowledge QuotaExceededError only if there's something already stored
      storage && storage.length !== 0;
  }
};

/* read compare Collection
============================================================================ */
const getCompareCollection = () => {
  const compareCollectionJSON = localStorage.getItem('cranachCollect');
  return compareCollectionJSON ? JSON.parse(compareCollectionJSON) : [];
};

/* write compare Collection
============================================================================ */
const putCompareCollection = (collection) => {
  localStorage.setItem('cranachCollect', JSON.stringify(collection));
};

/* add to local storage
============================================================================ */
const addToCompareCollection = (elementToBeStored) => {
  const ele = elementToBeStored;
  const { title } = ele;
  const cdaId = ele.dataset.cdaId;
  const objectTitle = ele.dataset.objectTitle;
  const imageId = ele.dataset.imageId;
  const imageType = ele.dataset.imageType;
  const imagePreviewUrl = ele.dataset.imagePreviewUrl;
  const imageTilesUrl = ele.dataset.imageTilesUrl;

  const data = {
    title, cdaId, objectTitle, imageId, imageType, imagePreviewUrl, imageTilesUrl,
  }
  
  const isAlreadyCollected = compareCollection.findIndex((item) => item.imageId === imageId) >= 0 ? true : false;
  if (isAlreadyCollected) return;
  
  compareCollection.push(data);
  putCompareCollection(compareCollection);

  ele.dataset.collected = 'true';
  checkIfPageHasCollectedItems();
};

/* remove from local storage
============================================================================ */
const removeFromCompareCollection = (elementToBeRemoved) => {
  const ele = elementToBeRemoved;
  const imageId = ele.dataset.imageId;

  const newCollection = compareCollection.filter(item => item.imageId !== imageId);
  compareCollection = newCollection;
  putCompareCollection(compareCollection);
  
  ele.dataset.collected = 'false';
  checkIfPageHasCollectedItems();
};

/* Add interactive element
============================================================================ */
const addInteractiveElements = () => {
  const collectableElements = document.querySelectorAll('.js-is-collectable');
  
  collectableElements.forEach(ele => {
    const collectInteraction = document.createElement("span");
    collectInteraction.classList.add('collect-interaction', 'js-compare-collection-add-or-remove');
    ele.appendChild(collectInteraction);
  });
};


/* Toggle Compare Launcher
============================================================================ */
const toggleCompareLauncher = (modus) => {
  const compareLauncher = document.querySelector('.js-cranach-compare-launcher');
  if (compareLauncher === null) return;
  if (modus === 'show') {
    compareLauncher.dataset.visible = 'true';
  } else { 
    compareLauncher.dataset.visible = 'false';
  }
};

/* Check if page has collected items
============================================================================ */
const checkIfPageHasCollectedItems = () => {
  const collectedItems = document.querySelectorAll('[data-collected=true]');
  if (collectedItems.length > 0) { toggleCompareLauncher('show'); }
  else { toggleCompareLauncher('hide'); }
}

/* Indicate collected elements
============================================================================ */
const indicateCollectedElements = () => {
  let pageHasCollectedElements = false;

  compareCollection.forEach(ele => {
    const { imageId } = ele;
    const collectedElement = document.querySelector(`[data-image-id=${imageId}]`);
    if (collectedElement !== null) {
      collectedElement.dataset.collected = 'true';
      pageHasCollectedElements = true;
    }
  });

  if (pageHasCollectedElements) {
    toggleCompareLauncher('show');
  }
};

/* Main
============================================================================ */

document.addEventListener('DOMContentLoaded', (event) => {
  
  const storageAvailable = checkIfStorageIsAvailable();
  if (!storageAvailable) return;

  compareCollection = getCompareCollection();

  /* Add interactive elements
  --------------------------------------------------------------------------  */
  addInteractiveElements();

  /* Collectable elements
  --------------------------------------------------------------------------  */
  indicateCollectedElements();

  /* Events
  --------------------------------------------------------------------------  */
  document.addEventListener('click', (ev) => {
    const { target } = ev;
    
    if (target.closest('.js-compare-collection-add-or-remove')) {
      const element = target.closest('.js-is-collectable');
      if (element.dataset.collected === 'true') removeFromCompareCollection(element);
      else addToCompareCollection(element);
    }
  }, true);

});
