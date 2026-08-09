import { z } from "zod";

const optionalText = z.string().trim().optional();
const requiredText = z.string().trim().min(1, "此欄位為必填");
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "請輸入有效日期");

export const placeSchema = z.object({
  name: requiredText,
  englishName: optionalText,
  time: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "請使用 HH:mm 格式").or(z.literal("")).optional(),
  type: z.enum(["sight", "food", "shopping", "hotel", "transport", "viewpoint", "activity", "other"]),
  mapQuery: optionalText,
  note: optionalText,
});

export const todoSchema = z.object({
  title: requiredText,
  category: z.enum(["accommodation", "transport", "ticket", "other"]),
  priority: z.enum(["high", "medium", "low"]),
  status: z.enum(["not_started", "in_progress", "completed", "not_applicable"]),
  city: optionalText,
  recommendedCompleteDate: isoDate.or(z.literal("")).optional(),
  nextAction: optionalText,
  note: optionalText,
});

export const daySchema = z.object({
  title: requiredText,
  date: isoDate,
  cityId: requiredText,
  subtitle: optionalText,
  note: optionalText,
});

export const emailSchema = z.string().trim().toLowerCase().email("請輸入有效的 Email");
