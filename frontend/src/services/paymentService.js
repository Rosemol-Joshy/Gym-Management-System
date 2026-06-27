import axios from "axios";

const BASE_URL = "http://127.0.0.1:5000/api/payments";

export const getPayments = () => axios.get(BASE_URL);

export const addPayment = (data) => axios.post(BASE_URL, data);

export const updatePayment = (id, data) =>
  axios.put(`${BASE_URL}/${id}`, data);

export const deletePayment = (id) =>
  axios.delete(`${BASE_URL}/${id}`);