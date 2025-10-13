// Mini-Cart Drawer & Ajax Add-To-Cart
(function () {
  const q = (s, r = document) => r.querySelector(s);
  const qa = (s, r = document) => Array.from(r.querySelectorAll(s));

  function openDrawer() {
    document.documentElement.classList.add('cart-drawer-open');
    q('.cart-drawer')?.setAttribute('aria-hidden', 'false');
    renderCart();
  }

  function closeDrawer() {
    document.documentElement.classList.remove('cart-drawer-open');
    q('.cart-drawer')?.setAttribute('aria-hidden', 'true');
  }

  async function getCart() {
    const res = await fetch('/cart.js');
    return await res.json();
  }

  async function renderCart() {
    const cart = await getCart();
    const container = q('[data-cart-items]');
    const subtotalEl = q('[data-cart-subtotal]');
    const countEls = qa('[data-cart-count]');
    if (!container) return;

    if (!cart.items.length) {
      container.innerHTML = `<p>Dein Warenkorb ist leer.</p>`;
    } else {
      container.innerHTML = cart.items.map((it, idx) => `
        <div class="cart-line">
          <img src="${it.image}" alt="${it.product_title}" />
          <div class="cart-line__info">
            <div class="cart-line__title">${it.product_title}</div>
            <div class="cart-line__price">${Shopify.formatMoney(it.final_line_price)}</div>
            <div class="cart-line__qty">
              <button data-change data-index="${idx+1}" data-qty="${it.quantity-1}">−</button>
              <input value="${it.quantity}" inputmode="numeric" readonly />
              <button data-change data-index="${idx+1}" data-qty="${it.quantity+1}">+</button>
              <button class="rm" data-change data-index="${idx+1}" data-qty="0">Entfernen</button>
            </div>
          </div>
        </div>
      `).join('');
    }

    const subtotal = cart.items_subtotal_price;
    if (subtotalEl) subtotalEl.textContent = Shopify.formatMoney(subtotal);
    countEls.forEach(el => el.textContent = cart.item_count);

    qa('[data-change]').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const line = Number(btn.dataset.index);
        const qty = Number(btn.dataset.qty);
        await fetch('/cart/change.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ line, quantity: qty })
        });
        renderCart();
      });
    });
  }

  // Toggle drawer
  document.addEventListener('click', (e) => {
    const t = e.target;
    if (t.closest('[data-open-cart]')) { e.preventDefault(); openDrawer(); }
    if (t.closest('[data-close-cart]')) { e.preventDefault(); closeDrawer(); }
    if (t.classList.contains('cart-backdrop')) closeDrawer();
  });

  // Ajax add-to-cart
  document.addEventListener('submit', async (e) => {
    const form = e.target;
    if (!form.matches('[data-ajax-add]')) return;
    e.preventDefault();
    const fd = new FormData(form);
    const payload = { id: fd.get('id'), quantity: Number(fd.get('quantity') || 1), properties: {} };
    const btn = form.querySelector('button[type="submit"]');
    const old = btn?.textContent;
    if (btn) btn.textContent = 'Wird hinzugefügt…';
    try {
      await fetch('/cart/add.js', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (btn) btn.textContent = 'Hinzugefügt!';
      openDrawer();
    } catch (err) {
      alert('Konnte nicht in den Warenkorb legen.');
    } finally {
      setTimeout(() => { if (btn && old) btn.textContent = old; }, 800);
    }
  });

  // Expose for debug
  window.__cart = { openDrawer, closeDrawer, renderCart, getCart };
})();
