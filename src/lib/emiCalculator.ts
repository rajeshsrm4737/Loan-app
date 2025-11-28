export interface EMICalculation {
  emi: number;
  totalPayment: number;
  totalInterest: number;
  principal: number;
}

export interface RepaymentScheduleItem {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
  date: string;
}

export function calculateEMI(
  principal: number,
  annualInterestRate: number,
  tenureMonths: number
): EMICalculation {
  if (principal <= 0 || tenureMonths <= 0) {
    return {
      emi: 0,
      totalPayment: 0,
      totalInterest: 0,
      principal: 0,
    };
  }

  if (annualInterestRate === 0) {
    const emi = principal / tenureMonths;
    return {
      emi,
      totalPayment: principal,
      totalInterest: 0,
      principal,
    };
  }

  const monthlyRate = annualInterestRate / 12 / 100;

  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
    (Math.pow(1 + monthlyRate, tenureMonths) - 1);

  const totalPayment = emi * tenureMonths;
  const totalInterest = totalPayment - principal;

  return {
    emi: Math.round(emi * 100) / 100,
    totalPayment: Math.round(totalPayment * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    principal,
  };
}

export function generateRepaymentSchedule(
  principal: number,
  annualInterestRate: number,
  tenureMonths: number,
  startDate: Date = new Date()
): RepaymentScheduleItem[] {
  const { emi } = calculateEMI(principal, annualInterestRate, tenureMonths);

  if (emi === 0) {
    return [];
  }

  const schedule: RepaymentScheduleItem[] = [];
  let remainingBalance = principal;
  const monthlyRate = annualInterestRate / 12 / 100;

  for (let month = 1; month <= tenureMonths; month++) {
    const interestPayment = remainingBalance * monthlyRate;
    const principalPayment = emi - interestPayment;

    remainingBalance = Math.max(0, remainingBalance - principalPayment);

    const paymentDate = new Date(startDate);
    paymentDate.setMonth(paymentDate.getMonth() + month);

    schedule.push({
      month,
      payment: Math.round(emi * 100) / 100,
      principal: Math.round(principalPayment * 100) / 100,
      interest: Math.round(interestPayment * 100) / 100,
      balance: Math.round(remainingBalance * 100) / 100,
      date: paymentDate.toISOString().split('T')[0],
    });
  }

  return schedule;
}

export function calculatePenalty(
  outstandingAmount: number,
  penaltyRate: number,
  daysOverdue: number
): number {
  const dailyPenaltyRate = penaltyRate / 365 / 100;
  const penalty = outstandingAmount * dailyPenaltyRate * daysOverdue;

  return Math.round(penalty * 100) / 100;
}

export function getDaysOverdue(dueDate: string): number {
  const due = new Date(dueDate);
  const today = new Date();
  const diffTime = today.getTime() - due.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return Math.max(0, diffDays);
}

export function calculateLoanSummary(
  principal: number,
  annualInterestRate: number,
  tenureMonths: number,
  penaltyRate: number = 0,
  dueDate?: string
) {
  const emiCalc = calculateEMI(principal, annualInterestRate, tenureMonths);

  let penalty = 0;
  let daysOverdue = 0;

  if (dueDate) {
    daysOverdue = getDaysOverdue(dueDate);
    if (daysOverdue > 0) {
      penalty = calculatePenalty(principal, penaltyRate, daysOverdue);
    }
  }

  return {
    ...emiCalc,
    penalty,
    daysOverdue,
    totalDue: emiCalc.emi + penalty,
  };
}
