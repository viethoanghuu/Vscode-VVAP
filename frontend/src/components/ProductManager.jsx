import React from "react";

export default function ProductManager({
  products = [],
  form,
  onChange,
  onSubmit,
  onDelete,
  submitting,
}) {
  return (
    <div className="card product-card">
      <h3 className="card-title">Product management</h3>
      <div className="label">Add new products or remove them from the list</div>

      <form
        className="product-form"
        onSubmit={(e) => {
          e.preventDefault();
          onSubmit && onSubmit();
        }}
      >
        <label>
          <span>ID (slug)</span>
          <input
            required
            value={form.id}
            onChange={(e) => onChange({ ...form, id: e.target.value })}
            placeholder="asus-rog-zephyrus-g16"
          />
        </label>
        <label>
          <span>Product name</span>
          <input
            required
            value={form.name}
            onChange={(e) => onChange({ ...form, name: e.target.value })}
            placeholder="ASUS ROG Zephyrus G16"
          />
        </label>
        <label>
          <span>Image (URL)</span>
          <input
            value={form.image_url}
            onChange={(e) => onChange({ ...form, image_url: e.target.value })}
            placeholder="https://example.com/cover.jpg"
          />
        </label>
        <label>
          <span>Source link (e-commerce)</span>
          <input
            value={form.source_url}
            onChange={(e) => onChange({ ...form, source_url: e.target.value })}
            placeholder="https://store.com/product"
          />
        </label>
        <button type="submit" disabled={submitting}>
          {submitting ? "Saving..." : "Save product"}
        </button>
      </form>

      <div className="product-list">
        {products.length === 0 ? (
          <p className="muted">No products yet.</p>
        ) : (
          products.map((p) => (
            <div key={p.id} className="product-row">
              <div>
                <div className="product-name">{p.name}</div>
                <div className="product-meta">{p.id}</div>
              </div>
              <button type="button" className="danger" onClick={() => onDelete && onDelete(p.id)}>
                Delete
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
