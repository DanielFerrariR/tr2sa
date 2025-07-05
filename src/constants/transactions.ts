export enum TRANSATION_EVENT_TYPE {
  'INCOMING_TRANSFER_DELEGATION',
  'card_successful_transaction',
  'card_failed_transaction',
  'trading_savingsplan_executed', // savings plan
  'benefits_spare_change_execution', // roundup
  'benefits_saveback_execution', // 15 euros per month
  'card_successful_verification',
  'INTEREST_PAYOUT', // interest
  'OUTGOING_TRANSFER_DELEGATION',
  'trading_trade_executed', // trade
  'card_refund',
  'ssp_corporate_action_invoice_cash', // dividend
  'card_failed_verification',
  'ssp_tax_correction_invoice',
  'OUTGOING_TRANSFER',
  'timeline_legacy_migrated_events',
  'INCOMING_TRANSFER',
  'card_order_billed',
}
