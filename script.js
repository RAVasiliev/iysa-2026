const gallery = document.querySelector("#gallery");
const lightbox = document.querySelector("#lightbox");
const lightboxImage = document.querySelector("#lightboxImage");
const lightboxLike = document.querySelector("#lightboxLike");
const lightboxDownload = document.querySelector("#lightboxDownload");
const emptyState = document.querySelector("#emptyState");

const likedStorageKey = "iysa-2026-liked-photos";
let photos = [];
let activeIndex = 0;
let likedPhotos = loadLikedPhotos();

function loadLikedPhotos() {
  try {
    const saved = JSON.parse(localStorage.getItem(likedStorageKey) || "[]");
    return new Set(saved.filter((index) => Number.isInteger(index)));
  } catch {
    return new Set();
  }
}

function saveLikedPhotos() {
  try {
    localStorage.setItem(likedStorageKey, JSON.stringify([...likedPhotos]));
  } catch {
    // Likes still work for the current page if browser storage is unavailable.
  }
}

function mediaFileName(media, index) {
  if (media.downloadName) return media.downloadName;
  const extension = media.src.split(".").pop() || "webp";
  return `IYSA-2026-${String(index + 1).padStart(2, "0")}.${extension}`;
}

function likeButtonMarkup(index) {
  const isLiked = likedPhotos.has(index);
  const label = isLiked ? "Убрать лайк" : "Поставить лайк";
  return `
    <button class="like-button${isLiked ? " is-liked" : ""}" type="button"
      data-like-index="${index}" aria-pressed="${isLiked}" aria-label="${label} фото ${String(index + 1).padStart(2, "0")}">
      <span class="like-icon" aria-hidden="true">${isLiked ? "♥" : "♡"}</span>
    </button>
  `;
}

function downloadButtonMarkup(media, index) {
  return `
    <a class="download-button card-download" href="${media.src}" download="${mediaFileName(media, index)}"
      aria-label="Скачать фото ${String(index + 1).padStart(2, "0")}">↓</a>
  `;
}

function updateLikeButtons(index) {
  const isLiked = likedPhotos.has(index);
  document.querySelectorAll(`[data-like-index="${index}"]`).forEach((button) => {
    button.classList.toggle("is-liked", isLiked);
    button.setAttribute("aria-pressed", String(isLiked));
    button.setAttribute("aria-label", `${isLiked ? "Убрать лайк" : "Поставить лайк"} фото ${String(index + 1).padStart(2, "0")}`);
    const icon = button.querySelector(".like-icon");
    if (icon) icon.textContent = isLiked ? "♥" : "♡";
  });
}

function toggleLike(index) {
  if (likedPhotos.has(index)) likedPhotos.delete(index);
  else likedPhotos.add(index);
  saveLikedPhotos();
  updateLikeButtons(index);
}

function mediaCardMarkup(media, index, isFeatured = false) {
  return `
    <figure class="photo-card" data-index="${index}">
      <img src="${media.src}" alt="${media.alt}" loading="${isFeatured ? "eager" : "lazy"}" decoding="async" />
      <div class="photo-actions" aria-label="Действия с фото ${String(index + 1).padStart(2, "0")}">
        ${likeButtonMarkup(index)}
        ${downloadButtonMarkup(media, index)}
      </div>
    </figure>
  `;
}

function renderGallery() {
  const orderedPhotos = photos
    .map((media, index) => ({ media, index }))
    .sort((a, b) => Number(Boolean(b.media.featured)) - Number(Boolean(a.media.featured)));

  gallery.innerHTML = orderedPhotos
    .map(({ media, index }) => mediaCardMarkup(media, index, Boolean(media.featured)))
    .join("");
  emptyState.hidden = photos.length > 0;
}

function showPhoto(index) {
  activeIndex = (index + photos.length) % photos.length;
  const media = photos[activeIndex];
  lightboxImage.src = media.src;
  lightboxImage.alt = media.alt;
  lightboxLike.dataset.likeIndex = String(activeIndex);
  lightboxDownload.href = media.src;
  lightboxDownload.download = mediaFileName(media, activeIndex);
  updateLikeButtons(activeIndex);
  lightbox.hidden = false;
  document.body.classList.add("is-locked");
}

function closeLightbox() {
  lightbox.hidden = true;
  lightboxImage.removeAttribute("src");
  document.body.classList.remove("is-locked");
}

function handleGalleryClick(event) {
  const likeButton = event.target.closest(".like-button");
  if (likeButton) {
    event.stopPropagation();
    toggleLike(Number(likeButton.dataset.likeIndex));
    return;
  }
  if (event.target.closest(".download-button")) {
    event.stopPropagation();
    return;
  }
  const card = event.target.closest(".photo-card");
  if (card) showPhoto(Number(card.dataset.index));
}

gallery.addEventListener("click", handleGalleryClick);

document.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
document.querySelector(".lightbox-prev").addEventListener("click", () => showPhoto(activeIndex - 1));
document.querySelector(".lightbox-next").addEventListener("click", () => showPhoto(activeIndex + 1));
lightboxLike.addEventListener("click", () => toggleLike(activeIndex));

lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) closeLightbox();
});

document.addEventListener("keydown", (event) => {
  if (lightbox.hidden) return;
  if (event.key === "Escape") closeLightbox();
  if (event.key === "ArrowLeft") showPhoto(activeIndex - 1);
  if (event.key === "ArrowRight") showPhoto(activeIndex + 1);
});

fetch("photos.json?v=5")
  .then((response) => {
    if (!response.ok) throw new Error("Photo manifest is unavailable");
    return response.json();
  })
  .then((manifest) => {
    photos = manifest;
    renderGallery();
  })
  .catch(() => {
    emptyState.hidden = false;
    gallery.innerHTML = "";
  });
