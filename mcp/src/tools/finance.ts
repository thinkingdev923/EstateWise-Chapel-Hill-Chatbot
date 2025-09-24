import { z } from "zod";
import type { ToolDef } from "../core/registry.js";

/** Finance calculators: schedule, mortgage, affordability, cap rate, rent-vs-buy. */
export const financeTools: ToolDef[] = [
  {
    name: "finance.schedule",
    description: "Return the first N months of the amortization schedule.",
    schema: {
      price: z.number(),
      downPct: z.number().default(20),
      apr: z.number().default(6.5),
      years: z.number().default(30),
      months: z.number().default(12),
    },
    handler: async (args: any) => {
      const {
        price,
        downPct = 20,
        apr = 6.5,
        years = 30,
        months = 12,
      } = args as any;
      const loan = price * (1 - downPct / 100);
      const r = apr / 100 / 12;
      const n = years * 12;
      const pmt = r
        ? (loan * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1)
        : loan / n;
      const rows: Array<{
        month: number;
        interest: number;
        principal: number;
        balance: number;
      }> = [];
      let bal = loan;
      for (let m = 1; m <= Math.max(1, Math.min(months, n)); m++) {
        const interest = bal * r;
        const principal = pmt - interest;
        bal = Math.max(0, bal - principal);
        rows.push({ month: m, interest, principal, balance: bal });
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ payment: pmt, schedule: rows }),
          },
        ],
      };
    },
  },
  {
    name: "finance.mortgage",
    description:
      "Compute mortgage breakdown (principal+interest, taxes, insurance, HOA).",
    schema: {
      price: z.number(),
      downPct: z.number().default(20),
      apr: z.number().default(6.5),
      years: z.number().default(30),
      taxRatePct: z.number().default(1.0),
      insMonthly: z.number().default(120),
      hoaMonthly: z.number().default(0),
    },
    handler: async (args: any) => {
      const { price, downPct, apr, years, taxRatePct, insMonthly, hoaMonthly } =
        args as any;
      const loan = price * (1 - downPct / 100);
      const r = apr / 100 / 12;
      const n = years * 12;
      const pAndI = r
        ? (loan * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1)
        : loan / n;
      const taxes = (price * (taxRatePct / 100)) / 12;
      const total = pAndI + taxes + insMonthly + hoaMonthly;
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              loan,
              pAndI,
              taxes,
              insMonthly,
              hoaMonthly,
              total,
            }),
          },
        ],
      };
    },
  },
  {
    name: "finance.affordability",
    description:
      "Estimate max home price from monthly budget or income+DTI (includes taxes/insurance/HOA).",
    schema: {
      monthlyBudget: z.number().optional(),
      annualIncome: z.number().optional(),
      maxDtiPct: z.number().optional().default(36),
      downPct: z.number().default(20),
      apr: z.number().default(6.5),
      years: z.number().default(30),
      taxRatePct: z.number().default(1.0),
      insMonthly: z.number().default(120),
      hoaMonthly: z.number().default(0),
    },
    handler: async (args: any) => {
      const {
        monthlyBudget,
        annualIncome,
        maxDtiPct = 36,
        downPct = 20,
        apr = 6.5,
        years = 30,
        taxRatePct = 1.0,
        insMonthly = 120,
        hoaMonthly = 0,
      } = args as any;
      const monthlyCap =
        monthlyBudget ??
        (annualIncome ? (annualIncome / 12) * (maxDtiPct / 100) : null);
      if (!monthlyCap) throw new Error("Provide monthlyBudget or annualIncome");
      const r = apr / 100 / 12;
      const n = years * 12;
      const fixed = insMonthly + hoaMonthly;
      const k = r ? (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : 1 / n;
      const loanFactor = 1 - downPct / 100;
      const price =
        (monthlyCap - fixed) / (loanFactor * k + taxRatePct / 100 / 12);
      const loan = price * loanFactor;
      const pAndI = loan * k;
      const taxes = (price * (taxRatePct / 100)) / 12;
      const total = pAndI + taxes + fixed;
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({
              monthlyCap,
              price,
              loan,
              pAndI,
              taxes,
              insMonthly,
              hoaMonthly,
              total,
            }),
          },
        ],
      };
    },
  },
  {
    name: "finance.capRate",
    description:
      "Compute cap rate given rent and expenses. Returns NOI and capRate.",
    schema: {
      price: z.number(),
      annualRent: z.number(),
      vacancyPct: z.number().default(5),
      expensesAnnual: z.number().default(0),
      taxRatePct: z.number().optional(),
      insuranceAnnual: z.number().optional(),
      hoaAnnual: z.number().optional(),
    },
    handler: async (args: any) => {
      const {
        price,
        annualRent,
        vacancyPct = 5,
        expensesAnnual = 0,
        taxRatePct,
        insuranceAnnual,
        hoaAnnual,
      } = args as any;
      const egi = annualRent * (1 - vacancyPct / 100);
      const taxes = taxRatePct ? price * (taxRatePct / 100) : 0;
      const ins = insuranceAnnual || 0;
      const hoa = hoaAnnual || 0;
      const opex = expensesAnnual + taxes + ins + hoa;
      const noi = egi - opex;
      const capRate = noi / price;
      return {
        content: [
          { type: "text", text: JSON.stringify({ egi, opex, noi, capRate }) },
        ],
      };
    },
  },
  {
    name: "finance.rentVsBuy",
    description: "Compare monthly rent against monthly ownership costs.",
    schema: {
      monthlyRent: z.number(),
      price: z.number(),
      downPct: z.number().default(20),
      apr: z.number().default(6.5),
      years: z.number().default(30),
      taxRatePct: z.number().default(1.0),
      insMonthly: z.number().default(120),
      hoaMonthly: z.number().default(0),
    },
    handler: async (args: any) => {
      const {
        monthlyRent,
        price,
        downPct = 20,
        apr = 6.5,
        years = 30,
        taxRatePct = 1.0,
        insMonthly = 120,
        hoaMonthly = 0,
      } = args as any;
      const loan = price * (1 - downPct / 100);
      const r = apr / 100 / 12;
      const n = years * 12;
      const pAndI = r
        ? (loan * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1)
        : loan / n;
      const taxes = (price * (taxRatePct / 100)) / 12;
      const ownMonthly = pAndI + taxes + insMonthly + hoaMonthly;
      const diff = ownMonthly - monthlyRent;
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify({ ownMonthly, monthlyRent, difference: diff }),
          },
        ],
      };
    },
  },
];
