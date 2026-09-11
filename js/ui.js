const placeholder = "./assets/presentes/placeholder.svg";

export const elements = {
  grid: document.querySelector("#presentes-grid"),
  connectionMessage: document.querySelector("#reservation-status"),
  dialog: document.querySelector("#reservation-dialog"),
  form: document.querySelector("#reservation-form"),
  dialogTitle: document.querySelector("#dialog-title"),
  input: document.querySelector("#guest-name"),
  nameError: document.querySelector("#name-error"),
  submitButton: document.querySelector("#reservation-form [type='submit']"),
  toastRegion: document.querySelector("#toast-region")
};

function createExampleButton(presente) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "button button--secondary";
  button.textContent = presente.exemploUrl ? "Exemplo" : "Em breve";
  button.disabled = !presente.exemploUrl;
  if (presente.exemploUrl) button.addEventListener("click", () => window.open(presente.exemploUrl, "_blank", "noopener,noreferrer"));
  return button;
}

export function renderPresentes(presentes, state, onGift) {
  const fragment = document.createDocumentFragment();
  presentes.forEach((presente, index) => {
    const reservado = state.reservas.has(presente.id);
    const card = document.createElement("article");
    card.className = "presente-card";
    card.dataset.presenteId = presente.id;
    card.style.animationDelay = `${Math.min(index * 25, 300)}ms`;

    const imageWrap = document.createElement("div");
    imageWrap.className = "presente-image-wrap";
    const image = document.createElement("img");
    image.className = "presente-image";
    image.src = presente.imagem;
    image.alt = presente.nome;
    image.loading = "lazy";
    image.addEventListener("error", () => { if (!image.src.endsWith("placeholder.svg")) image.src = placeholder; }, { once: true });
    imageWrap.append(image);

    const title = document.createElement("h3");
    title.textContent = presente.nome;
    const actions = document.createElement("div");
    actions.className = "card-actions";
    actions.append(createExampleButton(presente));

    const giftButton = document.createElement("button");
    giftButton.type = "button";
    giftButton.className = "button button--primary";
    giftButton.setAttribute("aria-label", `Presentear ${presente.nome}`);
    if (reservado) {
      giftButton.textContent = "Já escolhido";
      giftButton.disabled = true;
      giftButton.classList.add("button--reserved");
    } else if (state.isLoadingReservations) {
      giftButton.textContent = "Verificando...";
      giftButton.disabled = true;
      giftButton.classList.add("button--loading");
    } else if (state.hasConnectionError) {
      giftButton.textContent = "Indisponível";
      giftButton.disabled = true;
    } else {
      giftButton.textContent = "Presentear";
      giftButton.addEventListener("click", () => onGift(presente));
    }
    actions.append(giftButton);
    card.append(imageWrap, title, actions);
    fragment.append(card);
  });
  elements.grid.replaceChildren(fragment);
}

export function openReservationDialog(presente) {
  elements.dialog.dataset.presenteId = presente.id;
  elements.dialogTitle.textContent = `Presentear ${presente.nome}`;
  elements.form.reset();
  elements.nameError.textContent = "";
  elements.dialog.showModal();
  requestAnimationFrame(() => elements.input.focus());
}

export function closeReservationDialog() {
  elements.dialog.close();
  elements.dialog.removeAttribute("data-presente-id");
}

export function showToast(title, message, isError = false) {
  const toast = document.createElement("div");
  toast.className = `toast${isError ? " toast--error" : ""}`;
  const strong = document.createElement("strong");
  strong.textContent = title;
  const text = document.createElement("span");
  text.textContent = message;
  toast.append(strong, text);
  elements.toastRegion.replaceChildren(toast);
  window.setTimeout(() => toast.remove(), 5200);
}
