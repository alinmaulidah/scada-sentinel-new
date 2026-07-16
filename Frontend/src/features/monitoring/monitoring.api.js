import api from "../../lib/api";

const unwrapRuns = (response) => response.data?.data || response.data || [];

export const getMonitoringHistory = async () => unwrapRuns(await api.get("/algorithm_results"));

export const getLatestMonitoring = async () => {
  const { data } = await api.get("/monitoring");
  return { logs: data?.data || [], meta: data?.meta || null };
};

export const getMonitoringRun = async (runId) => {
  const run = (await getMonitoringHistory()).find((item) => Number(item.id) === Number(runId));

  if (!run) throw new Error("Riwayat tidak ditemukan");
  return run;
};
