const { createApp } = Vue;

createApp({
  data() {
    return {
      lessons: [
        { id: 1, subject: "Mathematics", location: "Hendon", price: 120, spaces: 5, icon: "fa fa-square-root-variable", description: "Explore algebra, geometry, and advanced problem-solving." },
        { id: 2, subject: "Science", location: "Colindale", price: 110, spaces: 5, icon: "fa fa-flask", description: "Hands-on experiments and modern scientific methods." },
        { id: 3, subject: "English Literature", location: "Brent Cross", price: 100, spaces: 5, icon: "fa fa-book-open", description: "Dive into classics, poetry, and creative writing." },
        { id: 4, subject: "Computer Science", location: "Golders Green", price: 130, spaces: 5, icon: "fa fa-laptop-code", description: "Learn programming, logic, and real-world computing." },
        { id: 5, subject: "Art & Design", location: "Hendon", price: 95, spaces: 5, icon: "fa fa-palette", description: "Express yourself through painting, sketching, and design." },
        { id: 6, subject: "History", location: "Colindale", price: 105, spaces: 5, icon: "fa fa-landmark", description: "Discover key events that shaped the world." },
        { id: 7, subject: "Music", location: "Brent Cross", price: 90, spaces: 5, icon: "fa fa-music", description: "Learn instruments, rhythm, and composition." },
        { id: 8, subject: "Physical Education", location: "Golders Green", price: 80, spaces: 5, icon: "fa fa-dumbbell", description: "Improve fitness, teamwork, and leadership." },
        { id: 9, subject: "Drama", location: "Hendon", price: 85, spaces: 5, icon: "fa fa-theater-masks", description: "Build confidence through acting and stagecraft." },
        { id: 10, subject: "Economics", location: "Colindale", price: 125, spaces: 5, icon: "fa fa-chart-line", description: "Understand markets, finance, and decision-making." }
      ],
      cart: [],
      cartVisible: false,
      searchTerm: "",
      sortAttr: "subject",
      sortAscending: true,
      checkoutName: "",
      checkoutPhone: "",
      message: ""
    };
  },
  computed: {
    filteredAndSortedLessons() {
      const term = this.searchTerm.toLowerCase();
      let filtered = this.lessons.filter(l => {
        if (!term) return true;
        return Object.values(l).some(v => String(v).toLowerCase().includes(term));
      });
      filtered.sort((a, b) => {
        let A = a[this.sortAttr], B = b[this.sortAttr];
        if (typeof A === "string") A = A.toLowerCase(), B = B.toLowerCase();
        if (A < B) return this.sortAscending ? -1 : 1;
        if (A > B) return this.sortAscending ? 1 : -1;
        return 0;
      });
      return filtered;
    },
    cartTotalItems() {
      return this.cart.reduce((sum, i) => sum + i.qty, 0);
    },
    cartTotal() {
      return this.cart.reduce((sum, i) => sum + i.qty * i.price, 0);
    },
    validName() {
      return /^[A-Za-z\s]+$/.test(this.checkoutName);
    },
    validPhone() {
      return /^[0-9]+$/.test(this.checkoutPhone);
    },
    checkoutEnabled() {
      return this.cart.length && this.validName && this.validPhone;
    }
  },
  methods: {
    toggleSortOrder() { this.sortAscending = !this.sortAscending; },
    addToCart(lesson) {
      if (lesson.spaces <= 0) return;
      lesson.spaces--;
      const existing = this.cart.find(i => i.lessonId === lesson.id);
      if (existing) existing.qty++;
      else this.cart.push({ lessonId: lesson.id, subject: lesson.subject, location: lesson.location, price: lesson.price, qty: 1 });
    },
    removeFromCart(item) {
      const lesson = this.lessons.find(l => l.id === item.lessonId);
      if (lesson) lesson.spaces += item.qty;
      this.cart = this.cart.filter(i => i.lessonId !== item.lessonId);
    },
    toggleCart() { this.cartVisible = !this.cartVisible; },
    checkout() {
      if (!this.checkoutEnabled) return;
      this.message = `Thank you ${this.checkoutName}! Your enrollment for ${this.cartTotalItems} course(s) is confirmed.`;
      this.cart = [];
      this.checkoutName = "";
      this.checkoutPhone = "";
      this.cartVisible = false;
    }
  }
}).mount("#app");
