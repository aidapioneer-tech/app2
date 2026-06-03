export interface IStep {
  action: () => Promise<void>
  caption?: string
  data?: Record<string, unknown>
}

export type PaymentType = 'prepay' | 'postpay'
export type ContractorBadge = 'paidByAct' | 'partial' | 'none'
export type DealMode = 'client' | 'contractor'

export interface PaymentRow {
  paymentId: number
  type: PaymentType
  planTotal: number
  planNet: number
  planVat: number
  factTotal: number
  factNet: number
  factVat: number
  leftToPay: number
  isFullyPaid: boolean
  dateDue: string | null
  dateReceived: string | null
  distributionsCount: number
}

export interface DealHeader {
  id: number
  title: string
  companyId: number
  companyTitle: string
  categoryId: number
  currencyId: string
  taxRate: number
}

export interface ParentClientDeal {
  id: number
  title: string
  companyId: number
  companyTitle: string
  currencyId: string
  incomeGross: number
  incomeNet: number
  thisContractorShare: number
}

export interface ContractorBlock {
  dealId: number
  title: string
  companyId: number
  companyTitle: string
  currencyId: string
  /** Ставка НДС сделки подрядчика. Уточнить с клиентом нужно ли всегда 20% или брать реальную ставку. */
  taxRate: number
  badge: ContractorBadge
  payments: PaymentRow[]
  totals: {
    planTotal: number
    factTotal: number
    leftToPay: number
  }
}

export interface MoneyTotals {
  plan: {
    incomeGross: number
    incomeNet: number
    expenseTotal: number
    profit: number
    marginPercent: number
  }
  fact: {
    incomeGross: number
    incomeNet: number
    expenseTotal: number
    profit: number
    marginPercent: number
  }
  progress: {
    incomeReceivedPercent: number
    expensePaidPercent: number
  }
}

export interface DealMoneyResponse {
  mode: DealMode
  deal: DealHeader
  parentClientDeal: ParentClientDeal | null
  payments: PaymentRow[]
  contractors: ContractorBlock[] | null
  totals: MoneyTotals
}
