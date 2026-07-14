const gallery = document.querySelector("#gallery");
const lightbox = document.querySelector("#lightbox");
const lightboxImage = document.querySelector("#lightboxImage");
const lightboxCaption = document.querySelector("#lightboxCaption");
const lightboxCounter = document.querySelector("#lightboxCounter");
const photoCount = document.querySelector("#photoCount");
const likedCount = document.querySelector("#likedCount");
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

function photoFileName(index) {
  return `IYSA-2026-${String(index + 1).padStart(2, "0")}.webp`;
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

function downloadButtonMarkup(photo, index) {
  return `
    <a class="download-button card-download" href="${photo.src}" download="${photoFileName(index)}"
      aria-label="Скачать фото ${String(index + 1).padStart(2, "0")}">↓</a>
  `;
}

function updateLikedCount() {
  likedCount.textContent = `${likedPhotos.size} LIKED`;
}

function updateLikeButtons(index) {
  const isLiked = likedPhotos.has(index);
  document.querySelectorAll(`[data-like-index="${index}"]`).forEach((button) => {
    button.classList.toggle("is-liked", isLiked);
    button.setAttribute("aria-pressed", String(isLiked));
    button.setAttribute("aria-label", `${isLiked ? "Убрать лайк" : "Поставить лайк"} фото ${String(index + 1).padStart(2, "0")}`);
    const icon = button.querySelector(".like-icon");
    if (icon) icon.textContent = isLiked ? "♥" : "♡";
    const label = button.querySelector(".like-label");
    if (label) label.textContent = isLiked ? "Понравилось" : "Нравится";
  });
  updateLikedCount();
}

function toggleLike(index) {
  if (likedPhotos.has(index)) likedPhotos.delete(index);
  else likedPhotos.add(index);
  saveLikedPhotos();
  updateLikeButtons(index);
}

function renderGallery() {
  gallery.innerHTML = photos.map((photo, index) => `
    <figure class="photo-card" data-index="${index}">
      <img src="${photo.src}" alt="${photo.alt}" loading="lazy" decoding="async" />
      <figcaption>${String(index + 1).padStart(2, "0")}</figcaption>
      <div class="photo-actions" aria-label="Действия с фото ${String(index + 1).padStart(2, "0")}">
        ${likeButtonMarkup(index)}
        ${downloadButtonMarkup(photo, index)}
      </div>
    </figure>
  `).join("");

  photoCount.textContent = `${photos.length} PHOTOS`;
  updateLikedCount();
  emptyState.hidden = photos.length > 0;
}

function showPhoto(index) {
  activeIndex = (index + photos.length) % photos.length;
  const photo = photos[activeIndex];
  lightboxImage.src = photo.src;
  lightboxImage.alt = photo.alt;
  lightboxCaption.textContent = photo.alt;
  lightboxCounter.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(photos.length).padStart(2, "0")}`;
  lightboxLike.dataset.likeIndex = String(activeIndex);
  lightboxDownload.href = photo.src;
  lightboxDownload.download = photoFileName(activeIndex);
  updateLikeButtons(activeIndex);
  lightbox.hidden = false;
  document.body.classList.add("is-locked");
}

function closeLightbox() {
  lightbox.hidden = true;
  lightboxImage.removeAttribute("src");
  document.body.classList.remove("is-locked");
}

gallery.addEventListener("click", (event) => {
  const likeButton = event.target.closest(".like-button");
  if (likeButton) {
    event.stopPropagation();
    toggleLike(Number(likeButton.dataset.likeIndex));
    return;
  }
  const card = event.target.closest(".photo-card");
  if (card) showPhoto(Number(card.dataset.index));
});

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

fetch("photos.json")
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
