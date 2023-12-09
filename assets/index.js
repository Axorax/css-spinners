function beautifyCSS(css) {
  css = css.replace(/([^{]){/g, "$1 {\n");
  css = css.replace(/}([^}])/g, "}\n$1");
  let level = 0;
  css = css.replace(/([\{\}])/g, function (match, p1) {
    if (p1 === "{") {
      level++;
      return "{" + "\t".repeat(level);
    } else {
      level--;
      return "\n" + "\t".repeat(level) + "}";
    }
  });
  css = css.replace(/;/g, ";\n");
  css = css.replace(/^\s+|\s+$/g, "");
  return css;
}

function beautifyHTML(html) {
  const tabSize = 2;
  const tagPattern = /<(\/?)(\w+)([^>]*)>/g;

  let indentLevel = 0;
  let formattedHTML = "";

  html.replace(tagPattern, (match, close, tagName, attributes) => {
    if (close) {
      indentLevel--;
    }

    const indent = " ".repeat(indentLevel * tabSize);
    formattedHTML += `${indent}<${close ? "/" : ""}${tagName}${attributes}>\n`;

    if (!close && !match.endsWith("/>")) {
      indentLevel++;
    }

    if (close) {
      indentLevel--;
    }

    if (!close && !match.endsWith("/>")) {
      indentLevel++;
    }

    return match;
  });

  return formattedHTML;
}

const container = document.querySelector("#container");
const end = document.querySelector("#end");
const toggle = document.querySelector(".mode input[type='checkbox']");
const gridStyle = document.querySelector("#grid-style");
const url = window.location.origin.includes("github.io")
  ? "https://axorax.github.io/css-spinners"
  : window.location.origin;
let backgrounds = [
  "radial-gradient( circle farthest-corner at 10.2% 55.8%,  rgba(252,37,103,1) 0%, rgba(250,38,151,1) 46.2%, rgba(186,8,181,1) 90.1% )",
  "linear-gradient( 109.6deg,  rgba(61,245,167,1) 11.2%, rgba(9,111,224,1) 91.1% )",
  "radial-gradient( circle farthest-corner at 10% 20%,  rgba(0,152,155,1) 0.1%, rgba(0,94,120,1) 94.2% )",
  "linear-gradient( 110.3deg,  rgba(73,93,109,1) 4.3%, rgba(49,55,82,1) 96.7% )",
  "radial-gradient( circle farthest-corner at 10% 20%,  rgba(62,133,238,1) 1.1%, rgba(227,137,240,1) 43.7%, rgba(243,193,124,1) 89.7% )",
  "linear-gradient( 112.1deg,  rgba(32,38,57,1) 11.4%, rgba(63,76,119,1) 70.2% )",
  "linear-gradient( 109.6deg,  rgba(123,90,224,1) 11.2%, rgba(164,46,253,1) 32.6%, rgba(213,56,234,1) 62.7%, rgba(251,138,52,1) 100.2% )",
];
const requestsNeeded = Math.ceil((totalSpinners + 1) / spinnersPerFile);
let requestCount = 1;
let spinners = 0;
const themes = {
  dark: `
  color-scheme: dark;
  --primary: #3978ff;
  --primary-light: #5b8fff;
  --secondary: #1c1c1c;
  --tertiary: #3d3d3d;
  --sidebar-bg: #232323c1;
  --code-bg: #2b2b2b;
  --code-border: #3d3d3d;
  --filter: invert(1);
  --text-light: #545454;
  --hr: #62626249;
  --code-preview: #2b2b2b;
  --color: #fff;
  --box-bg: #202020;
  `,
  light: `
  color-scheme: light;
  --primary: #3978ff;
  --primary-light: #5b8fff;
  --secondary: #ffffff;
  --tertiary: #f1f1f1;
  --sidebar-bg: #e7e7e7c1;
  --code-bg: #f2f2f2;
  --code-border: #bfbfbf;
  --filter: invert(0);
  --text-light: #cecece;
  --hr: #7a7a7a49;
  --code-preview: #d9d9d9;
  --color: #000;
  --box-bg: #515151;
  `,
};
let currentTheme = "dark";

function localCheck() {
  if (localStorage.getItem("style")) {
    const item = localStorage.getItem("style");
    if (item == "m") {
      gridStyle.innerHTML = `#container{width: calc(100% - 2rem);gap: 1rem;}.box{border: 1px solid ${getComputedStyle(
        document.documentElement,
      ).getPropertyValue(
        "--code-border",
      )} !important;background: ${getComputedStyle(
        document.documentElement,
      ).getPropertyValue("--box-bg")} !important;}`;
      backgrounds = [];
    } else if (item == "s") {
      gridStyle.innerHTML = `#container{width: calc(100% - 2rem);gap: 1rem;}`;
    }
  } else {
    gridStyle.innerHTML = "";
  }
}

localCheck();

toggle.addEventListener("click", () => {
  if (currentTheme == "light") {
    document.documentElement.style.cssText = themes.dark;
    currentTheme = "dark";
  } else {
    document.documentElement.style.cssText = themes.light;
    currentTheme = "light";
  }
});

const urlParams = new URLSearchParams(window.location.search);

function loadOneSpinner(num) {
  end.remove();
  const page = Math.max(Math.ceil(num / spinnersPerFile), 1);
  loadSpinners(page, () => {
    document.querySelectorAll(".box").forEach((box) => {
      if (box.id != `spinner-${num}`) {
        box.remove();
      }
    });
  });
}

if (urlParams.get("page")) {
  end.remove();
  const page = urlParams.get("page");
  if (page.includes("p")) {
    loadOneSpinner(
      Math.ceil(parseFloat(page.replace("p", "")) * spinnersPerFile),
    );
  } else {
    loadSpinners(page);
  }
} else if (urlParams.get("spinner")) {
  loadOneSpinner(urlParams.get("spinner"));
} else {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          if (requestCount - 1 == requestsNeeded) {
            observer.unobserve(entry.target);
          } else {
            loadSpinners();
          }
        }
      });
    },
    { rootMargin: "200px" },
  );

  setTimeout(() => {
    observer.observe(end);
  }, 100);

  loadSpinners();
}

function loadSpinners(page, cb = false) {
  let fetchUrl;
  if (page) {
    fetchUrl = `${url}/data/spinners-${page}.json`;
  } else {
    fetchUrl = `${url}/data/spinners-${requestCount}.json`;
  }
  fetch(fetchUrl)
    .then((response) => response.json())
    .then((data) => {
      for (let i = 0; i < Object.keys(data).length; i++) {
        const spinner = data[Object.keys(data)[i]];
        const element = document.createElement("div");
        const preview = document.createElement("div");
        preview.classList.add("preview");
        element.append(preview);
        const shadowRoot = preview.attachShadow({ mode: "open" });
        const spinnerStyle = document.createElement("style");
        spinnerStyle.innerText = spinner.c;
        shadowRoot.innerHTML = spinner.h;
        shadowRoot.append(spinnerStyle);
        element.onclick = () => {
          sourceCode(spinner.h, spinner.c, Object.keys(data)[i]);
        };
        element.style.background =
          backgrounds[Math.floor(Math.random() * backgrounds.length)];
        element.classList.add("box");
        element.id = `spinner-${Object.keys(data)[i]}`;
        container.append(element);
        spinners++;
      }
      requestCount++;
    })
    .then((data) => {
      if (cb) {
        cb(data);
      }
    });
}

function closeSidebar() {
  const sidebar = document.querySelector(".sidebar");
  sidebar.style.transform = "translateX(-100%)";
  document.querySelector(".sidebar-overlay").remove();
  document.body.classList.remove("no-scroll");
  setTimeout(() => {
    sidebar.remove();
  }, 500);
}

function createSidebar(title, content) {
  if (document.querySelector(".sidebar")) {
    document.querySelector(".sidebar").remove();
    document.querySelector(".sidebar-overlay").remove();
    document.body.classList.remove("no-scroll");
  }

  const template = `
  <div class="panel">
  <p>${title}</p>
  <div class="close" onclick="closeSidebar()">x</div>
  </div>
  <div class="body">
  ${content}
  </div>`;
  const element = document.createElement("div");
  const overlay = document.createElement("div");

  document.body.classList.add("no-scroll");
  element.classList.add("sidebar");
  overlay.classList.add("sidebar-overlay");

  element.innerHTML = template;

  document.body.append(element);
  document.body.append(overlay);

  overlay.addEventListener("click", closeSidebar);

  setTimeout(() => {
    element.style.transform = "translateX(0)";
  }, 100);
}

function showPages() {
  createSidebar(
    `Pages`,
    `
    <h2>View only one page</h2><br />
    Why? &nbsp;
    Getting a particular spinner can require a lot of scrolling. Going to a page can help get them easily, load less and share with others.
    <hr>
    <div class="spinner-pages"></div>
    <hr>
    <h2>View particular spinner</h2><br />
    Add "?spinner=<spinner_id>" at the end of the url. Examples:<br /><br />
    ${url}?spinner=0<br />
    ${url}?spinner=269<br /><br />
    You can also use the precise page by adding "?page=p<precise_page>" at the end. Examples:<br /><br />
    ${url}?page=p0<br />
    ${url}?page=p0.05<br /><br />
    `,
  );
  const spinnerPages = document.querySelector(".sidebar .spinner-pages");
  for (let i = 0; i < requestsNeeded; i++) {
    spinnerPages.innerHTML += `<a href="${url}?page=${
      i + 1
    }"><button class="s1">Page - ${i + 1}</button></a>`;
  }
}

function showStyle() {
  createSidebar(
    `Select Grid Style`,
    `
    <h2>Change how the grid looks!</h2>
    <hr>
    <div class="grid">
    <button class="s1" onclick="setStyle('g')">Gradient with zero spacing</button>
    <button class="s1" onclick="setStyle('s')">Gradient with spacing</button>
    <button class="s1" onclick="setStyle('m')">Minimal</button>
    </div>
    <hr>
    `,
  );
}

function setStyle(style) {
  if (style == "g") {
    localStorage.clear();
  } else {
    localStorage.setItem("style", style);
  }
  localCheck();
}

function sourceCode(html, css, count) {
  createSidebar(
    `#spinner-${count} source code`,
    `
    In page: <strong>${Math.max(
      Math.ceil(count / spinnersPerFile),
      1,
    )}</strong> (<a href="${url}?page=${
      count / spinnersPerFile
    }p">precise</a> - ${count / spinnersPerFile})<br /><br />
    Spinner URL: <a href="${url}?spinner=${count}">${url}?spinner=${count}</a><br /><br />
    <div class="code-preview">
    ${html}
    </div>
    
    <h3>HTML</h3>
    <div class="code code-max html">
        <button><img src="./assets/copy.svg"></button>
        <pre><code></code></pre>
    </div>
    
    <h3>CSS</h3>
    <div class="code code-max css">
        <button><img src="./assets/copy.svg"></button>
        <pre><code></code></pre>
    </div>

    <hr>
    
    <h3>HTML (minified)</h3>
    <div class="code code-mini html">
        <button><img src="./assets/copy.svg"></button>
        <pre><code></code></pre>
    </div>
    
    <h3>CSS  (minified)</h3>
    <div class="code code-mini css">
        <button><img src="./assets/copy.svg"></button>
        <pre><code></code></pre>
    </div>`,
  );

  html = html.replaceAll(`s${count}`, "loader");
  css = css.replaceAll(`s${count}`, "loader");

  const newCss = beautifyCSS(css),
    newHtml = beautifyHTML(html),
    codePreview = document.querySelector(".sidebar .code-preview"),
    shadowRoot = codePreview.attachShadow({ mode: "open" });

  shadowRoot.innerHTML = `${html} <style>${css}</style>`;

  document.querySelector(".sidebar .code-max.html pre code").textContent =
    newHtml;
  document.querySelector(".sidebar .code-max.css pre code").textContent =
    newCss;

  copyTextButton(".sidebar .code-max.html button", newHtml);
  copyTextButton(".sidebar .code-max.css button", newCss);

  document.querySelector(".sidebar .code-mini.html pre code").textContent =
    html;
  document.querySelector(".sidebar .code-mini.css pre code").textContent = css;

  copyTextButton(".sidebar .code-mini.html button", html);
  copyTextButton(".sidebar .code-mini.css button", css);
}

function copyTextButton(selector, text) {
  const button = document.querySelector(selector),
    img = document.querySelector(`${selector} img`);

  button.addEventListener("click", () => {
    navigator.clipboard.writeText(text);
    img.src = `./assets/done.svg`;
    setTimeout(() => {
      img.src = `./assets/copy.svg`;
    }, 2000);
  });
}

window.addEventListener("scroll", function () {
  var backToTopButton = document.getElementById("backToTop");
  if (window.scrollY > 400) {
    backToTopButton.style.transform = "translateX(0)";
  } else {
    backToTopButton.style.transform = "translateX(300%)";
  }
});

document.getElementById("backToTop").addEventListener("click", function () {
  window.scrollTo({ top: 0, behavior: "smooth" });
});
