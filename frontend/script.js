// ✅ Backend base URL (Render backend)
const API_BASE = "https://imag-3e3b.onrender.com";

(async function fetchImages() {
  const container = document.getElementById("gallery");
  container.innerHTML = "Loading...";

  try {
    const res = await fetch(`${API_BASE}/images`);
    const images = await res.json();

    container.innerHTML = "";

    if (!Array.isArray(images) || images.length === 0) {
      container.innerHTML = "<p>No images uploaded yet.</p>";
      return;
    }

    images.forEach(img => {
      const card = document.createElement("div");
      card.className = "card";

      const el = document.createElement("img");
      el.src = img.Url;   // ✅ match backend property
      el.alt = img.Key;
      el.style.maxWidth = "200px";
      el.style.margin = "10px";

      const meta = document.createElement("div");
      meta.className = "meta";
      meta.innerText = `${img.Key.split('/').pop()} — ${(img.Size / 1024).toFixed(1)} KB`;

      const del = document.createElement("button");
      del.innerText = "Delete";
      del.onclick = async () => {
        if (!confirm("Delete this image?")) return;
        const dres = await fetch(`${API_BASE}/images`, {
          method: "DELETE",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ key: img.Key })
        });
        const dj = await dres.json();
        if (dj.success) fetchImages(); else alert("Delete failed");
      };

      card.appendChild(el);
      card.appendChild(meta);
      card.appendChild(del);
      container.appendChild(card);
    });
  } catch (err) {
    console.error(err);
    container.innerHTML = "<p>Error loading images</p>";
  }
})();

// Upload form
const form = document.getElementById("uploadForm");
form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const file = document.getElementById("fileInput").files[0];
  if (!file) return;
  const fd = new FormData();
  fd.append("image", file);
  document.getElementById("uploadMsg").innerText = "Uploading...";
  try {
    const res = await fetch(`${API_BASE}/upload`, { method: "POST", body: fd });
    const j = await res.json();
    if (j.success || j.key) {
      document.getElementById("uploadMsg").innerText = "Upload successful";
      form.reset();
      fetchImages(); // reload images after upload
    } else {
      document.getElementById("uploadMsg").innerText = "Upload failed";
    }
  } catch (err) {
    console.error(err);
    document.getElementById("uploadMsg").innerText = "Upload error";
  }
});

// ✅ Auto load when page is ready
window.addEventListener("DOMContentLoaded", () => fetchImages());
