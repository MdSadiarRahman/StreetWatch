import { z } from "zod";

export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 72;

export interface PasswordRequirementCheck {
  id: string;
  label: string;
  met: boolean;
}

export type PasswordStrengthLabel = "Weak" | "Fair" | "Good" | "Strong";

export interface PasswordStrengthResult {
  score: number; // 0 to 4
  label: PasswordStrengthLabel;
  checks: PasswordRequirementCheck[];
  isValid: boolean;
}

export const DHAKA_WARDS = [
  "Ward 1",
  "Ward 2",
  "Ward 4",
  "Ward 9",
  "Ward 11",
  "Ward 15",
  "Ward 16",
  "Ward 19",
  "Ward 26",
  "Ward 31",
  "Ward 33",
  "Ward 36",
  "DNCC HQ",
  "DSCC HQ",
] as const;

export const strongPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters`)
  .max(PASSWORD_MAX_LENGTH, `Password must not exceed ${PASSWORD_MAX_LENGTH} characters`)
  .regex(/[A-Z]/, "Password must include at least one uppercase letter")
  .regex(/[a-z]/, "Password must include at least one lowercase letter")
  .regex(/[0-9]/, "Password must include at least one number")
  .regex(/[^A-Za-z0-9]/, "Password must include at least one special character");

/**
 * Evaluate password against policy requirements and compute a 4-tier strength rating.
 */
export function evaluatePasswordStrength(password: string): PasswordStrengthResult {
  const checks: PasswordRequirementCheck[] = [
    {
      id: "length",
      label: `At least ${PASSWORD_MIN_LENGTH} characters`,
      met: password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH,
    },
    {
      id: "upper",
      label: "At least one uppercase letter (A-Z)",
      met: /[A-Z]/.test(password),
    },
    {
      id: "lower",
      label: "At least one lowercase letter (a-z)",
      met: /[a-z]/.test(password),
    },
    {
      id: "number",
      label: "At least one number (0-9)",
      met: /[0-9]/.test(password),
    },
    {
      id: "special",
      label: "At least one special character (!@#$...)",
      met: /[^A-Za-z0-9]/.test(password),
    },
  ];

  const metCount = checks.filter((c) => c.met).length;
  const isValid = checks.every((c) => c.met);

  let score = 0;
  if (password.length > 0) {
    if (metCount <= 2) score = 1;
    else if (metCount === 3 || metCount === 4) score = 2;
    else if (metCount === 5 && password.length < 12) score = 3;
    else if (metCount === 5 && password.length >= 12) score = 4;
  }

  const labelMap: Record<number, PasswordStrengthLabel> = {
    0: "Weak",
    1: "Weak",
    2: "Fair",
    3: "Good",
    4: "Strong",
  };

  return {
    score,
    label: labelMap[score] || "Weak",
    checks,
    isValid,
  };
}
