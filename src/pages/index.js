import "./index.css";
import {
  enableValidation,
  settings,
  resetValidation,
  disableButton,
} from "../scripts/validation.js";
import Api from "../utils/Api.js";
import logo from "../images/logo.svg";
import avatar from "../images/avatar.jpg";
import pencilIcon from "../images/pencil.svg";
import plusIcon from "../images/plus.svg";
import closeIcon from "../images/close.svg";
import pencilIconLight from "../images/pencil-light.svg";

// Profile elements
const headerLogo = document.querySelector(".header__logo");
headerLogo.src = logo;
const profileAvatar = document.querySelector(".profile__avatar");
profileAvatar.src = avatar;
const profileEditButton = document.querySelector(".profile__edit-button");
const cardModalButton = document.querySelector(".profile__add-button");
const avatarModalButton = document.querySelector(".profile__avatar-button");
const profileName = document.querySelector(".profile__name");
const profileDescription = document.querySelector(".profile__description");

// Edit form elements
const editModal = document.querySelector("#edit-modal");
const editFormElement = editModal.querySelector(".modal__form");
const editModalCloseButton = editModal.querySelector(".modal__close-button");
const editModalNameInput = editModal.querySelector("#profile-name-input");
const editModalDescriptionInput = editModal.querySelector(
  "#profile-description-input"
);

// Card form elements
const cardModal = document.querySelector("#add-card-modal");
const cardForm = cardModal.querySelector(".modal__form");
const cardSubmitButton = cardModal.querySelector(".modal__submit-button");
const cardModalCloseButton = cardModal.querySelector(".modal__close-button");
const cardNameInput = cardModal.querySelector("#add-card-name-input");
const cardLinkInput = cardModal.querySelector("#add-card-link-input");

// Avatar form elements
const avatarModal = document.querySelector("#avatar-modal");
const avatarForm = avatarModal.querySelector(".modal__form");
const avatarSubmitButton = avatarModal.querySelector(".modal__submit-button");
const avatarModalCloseButton = avatarModal.querySelector(
  ".modal__close-button"
);
const avatarInput = avatarModal.querySelector("#profile-avatar-input");

// Delete form elements
const deleteModal = document.querySelector("#delete-modal");
const deleteForm = deleteModal.querySelector(".modal__form");
const deleteModalCancelButton = deleteModal.querySelector(
  ".modal__submit-button:last-of-type"
);
const deleteModalCloseButton = deleteModal.querySelector(
  ".modal__close-button"
);

// Preview image popup elements
const previewModal = document.querySelector("#preview-modal");
const previewModalImageEl = previewModal.querySelector(".modal__image");
const previewModalCaptionEl = previewModal.querySelector(".modal__caption");
const previewModalCloseButton = previewModal.querySelector(
  ".modal__close-button_preview"
);

//Card related elements
const cardTemplate = document.querySelector("#card-template");
const cardsList = document.querySelector(".cards__list");

let selectedCard, selectedCardId;

// Set initial image sources
document.querySelector(".profile__edit-button img").src = pencilIcon;
document.querySelector(".profile__add-button img").src = plusIcon;
document.querySelector(".modal__close-button-icon").src = closeIcon;
document.querySelector(".profile__pencil-icon").src = pencilIconLight;

// API instance
const api = new Api({
  baseUrl: "https://around-api.en.tripleten-services.com/v1",
  headers: {
    authorization: "28aac5fc-2755-4f17-ade9-3d966c5a6837",
    "Content-Type": "application/json",
  },
});

// Fetch initial data
api
  .getAppInfo()
  .then(([cards, userInfo]) => {
    if (userInfo.avatar) {
      profileAvatar.src = userInfo.avatar;
    }

    profileName.textContent = userInfo.name;
    profileDescription.textContent = userInfo.about;

    if (Array.isArray(cards)) {
      cards.forEach((item) => {
        const cardElement = getCardElement(item);
        cardsList.append(cardElement);
      });
    }
  })
  .catch(console.error);

// Event Handlers
function handleAddCardSubmit(evt) {
  evt.preventDefault();

  const inputValues = { name: cardNameInput.value, link: cardLinkInput.value };

  const cardSubmitButton = evt.submitter;
  cardSubmitButton.textContent = "Saving...";

  api
    .addCard(inputValues)
    .then((savedCard) => {
      const cardEl = getCardElement(savedCard);
      cardsList.prepend(cardEl);
      evt.target.reset();

      if (typeof disableButton === "function") {
        disableButton(cardSubmitButton, settings);
      }

      closeModal(cardModal);
    })
    .catch(console.error)
    .finally(() => {
      cardSubmitButton.textContent = "Save";
    });
}

function handleAvatarFormSubmit(evt) {
  evt.preventDefault();

  const submitButton = evt.submitter;
  submitButton.textContent = "Saving...";

  disableButton(avatarSubmitButton, settings);

  api
    .editAvatarInfo(avatarInput.value)
    .then((data) => {
      profileAvatar.src = data.avatar;
      closeModal(avatarModal);
      avatarForm.reset();
      disableButton(avatarSubmitButton, settings);
    })
    .catch(console.error)
    .finally(() => {
      submitButton.textContent = "Save";
    });
}

function handleDeleteSubmit(evt) {
  evt.preventDefault();
  evt.submitter.textContent = "Deleting...";

  api
    .deleteCard(selectedCardId)
    .then(() => {
      selectedCard.remove();
      closeModal(deleteModal);
    })
    .catch(console.error)
    .finally(() => {
      evt.submitter.textContent = "Delete";
    });
}

deleteForm.addEventListener("submit", handleDeleteSubmit);

enableValidation(settings);

// Utility Functions
function getCardElement(data) {
  const cardElement = cardTemplate.content
    .querySelector(".card")
    .cloneNode(true);
  const cardNameEl = cardElement.querySelector(".card__title");
  const cardImage = cardElement.querySelector(".card__image");
  const cardLikeButton = cardElement.querySelector(".card__like-button");
  const cardDeleteButton = cardElement.querySelector(".card__delete-button");

  if (data.isLiked) {
    cardLikeButton.classList.add("card__like-button_liked");
  }

  cardNameEl.textContent = data.name;
  cardImage.src = data.link;
  cardImage.alt = data.name;

  cardLikeButton.addEventListener("click", (evt) => {
    cardLikeButton.classList.toggle("card__like-button_liked");
    handleLike(evt, data._id);
  });

  cardImage.addEventListener("click", () => {
    openModal(previewModal);
    previewModalCaptionEl.textContent = data.name;
    previewModalImageEl.src = data.link;
    previewModalImageEl.alt = data.name;
  });

  cardDeleteButton.addEventListener("click", () =>
    handleDeleteCard(cardElement, data._id)
  );

  return cardElement;
}

function handleDeleteCard(cardElement, cardId) {
  selectedCard = cardElement;
  selectedCardId = cardId;
  openModal(deleteModal);
}

function handleLike(evt, id) {
  const likeButton = evt.target;
  const isLiked = likeButton.classList.contains("card__like-button_liked");

  likeButton.disabled = true;

  api
    .changeLikeStatus(id, !isLiked)
    .then((updatedCard) => {
      if ("isLiked" in updatedCard) {
        likeButton.classList.toggle(
          "card__like-button_liked",
          updatedCard.isLiked
        );
      } else {
        likeButton.classList.toggle("card__like-button_liked", !isLiked);
      }
    })
    .catch(console.error)
    .finally(() => {
      likeButton.disabled = false;
    });
}

function openModal(modal) {
  modal.classList.add("modal_opened");
  document.addEventListener("keydown", handleEscKeyPress);
  modal.addEventListener("mousedown", handleOverlayClick);
}

function closeModal(modal) {
  modal.classList.remove("modal_opened");
  document.removeEventListener("keydown", handleEscKeyPress);
  modal.removeEventListener("mousedown", handleOverlayClick);
}

function handleEditFormSubmit(evt) {
  evt.preventDefault();
  evt.submitter.textContent = "Saving...";

  api
    .editUserInfo({
      name: editModalNameInput.value,
      about: editModalDescriptionInput.value,
    })
    .then((data) => {
      profileName.textContent = data.name;
      profileDescription.textContent = data.about;
      closeModal(editModal);
    })
    .catch(console.error)
    .finally(() => {
      evt.submitter.textContent = "Save";
    });
}

function handleOverlayClick(evt) {
  if (evt.target.classList.contains("modal_opened")) {
    closeModal(evt.target);
  }
}

function handleEscKeyPress(evt) {
  if (evt.key === "Escape") {
    const openModal = document.querySelector(".modal_opened");
    if (openModal) {
      closeModal(openModal);
    }
  }
}

// Event Listeners
profileEditButton.addEventListener("click", () => {
  editModalNameInput.value = profileName.textContent;
  editModalDescriptionInput.value = profileDescription.textContent;
  resetValidation(
    editFormElement,
    [editModalNameInput, editModalDescriptionInput],
    settings
  );
  openModal(editModal);
});

editModalCloseButton.addEventListener("click", () => {
  closeModal(editModal);
});

cardModalButton.addEventListener("click", () => {
  openModal(cardModal);
});

cardModalCloseButton.addEventListener("click", () => {
  closeModal(cardModal);
});

previewModalCloseButton.addEventListener("click", () => {
  closeModal(previewModal);
});

editFormElement.addEventListener("submit", handleEditFormSubmit);

cardForm.addEventListener("submit", handleAddCardSubmit);

avatarModalButton.addEventListener("click", () => {
  openModal(avatarModal);
});

avatarModalCloseButton.addEventListener("click", () => {
  closeModal(avatarModal);
});

avatarForm.addEventListener("submit", handleAvatarFormSubmit);

deleteModalCancelButton.addEventListener("click", () => {
  closeModal(deleteModal);
});

deleteModalCloseButton.addEventListener("click", () => {
  closeModal(deleteModal);
});
