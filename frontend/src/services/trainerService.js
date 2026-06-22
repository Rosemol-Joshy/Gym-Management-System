import axios from "axios";

const BASE_URL = "http://127.0.0.1:5000/api/trainers";

export const getTrainers = () => axios.get(BASE_URL);
export const addTrainer = (data) => axios.post(BASE_URL, data);
export const updateTrainer = (id, data) =>
  axios.put(`${BASE_URL}/${id}`, data);
export const deleteTrainer = (id) =>
  axios.delete(`${BASE_URL}/${id}`);