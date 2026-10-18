
"use strict";

/* ==========================================
   BRASA BURGER — PREMIUM
   Carrossel automático + pedidos
========================================== */

const WHATSAPP_NUMBER = "";

const SLIDE_INTERVAL = 5000;
const TRANSITION_DURATION = 350;

const burgers = [
  {
    name: "Brasa Clássico",
    image: "imagem/hero.png",
    description:
      "Pão brioche, blend bovino, queijo derretido, alface e molho da casa.",
    price: 29.90
  },
  {
    name: "Fogo Duplo",
    image: "imagem/fogo-duplo.png",
    description:
      "Dois blends suculentos, cheddar, cebola caramelizada e picles crocante.",
    price: 39.90
  },
  {
    name: "Defumado Dourado",
    image: "imagem/defumado-dourado.png",
    description:
      "Blend defumado, queijo prato, bacon crocante e maionese de páprica.",
    price: 34.90
  }
];

const money = value =>
  value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

const $ = id => document.getElementById(id);

/* ==========================================
   ELEMENTOS
========================================== */

const mainBurger = $("mainBurger");
const mainBurgerName = $("mainBurgerName");
const mainBurgerDescription = $("mainBurgerDescription");
const mainBurgerPrice = $("mainBurgerPrice");

const slideNumber = $("slideNumber");
const progressFill = $("progressFill");

const burgerCards = document.querySelectorAll(".burger-card");

const previousBurger = $("previousBurger");
const nextBurger = $("nextBurger");

const orderBurger = $("orderBurger");
const orderQuantity = $("orderQuantity");
const decreaseQuantity = $("decreaseQuantity");
const increaseQuantity = $("increaseQuantity");

const orderDescription = $("orderDescription");
const orderTotal = $("orderTotal");
const whatsappOrder = $("whatsappOrder");
const orderNotice = $("orderNotice");

const menuToggle = $("menuToggle");
const navigation = $("navigation");

const reducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
);

/* ==========================================
   ESTADO DO CARROSSEL
========================================== */

let currentBurger = 0;
let carouselTimer = null;
let animationTimer = null;
let animationVersion = 0;

let carouselPaused = false;

const imageCache = new Map();

/* ==========================================
   PRÉ-CARREGAMENTO DAS IMAGENS
========================================== */

function preloadImage(src) {
  if (imageCache.has(src)) {
    return imageCache.get(src);
  }

  const promise = new Promise((resolve, reject) => {
    const image = new Image();

    image.onload = () => resolve(src);
    image.onerror = () => reject(new Error(
      `Não foi possível carregar: ${src}`
    ));

    image.src = src;

    if (image.complete && image.naturalWidth > 0) {
      resolve(src);
    }
  });

  imageCache.set(src, promise);

  return promise;
}

burgers.forEach(burger => {
  preloadImage(burger.image).catch(error => {
    console.warn(error.message);
  });
});

/* ==========================================
   CONTROLES VISUAIS
========================================== */

function updateCards(index) {
  burgerCards.forEach(card => {
    const cardIndex = Number(card.dataset.burger);
    const selected = cardIndex === index;

    card.classList.toggle("selected", selected);

    card.setAttribute(
      "aria-pressed",
      String(selected)
    );
  });
}

function updateNavigation(index) {
  if (slideNumber) {
    slideNumber.textContent =
      String(index + 1).padStart(2, "0");
  }

  if (progressFill) {
    progressFill.style.width =
      `${((index + 1) / burgers.length) * 100}%`;
  }
}

function updateBurgerInformation(burger) {
  mainBurgerName.textContent = burger.name.toUpperCase();

  mainBurgerDescription.textContent =
    burger.description;

  mainBurgerPrice.textContent = money(burger.price);
}

function resetImageStyles() {
  mainBurger.style.opacity = "1";
  mainBurger.style.transform = "translateY(0) scale(1)";
  mainBurger.style.filter = "blur(0)";
}

/* ==========================================
   ANIMAÇÃO PRINCIPAL
========================================== */

async function updateBurger(index, manual = false) {
  const nextIndex =
    (index + burgers.length) % burgers.length;

  if (manual) {
    restartCarousel();
  }

  if (nextIndex === currentBurger) {
    return;
  }

  const version = ++animationVersion;
  const burger = burgers[nextIndex];

  clearTimeout(animationTimer);

  try {
    await preloadImage(burger.image);
  } catch (error) {
    console.warn(error.message);
    resetImageStyles();
    return;
  }

  if (version !== animationVersion) {
    return;
  }

  currentBurger = nextIndex;

  updateCards(currentBurger);
  updateNavigation(currentBurger);

  if (orderBurger) {
    orderBurger.value = String(currentBurger);
    updateOrder();
  }

  if (reducedMotion.matches) {
    mainBurger.src = burger.image;
    mainBurger.alt =
      `${burger.name}, hambúrguer artesanal`;

    updateBurgerInformation(burger);
    resetImageStyles();
    return;
  }

  mainBurger.style.transition =
    `opacity ${TRANSITION_DURATION}ms ease, ` +
    `transform ${TRANSITION_DURATION}ms ease, ` +
    `filter ${TRANSITION_DURATION}ms ease`;

  mainBurger.style.opacity = "0";
  mainBurger.style.transform =
    "translateY(15px) scale(0.96)";
  mainBurger.style.filter = "blur(4px)";

  animationTimer = setTimeout(() => {
    if (version !== animationVersion) {
      return;
    }

    mainBurger.src = burger.image;
    mainBurger.alt =
      `${burger.name}, hambúrguer artesanal`;

    updateBurgerInformation(burger);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (version !== animationVersion) {
          return;
        }

        resetImageStyles();
      });
    });
  }, TRANSITION_DURATION);
}

/* ==========================================
   CARROSSEL AUTOMÁTICO
========================================== */

function stopCarousel() {
  clearTimeout(carouselTimer);
  carouselTimer = null;
}

function startCarousel() {
  stopCarousel();

  if (carouselPaused || document.hidden) {
    return;
  }

  // Sem troca automática para quem prefere
  // movimento reduzido.
  if (reducedMotion.matches) {
    return;
  }

  carouselTimer = setTimeout(() => {
    updateBurger(currentBurger + 1);

    startCarousel();
  }, SLIDE_INTERVAL);
}

function restartCarousel() {
  stopCarousel();
  startCarousel();
}

/* ==========================================
   CARDS CLICÁVEIS
========================================== */

burgerCards.forEach(card => {
  card.addEventListener("click", () => {
    const index = Number(card.dataset.burger);

    if (!Number.isInteger(index)) {
      return;
    }

    updateBurger(index, true);

    const hero = $("inicio");

    if (hero) {
      hero.scrollIntoView({
        behavior: reducedMotion.matches
          ? "auto"
          : "smooth",
        block: "start"
      });
    }
  });
});

/* ==========================================
   REMOÇÃO DAS SETAS
========================================== */

// As setas antigas não serão mais exibidas.
// O código continua funcionando mesmo que
// esses elementos não existam no HTML.

if (previousBurger) {
  previousBurger.hidden = true;
  previousBurger.style.display = "none";
}

if (nextBurger) {
  nextBurger.hidden = true;
  nextBurger.style.display = "none";
}

/* ==========================================
   PAUSA QUANDO A ABA NÃO ESTÁ VISÍVEL
========================================== */

document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    stopCarousel();
  } else {
    startCarousel();
  }
});

reducedMotion.addEventListener("change", () => {
  if (reducedMotion.matches) {
    stopCarousel();

    clearTimeout(animationTimer);
    animationVersion++;

    const burger = burgers[currentBurger];

    mainBurger.src = burger.image;
    updateBurgerInformation(burger);
    resetImageStyles();
  } else {
    startCarousel();
  }
});

/* ==========================================
   SISTEMA DE PEDIDOS
========================================== */

function getQuantity() {
  const value = Number(orderQuantity.value);

  if (!Number.isFinite(value)) {
    return 1;
  }

  return Math.max(
    1,
    Math.min(20, Math.trunc(value))
  );
}

function updateOrder() {
  const index = Number(orderBurger.value);

  const burger = burgers[index] || burgers[0];
  const quantity = getQuantity();

  orderQuantity.value = quantity;

  orderDescription.textContent =
    `${quantity}x ${burger.name}`;

  orderTotal.textContent =
    money(burger.price * quantity);

  orderNotice.textContent = "";
}

if (orderBurger) {
  orderBurger.addEventListener("change", () => {
    const index = Number(orderBurger.value);

    updateBurger(index, true);
    updateOrder();
  });
}

if (orderQuantity) {
  orderQuantity.addEventListener(
    "change",
    updateOrder
  );

  orderQuantity.addEventListener("input", () => {
    const index = Number(orderBurger.value);
    const burger = burgers[index] || burgers[0];
    const quantity = getQuantity();

    orderDescription.textContent =
      `${quantity}x ${burger.name}`;

    orderTotal.textContent =
      money(burger.price * quantity);
  });
}

if (decreaseQuantity) {
  decreaseQuantity.addEventListener("click", () => {
    orderQuantity.value = Math.max(
      1,
      getQuantity() - 1
    );

    updateOrder();
  });
}

if (increaseQuantity) {
  increaseQuantity.addEventListener("click", () => {
    orderQuantity.value = Math.min(
      20,
      getQuantity() + 1
    );

    updateOrder();
  });
}

/* ==========================================
   WHATSAPP
========================================== */

if (whatsappOrder) {
  whatsappOrder.addEventListener("click", () => {
    updateOrder();

    const index = Number(orderBurger.value);
    const burger = burgers[index] || burgers[0];

    const quantity = getQuantity();
    const total = money(burger.price * quantity);

    const message =
      `Olá! Gostaria de fazer um pedido na BRASA BURGER.\n\n` +
      `🍔 Produto: ${burger.name}\n` +
      `📦 Quantidade: ${quantity}\n` +
      `💰 Total: ${total}\n\n` +
      `Gostaria de confirmar a disponibilidade.`;

    if (!/^\d{10,15}$/.test(WHATSAPP_NUMBER)) {
      orderNotice.textContent =
        "Projeto demonstrativo: configure o WhatsApp oficial para ativar os pedidos.";
      return;
    }

    const url =
      `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

    window.open(
      url,
      "_blank",
      "noopener,noreferrer"
    );
  });
}

/* ==========================================
   MENU RESPONSIVO
========================================== */

if (menuToggle && navigation) {
  const navigationLinks =
    navigation.querySelectorAll("a");

  function closeMenu() {
    navigation.classList.remove("open");

    menuToggle.setAttribute(
      "aria-expanded",
      "false"
    );

    menuToggle.setAttribute(
      "aria-label",
      "Abrir menu"
    );

    menuToggle.textContent = "☰";
  }

  menuToggle.addEventListener("click", () => {
    const isOpen =
      navigation.classList.toggle("open");

    menuToggle.setAttribute(
      "aria-expanded",
      String(isOpen)
    );

    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Fechar menu" : "Abrir menu"
    );

    menuToggle.textContent =
      isOpen ? "✕" : "☰";
  });

  navigationLinks.forEach(link => {
    link.addEventListener("click", () => {
      closeMenu();

      navigationLinks.forEach(item => {
        item.classList.remove("active");
      });

      link.classList.add("active");
    });
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") {
      closeMenu();
    }
  });
}

/* ==========================================
   INICIALIZAÇÃO
========================================== */

function initialize() {
  const burger = burgers[0];

  currentBurger = 0;

  mainBurger.src = burger.image;
  mainBurger.alt =
    `${burger.name}, hambúrguer artesanal`;

  updateBurgerInformation(burger);
  updateCards(currentBurger);
  updateNavigation(currentBurger);

  if (orderBurger) {
    orderBurger.value = "0";
    updateOrder();
  }

  mainBurger.addEventListener("error", () => {
    console.warn(
      "Imagem principal não encontrada:",
      mainBurger.src
    );
  });

  document
    .querySelectorAll(".burger-card img")
    .forEach(img => {
      img.addEventListener("error", () => {
        console.warn(
          "Imagem do card não encontrada:",
          img.src
        );
      });
    });

  startCarousel();
}

initialize();
