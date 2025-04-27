document.addEventListener("DOMContentLoaded", function () {
    "use strict";

    // Spinner
    const spinner = document.getElementById("spinner");
    if (spinner) {
        setTimeout(() => {
            spinner.classList.remove("show");
        }, 1);
    }


    // Back to top button
    const backToTop = document.querySelector(".back-to-top");
    if (backToTop) {
        window.addEventListener("scroll", function () {
            if (window.scrollY > 300) {
                backToTop.style.display = "block";
            } else {
                backToTop.style.display = "none";
            }
        });

        backToTop.addEventListener("click", function (e) {
            e.preventDefault();
            window.scrollTo({
                top: 0,
                behavior: "smooth",
            });
        });
    }

    // Modal Video
    let videoSrc = "";
    const btnPlay = document.querySelectorAll(".btn-play");
    const videoModal = document.getElementById("videoModal");
    const videoElement = document.getElementById("video");

    btnPlay.forEach((btn) => {
        btn.addEventListener("click", function () {
            videoSrc = btn.getAttribute("data-src");
        });
    });

    if (videoModal) {
        videoModal.addEventListener("shown.bs.modal", function () {
            if (videoElement) {
                videoElement.setAttribute(
                    "src",
                    `${videoSrc}?autoplay=1&modestbranding=1&showinfo=0`
                );
            }
        });

        videoModal.addEventListener("hide.bs.modal", function () {
            if (videoElement) {
                videoElement.setAttribute("src", videoSrc);
            }
        });
    }

    // Facts counter
    const counters = document.querySelectorAll("[data-toggle='counter-up']");
    counters.forEach((counter) => {
        let updateCounter = function () {
            const target = +counter.getAttribute("data-target");
            const speed = 2000; // Duration in milliseconds
            const increment = target / speed;

            let count = 0;
            const update = () => {
                count += increment;
                if (count < target) {
                    counter.innerText = Math.floor(count);
                    requestAnimationFrame(update);
                } else {
                    counter.innerText = target;
                }
            };
            update();
        };

        updateCounter();
    });
    
});