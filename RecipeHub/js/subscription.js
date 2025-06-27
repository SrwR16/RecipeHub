const navBar = () => {
  const login = document.getElementById("login-control");
  const token = localStorage.getItem("tokens");
  const tokens = JSON.parse(token);
  if (tokens) {
    login.innerHTML = `
      <a href="profile.html" class="btn text-white" style="background-color: #77574c">Profile</a>
      <a onclick="logout()" class="btn text-white" style="background-color: #77574c">Logout</a>
      `;
  } else {
    login.innerHTML = `
      <a href="./auth.html" class="btn text-white" style="background-color: #77574c">Login</a>
      `;
  }
};

const user_count = () => {
  fetch("http://127.0.0.1:8000/chat/profile/")
    .then((res) => res.json())
    .then((data) => {
      const monthlyPremiumCount = Array(12).fill(0); // Array for counting premium users by month
      const monthlyNormalCount = Array(12).fill(0); // Array for counting normal users by month
      data.forEach((user) => {
        const creationDate = new Date(user.user_creation_date);
        const month = creationDate.getMonth(); // Get the month (0-11)
        if (user.verified) {
          monthlyPremiumCount[month] += 1; // Increment premium user count
        } else {
          monthlyNormalCount[month] += 1; // Increment normal user count
        }
      });
      // Update the chart with dynamic data
      updateChart(monthlyPremiumCount, monthlyNormalCount);
    })
    .catch((error) => console.error("Error fetching data:", error));
};

const updateChart = (premiumData, normalData) => {
  const monthlyUserChart = Chart.getChart("monthlyUserChart"); // Get existing chart instance
  if (monthlyUserChart) {
    monthlyUserChart.data.datasets[0].data = premiumData; // Update premium users dataset
    monthlyUserChart.data.datasets[1].data = normalData; // Update normal users dataset
    monthlyUserChart.update(); // Update the chart
  } else {
    console.error("Chart instance not found");
  }
};

const ctx = document.getElementById("monthlyUserChart").getContext("2d");
const data = {
  labels: ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"],
  datasets: [
    {
      label: "Premium Users",
      data: [],
      backgroundColor: "rgba(75, 192, 192, 0.2)",
      borderColor: "rgba(75, 192, 192, 1)",
      borderWidth: 1,
      fill: false,
      hidden: false,
    },
    {
      label: "Normal Users",
      data: [],
      backgroundColor: "rgba(255, 99, 132, 0.2)",
      borderColor: "rgba(255, 99, 132, 1)",
      borderWidth: 1,
      fill: false,
      hidden: true,
    },
  ],
};
const config = {
  type: "line",
  data: data,
  options: {
    responsive: true,
    plugins: {
      legend: {
        display: true,
        onClick: (e, legendItem) => {
          const chart = monthlyUserChart; // Direct reference to the chart instance
          const datasetIndex = legendItem.datasetIndex;
          if (datasetIndex !== undefined) {
            const dataset = chart.data.datasets[datasetIndex];
            if (dataset) {
              // Toggle visibility for the clicked dataset
              dataset.hidden = !dataset.hidden;
              chart.update(); // Update the chart
            } else {
              console.error("Dataset is undefined");
            }
          } else {
            console.error("datasetIndex is undefined");
          }
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
    },
  },
};
const monthlyUserChart = new Chart(ctx, config);

function showPlan(planType) {
  const monthlyPlan = document.getElementById("monthly-plan");
  const yearlyPlan = document.getElementById("yearly-plan");

  if (planType === "monthly") {
    monthlyPlan.classList.remove("hidden");
    yearlyPlan.classList.add("hidden");
    document.getElementById("monthly-btn").classList.add("bg-neutral", "text-white");
    document.getElementById("yearly-btn").classList.remove("bg-neutral", "text-white");
  } else {
    yearlyPlan.classList.remove("hidden");
    monthlyPlan.classList.add("hidden");
    document.getElementById("yearly-btn").classList.add("bg-neutral", "text-white");
    document.getElementById("monthly-btn").classList.remove("bg-neutral", "text-white");
  }
}

const checkVerificationAndSubscribe = (planId, price) => {
    fetch("http://127.0.0.1:8000/chat/profile/")
      .then((res) => res.json())
      .then((data) => {
        const userId = localStorage.getItem("user_id");
        const userProfile = data.find((item) => item.user.id == userId);
        if (userProfile && userProfile.verified) {
          alert("You already subscribed to a plan");
        } else {
          subscriptionHandle(planId, price);
        }
      })
      .catch((error) => {
        console.error("Error fetching user profile:", error);
      });
  };

const subscriptionHandle = (subscriptionType, amount) => {
  fetch("http://127.0.0.1:8000/promotions/product/payment/", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      id: subscriptionType,
      price: amount,
    }),
  })
    .then((res) => res.json())
    .then((data) => {
      if (data && data.GatewayPageURL) {
        fetch("http://127.0.0.1:8000/order/list/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            user: localStorage.getItem("user_id"),
            is_payment: true,
            payment_amount: amount,
            pay_reason: "For Subcription",
          }),
        })
          .then((res) => res.json())
          .then((data) => {
            alert("Order Created Successfully!!");
          });
        window.location.href = data.GatewayPageURL;
      } 
      else {
        alert("Failed to initiate payment");
      }
    })
    .catch((error) => {
      console.error("Error:", error);
    });
};

const checkSubcribedUser = () =>{
    fetch("http://127.0.0.1:8000/order/list/")
    .then(res=>res.json())
    .then(data=>data.forEach(item=>{
        if(item.pay_reason=="For Subcription"){
            makeVerified(item.user)
        }
    }))
}

const makeVerified = (user) =>{
    console.log(user);
    fetch("http://127.0.0.1:8000/chat/profile/")
    .then(res=>res.json())
    .then(data=>{
        data.forEach(item=>{
            if(item.user.id==user && !item.verified){
                fetch(`http://127.0.0.1:8000/chat/profile/${item.id}/`,{
                    method: "PUT", // Use PUT for updating
                    headers: {
                      "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ verified: true }), 
                  })
                .then(res=>res.json())
                .then(data=>console.log(data))
            }
        })
    })
}

const logout = () => {
    alert("Logout Successfully");
    localStorage.removeItem("tokens");
    localStorage.removeItem("user_id");
    window.location.href = "auth.html";
  };

checkSubcribedUser()
user_count();
navBar();
