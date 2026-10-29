
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  "https://stockflow-inventory-management-tx2y.onrender.com";

export default API_BASE_URL;

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem("stockflow_access");

  const headers = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const text = await response.text();
  let data = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { detail: text || "Unexpected server response." };
  }

  if (!response.ok) {
    if (response.status === 401 && token) {
      localStorage.removeItem("stockflow_access");
      localStorage.removeItem("stockflow_refresh");
    }

    const message =
      data.detail ||
      data.error ||
      Object.entries(data)
        .map(([key, value]) =>
          `${key}: ${Array.isArray(value) ? value.join(", ") : value}`
        )
        .join("\n") ||
      "Request failed.";

    throw new Error(message);
  }

  return data;
}
