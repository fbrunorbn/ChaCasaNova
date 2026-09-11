import { collection, doc, onSnapshot, runTransaction, serverTimestamp } from "https://www.gstatic.com/firebasejs/12.18.0/firebase-firestore.js";
import { db } from "./firebase-config.js";

export function acompanharReservas(onNext, onError) {
  return onSnapshot(collection(db, "reservas"), onNext, onError);
}

export async function reservarPresente(presenteId, nome) {
  const reservaRef = doc(db, "reservas", presenteId);
  await runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(reservaRef);
    if (snapshot.exists()) {
      const error = new Error("PRESENTE_JA_ESCOLHIDO");
      error.code = "PRESENTE_JA_ESCOLHIDO";
      throw error;
    }
    transaction.set(reservaRef, { nome, reservadoEm: serverTimestamp() });
  });
}
