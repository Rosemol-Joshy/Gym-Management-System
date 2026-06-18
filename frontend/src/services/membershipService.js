import axios from "axios";

const BASE_URL = "http://127.0.0.1:5000/api/membership-plans";

export const getMemberships = () => axios.get(BASE_URL);
export const addMembership = (data) => axios.post(BASE_URL, data);
export const updateMembership = (id, data) =>
  axios.put(`${BASE_URL}/${id}`, data);
export const deleteMembership = (id) =>
  axios.delete(`${BASE_URL}/${id}`);