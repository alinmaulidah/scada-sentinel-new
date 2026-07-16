import api from "../../lib/api";

export const runAlgorithm = (payload) => api.post("/algoritma/run", payload);
