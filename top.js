// 获取页面元素
const landingView = document.getElementById("landingView");
const mainView = document.getElementById("mainView");
const navLinks = document.querySelectorAll(".nav-link");

// 添加点击事件监听器
navLinks.forEach(link => {
  link.addEventListener("click", (event) => {
    event.preventDefault(); // 阻止默认链接行为
    const targetId = event.target.getAttribute("href");
    showView(targetId);
  });
});

// 显示指定视图
function showView(targetId) {
  if (targetId === "#home") {
    landingView.classList.remove("hidden");
    mainView.classList.add("hidden");
  } else {
    landingView.classList.add("hidden");
    mainView.classList.remove("hidden");
    scrollToSection(targetId);
  }
}

// 滚动到指定部分
function scrollToSection(targetId) {
  const targetElement = document.querySelector(targetId);
  if (targetElement) {
    targetElement.scrollIntoView({ behavior: "smooth" });
  }
}
