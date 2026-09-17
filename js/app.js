import { presentes } from "./presentes.js?v=2026.09.16.1";
import { acompanharReservas, reservarPresente } from "./firebase-service.js?v=2026.09.16.1";
import { closeReservationDialog, elements, openReservationDialog, renderPresentes, showToast } from "./ui.js?v=2026.09.16.1";

const reservas = new Map();
const state = { reservas, isLoadingReservations: true, hasConnectionError: false, isSubmitting: false };

function estaReservado(id) { return reservas.has(id); }
function refreshCards() { renderPresentes(presentes, state, openReservationDialog); }
function nomeValido(nome) {
  if (nome.length < 2) return "Digite pelo menos 2 caracteres.";
  if (nome.length > 80) return "Use no máximo 80 caracteres.";
  return "";
}

elements.form.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (state.isSubmitting) return;
  const presenteId = elements.dialog.dataset.presenteId;
  const nomeLimpo = elements.input.value.trim().replace(/\s+/g, " ");
  const validationMessage = nomeValido(nomeLimpo);
  if (validationMessage) {
    elements.nameError.textContent = validationMessage;
    elements.input.focus();
    return;
  }
  if (!presenteId || estaReservado(presenteId)) {
    closeReservationDialog();
    showToast("Ops!", "Alguém acabou de escolher esse presente.", true);
    return;
  }
  state.isSubmitting = true;
  elements.submitButton.disabled = true;
  elements.submitButton.textContent = "Reservando...";
  elements.nameError.textContent = "";
  try {
    await reservarPresente(presenteId, nomeLimpo);
    reservas.set(presenteId, { nome: nomeLimpo });
    closeReservationDialog();
    refreshCards();
    showToast("Presente reservado! 💙", "Obrigada por fazer parte do nosso primeiro lar.");
  } catch (error) {
    if (error?.code === "PRESENTE_JA_ESCOLHIDO" || error?.message === "PRESENTE_JA_ESCOLHIDO") {
      closeReservationDialog();
      showToast("💙 Ops!", "Alguém acabou de escolher esse presente.", true);
    } else {
      elements.nameError.textContent = "Não foi possível reservar agora. Tente novamente.";
    }
  } finally {
    state.isSubmitting = false;
    elements.submitButton.disabled = false;
    elements.submitButton.textContent = "Confirmar presente";
  }
});

elements.input.addEventListener("input", () => { elements.nameError.textContent = ""; });
elements.dialog.querySelector(".dialog-close").addEventListener("click", closeReservationDialog);
elements.dialog.querySelector("[data-action='cancel']").addEventListener("click", closeReservationDialog);
elements.dialog.addEventListener("click", (event) => { if (event.target === elements.dialog) closeReservationDialog(); });

acompanharReservas(
  (snapshot) => {
    reservas.clear();
    snapshot.forEach((documentSnapshot) => reservas.set(documentSnapshot.id, documentSnapshot.data()));
    state.isLoadingReservations = false;
    state.hasConnectionError = false;
    elements.connectionMessage.textContent = "";
    refreshCards();
  },
  (error) => {
    console.error("Falha ao acompanhar reservas:", error);
    state.isLoadingReservations = false;
    state.hasConnectionError = true;
    elements.connectionMessage.textContent = "Não conseguimos verificar a disponibilidade dos presentes agora. Tente novamente em instantes.";
    refreshCards();
  }
);

function registerWebMcpTool() {
  const context = document.modelContext;
  if (!context?.registerTool) return;
  try {
    void Promise.resolve(context.registerTool({
      name: "reserve_gift",
      title: "Reservar presente",
      description: "Reserva um presente disponível da lista de J & Y usando o nome do convidado.",
      inputSchema: {
        type: "object",
        properties: {
          giftId: { type: "string", enum: presentes.map(({ id }) => id) },
          guestName: { type: "string", minLength: 2, maxLength: 80 }
        },
        required: ["giftId", "guestName"],
        additionalProperties: false
      },
      annotations: { readOnlyHint: false, untrustedContentHint: false },
      async execute(input) {
        const nome = String(input?.guestName ?? "").trim().replace(/\s+/g, " ");
        const presente = presentes.find(({ id }) => id === input?.giftId);
        const invalid = nomeValido(nome);
        if (!presente || invalid) throw new Error(invalid || "Presente inválido.");
        if (estaReservado(presente.id)) throw new Error("PRESENTE_JA_ESCOLHIDO");
        await reservarPresente(presente.id, nome);
        reservas.set(presente.id, { nome });
        refreshCards();
        return { giftId: presente.id, status: "reserved" };
      }
    })).catch((error) => console.warn("WebMCP indisponível:", error));
  } catch (error) { console.warn("WebMCP indisponível:", error); }
}

refreshCards();
registerWebMcpTool();
export { estaReservado };
