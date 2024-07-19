const API = (() => {
  const URL = "http://localhost:3000";
  const getCart = () => {
    return fetch(`${URL}/cart`).then((res) => res.json());
  };

  const getInventory = () => {
    return fetch(`${URL}/inventory`).then((res) => res.json());
  };

  const addToCart = (inventoryItem) => {
    return fetch(`${URL}/cart`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(inventoryItem),
    }).then((res) => res.json());
  };

  const updateCart = (id, newAmount) => {
    return fetch(`${URL}/cart/${id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newAmount),
    }).then((res) => res.json());
  };

  const deleteFromCart = (id) => {
    return fetch(`${URL}/cart/${id}`, {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
    }).then((res) => res.json());
  };

  const checkout = () => {
    // you don't need to add anything here
    return getCart().then((data) =>
      Promise.all(data.map((item) => deleteFromCart(item.id)))
    );
  };

  return {
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  };
})();

const Model = (() => {
  // implement your logic for Model
  class State {
    #onChange;
    #inventory;
    #cart;
    constructor() {
      this.#inventory = [];
      this.#cart = [];
    }
    get cart() {
      return this.#cart;
    }

    get inventory() {
      return this.#inventory;
    }

    set cart(newCart) {
      this.#cart = newCart;
      this.#onChange();
    }

    set inventory(newInventory) {
      this.#inventory = newInventory;
      this.#onChange();
    }

    subscribe(cb) {
      this.#onChange = cb;
    }
  }
  const {
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  } = API;
  return {
    State,
    getCart,
    updateCart,
    getInventory,
    addToCart,
    deleteFromCart,
    checkout,
  };
})();

const View = (() => {
  const inventoryListEl = document.querySelector(".inventory__list");
  const cartListEl = document.querySelector(".cart__list");
  const checkoutBtnEl = document.querySelector(".cart__checkout-btn");

  const renderInventory = (inventories) => {
    let inventoriesTemp = "";
    inventories.forEach((inventory) => {
      const inventoryItemTemp = `
        <li id=${inventory.id}>
          <span>${inventory.content}</span>
          <button class="minus-btn" data-id="${inventory.id}">-</button>
          <input type="text" value="0" class="amount-input" data-id="${inventory.id}" />
          <button class="plus-btn" data-id="${inventory.id}">+</button>
          <button class="add-to-cart-btn" data-id="${inventory.id}">Add to Cart</button>
        </li>`;
      inventoriesTemp += inventoryItemTemp;
    });
    inventoryListEl.innerHTML = inventoriesTemp;
  };

  const renderCart = (cart) => {
    let cartTemp = "";
    cart.forEach((item) => {
      const itemTemp = `
      <li>
        <span>${item.content} (${item.amount})</span>
        <button class="delete-btn" data-id="${item.id}">Delete</button>
      </li>`;
      cartTemp += itemTemp;
    });
    cartListEl.innerHTML = cartTemp;
  };

  return {
    renderInventory,
    renderCart,
    inventoryListEl,
    checkoutBtnEl,
    cartListEl,
  };
})();

const Controller = ((model, view) => {
  // implement your logic for Controller
  const state = new model.State();

  const handleUpdateAmount = (e) => {
    const id = e.target.dataset.id;
    const amountInput = document.querySelector(
      `.amount-input[data-id="${id}"]`
    );
    let amount = parseInt(amountInput.value);
    if (e.target.classList.contains("plus-btn")) {
      amountInput.value = ++amount;
    } else if (e.target.classList.contains("minus-btn") && amount > 0) {
      amountInput.value = --amount;
    }
  };

  const handleAddToCart = () => {
    view.inventoryListEl.addEventListener("click", (event) => {
      const target = event.target;
      console.log(target.className);
      if (target.className === "add-to-cart-btn") {
        event.preventDefault();
        const amountInput = document.querySelector(
          `.amount-input[data-id="${target.dataset.id}"]`
        );
        const amount = parseInt(amountInput.value);
        console.log(amount);
        const id = target.dataset.id;
        if (amount > 0) {
          const inventoryItem = state.inventory.find(
            (item) => item.id === parseInt(id)
          );
          const cartItem = state.cart.find((item) => item.id === parseInt(id));
          console.log(cartItem);
          if (cartItem !== undefined) {
            console.log(id);
            model.updateCart(id, cartItem.amount + amount).then(() => {
              model.getCart().then((data) => (state.cart = data));
            });
          } else {
            const newItem = { ...inventoryItem, amount };
            model.addToCart(newItem).then(() => {
              model.getCart().then((data) => (state.cart = data));
            });
          }
        }
      } else if (target.classList.contains("minus-btn")) {
        const amountInput = document.querySelector(
          `.amount-input[data-id="${target.dataset.id}"]`
        );
        let amount = parseInt(amountInput.value);
        if (amount > 0) {
          amountInput.value = amount - 1;
        }
      } else if (target.classList.contains("plus-btn")) {
        const amountInput = document.querySelector(
          `.amount-input[data-id="${target.dataset.id}"]`
        );
        let amount = parseInt(amountInput.value);
        amountInput.value = amount + 1;
      }
    });
  };

  const handleDelete = (id) => {
    model.deleteFromCart(id).then(() => {
      model.getCart().then((data) => (state.cart = data));
    });
  };

  const handleCheckout = () => {
    model.checkout().then(() => {
      model.getCart().then((data) => (state.cart = data));
    });
  };

  const init = () => {
    model.getInventory().then((data) => (state.inventory = data));
    model.getCart().then((data) => (state.cart = data));

    view.cartListEl.addEventListener("click", (event) => {
      const target = event.target;
      if (target.classList.contains("delete-btn")) {
        const id = target.dataset.id;
        handleDelete(id);
      }
    });

    view.checkoutBtnEl.addEventListener("click", handleCheckout);

    state.subscribe(() => {
      view.renderInventory(state.inventory);
      view.renderCart(state.cart);
    });
    handleAddToCart();
  };

  const bootstrap = () => {
    init();
  };
  return {
    bootstrap,
  };
})(Model, View);

Controller.bootstrap();
