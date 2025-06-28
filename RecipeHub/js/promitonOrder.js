const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get("id");

const loadOrderProduct = () => {
  fetch("/api/promotions/list/")
    .then((res) => res.json())
    .then((data) =>
      data.forEach((item) => {
        if (item.id == id) {
          displayOrderProduct(item);
        }
      })
    );
};

const displayOrderProduct = (item) => {
  const productContainer = document.getElementById("product-container");
  const productHTML = `
        <div class="bg-white shadow-md rounded-lg overflow-hidden transform transition-transform duration-500 hover:scale-105">
            <img src="${item.image}" alt="${item.title}" class="w-full h-64 object-cover object-center">
            <div class="p-6">
                <h2 class="text-2xl font-bold text-gray-800 mb-2">${item.title}</h2>
                <p class="text-gray-600 mb-4">${item.description}</p>
                <p class="text-lg text-gray-800 mb-2">Price: $${item.price}</p>
                <p class="text-lg font-semibold ${item.product_count > 0 ? "text-green-500" : "text-red-500"}">
                    ${item.product_count > 0 ? "In Stock" : "Out of Stock"}
                </p>
                ${
                  item.product_count > 0
                    ? `
                <div class="mt-4">
                    <button  onclick="orderTake(${item.id}, ${item.price})" class="w-full primary-color text-white py-2 px-4 rounded-lg hover:bg-gray-800 transition-colors duration-300">Pay Now</button>
                </div>
                `
                    : ""
                }
            </div>
        </div>
    `;
  productContainer.innerHTML = productHTML;
};

const orderTake = (productId, amount) => {
  fetch("/api/order/list/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      user: localStorage.getItem("user_id"),
      is_payment: true,
      payment_amount: amount,
      pay_reason: "Taking Promotional Product",
    }),
  })
    .then((res) => res.json())
    .then((data) => handlePayment(productId, amount))
    .catch((error) => {
      console.error("Error:", error);
    });
};

const handlePayment = (productId, amount) => {
  fetch("/api/promotions/product/payment/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: productId,
      price: amount,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data && data.GatewayPageURL) {
        window.location.href = data.GatewayPageURL;
        console.log(data);
      } else {
        alert("Failed to initiate payment");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
};

loadOrderProduct();
