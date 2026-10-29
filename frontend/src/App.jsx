
import { useCallback, useEffect, useState } from "react";
import { apiRequest } from "./api";
import "./App.css";

const emptyProduct = {
  name: "",
  sku: "",
  description: "",
  quantity: 0,
  cost_price: "",
  selling_price: "",
  low_stock_threshold: "",
};

function App() {
  const [token, setToken] = useState(
    () => localStorage.getItem("stockflow_access") || ""
  );
  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("stockflow_user") || "null");
    } catch {
      return null;
    }
  });

  const [authMode, setAuthMode] = useState("login");
  const [authForm, setAuthForm] = useState({
    username: "",
    email: "",
    password: "",
    organization_name: "",
  });

  const [products, setProducts] = useState([]);
  const [dashboard, setDashboard] = useState({
    total_products: 0,
    total_units: 0,
    inventory_cost_value: "0.00",
    low_stock_count: 0,
    low_stock_products: [],
  });

  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState(false);

  const loadData = useCallback(async () => {
    const query = search.trim()
      ? `?search=${encodeURIComponent(search.trim())}`
      : "";

    const [productData, dashboardData] = await Promise.all([
  apiRequest(`/api/products/${query}`),
  apiRequest("/api/dashboard/"),
]);

    setProducts(productData);
    setDashboard(dashboardData);
  }, [search]);

  useEffect(() => {
    if (!token) return;

    loadData().catch((err) => {
      setError(err.message);
      if (err.message.toLowerCase().includes("credentials")) {
        logout();
      }
    });
  }, [token, loadData]);

  function logout() {
    localStorage.removeItem("stockflow_access");
    localStorage.removeItem("stockflow_refresh");
    localStorage.removeItem("stockflow_user");
    setToken("");
    setUser(null);
    setProducts([]);
    setDashboard({
      total_products: 0,
      total_units: 0,
      inventory_cost_value: "0.00",
      low_stock_count: 0,
      low_stock_products: [],
    });
  }

  function updateAuthForm(event) {
    setAuthForm({
      ...authForm,
      [event.target.name]: event.target.value,
    });
  }

  async function submitAuth(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);

    try {
      const path =
      authMode === "register" 
      ? "/api/auth/register/"
      : "/api/auth/login/";
      const payload =
        authMode === "register"
          ? authForm
          : {
              email: authForm.email,
              password: authForm.password,
            };

      const data = await apiRequest(path, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (authMode === "register") {
        setNotice("Account created! Please log in.");
        setAuthMode("login");
        setAuthForm({
          username: "",
          email: authForm.email,
          password: "",
          organization_name: "",
        });
      } else {
        localStorage.setItem("stockflow_access", data.access);
        localStorage.setItem("stockflow_refresh", data.refresh);
        localStorage.setItem("stockflow_user", JSON.stringify(data.user));

        setToken(data.access);
        setUser(data.user);
        setNotice("Welcome to StockFlow!");
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function updateProductForm(event) {
    setProductForm({
      ...productForm,
      [event.target.name]: event.target.value,
    });
  }

  async function submitProduct(event) {
    event.preventDefault();
    setError("");
    setNotice("");
    setBusy(true);

    const payload = {
      ...productForm,
      quantity: Number(productForm.quantity),
      cost_price:
        productForm.cost_price === "" ? null : productForm.cost_price,
      selling_price:
        productForm.selling_price === "" ? null : productForm.selling_price,
      low_stock_threshold:
        productForm.low_stock_threshold === ""
          ? null
          : Number(productForm.low_stock_threshold),
    };

    try {
      await apiRequest(
  editingId
    ? `/api/products/${editingId}/`
    : "/api/products/",
  {
    method: editingId ? "PATCH" : "POST",
    body: JSON.stringify(payload),
  }
);

      setNotice(editingId ? "Product updated." : "Product added.");
      setProductForm(emptyProduct);
      setEditingId(null);
      await loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function startEdit(product) {
    setEditingId(product.id);
    setProductForm({
      name: product.name,
      sku: product.sku,
      description: product.description || "",
      quantity: product.quantity,
      cost_price: product.cost_price ?? "",
      selling_price: product.selling_price ?? "",
      low_stock_threshold: product.low_stock_threshold ?? "",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function deleteProduct(product) {
    if (!window.confirm(`Delete "${product.name}"?`)) return;

    setError("");
    setNotice("");

    try {
      await apiRequest(`/api/products/${product.id}/`, {
        method: "DELETE",
});
      setNotice("Product deleted.");
      await loadData();
    } catch (err) {
      setError(err.message);
    }
  }

  if (!token) {
    return (
      <main className="auth-page">
        <section className="auth-card">
          <div className="brand-mark">S</div>
          <p className="eyebrow">INVENTORY MANAGEMENT</p>
          <h1>StockFlow</h1>
          <p className="muted">
            Keep your inventory organized and your business moving.
          </p>

          <div className="auth-tabs">
            <button
              className={authMode === "login" ? "active" : ""}
              onClick={() => {
                setAuthMode("login");
                setError("");
                setNotice("");
              }}
              type="button"
            >
              Login
            </button>
            <button
              className={authMode === "register" ? "active" : ""}
              onClick={() => {
                setAuthMode("register");
                setError("");
                setNotice("");
              }}
              type="button"
            >
              Create account
            </button>
          </div>

          {error && <div className="alert error">{error}</div>}
          {notice && <div className="alert success">{notice}</div>}

          <form onSubmit={submitAuth} className="form-stack">
            {authMode === "register" && (
              <>
                <label>
                  Username
                  <input
                    name="username"
                    value={authForm.username}
                    onChange={updateAuthForm}
                    required
                    autoComplete="username"
                  />
                </label>
                <label>
                  Organization name
                  <input
                    name="organization_name"
                    value={authForm.organization_name}
                    onChange={updateAuthForm}
                    required
                  />
                </label>
              </>
            )}

            <label>
              Email address
              <input
                name="email"
                type="email"
                value={authForm.email}
                onChange={updateAuthForm}
                required
                autoComplete="email"
              />
            </label>

            <label>
              Password
              <input
                name="password"
                type="password"
                value={authForm.password}
                onChange={updateAuthForm}
                required
                minLength={8}
                autoComplete={
                  authMode === "login" ? "current-password" : "new-password"
                }
              />
            </label>

            <button className="primary-button" disabled={busy}>
              {busy
                ? "Please wait..."
                : authMode === "register"
                  ? "Create account"
                  : "Sign in"}
            </button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="brand-mark small">S</div>
          <div>
            <strong>StockFlow</strong>
            <span>Inventory workspace</span>
          </div>
        </div>

        <div className="sidebar-label">WORKSPACE</div>
        <div className="nav-item selected">▦ &nbsp; Overview</div>
        <div className="nav-item">▤ &nbsp; Products</div>
        <div className="nav-item">⚑ &nbsp; Stock alerts</div>

        <div className="sidebar-bottom">
          <div className="avatar">
            {(user?.email || "U").charAt(0).toUpperCase()}
          </div>
          <div className="user-info">
            <strong>{user?.organization_name || "My organization"}</strong>
            <span>{user?.email}</span>
          </div>
          <button
            className="logout-button"
            onClick={logout}
            title="Log out"
          >
            ↪
          </button>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div>
            <p className="eyebrow">WORKSPACE / OVERVIEW</p>
            <h1>Inventory overview</h1>
            <p className="muted">
              Monitor your products and stock levels in one place.
            </p>
          </div>
          <div className="topbar-right">
            <span className="status-dot" />
            <span>Workspace active</span>
          </div>
        </header>

        {error && <div className="alert error">{error}</div>}
        {notice && <div className="alert success">{notice}</div>}

        <section className="stats-grid">
          <StatCard
            label="Total products"
            value={dashboard.total_products}
            icon="▤"
            caption="Unique inventory items"
          />
          <StatCard
            label="Total units"
            value={dashboard.total_units}
            icon="▦"
            caption="Units currently in stock"
          />
          <StatCard
            label="Inventory cost value"
            value={`₹${Number(
              dashboard.inventory_cost_value || 0
            ).toLocaleString("en-IN", {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}`}
            icon="₹"
            caption="Based on cost price"
          />
          <StatCard
            label="Low-stock items"
            value={dashboard.low_stock_count}
            icon="!"
            caption="Items needing attention"
            warning={dashboard.low_stock_count > 0}
          />
        </section>

        <section className="content-grid">
          <div className="panel product-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">
                  {editingId ? "UPDATE INVENTORY" : "INVENTORY MANAGEMENT"}
                </p>
                <h2>{editingId ? "Edit product" : "Add a product"}</h2>
              </div>
              {editingId && (
                <button
                  className="text-button"
                  onClick={() => {
                    setEditingId(null);
                    setProductForm(emptyProduct);
                  }}
                  type="button"
                >
                  Cancel edit
                </button>
              )}
            </div>

            <form className="product-form" onSubmit={submitProduct}>
              <label>
                Product name *
                <input
                  name="name"
                  value={productForm.name}
                  onChange={updateProductForm}
                  required
                  maxLength={255}
                  placeholder="e.g. Basmati rice"
                />
              </label>

              <label>
                SKU *
                <input
                  name="sku"
                  value={productForm.sku}
                  onChange={updateProductForm}
                  required
                  maxLength={100}
                  placeholder="e.g. RICE-001"
                />
              </label>

              <label className="full-width">
                Description
                <textarea
                  name="description"
                  value={productForm.description}
                  onChange={updateProductForm}
                  placeholder="Optional product details"
                  rows={2}
                />
              </label>

              <label>
                Quantity *
                <input
                  name="quantity"
                  type="number"
                  min="0"
                  step="1"
                  value={productForm.quantity}
                  onChange={updateProductForm}
                  required
                />
              </label>

              <label>
                Cost price (₹)
                <input
                  name="cost_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={productForm.cost_price}
                  onChange={updateProductForm}
                  placeholder="0.00"
                />
              </label>

              <label>
                Selling price (₹)
                <input
                  name="selling_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={productForm.selling_price}
                  onChange={updateProductForm}
                  placeholder="0.00"
                />
              </label>

              <label>
                Low-stock threshold
                <input
                  name="low_stock_threshold"
                  type="number"
                  min="0"
                  step="1"
                  value={productForm.low_stock_threshold}
                  onChange={updateProductForm}
                  placeholder="Use organization default"
                />
              </label>

              <button className="primary-button full-width" disabled={busy}>
                {busy
                  ? "Saving..."
                  : editingId
                    ? "Save changes"
                    : "+ Add product"}
              </button>
            </form>
          </div>

          <div className="panel alerts-panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">ATTENTION REQUIRED</p>
                <h2>Low-stock alerts</h2>
              </div>
              <span className="count-badge">
                {dashboard.low_stock_count}
              </span>
            </div>

            {dashboard.low_stock_products.length === 0 ? (
              <div className="empty-state">
                <span className="empty-icon">✓</span>
                <strong>All stocked up</strong>
                <p>No products are below their stock threshold.</p>
              </div>
            ) : (
              <div className="alert-list">
                {dashboard.low_stock_products.map((product) => (
                  <div className="alert-row" key={product.id}>
                    <div className="product-avatar">
                      {product.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="alert-product">
                      <strong>{product.name}</strong>
                      <span>{product.sku}</span>
                    </div>
                    <span className="quantity-warning">
                      {product.quantity} left
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="panel table-panel">
          <div className="panel-heading table-heading">
            <div>
              <p className="eyebrow">YOUR CATALOG</p>
              <h2>All products</h2>
              <p className="muted">
                Search and manage your inventory.
              </p>
            </div>
            <div className="search-box">
              <span>⌕</span>
              <input
                type="search"
                placeholder="Search name or SKU..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Quantity</th>
                  <th>Cost price</th>
                  <th>Selling price</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => {
                  const threshold =
                    product.low_stock_threshold ?? 5;
                  const low = product.quantity <= threshold;

                  return (
                    <tr key={product.id}>
                      <td>
                        <div className="table-product">
                          <div className="product-avatar">
                            {product.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <strong>{product.name}</strong>
                            <span>
                              {product.description || "No description"}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>
                        <code className="sku">{product.sku}</code>
                      </td>
                      <td>
                        <strong>{product.quantity}</strong>
                      </td>
                      <td>
                        {product.cost_price == null
                          ? "—"
                          : `₹${Number(product.cost_price).toFixed(2)}`}
                      </td>
                      <td>
                        {product.selling_price == null
                          ? "—"
                          : `₹${Number(product.selling_price).toFixed(2)}`}
                      </td>
                      <td>
                        <span className={`stock-pill ${low ? "low" : "ok"}`}>
                          <span className="pill-dot" />
                          {low ? "Low stock" : "In stock"}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="edit-button"
                            onClick={() => startEdit(product)}
                            type="button"
                          >
                            Edit
                          </button>
                          <button
                            className="delete-button"
                            onClick={() => deleteProduct(product)}
                            type="button"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {products.length === 0 && (
                  <tr>
                    <td colSpan="7">
                      <div className="empty-table">
                        {search
                          ? "No products match your search."
                          : "No products yet. Add your first product above."}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="table-footer">
            Showing {products.length} product{products.length === 1 ? "" : "s"}
            <button className="text-button" onClick={() => loadData()}>
              ↻ Refresh
            </button>
          </div>
        </section>

        <footer className="footer">
          StockFlow · Inventory management made simple
        </footer>
      </main>
    </div>
  );
}

function StatCard({ label, value, icon, caption, warning }) {
  return (
    <div className={`stat-card ${warning ? "stat-warning" : ""}`}>
      <div className="stat-top">
        <span>{label}</span>
        <span className="stat-icon">{icon}</span>
      </div>
      <strong className="stat-value">{value}</strong>
      <span className="stat-caption">{caption}</span>
    </div>
  );
}

export default App;
