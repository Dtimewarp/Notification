import "./style.css";
import { setupCounter } from "./counter.js";

document.querySelector("#app").innerHTML = `
  <div>
    <div class="card">
      <button id="counter" type="button"></button>
    </div>
    <button id="notifyBtn">Отправить уведомления</button>
  </div>
`;

setupCounter(document.querySelector("#counter"));

document.getElementById("notifyBtn").addEventListener("click", async () => {
  try {
    const res = await fetch("https://notification-zx0v.onrender.com/notify", {
      method: "POST",
    });
    if (res.ok) alert("Уведомления отправлены!");
    else alert("Ошибка при отправке уведомлений");
  } catch (err) {
    console.error(err);
    alert("Произошла ошибка при отправке уведомлений");
  }
});
