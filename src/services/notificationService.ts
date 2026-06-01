import { RecurringTransaction, Transaction } from '../types';
import { addDays, parseISO, startOfDay } from 'date-fns';

export const isNotificationSupported = (): boolean => {
  return typeof window !== 'undefined' && 'Notification' in window;
};

export const getNotificationPermission = (): NotificationPermission => {
  if (!isNotificationSupported()) return 'default';
  return Notification.permission;
};

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!isNotificationSupported()) return false;
  try {
    const permission = await Notification.requestPermission();
    localStorage.setItem('notification_permission_granted', (permission === 'granted').toString());
    return permission === 'granted';
  } catch (error) {
    console.error('Erro ao solicitar permissões de notificação:', error);
    return false;
  }
};

export const showNativeNotification = (title: string, options?: NotificationOptions): Notification | null => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') {
    return null;
  }
  try {
    return new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    });
  } catch (error) {
    console.error('Erro ao exibir notificação:', error);
    return null;
  }
};

/**
 * Checks for bills/transactions approaching due date and alerts the user natively.
 * Ensures each bill is alerted exactly once to prevent spam.
 */
export const checkAndTriggerDueReminders = (
  recurringTransactions: RecurringTransaction[],
  transactions: Transaction[],
  daysBefore: number = 3
) => {
  if (!isNotificationSupported() || Notification.permission !== 'granted') return;

  const today = startOfDay(new Date());
  const maxFutureDate = addDays(today, daysBefore);
  
  // Track notified IDs to avoid multiple alerts in the same session or day
  const storageKey = 'financial_reminders_sent_v1';
  let sentRemindersMap: Record<string, string> = {};
  
  try {
    sentRemindersMap = JSON.parse(localStorage.getItem(storageKey) || '{}');
  } catch (e) {
    sentRemindersMap = {};
  }
  
  const todayStr = today.toISOString().split('T')[0];
  let changed = false;

  // 1. Process recurring transactions
  recurringTransactions.forEach(rt => {
    if (!rt.active) return;

    const lastDate = rt.lastProcessedDate ? parseISO(rt.lastProcessedDate) : parseISO(rt.startDate);
    const nextDate = rt.frequency === 'weekly' ? addDays(lastDate, 7) : addDays(lastDate, 30);

    if (nextDate >= today && nextDate <= maxFutureDate) {
      const occurrenceKey = `${rt.id}-${nextDate.toISOString().split('T')[0]}`;
      // Check if was already notified today or on this occurrence key
      if (!sentRemindersMap[occurrenceKey]) {
        showNativeNotification('Conta Agendada Próxima', {
          body: `Lembrete: "${rt.description}" no valor de R$ ${rt.amount.toFixed(2)} vence em ${nextDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}.`,
          tag: rt.id,
        });
        sentRemindersMap[occurrenceKey] = todayStr;
        changed = true;
      }
    }
  });

  // 2. Process non-consolidated expenses (manual pending items)
  transactions.forEach(t => {
    if (t.type === 'expense' && !t.consolidated) {
      const tDate = parseISO(t.date);
      if (tDate >= today && tDate <= maxFutureDate) {
        const occurrenceKey = `${t.id}-${t.date}`;
        if (!sentRemindersMap[occurrenceKey]) {
          showNativeNotification('Conta a Vencer', {
            body: `A despesa "${t.description}" de R$ ${t.amount.toFixed(2)} vence em ${tDate.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}.`,
            tag: t.id,
          });
          sentRemindersMap[occurrenceKey] = todayStr;
          changed = true;
        }
      }
    }
  });

  // Clean old reminders (older than 30 days) to keep localStorage lightweight
  if (changed) {
    const freshMap: Record<string, string> = {};
    const cutoffDate = addDays(today, -30);
    Object.keys(sentRemindersMap).forEach(key => {
      const sentDateStr = sentRemindersMap[key];
      try {
        const sentDate = parseISO(sentDateStr);
        if (sentDate >= cutoffDate) {
          freshMap[key] = sentDateStr;
        }
      } catch (e) {
        // preserve if unparseable
        freshMap[key] = sentDateStr;
      }
    });

    localStorage.setItem(storageKey, JSON.stringify(freshMap));
  }
};
