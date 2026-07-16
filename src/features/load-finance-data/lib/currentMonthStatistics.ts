export function getCurrentMonthStatisticsQuery(now = new Date()) {
  return {
    startDate: new Date(now.getFullYear(), now.getMonth(), 1).toISOString(),
    endDate: now.toISOString(),
  };
}
