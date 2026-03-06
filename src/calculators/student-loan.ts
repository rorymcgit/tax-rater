export type StudentLoanPlan = 'none' | 'plan1' | 'plan2' | 'plan4' | 'plan5' | 'postgraduate';

const PLAN_THRESHOLDS: Record<Exclude<StudentLoanPlan, 'none'>, { threshold: number; rate: number }> = {
  plan1:        { threshold: 24_990, rate: 0.09 },
  plan2:        { threshold: 27_295, rate: 0.09 },
  plan4:        { threshold: 31_395, rate: 0.09 },
  plan5:        { threshold: 25_000, rate: 0.09 },
  postgraduate: { threshold: 21_000, rate: 0.06 },
};

export function calculateStudentLoan(annualIncome: number, plan: StudentLoanPlan): number {
  if (plan === 'none') return 0;

  const { threshold, rate } = PLAN_THRESHOLDS[plan];
  const repayableIncome = Math.max(0, annualIncome - threshold);
  return repayableIncome * rate;
}
