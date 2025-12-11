import axios from 'axios';

const API_BASE = 'http://localhost:3001/api';

const api = axios.create({
    baseURL: API_BASE,
    timeout: 120000 // 2 minutes for cloning large repos
});

export async function uploadRepo(repoUrl) {
    const response = await api.post('/uploadRepo', { repoUrl });
    return response.data;
}

export async function analyzeRepo(repoId) {
    const response = await api.get(`/analyze/${repoId}`);
    return response.data;
}

export async function summarizeFile(fileContent, path) {
    const response = await api.post('/ai/summarize', { fileContent, path });
    return response.data;
}

export default api;
