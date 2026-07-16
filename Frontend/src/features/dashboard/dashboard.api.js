import api from "../../lib/api";

export const getAlgorithmResults = () => api.get("/algoritma/results");
export const getScadaRecordCount = () => api.get("/scada-data", { params: { page: 1, limit: 1 } });
export const resetDashboardResults = () => api.delete("/algoritma/reset");
