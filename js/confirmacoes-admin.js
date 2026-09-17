import { collection, onSnapshot, orderBy, query } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-auth.js";
import { auth, db } from "./firebase-config.js?v=2026.09.17.2";

const loginPanel = document.querySelector("#admin-login-panel");
const loginForm = document.querySelector("#admin-login-form");
const emailInput = document.querySelector("#admin-email");
const passwordInput = document.querySelector("#admin-password");
const loginError = document.querySelector("#admin-login-error");
const loginButton = document.querySelector("#admin-login-submit");
const dashboard = document.querySelector("#admin-dashboard");
const logoutButton = document.querySelector("#admin-logout");
const totalPeople = document.querySelector("#admin-total-people");
const totalGroups = document.querySelector("#admin-total-groups");
const status = document.querySelector("#admin-status");
const permissionError = document.querySelector("#admin-permission-error");
const confirmationList = document.querySelector("#admin-confirmation-list");

let unsubscribeConfirmations = null;

function stopConfirmationsListener() {
  if (unsubscribeConfirmations) unsubscribeConfirmations();
  unsubscribeConfirmations = null;
}

function clearDashboardData() {
  totalPeople.textContent = "0";
  totalGroups.textContent = "0 confirmações recebidas";
  confirmationList.replaceChildren();
}

function showLogin() {
  loginPanel.hidden = false;
  dashboard.hidden = true;
  loginError.textContent = "";
  status.textContent = "";
  permissionError.hidden = true;
  clearDashboardData();
}

function showDashboard() {
  loginPanel.hidden = true;
  dashboard.hidden = false;
  permissionError.hidden = true;
}

function pluralizarPessoas(quantity) {
  return `${quantity} ${quantity === 1 ? "pessoa" : "pessoas"}`;
}

function renderConfirmations(snapshot) {
  let total = 0;
  const cards = [];

  snapshot.forEach((documentSnapshot) => {
    const data = documentSnapshot.data();
    const names = Array.isArray(data.nomes) ? data.nomes.filter((name) => typeof name === "string" && name.trim()) : [];
    const quantity = Number.isFinite(Number(data.quantidade)) ? Number(data.quantidade) : names.length;
    total += quantity;

    const card = document.createElement("article");
    card.className = "admin-confirmation-card";
    const namesList = document.createElement("ul");
    namesList.className = "admin-confirmation-names";
    names.forEach((name) => {
      const item = document.createElement("li");
      item.textContent = name;
      namesList.append(item);
    });
    const quantityText = document.createElement("p");
    quantityText.className = "admin-confirmation-quantity";
    quantityText.textContent = pluralizarPessoas(quantity);
    card.append(namesList, quantityText);
    cards.push(card);
  });

  totalPeople.textContent = String(total);
  totalGroups.textContent = `${snapshot.size} ${snapshot.size === 1 ? "confirmação recebida" : "confirmações recebidas"}`;
  confirmationList.replaceChildren(...cards);
  if (snapshot.empty) {
    const empty = document.createElement("p");
    empty.className = "admin-empty";
    empty.textContent = "Nenhuma confirmação recebida ainda.";
    confirmationList.append(empty);
  }
}

function startConfirmationsListener() {
  stopConfirmationsListener();
  clearDashboardData();
  permissionError.hidden = true;
  status.textContent = "Carregando confirmações...";

  const confirmationsQuery = query(
    collection(db, "confirmacoes"),
    orderBy("confirmadoEm", "desc")
  );

  unsubscribeConfirmations = onSnapshot(
    confirmationsQuery,
    (snapshot) => {
      renderConfirmations(snapshot);
      status.textContent = "";
    },
    (error) => {
      stopConfirmationsListener();
      clearDashboardData();
      if (error?.code === "permission-denied") {
        permissionError.hidden = false;
        status.textContent = "";
        return;
      }
      status.textContent = "Não foi possível carregar as confirmações agora. Tente novamente em instantes.";
      console.error("Falha ao acompanhar confirmações:", error);
    }
  );
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (loginButton.disabled) return;

  loginError.textContent = "";
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  if (!email || !password) {
    loginError.textContent = "Informe seu e-mail e sua senha.";
    return;
  }

  loginButton.disabled = true;
  loginButton.textContent = "Entrando...";
  try {
    await signInWithEmailAndPassword(auth, email, password);
  } catch (error) {
    loginError.textContent = "Não foi possível entrar. Confira seus dados e tente novamente.";
    console.error("Falha no login:", error);
  } finally {
    loginButton.disabled = false;
    loginButton.textContent = "Entrar";
  }
});

logoutButton.addEventListener("click", async () => {
  logoutButton.disabled = true;
  try {
    await signOut(auth);
  } catch (error) {
    status.textContent = "Não foi possível sair agora. Tente novamente.";
    console.error("Falha ao sair:", error);
  } finally {
    logoutButton.disabled = false;
  }
});

onAuthStateChanged(auth, (user) => {
  stopConfirmationsListener();
  if (!user) {
    showLogin();
    return;
  }

  showDashboard();
  startConfirmationsListener();
});
