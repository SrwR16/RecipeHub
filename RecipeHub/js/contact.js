const contact = (event) => {
  event.preventDefault();
  const name = getValueFor("name");
  const email = getValueFor("email");
  const message = getValueFor("message");
  const phone = getValueFor("phone");
  const username = getValueFor("username");
  fetch("http://127.0.0.1:8000/user/list/")
    .then((res) => res.json())
    .then((data) => {
      data.forEach((item) => {
        if (item.username == username) {
          user = item.id;
          const info = {
            name,
            phone,
            email,
            message,
            user,
          };
          fetch("http://127.0.0.1:8000/support/contact/", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify(info),
          })
            .then((res) => res.json())
            .then((data) => {
              alert("Your Mail send to the Admin");
            });
        }
      });
    });
};

const getValueFor = (id) => {
  const value = document.getElementById(id).value;
  return value;
};

const getUser = () => {
  const token = localStorage.getItem("tokens");
  if (token) {
    const tokens = JSON.parse(token);
    const token_seizer = tokens.access.split(".");
    const tokenPayload = JSON.parse(atob(token_seizer[1]));
    document.getElementById("username").value = tokenPayload.username;
  }
  else{
    alert('For support you need to login first.')
    window.location.href = "auth.html"
  }
};

getUser();
