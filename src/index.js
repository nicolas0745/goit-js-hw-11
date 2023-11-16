const axios = require('axios').default;
require('intersection-observer');
import { Notify } from 'notiflix';
import SimpleLightbox from 'simplelightbox';
import 'simplelightbox/dist/simple-lightbox.min.css';

const searchForm = document.querySelector('.search-form');
const input = searchForm.querySelector('input[type=text]');
const gallery = document.querySelector('.gallery');
const loader = document.querySelector('.dot-spinner');
const apiKey = '40676480-f1eba9f42c4c8420b412d5875';
let firstSearch = true;
let search;
let newGallery;
let page = 1;
let totalPages;
let lastImg;

const observer = new IntersectionObserver(
  async entry => {
    if (entry[0].isIntersecting) {
      observer.unobserve(lastImg);
      if (page > totalPages) {
        Notify.failure(
          `We're sorry, but you've reached the end of search results.`
        );
        return;
      }
      loader.classList.toggle('hidden');
      await searchImgs(search);
      const { height: cardHeight } =
        gallery.firstElementChild.getBoundingClientRect();
      window.scrollBy({
        top: cardHeight * 2,
        behavior: 'smooth',
      });
      loader.classList.toggle('hidden');
    }
  },
  {
    root: null,
    rootMargin: '0px',
    threshold: 0.2,
  }
);

const fetchImages = async str => {
  const url = `https://pixabay.com/api/`;
  const data = await axios.get(url, {
    params: {
      key: apiKey,
      q: str,
      image_type: 'photo',
      orientation: 'horizontal',
      safesearch: true,
      per_page: 40,
      page,
    },
  });
  console.log(data);
  return data;
};

const renderImages = imgs => {
  let template = '';
  imgs.forEach(img => {
    template += `<div class="photo-card">
    <a href="${img.largeImageURL}"><div class= "img-container"><img src="${img.webformatURL}" alt="${img.tags}" loading="lazy" /></div></a>
    <div class="info">
      <p class="info-item">
        <b>Likes</b> ${img.likes}
      </p>
      <p class="info-item">
        <b>Views</b> ${img.views}
      </p>
      <p class="info-item">
        <b>Comments</b> ${img.comments}
      </p>
      <p class="info-item">
        <b>Downloads</b> ${img.downloads}
      </p>
    </div>
  </div>`;
  });
  if (page === 1) {
    gallery.innerHTML = template;
    newGallery = new SimpleLightbox('.gallery a');
    lastImg = gallery.lastElementChild;
    if (totalPages === 1) {
      console.log(totalPages);
      return;
    }
    observer.observe(lastImg);
    return;
  }
  gallery.insertAdjacentHTML('beforeend', template);
  newGallery.refresh();
  lastImg = gallery.lastElementChild;
  observer.observe(lastImg);
};

const searchImgs = async string => {
  try {
    const {
      data: { hits, totalHits },
    } = await fetchImages(string);
    if (totalHits === 0) {
      Notify.failure(
        `Sorry, there are no images matching your search query. Please try again.`
      );
      return;
    }
    if (firstSearch) {
      Notify.success(`Hooray! We found ${totalHits} images.`);
      if (totalHits > 40) {
        totalPages = Math.round(totalHits / 40);
        console.log(totalPages);
      } else {
        totalPages = 1;
      }
    }
    renderImages(hits);
    page++;
  } catch (error) {
    console.log(`Error: ${error}`);
    Notify.failure(`Something went wrong. Reload the page.`);
  }
};

searchForm.addEventListener('submit', async evt => {
  evt.preventDefault();
  if (input.value.trim() == '') {
    Notify.failure(`Enter a word to search, please.`);
    return;
  }
  loader.classList.toggle('hidden');
  firstSearch = true;
  gallery.innerHTML = '';
  page = 1;
  search = input.value.trim().split(' ').join('+');
  await searchImgs(search);
  firstSearch = false;
  loader.classList.toggle('hidden');
});
