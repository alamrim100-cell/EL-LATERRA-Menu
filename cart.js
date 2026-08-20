// ===== إعدادات Supabase =====
const SUPABASE_URL = 'https://fyyxuvqwoykavqhoaowu.supabase.co';
const SUPABASE_KEY = 'sb_publishable_CKq5sKxZvi5k43cmEJ1cjw_Cg7jWk_e';

// ===== السلة =====
let cart = {};

let pendingItem = null;

function addToCart(nameAr, price, nameEn=''){
  // المشروبات اللي ما تحتاج خيار (طلبات جاهزة)
  const noTempItems = ['كرواسون','مرتديلا','حلومي','كريب','تيراميسو','تشيزكيك','لندن كيك','سان سباستيان','قهوة عربية'];
  if(noTempItems.includes(nameAr)){
    addItemToCart(nameAr, price, nameEn, '');
    return;
  }
  // أظهر نافذة الاختيار
  pendingItem = {nameAr, price, nameEn};
  const modal = document.getElementById('tempModal');
  const itemName = document.getElementById('tempItemName');
  const itemNameEn = document.getElementById('tempItemNameEn');
  if(itemName) itemName.textContent = nameAr;
  if(itemNameEn) itemNameEn.textContent = nameEn;
  if(modal) modal.classList.add('open');
}

function selectTemp(temp, tempEn){
  if(!pendingItem) return;
  addItemToCart(pendingItem.nameAr, pendingItem.price, pendingItem.nameEn, temp, tempEn);
  pendingItem = null;
  const modal = document.getElementById('tempModal');
  if(modal) modal.classList.remove('open');
}

function closeTempModal(){
  pendingItem = null;
  const modal = document.getElementById('tempModal');
  if(modal) modal.classList.remove('open');
}

function addItemToCart(nameAr, price, nameEn='', temp='', tempEn=''){
  const key = nameAr + (temp ? '_' + temp : '');
  const displayName = nameAr + (temp ? ` — ${temp}` : '');
  const displayNameEn = nameEn + (tempEn ? ` — ${tempEn}` : '');
  if(cart[key]){
    cart[key].qty++;
  } else {
    cart[key] = {name: displayName, nameEn: displayNameEn, price, qty:1};
  }
  updateCartUI();
  showCartBar();
}

function removeFromCart(name){
  if(cart[name]){
    cart[name].qty--;
    if(cart[name].qty <= 0) delete cart[name];
  }
  updateCartUI();
  if(Object.keys(cart).length === 0) hideCartBar();
}

function getTotal(){
  return Object.values(cart).reduce((s,i) => s + (i.price * i.qty), 0);
}

function getCount(){
  return Object.values(cart).reduce((s,i) => s + i.qty, 0);
}

function updateCartUI(){
  const count = getCount();
  const total = getTotal();
  const countEl = document.getElementById('cartCount');
  const totalEl = document.getElementById('cartTotal');
  const total2El = document.getElementById('cartTotal2');
  const itemsEl = document.getElementById('cartItems');
  if(countEl) countEl.textContent = count;
  if(totalEl) totalEl.textContent = total.toFixed(3);
  if(total2El) total2El.textContent = total.toFixed(3);
  if(itemsEl){
    itemsEl.innerHTML = Object.values(cart).map(item => `
      <div class="cart-row">
        <div class="cart-item-name">
          <div>${item.name}</div>
          ${item.nameEn ? `<div style="font-size:0.75rem;opacity:0.6;font-style:italic;">${item.nameEn}</div>` : ''}
        </div>
        <div class="cart-qty-ctrl">
          <button onclick="removeFromCart('${item.name}')">−</button>
          <span>${item.qty}</span>
          <button onclick="addToCart('${item.name}', ${item.price}, '${item.nameEn}')">+</button>
        </div>
        <span class="cart-item-price">${(item.price * item.qty).toFixed(3)}</span>
      </div>
    `).join('');
  }
}

function showCartBar(){
  const bar = document.getElementById('cartBar');
  if(bar) bar.classList.add('show');
}
function hideCartBar(){
  const bar = document.getElementById('cartBar');
  if(bar) bar.classList.remove('show');
}

function openCart(){
  const modal = document.getElementById('cartModal');
  if(modal){ modal.classList.add('open'); updateCartUI(); }
}
function closeCart(){
  const modal = document.getElementById('cartModal');
  if(modal) modal.classList.remove('open');
}

function animateBtn(name){
  const btns = document.querySelectorAll(`[data-item="${name}"]`);
  btns.forEach(btn => {
    btn.classList.add('added');
    setTimeout(() => btn.classList.remove('added'), 600);
  });
}

// ===== إرسال الطلب =====
async function sendOrder(){
  const tableInput = document.getElementById('tableNumber');
  const tableNum = tableInput ? tableInput.value.trim() : '';
  const noteInput = document.getElementById('orderNote');
  const note = noteInput ? noteInput.value.trim() : '';

  if(!tableNum){
    tableInput.focus();
    tableInput.style.borderColor = '#e53935';
    setTimeout(() => tableInput.style.borderColor = '', 2000);
    return;
  }

  if(Object.keys(cart).length === 0) return;

  const btn = document.getElementById('sendOrderBtn');
  btn.disabled = true;
  btn.textContent = '⏳ جاري الإرسال...';

  const items = Object.values(cart).map(i => ({name: i.name, nameEn: i.nameEn || '', qty: i.qty, price: i.price}));

  try{
    const res = await fetch(`${SUPABASE_URL}/rest/v1/orders`, {
      method:'POST',
      headers:{
        'apikey': SUPABASE_KEY,
        'Authorization': `Bearer ${SUPABASE_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=minimal'
      },
      body: JSON.stringify({
        table_number: tableNum,
        items: JSON.stringify(items),
        status: 'new',
        note: note,
        created_at: new Date().toISOString()
      })
    });

    if(res.ok || res.status === 201){
      // نجح الإرسال
      showSuccess();
      cart = {};
      updateCartUI();
      hideCartBar();
      closeCart();
    } else {
      throw new Error('فشل الإرسال');
    }
  } catch(e){
    btn.textContent = '❌ فشل الإرسال، حاول مرة ثانية';
    btn.disabled = false;
  }
}

function showSuccess(){
  const modal = document.getElementById('successModal');
  if(modal){ modal.classList.add('open'); setTimeout(() => modal.classList.remove('open'), 3000); }
}
