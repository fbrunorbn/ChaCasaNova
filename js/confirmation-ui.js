import { salvarConfirmacao } from "./confirmation-service.js?v=2026.09.17.2";

const STORAGE_KEY = "chaCasaNova.confirmacao";
const MAX_ATTENDEES = 15;
const MAX_COMPANIONS = MAX_ATTENDEES - 1;

function normalizarNome(value) {
  return String(value ?? "").trim().replace(/\s+/g, " ");
}

function mensagemNomeInvalido(nome) {
  if (!nome) return "Digite um nome para continuar.";
  if (nome.length < 2) return "Use pelo menos 2 caracteres.";
  if (nome.length > 80) return "Use no máximo 80 caracteres.";
  return "";
}

function criarIdDeConfirmacao() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();

  const randomValues = new Uint32Array(4);
  if (window.crypto?.getRandomValues) {
    window.crypto.getRandomValues(randomValues);
    return `c-${Date.now().toString(36)}-${Array.from(randomValues, (value) => value.toString(36)).join("")}`;
  }

  return `c-${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}-${Math.random().toString(36).slice(2)}`;
}

function lerConfirmacaoLocal() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw);
    return value && typeof value.id === "string" ? value : null;
  } catch {
    return null;
  }
}

function salvarConfirmacaoLocal(value) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // A confirmação segue funcionando quando o navegador bloqueia o armazenamento local.
  }
}

function obterOuCriarConfirmacaoPendente() {
  const existing = lerConfirmacaoLocal();
  if (existing?.id) return existing;

  const pending = { id: criarIdDeConfirmacao(), confirmed: false, attempted: false };
  salvarConfirmacaoLocal(pending);
  return pending;
}

function pluralizarPessoas(quantity) {
  return `${quantity} ${quantity === 1 ? "pessoa" : "pessoas"}`;
}

function erroDeDocumentoExistente(error, hadPreviousAttempt) {
  const code = String(error?.code ?? "").toLowerCase();
  if (["already-exists", "already_exists", "alreadyexists"].includes(code)) return true;

  // Em regras create-only, uma nova tentativa com o mesmo ID pode retornar permission-denied.
  // Só é tratada como duplicada após uma tentativa anterior já registrada localmente.
  return code === "permission-denied" && hadPreviousAttempt === true;
}

export function initConfirmationSection() {
  const form = document.querySelector("#confirmation-form");
  if (!form) return;

  const mainInput = document.querySelector("#confirmation-name");
  const mainError = document.querySelector("#confirmation-name-error");
  const companionFields = document.querySelector("#companion-fields");
  const addCompanionButton = document.querySelector("#add-companion");
  const count = document.querySelector("#confirmation-count");
  const feedback = document.querySelector("#confirmation-feedback");
  const submitButton = document.querySelector("#confirm-presence");
  const success = document.querySelector("#confirmation-success");
  const successTitle = document.querySelector("#confirmation-success-title");
  const successText = document.querySelector("#confirmation-success-text");
  if (!mainInput || !mainError || !companionFields || !addCompanionButton || !count || !feedback || !submitButton || !success || !successTitle || !successText) return;

  const state = { isSubmitting: false, companionIndex: 0 };

  function companionInputs() {
    return Array.from(companionFields.querySelectorAll("input[data-companion-name]"));
  }

  function atualizarContador() {
    const names = [mainInput, ...companionInputs()]
      .map((input) => normalizarNome(input.value))
      .filter(Boolean);
    count.textContent = pluralizarPessoas(names.length);
  }

  function atualizarLimiteDeAcompanhantes() {
    const reachedLimit = companionInputs().length >= MAX_COMPANIONS;
    addCompanionButton.disabled = reachedLimit || state.isSubmitting;
    addCompanionButton.textContent = reachedLimit ? "Limite de acompanhantes alcançado" : "+ Adicionar acompanhante";
  }

  function mostrarForm() {
    form.hidden = false;
    success.hidden = true;
  }

  function mostrarConfirmacao(title, text) {
    form.hidden = true;
    success.hidden = false;
    successTitle.textContent = title;
    successText.textContent = text;
  }

  function limparErros() {
    mainError.textContent = "";
    companionFields.querySelectorAll(".field-error").forEach((fieldError) => {
      fieldError.textContent = "";
    });
    feedback.textContent = "";
    feedback.removeAttribute("data-error");
  }

  function adicionarAcompanhante() {
    if (state.isSubmitting || companionInputs().length >= MAX_COMPANIONS) return;
    state.companionIndex += 1;
    const id = `companion-name-${state.companionIndex}`;
    const row = document.createElement("div");
    row.className = "companion-row";
    row.innerHTML = `
      <div class="companion-input-wrap">
        <label class="visually-hidden" for="${id}">Nome do acompanhante</label>
        <input id="${id}" data-companion-name type="text" maxlength="80" autocomplete="name" placeholder="Nome do acompanhante">
        <p class="field-error" aria-live="polite"></p>
      </div>
      <button class="remove-companion" type="button" aria-label="Remover acompanhante">&times;</button>
    `;

    const input = row.querySelector("input");
    const remove = row.querySelector(".remove-companion");
    input.addEventListener("input", () => {
      row.querySelector(".field-error").textContent = "";
      atualizarContador();
    });
    remove.addEventListener("click", () => {
      row.remove();
      atualizarContador();
      atualizarLimiteDeAcompanhantes();
    });
    companionFields.append(row);
    atualizarLimiteDeAcompanhantes();
    input.focus();
  }

  function coletarNomesValidos() {
    const mainName = normalizarNome(mainInput.value);
    const mainValidation = mensagemNomeInvalido(mainName);
    mainError.textContent = mainValidation;

    const nomes = [];
    if (!mainValidation) nomes.push(mainName);

    let firstInvalidInput = mainValidation ? mainInput : null;
    companionInputs().forEach((input) => {
      const name = normalizarNome(input.value);
      const error = input.closest(".companion-row").querySelector(".field-error");
      if (!name) {
        error.textContent = "";
        return;
      }

      const validation = mensagemNomeInvalido(name);
      error.textContent = validation;
      if (validation) {
        firstInvalidInput ??= input;
      } else {
        nomes.push(name);
      }
    });

    return { nomes, firstInvalidInput };
  }

  function setSubmitting(isSubmitting) {
    state.isSubmitting = isSubmitting;
    form.querySelectorAll("input, button").forEach((control) => {
      if (control !== addCompanionButton) control.disabled = isSubmitting;
    });
    submitButton.textContent = isSubmitting ? "Confirmando..." : "Confirmar presença";
    atualizarLimiteDeAcompanhantes();
  }

  const localConfirmation = lerConfirmacaoLocal();
  if (localConfirmation?.confirmed === true) {
    mostrarConfirmacao(
      "Presença já confirmada 💙",
      "Obrigada por fazer parte desse momento com a gente."
    );
    return;
  }

  mostrarForm();
  atualizarContador();
  atualizarLimiteDeAcompanhantes();

  mainInput.addEventListener("input", () => {
    mainError.textContent = "";
    atualizarContador();
  });
  addCompanionButton.addEventListener("click", adicionarAcompanhante);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (state.isSubmitting) return;

    limparErros();
    const { nomes, firstInvalidInput } = coletarNomesValidos();
    if (firstInvalidInput) {
      firstInvalidInput.focus();
      return;
    }

    const confirmation = obterOuCriarConfirmacaoPendente();
    const hadPreviousAttempt = confirmation.attempted === true;
    const pendingConfirmation = { ...confirmation, attempted: true };
    salvarConfirmacaoLocal(pendingConfirmation);
    setSubmitting(true);

    try {
      await salvarConfirmacao(pendingConfirmation.id, nomes);
      salvarConfirmacaoLocal({ id: pendingConfirmation.id, confirmed: true });
      mostrarConfirmacao(
        "Presença confirmada! 💙",
        "Já estamos felizes de saber que você estará com a gente."
      );
    } catch (error) {
      if (erroDeDocumentoExistente(error, hadPreviousAttempt)) {
        salvarConfirmacaoLocal({ id: pendingConfirmation.id, confirmed: true });
        mostrarConfirmacao(
          "Essa presença já foi confirmada 💙",
          "Obrigada por fazer parte desse momento com a gente."
        );
      } else {
        feedback.dataset.error = "true";
        feedback.textContent = "Não conseguimos confirmar agora. Tente novamente em instantes.";
      }
    } finally {
      setSubmitting(false);
    }
  });
}
