export enum TRANSACTION_EVENT_TYPE {
  INCOMING_TRANSFER_DELEGATION = 'INCOMING_TRANSFER_DELEGATION', // incoming transfer delegation
  CARD_SUCCESSFUL_TRANSACTION = 'card_successful_transaction', // card successful transaction
  CARD_FAILED_TRANSACTION = 'card_failed_transaction', // card failed transaction
  TRADING_SAVINGSPLAN_EXECUTED = 'trading_savingsplan_executed', // savings plan
  BENEFITS_SPARE_CHANGE_EXECUTION = 'benefits_spare_change_execution', // roundup
  BENEFITS_SAVEBACK_EXECUTION = 'benefits_saveback_execution', // 15 euros per month bonus
  CARD_SUCCESSFUL_VERIFICATION = 'card_successful_verification', // card successful verification
  INTEREST_PAYOUT = 'INTEREST_PAYOUT', // interest
  OUTGOING_TRANSFER_DELEGATION = 'OUTGOING_TRANSFER_DELEGATION', // outgoing transfer delegation
  TRADING_TRADE_EXECUTED = 'trading_trade_executed', // trade
  CARD_REFUND = 'card_refund', // card refund
  SSP_CORPORATE_ACTION_INVOICE_CASH = 'ssp_corporate_action_invoice_cash', // dividend
  CARD_FAILED_VERIFICATION = 'card_failed_verification', // card failed verification
  SSP_TAX_CORRECTION_INVOICE = 'ssp_tax_correction_invoice', // tax correction
  OUTGOING_TRANSFER = 'OUTGOING_TRANSFER', // outgoing transfer
  TIMELINE_LEGACY_MIGRATED_EVENTS = 'timeline_legacy_migrated_events', // trades, savings plans, interest and transfers, but not easily identifiable
  INCOMING_TRANSFER = 'INCOMING_TRANSFER', // income transfer
  CARD_ORDER_BILLED = 'card_order_billed', // money spend in a new Trade Republic card
  GIFTER_TRANSACTION = 'GIFTER_TRANSACTION', // Send stock gift to a friend
  GIFTING_RECIPIENT_ACTIVITY = 'GIFTING_RECIPIENT_ACTIVITY', // Received stock gifts from a friend, this is custom because transactions doesn't include it, so we need to pick this from activities
  STOCK_PERK_REFUNDED = 'STOCK_PERK_REFUNDED', // Received stock gifts when opening an account, this is custom because transactions doesn't include it, so we need to pick this from activities
}
