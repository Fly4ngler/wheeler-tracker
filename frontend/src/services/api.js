import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8090/api/v1';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Accounts
export const getAccounts = () => api.get('/accounts');
export const getAccount = (id) => api.get(`/accounts/${id}`);
export const createAccount = (data) => api.post('/accounts', data);
export const updateAccount = (id, data) => api.put(`/accounts/${id}`, data);
export const deleteAccount = (id) => api.delete(`/accounts/${id}`);

// Trades
export const getTrades = (params) => api.get('/trades', { params });
export const getTrade = (id) => api.get(`/trades/${id}`);
export const createTrade = (data) => api.post('/trades', data);
export const updateTrade = (id, data) => api.put(`/trades/${id}`, data);
export const closeTrade = (id, data) => api.post(`/trades/${id}/close`, data);
export const deleteTrade = (id) => api.delete(`/trades/${id}`);

// Positions
export const getPositions = (params) => api.get('/positions', { params });
export const getPosition = (id) => api.get(`/positions/${id}`);
export const createPosition = (data) => api.post('/positions', data);
export const updatePosition = (id, data) => api.put(`/positions/${id}`, data);
export const closePosition = (id, data) => api.post(`/positions/${id}/close`, data);
export const deletePosition = (id) => api.delete(`/positions/${id}`);

// Wheels
export const getWheels = (params) => api.get('/wheels', { params });
export const getWheel = (id) => api.get(`/wheels/${id}`);
export const createWheel = (data) => api.post('/wheels', data);
export const updateWheel = (id, data) => api.put(`/wheels/${id}`, data);

// Income
export const getIncome = (params) => api.get('/income', { params });
export const createIncome = (data) => api.post('/income', data);
export const deleteIncome = (id) => api.delete(`/income/${id}`);

// Market Data
export const getQuote = (symbol) => api.get(`/market/quote/${symbol}`);
export const searchSymbol = (query) => api.get(`/market/search/${query}`);

// Analytics
export const getDashboard = () => api.get('/trades/dashboard');
export const getPerformance = () => api.get('/trades/performance');

export default api;
