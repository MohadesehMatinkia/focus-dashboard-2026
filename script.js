const inputBox = document.getElementById("input-box");
const listContainer = document.getElementById("list-container");
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");
const emptyState = document.getElementById("empty-state");

// لود اولیه
document.addEventListener("DOMContentLoaded", () => {
    showTask();
    updateProgress();
    fetchQuote();     // <--- دریافت جمله انگیزشی
    loadTheme();      // <--- لود کردن تم ذخیره شده
    
    // فعال‌سازی Drag & Drop با SortableJS
    new Sortable(listContainer, {
        animation: 150,
        ghostClass: 'ghost-task', // کلاسی که در CSS تعریف کردیم
        onEnd: function() {
            saveData(); // ذخیره ترتیب جدید بعد از رها کردن
        }
    });
});

// --- بخش ۰: سخن بزرگان (API) ---
async function fetchQuote() {
    const quoteBox = document.getElementById("quote-box");
    try {
        // استفاده از API فارسی یا انگلیسی. اینجا یک API انگلیسی با ترجمه فرضی استفاده میکنیم
        // یا مستقیم یک آرایه محلی برای سرعت بیشتر و اطمینان:
        const quotes = [
            "هر روز یک شروع دوباره است 🌱",
            "تمرکز، کلید همه موفقیت‌هاست 🔑",
            "قدم‌های کوچک، تغییرات بزرگ می‌سازند 🚀",
            "غیرممکن، فقط یک کلمه است 💎",
            "رویاهات رو به برنامه تبدیل کن 📅"
        ];
        const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
        quoteBox.innerHTML = `<i class="fa-solid fa-quote-right"></i> ${randomQuote}`;
        
    } catch (error) {
        quoteBox.innerHTML = "امروز روز توست!";
    }
}

// --- بخش ۱: تغییر تم (Dark/Light) ---
function toggleTheme() {
    document.body.classList.toggle("light-mode");
    const icon = document.querySelector("#theme-btn i");
    
    if(document.body.classList.contains("light-mode")) {
        icon.classList.remove("fa-sun");
        icon.classList.add("fa-moon");
        localStorage.setItem("theme", "light"); // ذخیره در مرورگر
    } else {
        icon.classList.remove("fa-moon");
        icon.classList.add("fa-sun");
        localStorage.setItem("theme", "dark");
    }
}

function loadTheme() {
    const savedTheme = localStorage.getItem("theme");
    if(savedTheme === "light") {
        document.body.classList.add("light-mode");
        document.querySelector("#theme-btn i").classList.replace("fa-sun", "fa-moon");
    }
}

// --- بخش ۲: لاجیک اصلی تسک‌ها ---
inputBox.addEventListener("keypress", function(e) {
    if (e.key === "Enter") addTask();
});

function addTask() {
    if(inputBox.value === ''){
        showToast("لطفا متنی برای تسک بنویسید!", "error");
    } else {
        let li = document.createElement("li");
        li.innerHTML = inputBox.value;
        li.setAttribute("data-status", "active");
        listContainer.appendChild(li);
        
        let span = document.createElement("span");
        span.innerHTML = '<i class="fa-regular fa-trash-can"></i>';
        li.appendChild(span);
        
        inputBox.value = "";
        saveData();
        updateProgress();
        showToast("ماموریت جدید اضافه شد!", "success");
    }
}

listContainer.addEventListener("click", function(e){
    if(e.target.tagName === "LI"){
        e.target.classList.toggle("checked");
        
        if(e.target.classList.contains("checked")){
            e.target.setAttribute("data-status", "completed");
        } else {
            e.target.setAttribute("data-status", "active");
        }
        
        saveData();
        updateProgress();
    }
    else if(e.target.tagName === "SPAN" || e.target.closest("span")){
        e.target.closest("li").remove();
        saveData();
        updateProgress();
        showToast("آیتم حذف شد", "error");
    }
}, false);

// --- بخش ۳: Voice Input ---
function startVoice() {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        showToast("مرورگر پشتیبانی نمی‌کند", "error");
        return;
    }
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = "fa-IR";
    const micBtn = document.querySelector(".mic-btn");

    recognition.onstart = function() {
        micBtn.classList.add("listening");
        inputBox.placeholder = "در حال شنیدن...";
    };
    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        inputBox.value = transcript;
        micBtn.classList.remove("listening");
        inputBox.placeholder = "ماموریت بعدی چیه؟";
        setTimeout(addTask, 500);
    };
    recognition.start();
}

// --- بخش ۴: Toast (نوتیفیکیشن) ---
function showToast(msg, type = 'info') {
    let toastBox = document.getElementById("toast-box");
    let toast = document.createElement("div");
    toast.classList.add("toast");
    toast.classList.add(type);
    
    let icon = '';
    if(type === 'success') icon = '<i class="fa-solid fa-circle-check"></i>';
    else if(type === 'error') icon = '<i class="fa-solid fa-circle-exclamation"></i>';
    else icon = '<i class="fa-solid fa-circle-info"></i>';
    
    toast.innerHTML = icon + msg;
    toastBox.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = "none";
        toast.style.opacity = "0";
        toast.style.transform = "translateX(120%)"; 
        setTimeout(() => toast.remove(), 500);
    }, 3500);
}

// --- بخش ۵: Progress & Confetti ---
function updateProgress() {
    const tasks = listContainer.querySelectorAll("li");
    const checkedTasks = listContainer.querySelectorAll("li.checked");
    
    if(tasks.length === 0) {
        emptyState.style.display = "block";
        progressBar.style.width = "0%";
        progressText.innerText = "0%";
        return;
    } else {
        emptyState.style.display = "none";
    }

    const percent = (checkedTasks.length / tasks.length) * 100;
    progressBar.style.width = percent + "%";
    progressText.innerText = Math.round(percent) + "%";

    if(Math.round(percent) === 100 && tasks.length > 0) {
        launchConfetti();
        showToast("عالیه! همه کارها انجام شد 🔥", "success");
    }
}

function launchConfetti() {
    var duration = 3 * 1000;
    var animationEnd = Date.now() + duration;
    var defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };
    function randomInRange(min, max) { return Math.random() * (max - min) + min; }

    var interval = setInterval(function() {
        var timeLeft = animationEnd - Date.now();
        if (timeLeft <= 0) return clearInterval(interval);
        var particleCount = 50 * (timeLeft / duration);
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } }));
        confetti(Object.assign({}, defaults, { particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } }));
    }, 250);
}

function filterTasks(status) {
    const tasks = listContainer.querySelectorAll("li");
    document.querySelectorAll(".filter-tabs span").forEach(span => span.classList.remove("active"));
    document.getElementById(`tab-${status}`).classList.add("active");

    tasks.forEach(task => {
        const taskStatus = task.getAttribute("data-status");
        if(status === 'all') task.style.display = "flex";
        else if(status === 'completed') task.style.display = (taskStatus === 'completed') ? "flex" : "none";
        else if(status === 'active') task.style.display = (taskStatus === 'active') ? "flex" : "none";
    });
}

function saveData(){ localStorage.setItem("tasks_v3", listContainer.innerHTML); }
function showTask(){ if(localStorage.getItem("tasks_v3")) listContainer.innerHTML = localStorage.getItem("tasks_v3"); }