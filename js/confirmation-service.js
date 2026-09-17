import { doc, serverTimestamp, setDoc } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { db } from "./firebase-config.js?v=2026.09.17.2";

export async function salvarConfirmacao(confirmationId, nomes) {
  const confirmationRef = doc(db, "confirmacoes", confirmationId);

  await setDoc(confirmationRef, {
    nomes,
    quantidade: nomes.length,
    confirmadoEm: serverTimestamp()
  });
}
