import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Calculates query cost based on token usage.
 * Formula: ((prompt_tokens * input_rate) + (completion_tokens * output_rate)) / 1_000_000
 */
export function calculateCost(
  promptTokens: number,
  completionTokens: number,
  inputPricePerM: number,
  outputPricePerM: number
): number {
  const cost = (promptTokens * inputPricePerM + completionTokens * outputPricePerM) / 1_000_000;
  return Number(cost.toFixed(6));
}

export function formatCost(cost: number): string {
  if (cost === 0) return "$0.000000";
  if (cost < 0.000001) return `< $0.000001`;
  return `$${cost.toFixed(6)}`;
}
