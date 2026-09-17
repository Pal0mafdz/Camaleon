/**
 * Puebla con datos sintéticos a cualquier usuario que no tenga movimientos
 * todavía (cuentas creadas por signup antes de este cambio). Karla y Roberto
 * ya tienen ~6 meses de movimientos sembrados por `seed.ts`, así que nunca
 * los toca. Se llama sola al arrancar el server (`apps/server/src/index.ts`)
 * — es barata (un count por usuario) e idempotente (una vez poblado, el
 * conteo deja de ser cero, así que reiniciar el server no lo vuelve a hacer).
 */
import {
  countTransactions,
  createGoal,
  insertTransactions,
  listUsers,
  updateUserProfile,
} from "../queries";
import { generateSyntheticProfile } from "./profile";

export async function backfillSyntheticUsers() {
  const allUsers = await listUsers();

  for (const user of allUsers) {
    const existing = await countTransactions(user.id);
    if (existing > 0) continue;

    const profile = generateSyntheticProfile(user.id);
    await updateUserProfile(user.id, {
      age: profile.age,
      occupation: profile.occupation,
      monthlyIncome: profile.monthlyIncome,
      balance: profile.balance,
    });
    await insertTransactions(profile.transactions);
    if (profile.goal) {
      await createGoal({ userId: user.id, ...profile.goal });
    }

    console.log(`[backfill] ${user.name} (${user.id}) poblado con datos sintéticos`);
  }
}
