const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");

menuButton.addEventListener("click", () => {
  nav.classList.toggle("open");
});

document.querySelectorAll(".nav a").forEach(link => {
  link.addEventListener("click", () => {
    nav.classList.remove("open");
  });
});


const filters = document.querySelectorAll(".filter");
const courses = document.querySelectorAll(".course");

filters.forEach(button => {

  button.addEventListener("click", () => {

    filters.forEach(filter => {
      filter.classList.remove("active");
    });

    button.classList.add("active");

    const selected = button.dataset.filter;

    courses.forEach(course => {

      const category = course.dataset.category;

      if (selected === "all" || category === selected) {
        course.style.display = "block";
      } else {
        course.style.display = "none";
      }

    });

  });

});