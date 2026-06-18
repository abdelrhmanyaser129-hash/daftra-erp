import { supabase } from './supabase';

export type SalesInvoiceStatus = 'draft' | 'unpaid' | 'partial' | 'paid' | 'returned' | 'partially_returned';

export const toNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

export const getInvoiceNumber = (invoice: any): string =>
  invoice?.invoice_number || invoice?.invoiceNumber || '';

export const getClientName = (client: any): string =>
  client?.full_name || client?.fullName || client?.name || '';

export const calculateInvoiceStatus = (
  total: number,
  paidAmount: number,
  returnedAmount: number,
  draft = false
): SalesInvoiceStatus => {
  if (draft) return 'draft';
  const safeTotal = Math.max(0, toNumber(total));
  const paid = Math.max(0, toNumber(paidAmount));
  const returned = Math.max(0, toNumber(returnedAmount));

  if (safeTotal > 0 && returned >= safeTotal) return 'returned';
  if (returned > 0) return 'partially_returned';
  if (safeTotal === 0 || paid >= safeTotal) return 'paid';
  if (paid > 0) return 'partial';
  return 'unpaid';
};

export const getInvoiceFinancials = async (invoiceId: string) => {
  const [invoiceResult, paymentsResult, returnsResult] = await Promise.all([
    supabase.from('invoices').select('*').eq('id', invoiceId).single(),
    supabase.from('customer_payments').select('amount').eq('invoice_id', invoiceId).eq('status', 'completed'),
    supabase.from('returned_invoices').select('total').eq('invoice_id', invoiceId),
  ]);

  if (invoiceResult.error) throw invoiceResult.error;
  if (paymentsResult.error) throw paymentsResult.error;
  if (returnsResult.error) throw returnsResult.error;

  const total = toNumber(invoiceResult.data?.total);
  const paidAmount = (paymentsResult.data || []).reduce((sum, row: any) => sum + toNumber(row.amount), 0);
  const returnedAmount = (returnsResult.data || []).reduce((sum, row: any) => sum + toNumber(row.total), 0);
  const status = calculateInvoiceStatus(total, paidAmount, returnedAmount, invoiceResult.data?.status === 'draft');

  return {
    invoice: invoiceResult.data,
    total,
    paidAmount,
    returnedAmount,
    remainingAmount: Math.max(0, total - paidAmount - returnedAmount),
    status,
  };
};

export const refreshInvoiceFinancials = async (invoiceId: string) => {
  const financials = await getInvoiceFinancials(invoiceId);
  const { error } = await supabase
    .from('invoices')
    .update({
      status: financials.status,
      paid: financials.paidAmount,
      deposit_amount: financials.paidAmount,
      remaining_amount: financials.remainingAmount,
      already_paid: financials.status === 'paid',
    })
    .eq('id', invoiceId);

  if (error) throw error;
  return financials;
};

export const calculateClientBalance = async (clientId: string) => {
  const [clientResult, invoicesResult, paymentsResult, returnsResult] = await Promise.all([
    supabase.from('clients').select('opening_balance, balance').eq('id', clientId).single(),
    supabase.from('invoices').select('total, status').eq('client_id', clientId).neq('status', 'draft'),
    supabase.from('customer_payments').select('amount, status').eq('client_id', clientId).eq('status', 'completed'),
    supabase.from('returned_invoices').select('total').eq('client_id', clientId),
  ]);

  if (clientResult.error) throw clientResult.error;
  if (invoicesResult.error) throw invoicesResult.error;
  if (paymentsResult.error) throw paymentsResult.error;
  if (returnsResult.error) throw returnsResult.error;

  const openingBalance = toNumber(clientResult.data?.opening_balance);
  const totalInvoices = (invoicesResult.data || []).reduce((sum, row: any) => sum + toNumber(row.total), 0);
  const totalPayments = (paymentsResult.data || []).reduce((sum, row: any) => sum + toNumber(row.amount), 0);
  const totalReturns = (returnsResult.data || []).reduce((sum, row: any) => sum + toNumber(row.total), 0);

  return openingBalance + totalInvoices - totalPayments - totalReturns;
};

export const refreshClientBalance = async (clientId?: string | null) => {
  if (!clientId) return 0;
  const balance = await calculateClientBalance(clientId);
  const { error } = await supabase.from('clients').update({ balance }).eq('id', clientId);
  if (error) throw error;
  return balance;
};

export const addTreasuryTransaction = async ({
  treasuryId,
  transactionType,
  referenceType,
  referenceId,
  referenceNumber,
  description,
  amount,
  direction,
  createdBy = 'system',
}: {
  treasuryId: string;
  transactionType: string;
  referenceType: string;
  referenceId: string;
  referenceNumber: string;
  description: string;
  amount: number;
  direction: 'in' | 'out';
  createdBy?: string;
}) => {
  const { data: treasury, error: treasuryError } = await supabase
    .from('safes_banks')
    .select('balance')
    .eq('id', treasuryId)
    .single();
  if (treasuryError) throw treasuryError;

  const balanceBefore = toNumber(treasury?.balance);
  const signedAmount = direction === 'in' ? amount : -amount;
  const balanceAfter = balanceBefore + signedAmount;

  const updateResult = await supabase.from('safes_banks').update({ balance: balanceAfter }).eq('id', treasuryId);
  if (updateResult.error) throw updateResult.error;

  const insertResult = await supabase.from('treasury_transactions').insert({
    treasury_id: treasuryId,
    transaction_type: transactionType,
    reference_type: referenceType,
    reference_id: referenceId,
    reference_number: referenceNumber,
    description,
    amount,
    balance_before: balanceBefore,
    balance_after: balanceAfter,
    created_by: createdBy,
  });
  if (insertResult.error) throw insertResult.error;

  return { balanceBefore, balanceAfter };
};

export const recordCustomerPayment = async ({
  invoice,
  amount,
  paymentMethod,
  paymentDate,
  treasuryId,
  paymentNumber,
  notes = '',
  createdBy = 'system',
}: {
  invoice: any;
  amount: number;
  paymentMethod: string;
  paymentDate: string;
  treasuryId: string;
  paymentNumber: string;
  notes?: string;
  createdBy?: string;
}) => {
  const clientId = invoice.client_id;
  if (!clientId) throw new Error('Invoice is missing client_id');

  const invoiceId = invoice.id;
  const invoiceNumber = getInvoiceNumber(invoice);
  const clientName = invoice.client_name || invoice.clientName || '';

  const { data: payment, error } = await supabase
    .from('customer_payments')
    .insert({
      payment_number: paymentNumber,
      invoice_id: invoiceId,
      invoice_number: invoiceNumber,
      client_id: clientId,
      client_name: clientName,
      treasury_id: treasuryId,
      payment_method: paymentMethod,
      amount,
      payment_date: paymentDate,
      status: 'completed',
      notes,
      created_by: createdBy,
    })
    .select()
    .single();
  if (error) throw error;

  await addTreasuryTransaction({
    treasuryId,
    transactionType: 'sale_payment',
    referenceType: 'customer_payment',
    referenceId: payment.id,
    referenceNumber: paymentNumber,
    description: `Customer payment ${amount} from ${clientName} for invoice ${invoiceNumber}`,
    amount,
    direction: 'in',
    createdBy,
  });

  await refreshInvoiceFinancials(invoiceId);
  await refreshClientBalance(clientId);

  return payment;
};
