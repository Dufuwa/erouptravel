import type { BookingStatus, Priority, TicketStatus, TodoCategory, TodoStatus, TransportType } from "@/types/types";

export const todoCategoryLabels: Record<TodoCategory, string> = {
  accommodation: "住宿",
  transport: "交通",
  ticket: "票券",
  other: "其他",
};

export const todoStatusLabels: Record<TodoStatus, string> = {
  not_started: "未開始",
  in_progress: "進行中",
  completed: "已完成",
  not_applicable: "不適用",
};

export const priorityLabels: Record<Priority, string> = { high: "高", medium: "中", low: "低" };
export const bookingStatusLabels: Record<BookingStatus, string> = {
  not_booked: "未預訂",
  booked: "已預訂",
  confirmed: "已確認",
  cancelled: "已取消",
};
export const ticketStatusLabels: Record<TicketStatus, string> = { not_purchased: "未購買", purchased: "已購買" };
export const transportTypeLabels: Record<TransportType, string> = {
  flight: "航班",
  train: "火車",
  bus: "巴士",
  shuttle: "接駁",
  rental_car: "租車",
  local_transport: "市區交通",
};
