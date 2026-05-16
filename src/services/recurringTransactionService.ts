import { db } from '../firebase';
import { 
  collection, 
  doc, 
  serverTimestamp, 
  runTransaction,
  increment
} from 'firebase/firestore';
import { 
  parseISO, 
  addWeeks, 
  addMonths, 
  isBefore, 
  isSameDay, 
  format,
  startOfDay
} from 'date-fns';
import { RecurringTransaction } from '../types';

/**
 * Processes recurring transactions for a user.
 * For each active recurring transaction, it checks if any occurrences are due 
 * up to the current date and creates consolidated transactions accordingly.
 */
export const processRecurringTransactions = async (userId: string, recurringTransactions: RecurringTransaction[]) => {
  const today = startOfDay(new Date());
  
  for (const rt of recurringTransactions) {
    if (!rt.active) continue;

    // Determine the first date to start checking from
    let currentDateToCheck = rt.lastProcessedDate 
      ? (rt.frequency === 'weekly' ? addWeeks(parseISO(rt.lastProcessedDate), 1) : addMonths(parseISO(rt.lastProcessedDate), 1))
      : parseISO(rt.startDate);

    // Process all due dates up to today
    while (isBefore(currentDateToCheck, today) || isSameDay(currentDateToCheck, today)) {
      const dateString = format(currentDateToCheck, 'yyyy-MM-dd');
      
      try {
        await runTransaction(db, async (transaction) => {
          const accountRef = doc(db, `users/${userId}/accounts`, rt.accountId);
          const recurringRef = doc(db, `users/${userId}/recurring_transactions`, rt.id);
          const transactionDocRef = doc(collection(db, `users/${userId}/transactions`));

          const accountSnap = await transaction.get(accountRef);
          if (!accountSnap.exists()) {
            throw new Error(`Account ${rt.accountId} not found for recurring transaction ${rt.id}`);
          }

          // Create the new transaction
          transaction.set(transactionDocRef, {
            id: transactionDocRef.id,
            type: rt.type,
            amount: rt.amount,
            description: `${rt.description} (Recorrente)`,
            date: dateString,
            categoryId: rt.categoryId,
            costCenterId: rt.costCenterId || rt.categoryId, // Fallback to categoryId if costCenterId is missing
            accountId: rt.accountId,
            userId: userId,
            createdAt: serverTimestamp(),
            consolidated: true, // As requested
            notes: `Gerado automaticamente de transação recorrente: ${rt.description}`
          });

          // Update Account Balance
          const balanceChange = rt.type === 'income' ? rt.amount : -rt.amount;
          transaction.update(accountRef, {
            balance: increment(balanceChange),
            updatedAt: serverTimestamp()
          });

          // Update Recurring Transaction metadata
          transaction.update(recurringRef, {
            lastProcessedDate: dateString,
            updatedAt: serverTimestamp()
          });
        });
        
      } catch (error) {
        console.error(`Error processing recurring transaction ${rt.id}:`, error);
        // Break the while loop for this specific recurring transaction if it fails
        // to avoid infinite loops if it's a persistent error
        break; 
      }

      // Move to the next occurrence
      currentDateToCheck = rt.frequency === 'weekly' 
        ? addWeeks(currentDateToCheck, 1) 
        : addMonths(currentDateToCheck, 1);
    }
  }
};
